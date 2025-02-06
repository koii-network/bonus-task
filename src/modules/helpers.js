async function getUnclaimedRewards(taskState) {
  // loop over the taskState.availableBalances array and sum the unclaimed rewards
  // then calculate the percentage for each wallet and return an array in the format { wallet: address, percentage: percentage }
  // the sum of all percentages should equal 1
  let unclaimedRewards = taskState.available_balances;

  // get the total unclaimed rewards
  let unclaimedRewardsValues = Object.values(unclaimedRewards);
  let totalUnclaimed = unclaimedRewardsValues.reduce(
    (acc, item) => acc + item,
    0,
  );
  let unclaimedRewardsKeys = Object.keys(unclaimedRewards);
  let output = [];
  let rewardsPortionTotal = 0;

  // calculate the percentage for each wallet
  for (let wallet in unclaimedRewardsKeys) {
    let wallet_key = unclaimedRewardsKeys[wallet].toString();
    let rewards_portion = unclaimedRewardsValues[wallet] / totalUnclaimed;
    output[wallet_key] = rewards_portion;
    rewardsPortionTotal += rewards_portion;
  }
  // console.log("rewards_portion", rewardsPortionTotal);

  return { all: output, sum: totalUnclaimed };
}

async function checkSumTally(harmonized) {
  // calculate the total sum of the harmonized rewards

  let harmonized_keys = Object.keys(harmonized);
  let checksum = 0;
  for (let key of harmonized_keys) {
    checksum += harmonized[key];
  }

  return checksum;
}

// Calculate rewards for users based on their stakes and submissions
async function calculateRewards(users, totalReward) {
  // Calculate total weight
  let totalWeight = 0;

  // Calculate user weights
  const userWeights = {};

  // Calculate weights
  for (const user in users) {
    const weight = calculateWeight(users[user]);
    userWeights[user] = weight;
    totalWeight += weight;
  }

  console.log("Total reward:", totalReward);

  // Validate totalWeight to prevent division by zero
  if (totalWeight === 0) {
    console.error("Total weight is 0, cannot calculate rewards");
    return {};
  }

  // Calculate rewards based on weights and total reward
  const rewards = {};
  for (const user in users) {
    rewards[user] = Math.floor((userWeights[user] / totalWeight) * totalReward);
  }

  return rewards;
}

function calculateWeight(user, alpha = 0.5) {
  const beta = 1 - alpha;

  let stakeWeight = 0;
  let submissionWeight = 0;
  let developerBonus = 0;

  // Sum submissions with validation
  if (user.submissions && typeof user.submissions === "object") {
    for (const task in user.submissions) {
      const submission = user.submissions[task];
      if (typeof submission === "number" && !isNaN(submission)) {
        submissionWeight += submission;

        // Developer bonus
        if (user.developerOf && user.developerOf[task] === true) {
          const bonus = 0.5 * submission;
          developerBonus += bonus;
        }
      }
    }
  }

  // Sum stakes with validation
  if (user.stakes && typeof user.stakes === "object") {
    for (const task in user.stakes) {
      const stake = user.stakes[task];
      if (typeof stake === "number" && !isNaN(stake)) {
        stakeWeight += stake;
      }
    }
  }

  // Final weight calculation with validation
  const finalWeight = Math.floor(
    alpha * stakeWeight + beta * (submissionWeight + developerBonus) * 1e9,
  );

  return finalWeight;
}


export { checkSumTally, calculateRewards };
