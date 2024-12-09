import { namespaceWrapper } from "@_koii/namespace-wrapper";
import getTaskList from "../modules/getTaskList.js";
import { Connection, PublicKey } from "@_koii/web3.js";
import { retryWithMaxCount } from "../modules/retryWithMaxCount.js";

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
    let dev_bonus = [];
    let node_bonus = [];

    // the weighting factors are stored in array formatted with the taskId as the key, and the weighting factor as the value, the sum of all weighting factors should equal 1
    // eventually, these factors will be decided by a public vote of anyone running this task
    let taskList = [
      {
        id : "E5ThjNUEYoe3bnwAhq2m3v9PK5SeiVNn8PTgaQL5zpvr",
        type : "KOII"
      },
      // {
      //   id : "GX5dfxY5Ns82KZrJX4a8bBw3a6WMPHJ3sBxmycfoXR2Y",
      //   type : "KOII"
      // },
      // {
      //   id : "KiwDeyqgkC8bgKgXkBLa4qQ2honuBB4Zu152C6Ggb9J",
      //   type: "KOII"
      // },
      // {
      //   id : "D5G1uRNHwZiNkDAdrs3SjFtsdH683fKRQTNa8X9Cj3Nv",
      //   type : "KOII"
      // }
    ]
    let weighting_factors = {
      "E5ThjNUEYoe3bnwAhq2m3v9PK5SeiVNn8PTgaQL5zpvr" : 0.3, // Mask Task
      "GX5dfxY5Ns82KZrJX4a8bBw3a6WMPHJ3sBxmycfoXR2Y" : 0.1, // Free Token Task
      "KiwDeyqgkC8bgKgXkBLa4qQ2honuBB4Zu152C6Ggb9J" : 0.3, // BIGBIG
      "D5G1uRNHwZiNkDAdrs3SjFtsdH683fKRQTNa8X9Cj3Nv" : 0.1 // Truflation
    };

    // now, loop over the taskIDs and calculate the dev_bonus and node_bonus
    // for each task
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
      let developer_key = taskState.task_manager;

      // before adding the bonuses to the distribution proposal, we must weight them by the global weighting factors
      // the developer receives half of the bonus rewards, and the node receives the other half
      // there is only one developer key per task, so we can just multiply the dev_bonus by the weighting factor
      let total_weighted = unclaimed_rewards.sum * weighting_factors[task.id] * 0.5;
      dev_bonus.push({ developer_key, total_weighted });

      // there will be many nodes running each task
      // and multiply each item by the weighting factor
      let node_keys = Object.keys(taskState.stake_list);

      // now we can calculate the node_bonus for each node
      let unclaimedRewardsKeys = Object.keys(unclaimed_rewards.all);
      for (let key of unclaimedRewardsKeys) {
        let weight = weighting_factors[task.id];
        let node_bonus_amount = unclaimed_rewards.all[key] * (weight) * 0.5; // todo : incorporate the stake amount into the bonus
        node_bonus[key] = node_bonus_amount;
      }
      
      // and then the node rewards must be added using the node_bonus_amount for each key
      for (let key of node_keys) {
        distribution_proposal[ key ] = node_bonus[key];
      }

      // now we must add the developer rewards to the distribution proposal
      distribution_proposal[developer_key] = dev_bonus;

      // TODO: if the developer is also staking, we must add the stake amount to the dev_bonus
    }
    // console.log('distribution_proposal', distribution_proposal)

    // as some developers and nodes may be common between the many tasks, we must harmonize the final distribution list
    distribution_proposal = await harmonizeDistribution(distribution_proposal);
    
    // console.log('distribution_proposal', distribution_proposal)

    await namespaceWrapper.storeSet("dist_"+roundNumber, distribution_proposal);
  } catch (error) {
    console.error("EXECUTE TASK ERROR:", error);
  }
}

async function getUnclaimedRewards (taskState) {
  // loop over the taskState.availableBalances array and sum the unclaimed rewards
  // then calculate the percentage for each wallet and return an array in the format { wallet: address, percentage: percentage }
  // the sum of all percentages should equal 1
  let unclaimedRewards = taskState.available_balances;
  
  // get the total unclaimed rewards
  let unclaimedRewardsValues = Object.values(unclaimedRewards);
  let totalUnclaimed = unclaimedRewardsValues.reduce((acc, item) => acc + item, 0);
  // console.log('total unclaimed', totalUnclaimed)
  let unclaimedRewardsKeys = Object.keys(unclaimedRewards);
  // console.log('unclaimedRewardsKeys length', unclaimedRewardsKeys.length)
  let output = []

  // calculate the percentage for each wallet
  for (let wallet in unclaimedRewardsKeys) {
    // console.log(unclaimedRewardsKeys[wallet], unclaimedRewardsValues[wallet] )
    let wallet_key = unclaimedRewardsKeys[wallet];
    let rewards_portion = unclaimedRewardsValues[wallet] / totalUnclaimed;
    output[wallet_key] = rewards_portion;
  }

  return { all: output, sum: totalUnclaimed };
}

async function harmonizeDistribution ( distribution_proposal ) {
  // this function takes in the distribution proposal and harmonizes it so that each wallet only appears once
  // the rewards are then summed and returned in a new array
  // all bonuses must be integers
  // console.log(distribution_proposal)
  
  let harmonized = [];
  let distribution_proposal_keys = Object.keys(distribution_proposal);
  for (let key of distribution_proposal_keys) {
    if (!distribution_proposal[key]) distribution_proposal[key] = 0;
    let value = distribution_proposal[key] * REWARD_PER_ROUND;
    if (harmonized[key]) {
      harmonized[key] += value;
    } else {
      harmonized[key] = value;
    }
  }

  let checksum_result = await checksum(harmonized);
  console.log('checksum', checksum_result);

  return harmonized;
}

async function checksum (harmonized) {
  // calculate the total sum of the harmonized rewards 
  
  let harmonized_keys = Object.keys(harmonized);
  let checksum = 0;
  for (let key of harmonized_keys) {
    // console.log('key', key, harmonized[key])
    if (key != 'undefined') {
      checksum += harmonized[key];
    }
    console.log('checksum', checksum, key)
  }

  return checksum;
}