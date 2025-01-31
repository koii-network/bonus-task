import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { getDataFromCID } from "../modules/getDataFromCID.js";

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
        console.log("CANDIDATE STAKE SLASHED", submitter.publicKey, slashedStake);
  
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

    const { distribution_proposal } = await namespaceWrapper.storeGet(
      "dist_" + roundNumber,
    );
    console.log("The number of distribution_proposal to check in distribution round:", Object.keys(distribution_proposal).length);

    const taskState = await namespaceWrapper.getTaskState({
      is_submission_required: true,
    });

    const { submissions } = taskState;
    const currentSubmission = submissions[roundNumber];

    console.log("Get currentSubmission", currentSubmission);
    
    if (!currentSubmission) {
      console.log("Key not found in submissions for round:", roundNumber);
      return {};
    }

    for (const key of Object.keys(currentSubmission)) {
      const cid = currentSubmission[key].submission_value;
      console.log(`Processing submission for ${key} with CID: ${cid}`);

      try {
        const cidData = await getDataFromCID("distribution_proposal.json", cid);
        if (!cidData || !cidData.distribution_proposal || !cidData.distribution_proposal.getStakingKeys) {
          console.log("Invalid or missing data in CID response");
          continue;
        }

        const { getKoiiStakingKey, getKPLStakingKey } =
          cidData.distribution_proposal.getStakingKeys;

        console.log("Checking KOII wallet:", getKoiiStakingKey);
        console.log("Checking KPL wallet:", getKPLStakingKey);
        console.log("The number of distribution proposal available:", Object.keys(distribution_proposal).length);

        // Check if either KPL or KOII staking wallet exists in distribution_proposal
        const kplBounty = distribution_proposal[getKPLStakingKey] || 0;
        const koiiBounty = distribution_proposal[getKoiiStakingKey] || 0;
        const currentBounty = Math.max(kplBounty, koiiBounty);

        if (currentBounty > 0) {
            distributionList[getKoiiStakingKey] = currentBounty;
            console.log(`Assigned highest bounty ${currentBounty} to KOII wallet ${getKoiiStakingKey} (KPL: ${kplBounty}, KOII: ${koiiBounty})`);
        } else {
            distributionList[getKoiiStakingKey] = 0;
            console.log(`No bounty found for either KPL wallet ${getKPLStakingKey} or KOII wallet ${getKoiiStakingKey}`);
        }

      } catch (error) {
        console.error("Error processing submission:", error.message);
        continue;
      }
    }

    console.log("Final distributionList:", distributionList);
    return distributionList;
    
  } catch (error) {
    console.error("Error in distribution function:", error.message);
    return {};
  }
}
