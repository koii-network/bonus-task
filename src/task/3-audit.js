import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { getDataFromCID } from "../modules/getDataFromCID.js";
import { taskList, developerKey } from "../modules/globalList.js";
import { calculateRewards, checkSumTally } from "../modules/helpers.js";
import bs58 from "bs58";
import { REWARD_PER_ROUND } from "../config/constants.js";

export async function audit(submission, roundNumber, submitterKey) {
  try {
    if (!(await namespaceWrapper.storeGet(`dist_${roundNumber}`))) {
      const weighting_factors = await generateTaskWeight(roundNumber);
      if (!weighting_factors) {
        throw new Error('Failed to generate task weights');
      }
      await generateDistributionProposal(weighting_factors, roundNumber);
    } else {
      console.log(
        `Distribution proposal already exists for round ${roundNumber}`,
      );
    }
    return true;
  } catch (error) {
    console.error(`Error in audit function for round ${roundNumber}:`, error);
  }
}

async function generateTaskWeight(roundNumber) {
  try {
    // Get all submissions for the round
    const allSubmissions = await namespaceWrapper.getTaskState({is_submission_required: true});
    if (!allSubmissions) {
      throw new Error(`No submissions found for round ${roundNumber}`);
    }

    const roundSubmissions = allSubmissions.submissions[roundNumber];
    if (!roundSubmissions) {
      console.log(`No submissions found for specific round ${roundNumber}`);
      return null;
    }

    console.log(`Processing ${Object.keys(roundSubmissions).length} submissions for round ${roundNumber}`);

    // Process all submissions to collect data from CIDs
    for (const [koiiStakingKey, submission] of Object.entries(roundSubmissions)) {
      try {
        // Check if the submission is already processed
        let cidCheck = await namespaceWrapper.storeGet(
          `vote_cid_${koiiStakingKey}`,
        );
        if (cidCheck === submission.submission_value) {
          // console.log(`CID already processed for key ${koiiStakingKey}`);
          continue;
        }
        // Get data from CID
        const cidData = await getDataFromCID(`vote.json`, submission.submission_value);
        if (!cidData) {
          throw new Error(`Failed to fetch data from CID: ${submission.submission_value}`);
        }

        await namespaceWrapper.storeSet(
          `vote_cid_${koiiStakingKey}`,
          submission.submission_value,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second

        // Parse the vote_0 data
        if (cidData.user_vote) {
          const { getStakingKeys, vote } = cidData.user_vote;
          if (!getStakingKeys || !vote) {
            throw new Error('Invalid user vote data structure');
          }

          console.log("Processing user vote data:");
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
          error.message,
        );
        // Continue with next submission instead of breaking the entire process
        continue;
      }
    }

    // Initialize weighting_factors with all tasks from taskList
    const weighting_factors = {};
    const taskComments = {};

    if (!taskList || taskList.length === 0) {
      throw new Error('Task list is empty or invalid');
    }

    // Create mapping of task IDs to their comments
    taskList.forEach((task) => {
      if (!task.id) {
        throw new Error('Invalid task entry: missing ID');
      }
      weighting_factors[task.id] = 0;
      // Extract comment if it exists in the line after the ID
      const comment = task.id.match(/\/\/ (.+)$/);
      taskComments[task.id] = comment ? comment[1].trim() : "";
    });

    // Add debug logs for weight calculation
    console.log("\nCalculating final weights:");
    let totalWeight = 0;
    for (const [koiiStakingKey, submission] of Object.entries(roundSubmissions)) {
      try {
        const voteString = await namespaceWrapper.storeGet(`votes_${koiiStakingKey}`);
        if (!voteString) continue;

        let voteData;
        try {
          // Try parsing if it's a string, otherwise use as is if it's already an object
          voteData = typeof voteString === 'string' ? JSON.parse(voteString) : voteString;
        } catch (error) {
          console.error(`Error parsing vote data for key ${koiiStakingKey}:`, error.message);
          continue;
        }

        if (!voteData || !voteData.votes) {
          throw new Error('Invalid vote data structure');
        }

        const votes = voteData.votes;
        for (const [taskId, taskData] of Object.entries(votes)) {
          if (taskId in weighting_factors) {
            if (typeof taskData.weighting_factors !== 'number' || isNaN(taskData.weighting_factors)) {
              console.warn(`Invalid weighting factor for task ${taskId}: ${taskData.weighting_factors}`);
              continue;
            }
            weighting_factors[taskId] += taskData.weighting_factors;
            totalWeight += taskData.weighting_factors;
          }
        }
      } catch (error) {
        console.error(`Error processing votes for key ${koiiStakingKey}:`, error.message);
        // Continue with next submission
        continue;
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
  } catch (error) {
    console.error(`Error in generateTaskWeight for round ${roundNumber}:`, error);
  }
}

async function generateDistributionProposal(weighting_factors, roundNumber) {
  try {
    console.log(`Generating Distribution Proposal for round ${roundNumber}`);
    
    if (!weighting_factors || Object.keys(weighting_factors).length === 0) {
      throw new Error('Invalid weighting factors provided');
    }

    const getTaskList = taskList;
    const getWeightList = weighting_factors;
    const getDeveloperKey = developerKey;

    if (!getTaskList || !getDeveloperKey) {
      throw new Error('Missing required task list or developer key data');
    }

    // Fetch all task states in parallel
    const getAllTaskStates = await getTaskState(getTaskList);
    if (!getAllTaskStates || getAllTaskStates.length === 0) {
      throw new Error('Failed to fetch task states');
    }

    const users = {};

    for (const taskStates of getAllTaskStates) {
      try {
        if (!taskStates || !taskStates.data) {
          console.warn(`Invalid task state data for task ${taskStates?.taskId}`);
          continue;
        }

        const { taskId } = taskStates;
        const { submissions, stake_list, task_manager } = taskStates.data;

        if (!submissions || !stake_list || !task_manager) {
          console.warn(`Missing required data for task ${taskId}`);
          continue;
        }

        // Get last five submissions
        const lastFiveKeys = Object.keys(submissions)
          .map(Number)
          .sort((a, b) => a - b)
          .slice(-5);

        // Process submissions
        for (const lastFiveKey of lastFiveKeys) {
          try {
            const submission = submissions[`${lastFiveKey}`];
            if (!submission) continue;

            // Process KPL staking keys
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
          } catch (error) {
            console.error(`Error processing submission ${lastFiveKey} for task ${taskId}:`, error.message);
            continue;
          }
        }

        // Process developer keys
        try {
          const developerKey = await bs58.encode(task_manager);
          if (getDeveloperKey[developerKey]) {
            const getTaskId = Object.keys(getDeveloperKey[developerKey])[0];
            if (getTaskId === taskId) {
              const kplStakingKey = 
                getDeveloperKey[developerKey][getTaskId].getKPLStakingKey;
              
              if (!kplStakingKey) {
                throw new Error(`Invalid KPL staking key for developer of task ${taskId}`);
              }

              if (!users[kplStakingKey]) {
                users[kplStakingKey] = {
                  submissions: {},
                  stakes: {},
                  developerOf: {},
                };
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
        } catch (error) {
          console.error(`Error processing developer key for task ${taskId}:`, error.message);
        }
      } catch (error) {
        console.error(`Error processing task state for task ${taskStates?.taskId}:`, error.message);
        continue;
      }
    }

    // Apply weighting factors
    for (let stakingKey in users) {
      try {
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
      } catch (error) {
        console.error(`Error processing weights for staking key ${stakingKey}:`, error.message);
      }
    }

    // Calculate rewards
    const distribution_proposal = await calculateRewards(
      users,
      REWARD_PER_ROUND,
    );

    if (!distribution_proposal) {
      throw new Error('Failed to calculate rewards distribution');
    }

    const total_node_bonus = Object.values(distribution_proposal).reduce(
      (a, b) => a + b,
      0,
    );
    console.log("Total node bonus:", total_node_bonus / 1e9);

    // Get staking keys
    try {
      const getKoiiStakingKey = 
        await namespaceWrapper.getSubmitterAccount("KOII");
      const getKPLStakingKey = 
        await namespaceWrapper.getSubmitterAccount("KPL");

      if (!getKoiiStakingKey || !getKPLStakingKey) {
        throw new Error('Failed to get staking keys');
      }

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
      console.error('Error processing staking keys:', error.message);
      throw error;
    }
  } catch (error) {
    console.error("Error in generateDistributionProposal:", error.message);
    console.error("Error stack:", error.stack);
    throw error;
  }
}

async function getTaskState(taskList) {
  try {
    if (!taskList || !Array.isArray(taskList) || taskList.length === 0) {
      throw new Error('Invalid task list provided');
    }

    const fetchPromises = taskList.map(async (task) => {
      try {
        if (!task || !task.id || !task.type) {
          throw new Error(`Invalid task data: ${JSON.stringify(task)}`);
        }

        console.log("Fetching state for task:", task.id);
        const result = await namespaceWrapper.getTaskStateById(
          task.id,
          task.type,
          {
            is_available_balances_required: true,
            is_stake_list_required: true,
            is_submission_required: true,
          },
        );

        if (!result || result.data === null) {
          throw new Error(`Task ID ${task.id} returned null data`);
        }

        return {
          taskId: task.id,
          success: true,
          data: result,
        };
      } catch (error) {
        console.error(
          `Error fetching data for task ID ${task?.id}:`,
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

    if (successfulTasks.length === 0) {
      console.warn('No successful task results found');
    } else {
      console.log(`Successfully fetched ${successfulTasks.length} task states`);
    }

    return successfulTasks;
  } catch (error) {
    console.error("Error in getTaskState:", error.message);
    console.error("Error stack:", error.stack);
    return [];
  }
}
