import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { getDataFromCID } from "../modules/getDataFromCID.js";

const SLASH_PERCENT = 0.7;

export async function distribution(roundNumber) {
  const distributionList = {};

  try {
    const { distribution_proposal } = await namespaceWrapper.storeGet(
      "dist_" + roundNumber,
    );

    // Check current slot and Get the task state
    const taskState = await namespaceWrapper.getTaskState({
      is_submission_required: true,
    });

    const { submissions } = taskState;
    const currentSubmission = submissions[roundNumber];

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

        console.log("Checking KPL wallet:", getKPLStakingKey);
        console.log("Distribution proposal available:", Object.keys(distribution_proposal));

        if (distribution_proposal.hasOwnProperty(getKPLStakingKey)) {
          distributionList[getKoiiStakingKey] = distribution_proposal[getKPLStakingKey];
          console.log(`Assigned ${distribution_proposal[getKPLStakingKey]} to ${getKoiiStakingKey}`);
        } else {
          console.log(`No distribution found for KPL wallet: ${getKPLStakingKey}`);
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
