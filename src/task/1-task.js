import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { PublicKey } from "@_koii/web3.js";
import { calculateRewards, checkSumTally } from "../modules/helpers.js";
import bs58 from "bs58";
import { REWARD_PER_ROUND } from "../config/constants.js";
import { taskList, weighting_factors } from "../modules/globalList.js";

export async function task(roundNumber) {
  /**
   * Run your task and store the proofs to be submitted for auditing
   * The submission of the proofs is done in the submission function
   */
  try {
    console.log(`EXECUTE TASK FOR ROUND ${roundNumber}`);
    // you can optionally return this value to be used in debugging

    const getTaskList = taskList;
    const getWeightList = weighting_factors;

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

      // developer key and task id
      // const developer_key = await bs58.encode(task_manager);
      // console.log(developer_key);
    }

    for (let stakingKey in users) {
      let user = users[stakingKey];
      if (user.submissions) {
        for (let submissionKey in user.submissions) {
          const getTaskSpecificWeight = getWeightList[submissionKey];
          user.submissions[submissionKey] *= getTaskSpecificWeight;
        }
      }
    }

    const distribution_proposal = await calculateRewards(
      users,
      REWARD_PER_ROUND,
    );

    const total_node_bonus = Object.values(distribution_proposal).reduce(
      (a, b) => a + b,
      0,
    );
    console.log("total_node_bonus:", total_node_bonus);

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
  } catch (error) {
    console.error("EXECUTE TASK ERROR:", error);
  }
}

async function getTaskState(taskList) {
  try {
    const fetchPromises = taskList.map(async (task) => {
      try {
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
        60000,
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
