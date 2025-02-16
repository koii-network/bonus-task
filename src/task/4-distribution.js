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

    const distData = await namespaceWrapper.storeGet(
      "dist_" + roundNumber,
    );
    
    console.log("Distribution data from storeGet:", distData);
    
    if (!distData) {
      console.log("No distribution data found for round:", roundNumber);
      return distributionList;
    }

    const { distribution_proposal } = distData;
    
    if (!distribution_proposal) {
      console.log("No distribution_proposal found in data for round:", roundNumber);
      return distributionList;
    }

    console.log("The number of distribution_proposal to check in distribution round:", Object.keys(distribution_proposal).length);

    let taskState;
    try {
      taskState = await namespaceWrapper.getTaskState({
        is_submission_required: true,
      });
    } catch (error) {
      console.error("Error getting task state:", error.message);
      return distributionList;
    }

    if (!taskState || !taskState.submissions) {
      console.log("Invalid task state or missing submissions");
      return distributionList;
    }

    const { submissions } = taskState;
    const currentSubmission = submissions[roundNumber];

    console.log("Get currentSubmission", currentSubmission);
    
    if (!currentSubmission) {
      console.log("Key not found in submissions for round:", roundNumber);
      return distributionList;
    }

    for (const key of Object.keys(currentSubmission)) {
      // Skip if the submitter is not in the approved list
      if (!approvedSubmitters.includes(key)) {
        console.log(`Skipping submission from ${key} as they are not in approved submitters list`);
        continue;
      }
      
      const submission = currentSubmission[key].submission_value;
      console.log(`Processing submission for ${key} with CID: ${cid}`);

      try {
        const { cid, acc1: getKoiiStakingKey, acc2: getKPLStakingKey} = submission;
        
        if (!cid || cid.substr(0,7) !== 'bafybei') {
          console.log("Invalid or missing data in CID response");
          continue;
        }

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

    // Check for approved submitters not in distributionList and assign them 0
    for (const approvedKey of approvedSubmitters) {
      if (!distributionList[approvedKey]) {
        console.log(`Approved submitter ${approvedKey} not found in distribution proposal, assigning 0`);
        distributionList[approvedKey] = 0;
      }
    }

    console.log("Final distributionList:", distributionList);
    
    return distributionList;
    
  } catch (error) {
    console.error("Error in distribution function:", error.message);
    return {};
  }
}
