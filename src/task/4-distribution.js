import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { getDataFromCID } from "../modules/getDataFromCID";

const SLASH_PERCENT = 0.7;

export async function distribution(submitters, bounty, roundNumber) {
  const distributionList = {};

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
    console.log("Key not found in submissions.");
    return {};
  }

  for (const key of Object.keys(currentSubmission)) {
    const cid = currentSubmission[key].submission_value;
    console.log(`Fetching data for CID: ${cid}`);

    try {
      const cidData = await getDataFromCID(cid);
      if (!cidData || !cidData.getStakingKeys) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }

      const { getKoiiStakingKey, getKPLStakingKey } =
        cidData.distribution_proposal.getStakingKeys;

      if (distribution_proposal.hasOwnProperty(getKPLStakingKey)) {
        distributionList[getKoiiStakingKey] =
          distributionList[getKPLStakingKey];
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.log("ERROR GETTING DATA FROM CID IN DISTRIBUTION ", error);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      continue;
    }
  }

  console.log("distributionList:", distributionList);

  // Return the final distribution list
  return {};
}
