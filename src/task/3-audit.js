import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { getDataFromCID } from "../modules/getDataFromCID.js";

export async function audit(submission, roundNumber, submitterKey) {
  /**
   * Audit a submission
   * This function should return true if the submission is correct, false otherwise
   */
  console.log(`AUDIT SUBMISSION FOR ROUND ${roundNumber} from ${submitterKey}`);

  try {
    const cid = submission;
    // Fetch and validate the data
    const data = await getDataFromCID("distribution_proposal.json", cid);
    if (
      !data ||
      !data.distribution_proposal ||
      !data.distribution_proposal.distribution_proposal ||
      !data.distribution_proposal.getStakingKeys
    ) {
      console.log("Failed to fetch data from CID");
      return false;
    }

    const getStakingKeys = data.distribution_proposal.getStakingKeys;
    const distribution_proposal =
      data.distribution_proposal.distribution_proposal;

    // console.log(getStakingKeys, distribution_proposal);

    if (!getStakingKeys.getKoiiStakingKey || !getStakingKeys.getKPLStakingKey) {
      console.log("No staking keys found in CID");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error during audit:", error.message);
    return false;
  }
}
