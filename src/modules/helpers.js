async function getUnclaimedRewards (taskState) {
  // loop over the taskState.availableBalances array and sum the unclaimed rewards
  // then calculate the percentage for each wallet and return an array in the format { wallet: address, percentage: percentage }
  // the sum of all percentages should equal 1
  let unclaimedRewards = taskState.available_balances;
  
  // get the total unclaimed rewards
  let unclaimedRewardsValues = Object.values(unclaimedRewards);
  let totalUnclaimed = unclaimedRewardsValues.reduce((acc, item) => acc + item, 0);
  let unclaimedRewardsKeys = Object.keys(unclaimedRewards);
  let output = []
  let rewardsPortionTotal = 0;

  // calculate the percentage for each wallet
  for (let wallet in unclaimedRewardsKeys) {
    let wallet_key = unclaimedRewardsKeys[wallet].toString();
    let rewards_portion = unclaimedRewardsValues[wallet] / totalUnclaimed;
    output[wallet_key] = rewards_portion;
    rewardsPortionTotal += rewards_portion;
  }
  console.log('rewards_portion', rewardsPortionTotal)

  return { all: output, sum: totalUnclaimed };
}

async function harmonizeDistribution ( distribution_proposal ) {
  // this function takes in the distribution proposal and harmonizes it so that each wallet only appears once
  // the rewards are then summed and returned in a new array
  // all bonuses must be integers
  
  let harmonized = [];
  let distribution_proposal_keys = Object.keys(distribution_proposal);
  for (let key of distribution_proposal_keys) {
      let value = distribution_proposal[key];
      if (harmonized[key]) {
        harmonized[key] += value;
      } else {
        harmonized[key] = value;
      }
  }

  return harmonized;
}

async function checkSumTally (harmonized) {
  // calculate the total sum of the harmonized rewards 
  
  let harmonized_keys = Object.keys(harmonized);
  let checksum = 0;
  for (let key of harmonized_keys) {
    checksum += harmonized[key];
  }

  return checksum;
}

export { getUnclaimedRewards, harmonizeDistribution, checkSumTally };