import { namespaceWrapper } from "@_koii/namespace-wrapper";
const SLASH_PERCENT = 0;

export async function distribution(submitters, bounty, roundNumber) {
  try {
    console.log(`MAKE DISTRIBUTION LIST FOR ROUND ${roundNumber}`);

    // Initialize an empty object to store the final distribution list
    const distributionList = {};

    // Initialize an empty array to store the public keys of submitters with correct values
    const approvedSubmitters = [];

    // Iterate through the list of submitters and handle each one
    for (const submitter of submitters) {
      // If the submitter's votes are 0, they do not get any reward
      if (submitter.votes === 0) {
        distributionList[submitter.publicKey] = 0;

        // If the submitter's votes are negative (submitted incorrect values), slash their stake
      } else if (submitter.votes < 0) {
        // Slash the submitter's stake by the defined percentage
        const slashedStake = Math.floor(submitter.stake * SLASH_PERCENT);
        // Add the slashed amount to the distribution list
        // since the stake is positive, we use a negative value to indicate a slash
        distributionList[submitter.publicKey] = -slashedStake;

        // Log that the submitter's stake has been slashed
        console.log(
          "CANDIDATE STAKE SLASHED",
          submitter.publicKey,
          slashedStake,
        );

        // If the submitter's votes are positive, add their public key to the approved submitters list
      } else {
        approvedSubmitters.push(submitter.publicKey);
      }
    }

    // If no submitters submitted correct values, return the current distribution list
    if (approvedSubmitters.length === 0) {
      console.log("NO NODES TO REWARD");
      return distributionList;
    }

    const distribution_proposal = await namespaceWrapper.storeGet(
      "finalDistributionList_" + roundNumber,
    );

    console.log("Distribution data from storeGet:", distribution_proposal);

    if (!distribution_proposal) {
      console.log(
        "No distribution_proposal found in data for round:",
        roundNumber,
      );
      return distributionList;
    }

    console.log(
      "The number of distribution_proposal to check in distribution round:",
      Object.keys(distribution_proposal).length,
    );

    for (const [key, value] of Object.entries(distribution_proposal)) {
      console.log(`Key: ${key}, Value: ${value}`);
      // Skip if the submitter is not in the approved list
      if (!approvedSubmitters.includes(key)) {
        console.log(
          `Skipping submission from ${key} as they are not in approved submitters list`,
        );
        continue;
      }

      distributionList[key] = value;
    }

    console.log("Final distributionList:", distributionList);
    return distributionList;
  } catch (error) {
    console.error("Error in distribution function:", error.message);
    return {};
  }
}
