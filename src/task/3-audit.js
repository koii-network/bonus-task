import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { getDataFromCID } from "../modules/getDataFromCID.js";
import { Connection, PublicKey } from "@_koii/web3.js";
import { getTaskStateInfo } from "@_koii/create-task-cli";

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
    if (!data || !data.distribution_proposal) {
      console.log("Failed to fetch data from CID");
      return true;
    }

    let taskList = [
      {
        id: "HRFuq1iK8eTsoG6nFf3PydcpGZLX9Poqk2QhFuRjGs3A", // Mask Task
        type: "KOII",
      },
      {
        id: "7BBKnthEGMnc5pfixTJu7FwkmuTt99naFd8NsRMsaEYh", //Free Fire Task
        type: "KOII",
      },
      {
        id: "AD8KJJn9ysmps74dAdNYA6PaVGRyaZwrtNpEXJWCx4wy", // BigBig
        type: "KOII",
      },
      {
        id: "3BXESVkbTou7ZNSXwTFrGoqkFa79FondJZZ5uRag3tiZ", // Truflation
        type: "KOII",
      },
    ];

    const connection = new Connection("https://mainnet.koii.network");

    const taskIds = taskList.map((task) => task.id);
    const submissionList = new Set();

    for (let taskId of taskIds) {
      console.log(`Checking task ID: ${taskId}`);
      const taskState = await getTaskStateInfo(connection, taskId);
      
      if (!taskState || !taskState.submissions) {
        console.log(`Failed to get submission for task ${taskId}`);
        return true;
      }

      // Check past 5 rounds
      for (let i = 1; i <= 5; i++) {
        const pastRound = roundNumber - i;
        if (pastRound > 0) {
          console.log(`Checking round ${pastRound} for task ${taskId}`);
          const roundSubmissions = taskState.submissions[pastRound];
          if (roundSubmissions && Array.isArray(roundSubmissions)) {
            roundSubmissions.forEach((address) => submissionList.add(address));
            console.log(`Found ${roundSubmissions.length} submissions in round ${pastRound}`);
          }
        }
      }
    }

    // Check if all addresses in distribution_proposal exist in submissionList
    const distributionAddresses = Object.keys(data.distribution_proposal);
    for (const address of distributionAddresses) {
      if (!submissionList.has(address)) {
        console.log(
          `Address ${address} in distribution not found in past submissions`,
        );
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error during audit:", error.message);
    return false;
  }
}
