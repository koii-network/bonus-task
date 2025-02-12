import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { taskList, developerKey } from "../src/modules/globalList.js";
import { calculateRewards, checkSumTally } from "../src/modules/helpers.js";
import bs58 from "bs58";
import { REWARD_PER_ROUND } from "../src/config/constants.js";

// Run the test
async function testAudit(submission, roundNumber, submitterKey) {
  if (!(await namespaceWrapper.storeGet(`dist_${roundNumber}`))) {
    const weighting_factors = await generateTaskWeight(roundNumber);
    await generateDistributionProposal(weighting_factors, roundNumber);
  } else {
    console.log(`Distribution proposal already exists for round ${roundNumber}`);
  }
}

async function generateDistributionProposal(weighting_factors, roundNumber) {
  try {
    console.log(`generate DistributionProposal FOR ROUND ${roundNumber}`);
    // you can optionally return this value to be used in debugging

    const getTaskList = taskList;
    const getWeightList = weighting_factors;
    const getDeveloperKey = developerKey;

    // the all task states are fetched in parallel
    const getAllTaskStates = await getTaskState(getTaskList);

    const users = {};

    for (const taskStates of getAllTaskStates) {
      const { taskId } = taskStates;
      const { submissions, stake_list, task_manager } = taskStates.data;

      // submission weights and only get the last five submissions
      const lastFiveKeys = Object.keys(submissions)
        .map(Number)
        .sort((a, b) => a - b)
        .slice(-5);

      // get the sum of all the submission weights
      for (const lastFiveKey of lastFiveKeys) {
        const submission = submissions[`${lastFiveKey}`];

        // kpl staking key
        for (const itemKey of Object.keys(submission)) {
          if (stake_list.hasOwnProperty(itemKey)) {
            if (!users[itemKey]) {
              users[itemKey] = {
                submissions: {},
                stakes: {},
                developerOf: {},
              };
            }

            users[itemKey].submissions[taskId] =
              (users[itemKey].submissions[taskId] || 0) + 1;
            users[itemKey].stakes[taskId] = stake_list[itemKey] / 1e9;
          }
        }
      }

      const developerKey = await bs58.encode(task_manager);
      if (getDeveloperKey[developerKey]) {
        const getTaskId = Object.keys(getDeveloperKey[developerKey])[0];
        if (getTaskId === taskId) {
          const kplStakingKey =
            getDeveloperKey[developerKey][getTaskId].getKPLStakingKey;
          if (!users[kplStakingKey]) {
            users[kplStakingKey] = {
              submissions: {},
              stakes: {},
              developerOf: {},
            };
            // Initialize submissions and stakes for this task
            if (stake_list[kplStakingKey]) {
              users[kplStakingKey].stakes[taskId] =
                stake_list[kplStakingKey] / 1e9;
            }
          }
          users[kplStakingKey].developerOf[taskId] = true;
          console.log(
            `Developer bonus set for ${kplStakingKey} on task ${taskId}`,
          );
        }
      }

      // developer key and task id
      // const developer_key = await bs58.encode(task_manager);
      // console.log(developer_key);
    }

    for (let stakingKey in users) {
      let user = users[stakingKey];
      if (user.submissions) {
        for (let submissionKey in user.submissions) {
          const getTaskSpecificWeight = getWeightList[submissionKey];
          if (
            typeof getTaskSpecificWeight === "number" &&
            !isNaN(getTaskSpecificWeight)
          ) {
            const originalValue = user.submissions[submissionKey];
            user.submissions[submissionKey] *= getTaskSpecificWeight;
          } else {
            console.warn(`Missing or invalid weight for task ${submissionKey}`);
            user.submissions[submissionKey] *= 1;
          }
        }
      }
    }

    // console.log('Users object before reward calculation:', JSON.stringify(users, null, 2));

    const distribution_proposal = await calculateRewards(
      users,
      REWARD_PER_ROUND,
    );

    const total_node_bonus = Object.values(distribution_proposal).reduce(
      (a, b) => a + b,
      0,
    );
    console.log("total_node_bonus:", total_node_bonus / 1e9);

    // get both kpl and koii staking key
    const getKoiiStakingKey =
      await namespaceWrapper.getSubmitterAccount("KOII");
    const getKPLStakingKey = await namespaceWrapper.getSubmitterAccount("KPL");

    const koiiPublicKey = getKoiiStakingKey.publicKey.toBase58();
    const kplPublicKey = getKPLStakingKey.publicKey.toBase58();

    const getStakingKeys = {
      getKoiiStakingKey: koiiPublicKey,
      getKPLStakingKey: kplPublicKey,
    };

    await namespaceWrapper.storeSet("dist_" + roundNumber, {
      getStakingKeys,
      distribution_proposal,
    });

    let checkSumTotal = await checkSumTally(distribution_proposal);
    console.log("checkSumTotal", checkSumTotal);
  } catch (error) {
    console.error("EXECUTE TASK ERROR:", error);
  }
}

async function getTaskState(taskList) {
  try {
    const fetchPromises = taskList.map(async (task) => {
      try {
        console.log("task", task);
        const result = await namespaceWrapper.getTaskStateById(
          task.id,
          task.type,
          {
            is_available_balances_required: true,
            is_stake_list_required: true,
            is_submission_required: true,
          },
        );
        // console.log("result", result);
        if (!result || result.data === null) {
          console.error(`Task ID ${task.id} returned null data.`);
          return null;
        }

        return {
          taskId: task.id,
          success: true,
          data: result,
        };
      } catch (error) {
        console.error(
          `Error fetching data for task ID ${task.id}:`,
          error.message,
        );
        return null;
      }
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Timeout: Fetching tasks took too long")),
        120000,
      ),
    );

    const taskResults = await Promise.race([
      Promise.all(fetchPromises),
      timeoutPromise,
    ]);

    const successfulTasks = taskResults.filter((result) => result !== null);

    return successfulTasks;
  } catch (error) {
    console.error("Error in fetchAllTaskData:", error);
    return [];
  }
}

async function generateTaskWeight(roundNumber) {
  // Create dummy submissions that match the real submission format
  const dummySubmissions = {
    koiiStakingKey1: {
      submission_value: "cid11",
      data: {
        user_vote: {
          getStakingKeys: {
            getKoiiStakingKey: "koiiStakingKey1",
            getKPLStakingKey: "kplStakingKey1",
          },
          vote: JSON.stringify({
            votes: {
              HRFuq1iK8eTsoG6nFf3PydcpGZLX9Poqk2QhFuRjGs3A: {
                weighting_factors: 0.2,
                type: "KPL",
              },
              H5CKDzSi2qWs7y7JGMX8sGvAZnWcUDx8k1mCMVWyJf1M: {
                weighting_factors: 0.3,
                type: "KPL",
              },
              AD8KJJn9ysmps74dAdNYA6PaVGRyaZwrtNpEXJWCx4wy: {
                weighting_factors: 0.5,
                type: "KPL",
              },
            },
          }),
        },
      },
    },
    koiiStakingKey2: {
      submission_value: "cid2",
      data: {
        user_vote: {
          getStakingKeys: {
            getKoiiStakingKey: "koiiStakingKey2",
            getKPLStakingKey: "kplStakingKey2",
          },
          vote: JSON.stringify({
            votes: {
              BshiEPaoEKkyiadGsRmxg23iDosJKr3seqoN81GYJBBH: {
                weighting_factors: 0.5,
                type: "KPL",
              },
              "5s8stHNHhaHo3fS49uwC8jaRCrodCUZg9YfUPkYxsfRc": {
                weighting_factors: 0.3,
                type: "KPL",
              },
              "99dHXaUbJzr8o96qs8sog4PBfM8FksM81mkkPK9jxiLL": {
                weighting_factors: 0.2,
                type: "KOII",
              },
            },
          }),
        },
      },
    },
    koiiStakingKey3: {
      submission_value: "cid3",
      data: {
        user_vote: {
          getStakingKeys: {
            getKoiiStakingKey: "koiiStakingKey3",
            getKPLStakingKey: "kplStakingKey3",
          },
          vote: JSON.stringify({
            votes: {
              BshiEPaoEKkyiadGsRmxg23iDosJKr3seqoN81GYJBBH: {
                weighting_factors: 0.3,
                type: "KPL",
              },
              "5s8stHNHhaHo3fS49uwC8jaRCrodCUZg9YfUPkYxsfRc": {
                weighting_factors: 0.5,
                type: "KPL",
              },
              "99dHXaUbJzr8o96qs8sog4PBfM8FksM81mkkPK9jxiLL": {
                weighting_factors: 0.2,
                type: "KOII",
              },
            },
          }),
        },
      },
    },
    koiiStakingKey4: {
      submission_value: "cid4",
      data: {
        user_vote: {
          getStakingKeys: {
            getKoiiStakingKey: "koiiStakingKey4",
            getKPLStakingKey: "kplStakingKey4",
          },
          vote: JSON.stringify({
            votes: {
              BshiEPaoEKkyiadGsRmxg23iDosJKr3seqoN81GYJBBH: {
                weighting_factors: 1,
                type: "KPL",
              },
            },
          }),
        },
      },
    },
  };

  // Process all submissions to collect data from CIDs
  for (const [koiiStakingKey, submission] of Object.entries(dummySubmissions)) {
    let cidCheck = await namespaceWrapper.storeGet(`vote_cid_${koiiStakingKey}`);
    console.log("cidCheck", cidCheck);
    if (cidCheck === submission.submission_value) {
      console.log(`CID already processed for key ${koiiStakingKey}`);
      continue;
    }
    await namespaceWrapper.storeSet(`vote_cid_${koiiStakingKey}`, submission.submission_value);

    try {
      // Get data from CID
      const cidData = submission.data;
      console.log(`\nProcessing submission for key: ${koiiStakingKey}`);
      // Parse the vote_0 data
      if (cidData.user_vote) {
        const { getStakingKeys, vote } = cidData.user_vote;
        console.log("Processing user vote data:");
        console.log("- Staking Keys:", getStakingKeys);
        console.log("- Vote:", vote);

        // Store staking key pairs
        await namespaceWrapper.storeSet(
          `staking_key_${getStakingKeys.getKoiiStakingKey}`,
          getStakingKeys.getKPLStakingKey,
        );
        console.log(
          `Stored staking key pair: ${getStakingKeys.getKoiiStakingKey} -> ${getStakingKeys.getKPLStakingKey}`,
        );

        // Store votes with formatted key
        const voteKey = `votes_${getStakingKeys.getKoiiStakingKey}`;
        await namespaceWrapper.storeSet(voteKey, vote);
        console.log(`Stored vote data with key: ${voteKey}`);
      } else {
        console.log("No user_vote data found in CID data");
      }
    } catch (error) {
      console.error(
        `Error processing submission for key ${koiiStakingKey}:`,
        error,
      );
      console.error("Error stack:", error.stack);
    }
  }

  // Initialize weighting_factors with all tasks from taskList
  const weighting_factors = {};
  const taskComments = {};

  // Create mapping of task IDs to their comments
  taskList.forEach((task) => {
    weighting_factors[task.id] = 0;
    // Extract comment if it exists in the line after the ID
    const comment = task.id.match(/\/\/ (.+)$/);
    taskComments[task.id] = comment ? comment[1].trim() : "";
  });

  // Add debug logs for weight calculation
  console.log("\nCalculating final weights:");
  let totalWeight = 0;
  for (const [koiiStakingKey, submission] of Object.entries(dummySubmissions)) {
    try {
      const voteString = await namespaceWrapper.storeGet(
        `votes_${koiiStakingKey}`,
      );
      if (!voteString) continue;

      const voteData = JSON.parse(voteString);
      const votes = voteData.votes;

      for (const [taskId, taskData] of Object.entries(votes)) {
        if (taskId in weighting_factors) {
          weighting_factors[taskId] += taskData.weighting_factors;
          totalWeight += taskData.weighting_factors;
        }
      }
    } catch (error) {
      console.error(`Error processing votes for key ${koiiStakingKey}:`, error);
    }
  }

  // Normalize weights to sum to 1
  if (totalWeight > 0) {
    for (const taskId in weighting_factors) {
      weighting_factors[taskId] = Number(
        (weighting_factors[taskId] / totalWeight).toFixed(1),
      );
    }
  } else {
    // If no votes, distribute weights equally
    const equalWeight = 1 / Object.keys(weighting_factors).length;
    for (const taskId in weighting_factors) {
      weighting_factors[taskId] = Number(equalWeight.toFixed(1));
    }
  }

  console.log(
    "Final weighting factors for round:",
    roundNumber,
    weighting_factors,
  );
  return weighting_factors;
}

// Run the test
testAudit("", 0, "");
