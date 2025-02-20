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

    // Get the stored distribution data for this round
    const distData = await namespaceWrapper.storeGet("vote_" + roundNumber);
    if (!distData) {
      console.log("No vote data found for round:", roundNumber);
      return null;
    }

    const { getStakingKeys, vote } = distData;
    if (!getStakingKeys || !vote) {
      console.log("Missing required data in distribution data");
      return null;
    }

    // Create the submission data structure
    const submissionData = {
      user_vote: {
        getStakingKeys,
        vote: JSON.parse(vote).votes
      }
    };

    // Store the submission data in a file
    const filePath = await storeInFile(submissionData);
    console.log("Submission data stored in file:", submissionData);

    if (filePath === null) {
      console.log("Failed to store submission data in file");
      return null;
    }

    // Upload the file and get CID
    const cid = await getSubmissionCID(filePath);
    if (!cid) {
      console.log("Failed to get CID for submission");
      return null;
    }

    console.log("Submission completed with CID:", cid);
    return cid;
  } catch (error) {
    console.error("MAKE SUBMISSION ERROR:", error);
    return null;
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
