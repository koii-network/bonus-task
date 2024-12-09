import { namespaceWrapper } from "@_koii/namespace-wrapper";
import getTaskList from "../modules/getTaskList.js";
import { Connection, PublicKey } from "@_koii/web3.js";
import { retryWithMaxCount } from "../modules/retryWithMaxCount.js";
import { harmonizeDistribution, getUnclaimedRewards, checkSumTally } from "../modules/helpers.js";
import bs58 from 'bs58';

import {
	K2_URL,
  REWARD_PER_ROUND
} from "../config/constants.js";

export async function task(roundNumber) {
  /**
   * Execute the task for the given round
   * Must return a string of max 512 bytes to be submitted on chain
   */
  try {
    console.log(`EXECUTE TASK FOR ROUND ${roundNumber}`);
    // you can optionally return this value to be used in debugging

    // let connection = new Connection(K2_URL);
    let distribution_proposal = [];
    let node_bonus = [];

    // the weighting factors are stored in array formatted with the taskId as the key, and the weighting factor as the value, the sum of all weighting factors should equal 1
    // eventually, these factors will be decided by a public vote of anyone running this task
    let taskList = [
      {
        id : "E5ThjNUEYoe3bnwAhq2m3v9PK5SeiVNn8PTgaQL5zpvr",
        type : "KOII"
      },
      {
        id : "GX5dfxY5Ns82KZrJX4a8bBw3a6WMPHJ3sBxmycfoXR2Y",
        type : "KOII"
      },
      {
        id : "KiwDeyqgkC8bgKgXkBLa4qQ2honuBB4Zu152C6Ggb9J",
        type: "KOII"
      },
      {
        id : "D5G1uRNHwZiNkDAdrs3SjFtsdH683fKRQTNa8X9Cj3Nv",
        type : "KOII"
      }
    ]
    let weighting_factors = {
      "E5ThjNUEYoe3bnwAhq2m3v9PK5SeiVNn8PTgaQL5zpvr" : 0.3, // Mask Task
      "GX5dfxY5Ns82KZrJX4a8bBw3a6WMPHJ3sBxmycfoXR2Y" : 0.2, // Free Token Task
      "KiwDeyqgkC8bgKgXkBLa4qQ2honuBB4Zu152C6Ggb9J" : 0.3, // BIGBIG
      "D5G1uRNHwZiNkDAdrs3SjFtsdH683fKRQTNa8X9Cj3Nv" : 0.2 // Truflation
    };

    // now, loop over the taskIDs and calculate the dev_bonus and node_bonus
    // for each task
    let totalWeight = 0;
    for (let task of taskList) {
      let taskState = await namespaceWrapper.getTaskStateById(
        task.id, 
        task.type,
        { 
          is_available_balances_required: true,
          is_stake_list_required: true
        }
      );

      if (!taskState) throw new Error("Task not found");

      // we calculate the dev_bonus and node_bonus for each task by the amount of unclaimed rewards
      let unclaimed_rewards = await getUnclaimedRewards(taskState);
      let developer_key = await bs58.encode(taskState.task_manager); // convert from buffer to base58

      // before adding the bonuses to the distribution proposal, we must weight them by the global weighting factors
      // the developer receives half of the bonus rewards, and the node receives the other half
      // there is only one developer key per task, so we can just multiply the dev_bonus by the weighting factor
      let task_weight = weighting_factors[task.id] * REWARD_PER_ROUND;
      console.log('task_weight', task_weight)
      console.log('task', task.id)
      totalWeight += task_weight;

      // now we can calculate the node_bonus for each node
      let unclaimedRewardsKeys = Object.keys(unclaimed_rewards.all);
      for (let key of unclaimedRewardsKeys) {
        node_bonus[key] = unclaimed_rewards.all[key] * task_weight * 0.5; // todo : incorporate the stake amount into the bonus
        distribution_proposal[ key ] = node_bonus[key];
      }

      // now we must add the developer rewards to the distribution proposal
      distribution_proposal[developer_key] = task_weight * 0.5;

      // TODO: if the developer is also staking, we must add the stake amount to the dev_bonus
    }
    console.log('totalweight', totalWeight)

    // as some developers and nodes may be common between the many tasks, we must harmonize the final distribution list
    distribution_proposal = await harmonizeDistribution(distribution_proposal);
    let checksumtotal = await checkSumTally(distribution_proposal);
    let outstanding = REWARD_PER_ROUND - checksumtotal;
    console.log('outstanding', outstanding)
    // console.log('distribution_proposal', distribution_proposal)

    await namespaceWrapper.storeSet("dist_"+roundNumber, distribution_proposal);
  } catch (error) {
    console.error("EXECUTE TASK ERROR:", error);
  }
}
