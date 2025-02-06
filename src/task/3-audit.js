import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { getDataFromCID } from "../modules/getDataFromCID.js";
import { calculateRewards, checkSumTally } from "../modules/helpers.js";
import bs58 from "bs58";
import { REWARD_PER_ROUND } from "../config/constants.js";

export async function audit(submission, roundNumber, submitterKey) {
  /**
   * Audit a submission
   * This function should return true if the submission is correct, false otherwise
   */
  console.log(`AUDIT SUBMISSION FOR ROUND ${roundNumber} from ${submitterKey}`);

  try {
    const cid = submission;
    // Fetch and validate the data
    const data = await getDataFromCID("distribution_proposal.json", cid);
    if (
      !data ||
      !data.user_vote ||
      !data.user_vote.vote ||
      !data.user_vote.getStakingKeys
    ) {
      console.log("Failed to fetch data from CID");
      return false;
    }

    const getStakingKeys = data.user_vote.getStakingKeys;

    if (!getStakingKeys.getKoiiStakingKey || !getStakingKeys.getKPLStakingKey) {
      console.log("No staking keys found in CID");
      return false;
    }

    const user_vote = data.user_vote.vote;

    // Check if user_vote is empty
    if (Object.keys(user_vote).length === 0) {
      console.log("The vote object is empty.");
      return false;
    }

    // get the current task submission
    let currentTaskState;
    try {
      currentTaskState = await namespaceWrapper.getTaskState({
        is_submission_required: true,
      });
    } catch (error) {
      console.error("Error getting task state:", error.message);
      return false;
    }

    if (!currentTaskState || !currentTaskState.submissions) {
      console.log("Invalid task state or missing submissions");
      return false;
    }

    try {
      const roundBeginSlot =
        currentTaskState.starting_slot +
        roundNumber * currentTaskState.round_time;
      const currentSlot = await namespaceWrapper.getSlot();

      console.log("Round Begin Slot:", roundBeginSlot);
      console.log("Current Slot:", currentSlot);

      // Check if the current slot is within in 1 minute of the round begin slot
      if (roundBeginSlot + 600 >= currentSlot) {
        let taskList = [];
        let weighting_factors = {};

        // Populate taskList and weighting_factors
        for (const [taskId, taskDetails] of Object.entries(user_vote)) {
          taskList.push({ id: taskId, type: taskDetails.type });
          weighting_factors[taskId] = taskDetails.weighting_factors;
        }

        console.log("Task List:", taskList);
        console.log("Weighting Factors:", weighting_factors);

        if (
          taskList.length === 0 ||
          Object.keys(weighting_factors).length === 0
        ) {
          console.log("Both taskList or weighting_factors are empty.");
          return false;
        }

        const getAllTaskStates = await getTaskState(taskList);
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

          // const developerKey = await bs58.encode(task_manager);
          // if (getDeveloperKey[developerKey]) {
          //   const getTaskId = Object.keys(getDeveloperKey[developerKey])[0];
          //   if (getTaskId === taskId) {
          //     const kplStakingKey =
          //       getDeveloperKey[developerKey][getTaskId].getKPLStakingKey;
          //     if (!users[kplStakingKey]) {
          //       users[kplStakingKey] = {
          //         submissions: {},
          //         stakes: {},
          //         developerOf: {},
          //       };
          //       // Initialize submissions and stakes for this task
          //       if (stake_list[kplStakingKey]) {
          //         users[kplStakingKey].stakes[taskId] =
          //           stake_list[kplStakingKey] / 1e9;
          //       }
          //     }
          //     users[kplStakingKey].developerOf[taskId] = true;
          //     console.log(
          //       `Developer bonus set for ${kplStakingKey} on task ${taskId}`,
          //     );
          //   }
          // }
        }

        for (let stakingKey in users) {
          let user = users[stakingKey];
          if (user.submissions) {
            for (let submissionKey in user.submissions) {
              const getTaskSpecificWeight = weighting_factors[submissionKey];
              if (
                typeof getTaskSpecificWeight === "number" &&
                !isNaN(getTaskSpecificWeight)
              ) {
                user.submissions[submissionKey] *= getTaskSpecificWeight;
              } else {
                console.warn(
                  `Missing or invalid weight for task ${submissionKey}`,
                );
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

        let checkSumTotal = await checkSumTally(distribution_proposal);
        console.log("checkSumTotal", checkSumTotal);

        // get the final list of Distribution
        const finalDistributionList = await processSubmissions(
          currentTaskState,
          roundNumber,
          distribution_proposal,
        );

        if (Object.keys(finalDistributionList).length === 0) {
          console.log(
            "Empty distribution list in the audits: ",
            Object.keys(finalDistributionList).length,
          );
          return false;
        }

        await namespaceWrapper.storeSet(
          "finalDistributionList_" + roundNumber,
          finalDistributionList,
        );

        return true;
      } else {
        console.log(
          "Task missed the window to be executed, skip round",
          roundNumber,
        );
        return false;
      }
    } catch (error) {
      console.error("GENERATING Distribution Proposal ERROR:", error);
      return false;
    }
  } catch (error) {
    console.error("Error during audit:", error.message);
    return false;
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

// process the current submission and mapping the KOII staking key
async function processSubmissions(
  currentTaskState,
  roundNumber,
  distribution_proposal,
) {
  const finalDistributionList = {};
  const { submissions } = currentTaskState;
  const currentSubmission = submissions[roundNumber];

  console.log("Get currentSubmission", currentSubmission);

  if (!currentSubmission) {
    console.log("Key not found in submissions for round:", roundNumber);
    return finalDistributionList;
  }

  for (const key of Object.keys(currentSubmission)) {
    const cid = currentSubmission[key].submission_value;
    console.log(`Processing submission for ${key} with CID: ${cid}`);

    try {
      const cidData = await getDataFromCID("distribution_proposal.json", cid);

      if (
        !cidData ||
        !cidData.user_vote ||
        !cidData.user_vote.vote ||
        !cidData.user_vote.getStakingKeys
      ) {
        console.log("Invalid or missing data in CID response");
        continue;
      }

      const { getKoiiStakingKey, getKPLStakingKey } =
        cidData.user_vote.getStakingKeys;

      console.log("Checking KOII wallet in SUBMISSION:", getKoiiStakingKey);
      console.log("Checking KPL wallet in SUBMISSION:", getKPLStakingKey);
      console.log(
        "The number of distribution proposal available:",
        Object.keys(distribution_proposal).length,
      );

      const kplBounty = distribution_proposal[getKPLStakingKey] || 0;
      const koiiBounty = distribution_proposal[getKoiiStakingKey] || 0;
      const currentBounty = Math.max(kplBounty, koiiBounty);

      finalDistributionList[getKoiiStakingKey] = currentBounty;
      console.log(
        `Assigned highest bounty ${currentBounty} to KOII wallet ${getKoiiStakingKey} (KPL: ${kplBounty}, KOII: ${koiiBounty})`,
      );
    } catch (error) {
      console.error("Error processing submission:", error.message);
      continue;
    }
  }

  return finalDistributionList;
}
