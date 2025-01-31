import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { getDataFromCID } from "../modules/getDataFromCID.js";

const SLASH_PERCENT = 0;

export function distribution(submitters, bounty, roundNumber) {
  return new Promise(async (resolve) => {
    try {
      console.log(`MAKE DISTRIBUTION LIST FOR ROUND ${roundNumber}`);
      const distributionList = {};
      const approvedSubmitters = [];
  
      for (const submitter of submitters) {
        if (submitter.votes === 0) {
          distributionList[submitter.publicKey] = 0;
        } else if (submitter.votes < 0) {
          const slashedStake = Math.floor(submitter.stake * SLASH_PERCENT);
          distributionList[submitter.publicKey] = -slashedStake;
          console.log("CANDIDATE STAKE SLASHED", submitter.publicKey, slashedStake);
        } else {
          approvedSubmitters.push(submitter.publicKey);
        }
      }
  
      if (approvedSubmitters.length === 0) {
        console.log("NO NODES TO REWARD");
        resolve(distributionList);
        return;
      }

      const { distribution_proposal } = await namespaceWrapper.storeGet("dist_" + roundNumber);
      const taskState = await namespaceWrapper.getTaskState({ is_submission_required: true });
      const currentSubmission = taskState.submissions[roundNumber];

      if (!currentSubmission) {
        console.log("Key not found in submissions for round:", roundNumber);
        resolve({});
        return;
      }

      for (const key of Object.keys(currentSubmission)) {
        try {
          const cid = currentSubmission[key].submission_value;
          const cidData = await getDataFromCID("distribution_proposal.json", cid);
          
          if (!cidData?.distribution_proposal?.getStakingKeys) continue;

          const { getKoiiStakingKey, getKPLStakingKey } = cidData.distribution_proposal.getStakingKeys;

          if (distribution_proposal.hasOwnProperty(getKPLStakingKey)) {
            distributionList[getKoiiStakingKey] = distribution_proposal[getKPLStakingKey];
          }
        } catch (error) {
          console.error("Error processing submission:", error.message);
        }
      }

      resolve(distributionList);
    } catch (error) {
      console.error("Error in distribution function:", error.message);
      resolve({});
    }
  });
}
