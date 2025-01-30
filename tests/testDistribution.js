async function testdistribution(roundNumber) {
  const distributionList = {};

  // Test data
  const distribution_proposal = {
    kplWallet111: 1000,
    kplWallet222: 2000,
    kplWallet123: 3000,
  };

  try {
    const cidData = {
      distribution_proposal: {
        getStakingKeys: {
          getKoiiStakingKey: "koiiWallet123",
          getKPLStakingKey: "kplWallet123",
        },
        distribution_proposal: {
          kplWallet111: 1000,
          kplWallet222: 2000,
          kplWallet123: 3000,
        },
      },
    };

    const { getKoiiStakingKey, getKPLStakingKey } =
      cidData.distribution_proposal.getStakingKeys;

    console.log("Checking KPL wallet:", getKPLStakingKey);
    console.log("Distribution proposal:", distribution_proposal);

    if (distribution_proposal.hasOwnProperty(getKPLStakingKey)) {
      distributionList[getKoiiStakingKey] = distribution_proposal[getKPLStakingKey];
      console.log(`Assigned ${distribution_proposal[getKPLStakingKey]} to ${getKoiiStakingKey}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    console.log("ERROR GETTING DATA FROM CID IN DISTRIBUTION ", error);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  console.log("Final distributionList:", distributionList);

  // Return the final distribution list
  return distributionList;
}

// Run the test
console.log("Starting distribution test...");
testdistribution(1)
  .then(result => console.log("Test completed with result:", result))
  .catch(error => console.error("Test failed:", error));