// Define the percentage by which to slash the stake of submitters who submitted incorrect values

import { namespaceWrapper } from "@_koii/namespace-wrapper";

// 0.7 = 70%
const SLASH_PERCENT = 0.7;

export function distribution(submitters, bounty, roundNumber) {
  // fetch the distribution from the state
  let bonus_list = namespaceWrapper.storeGet("dist_" + roundNumber);

  // convert the bonus list to a properly formatted distribution list
  let distributionList = [];
  for (let item of bonus_list) {
    if (item.developer_key) {
      distributionList.push({
        wallet: item.developer_key,
        amount: Math.floor(item.dev_bonus),
      });
    } else {
      distributionList.push({
        wallet: item.node_key,
        amount: Math.floor(item.node_bonus_amount),
      });
    }
  }

  // Return the final distribution list
  return distributionList;
}
