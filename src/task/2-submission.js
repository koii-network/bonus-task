import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { storeInFile } from "../modules/storeFile.js";
import { KoiiStorageClient } from "@_koii/storage-task-sdk";

export async function submission(roundNumber) {
  /**
   * Submit the task proofs for auditing
   * Must return a string of max 512 bytes to be submitted on chain
   */
  try {
    console.log(`MAKE SUBMISSION FOR ROUND ${roundNumber}`);

    const get_distribution_proposal = await namespaceWrapper.storeGet(
      "dist_" + roundNumber,
    );

    const getFilePath = await storeInFile({
      distribution_proposal: get_distribution_proposal,
    });
    console.log("getFilePath", getFilePath);

    const getCID = await getSubmissionCID(getFilePath);

    // Not sure if we need to store again data before the audits
    // await namespaceWrapper.storeSet("dist_" + roundNumber, {
    //   get_distribution_proposal,
    //   getCID,
    // });

    console.log("submission completed");
    return getCID;
  } catch (error) {
    console.error("MAKE SUBMISSION ERROR:", error);
  }
}

async function getSubmissionCID(filePath) {
  try {
    const client = new KoiiStorageClient(undefined, undefined, true);

    const userStaking = await namespaceWrapper.getSubmitterAccount();

    const { cid } = await client.uploadFile(filePath, userStaking);
    return cid;
  } catch (error) {
    console.error("Error getting CID:", error);
    return null;
  }
}
