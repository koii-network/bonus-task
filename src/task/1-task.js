import { namespaceWrapper } from "@_koii/namespace-wrapper";
import getTaskList from "../modules/getTaskList.js";
import { Connection, PublicKey } from "@_koii/web3.js";
import { retryWithMaxCount } from "../modules/retryWithMaxCount.js";

import {
	K2_URL
} from "../config/constants.js";

export async function task(roundNumber) {
  // testing getTaskStateById (doesn't seem to work...)
  // let taskState = await retryWithMaxCount(namespaceWrapper.getTaskStateById, ['E5ThjNUEYoe3bnwAhq2m3v9PK5SeiVNn8PTgaQL5zpvr'], 3, 30); // testing with Mask Task
  // can also try the old way
  // let taskState = await namespaceWrapper.getTaskStateById('E5ThjNUEYoe3bnwAhq2m3v9PK5SeiVNn8PTgaQL5zpvr');
  // console.log('EZ TESTING got test taskID', taskState)

  // everything below this is broken as taskState can't be fetched...
  try {
    console.log(`EXECUTE TASK FOR ROUND ${roundNumber}`);
    // you can optionally return this value to be used in debugging

    let connection = new Connection(K2_URL);
    let distribution_proposal = [];
    let dev_bonus = [];
    let node_bonus = [];

    // the weighting factors are stored in array formatted with the taskId as the key, and the weighting factor as the value, the sum of all weighting factors should equal 1
    // eventually, these factors will be decided by a public vote of anyone running this task
    let weighting_factors = {
      "E5ThjNUEYoe3bnwAhq2m3v9PK5SeiVNn8PTgaQL5zpvr" : 0.3, // Mask Task
      "GX5dfxY5Ns82KZrJX4a8bBw3a6WMPHJ3sBxmycfoXR2Y" : 0.1, // Free Token Task
      "KiwDeyqgkC8bgKgXkBLa4qQ2honuBB4Zu152C6Ggb9J" : 0.3, // BIGBIG
      "D5G1uRNHwZiNkDAdrs3SjFtsdH683fKRQTNa8X9Cj3Nv" : 0.1 // Truflation
    };

    // first, get the list of all taskIDs
    let koiiTaskList = await getTaskList(connection, 'KOII');
    console.log('tasklist', koiiTaskList)

    // let kplTaskList = await getTaskList(connection, 'kpl');
    // TODO check if the getTaskStateById() works for KPL

    let taskList = koiiTaskList.taskPubKeys;

    // now, loop over the taskIDs and calculate the dev_bonus and node_bonus
    // for each task
    for (let taskID of taskList) {
      let taskState = await namespaceWrapper.getTaskStateById(taskID);

      if (!taskState) throw new Error("Task not found");

      // we calculate the dev_bonus and node_bonus for each task by the amount of unclaimed rewards
      let unclaimed_rewards = await getUnclaimedRewards(taskState);
      let developer_key = taskState.task_manager;

      // before adding the bonuses to the distribution proposal, we must weight them by the global weighting factors
      // the developer receives half of the bonus rewards, and the node receives the other half
      // there is only one developer key per task, so we can just multiply the dev_bonus by the weighting factor
      let total_unclaimed = unclaimed_rewards.reduce((acc, item) => acc + item, 0);
      let total_weighted = total_unclaimed * weighting_factors[taskID];
      dev_bonus.push({ developer_key, total_weighted });

      // there will be many nodes running each task
      // and multiply each item by the weighting factor
      // the taskState.stake_list contains a list of wallets staked into the task formatted as { wallet_addres : stake_amount } where the stake amount is an integer
      // we must extract the list of staked keys
      let node_keys = Object.keys(taskState.stake_list);
      let node_stakes = Object.values(taskState.stake_list);

      // now we can calculate the node_bonus for each node
      for (let i = 0; i < node_keys.length; i++) {
        // we must lookup the corresponding unclaimed balances for each node using their key
        let node_key = node_keys[i];
        let node_stake = node_stakes[i];
        let node_unclaimed_rewards = unclaimed_rewards[node_key];
        let node_bonus_amount = node_unclaimed_rewards * (1 - weighting_factors[taskID]) * node_stake;
        node_bonus.push({ node_key, node_bonus_amount });
      }
      
      // now we must add the developer rewards to the distribution proposal
      distribution_proposal.push({ developer_key, dev_bonus });

      // and then the node rewards must be added using the node_bonus_amount for each key
      for (let i = 0; i < node_keys.length; i++) {
        distribution_proposal.push({ node_key: node_keys[i], node_bonus: node_bonus[i] });
      }
    }

    // as some developers and nodes may be common between the many tasks, we must harmonize the final distribution list
    distribution_proposal = harmonizeDistribution(distribution_proposal);
    
    console.log('distribution_proposal', distribution_proposal)

    await namespaceWrapper.storeSet("dist_"+roundNumber, distribution_proposal);
  } catch (error) {
    console.error("EXECUTE TASK ERROR:", error);
  }
}

async function getUnclaimedRewards (taskState) {
  // loop over the taskState.availableBalances array and sum the unclaimed rewards
  // then calculate the percentage for each wallet and return an array in the format { wallet: address, percentage: percentage }
  // the sum of all percentages should equal 1
  let unclaimedRewards = taskState.availableBalances;
  let totalRewards = unclaimedRewards.reduce((acc, item) => acc + item, 0);
  return unclaimedRewards.map(item => item / totalRewards);
}

async function harmonizeDistribution ( distribution_proposal ) {
  // this function takes in the distribution proposal and harmonizes it so that each wallet only appears once
  // the rewards are then summed and returned in a new array
  // all bonuses must be integers
  let harmonized = [];
  let wallet_list = [];
  for (let item of distribution_proposal) {
    let wallet = item.developer_key || item.node_key;
    if (!wallet_list.includes(wallet)) {
      wallet_list.push(wallet);
      harmonized.push(item);
    } else {
      let index = wallet_list.indexOf(wallet);
      if (item.developer_key) {
        harmonized[index].total_weighted += item.total_weighted;
      } else {
        harmonized[index].node_bonus_amount += item.node_bonus_amount;
      }
    }
  }
}