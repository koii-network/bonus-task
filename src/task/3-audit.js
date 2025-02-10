import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { getDataFromCID } from "../modules/getDataFromCID.js";
import { calculateRewards, checkSumTally } from "../modules/helpers.js";
import bs58 from "bs58";
import { REWARD_PER_ROUND } from "../config/constants.js";

export async function audit(submission, roundNumber, submitterKey) {
    // Get all submissions for the round
    const allSubmissions = await namespaceWrapper.getTaskSubmissionInfo(roundNumber);
    
    // Process all submissions to collect data from CIDs
    for (const [koiiStakingKey, submission] of Object.entries(allSubmissions)) {
      // Check if the submission is already processed
      const stakingKey = await namespaceWrapper.storeGet(`staking_key_${koiiStakingKey}`);
      const vote = await namespaceWrapper.storeGet(`votes_${koiiStakingKey}`);
      if(stakingKey && vote) {
        continue;
      }
        try {
            // Get data from CID
            const cidData = await getDataFromCID(submission.submission_value);
            
            // Parse the vote_0 data
            if (cidData.user_vote) {
                const { getStakingKeys, vote } = cidData.user_vote;
                
                // Store staking key pairs
                await namespaceWrapper.storeSet(`staking_key_${getStakingKeys.getKoiiStakingKey}`, getStakingKeys.getKPLStakingKey);
                
                // Store votes with formatted key
                const voteKey = `votes_${getStakingKeys.getKoiiStakingKey}`;
                await namespaceWrapper.storeSet(voteKey, vote);
            }
        } catch (error) {
            console.error(`Error processing submission for key ${koiiStakingKey}:`, error);
        }
    }
    
    return {
        stakingKeyPairs,
        userVotes
    };
}
