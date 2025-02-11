import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { getDataFromCID } from "../modules/getDataFromCID.js";
import { taskList } from "../modules/globalList.js";
import { calculateRewards, checkSumTally } from "../modules/helpers.js";
import bs58 from "bs58";
import { REWARD_PER_ROUND } from "../config/constants.js";

export async function audit(submission, roundNumber, submitterKey) {
    // Get all submissions for the round
    const allSubmissions = await namespaceWrapper.getTaskSubmissionInfo(roundNumber);
    
    // Process all submissions to collect data from CIDs
    for (const [koiiStakingKey, submission] of Object.entries(allSubmissions)) {
        console.log(`\nProcessing submission for key: ${koiiStakingKey}`);
        
        // Check if the submission is already processed
        const stakingKey = await namespaceWrapper.storeGet(`staking_key_${koiiStakingKey}`);
        const vote = await namespaceWrapper.storeGet(`votes_${koiiStakingKey}`);
        if (stakingKey && vote) {
            console.log(`Already processed for key ${koiiStakingKey}`);
            console.log('Stored staking key:', stakingKey);
            console.log('Stored vote:', vote);
            continue;
        }
        
        try {
            // Get data from CID
            const cidData = await getDataFromCID(submission.submission_value);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
            
            // Parse the vote_0 data
            if (cidData.user_vote) {
                const { getStakingKeys, vote } = cidData.user_vote;
                console.log('Processing user vote data:');
                console.log('- Staking Keys:', getStakingKeys);
                console.log('- Vote:', vote);
                
                // Store staking key pairs
                await namespaceWrapper.storeSet(
                    `staking_key_${getStakingKeys.getKoiiStakingKey}`,
                    getStakingKeys.getKPLStakingKey
                );
                console.log(`Stored staking key pair: ${getStakingKeys.getKoiiStakingKey} -> ${getStakingKeys.getKPLStakingKey}`);
                
                // Store votes with formatted key
                const voteKey = `votes_${getStakingKeys.getKoiiStakingKey}`;
                await namespaceWrapper.storeSet(voteKey, vote);
                console.log(`Stored vote data with key: ${voteKey}`);
            } else {
                console.log('No user_vote data found in CID data');
            }
        } catch (error) {
            console.error(`Error processing submission for key ${koiiStakingKey}:`, error);
            console.error('Error stack:', error.stack);
        }
    }
    
    // Initialize weighting_factors with all tasks from taskList
    const weighting_factors = {};
    const taskComments = {};
    
    // Create mapping of task IDs to their comments
    taskList.forEach(task => {
        weighting_factors[task.id] = 0;
        // Extract comment if it exists in the line after the ID
        const comment = task.id.match(/\/\/ (.+)$/);
        taskComments[task.id] = comment ? comment[1].trim() : '';
    });
    
    // Add debug logs for weight calculation
    console.log('\nCalculating final weights:');
    let totalWeight = 0;
    for (const [koiiStakingKey, submission] of Object.entries(allSubmissions)) {
        try {
            const voteString = await namespaceWrapper.storeGet(`votes_${koiiStakingKey}`);
            if (!voteString) continue;
            
            const voteData = JSON.parse(voteString);
            const votes = voteData.votes;
            
            for (const [taskId, taskData] of Object.entries(votes)) {
                if (taskId in weighting_factors) {
                    weighting_factors[taskId] += taskData.weighting_factors;
                    totalWeight += taskData.weighting_factors;
                }
            }
        } catch (error) {
            console.error(`Error processing votes for key ${koiiStakingKey}:`, error);
        }
    }
    
    // Normalize weights to sum to 1
    if (totalWeight > 0) {
        for (const taskId in weighting_factors) {
            weighting_factors[taskId] = Number((weighting_factors[taskId] / totalWeight).toFixed(1));
        }
    } else {
        // If no votes, distribute weights equally
        const equalWeight = 1 / Object.keys(weighting_factors).length;
        for (const taskId in weighting_factors) {
            weighting_factors[taskId] = Number(equalWeight.toFixed(1));
        }
    }
    
    // After normalization
    console.log('\nNormalized weights:');
    for (const [taskId, weight] of Object.entries(weighting_factors)) {
        console.log(`Task ${taskId}: ${weight}`);
    }
    
    // Store the final weighting factors
    await namespaceWrapper.storeSet('final_weighting_factors', JSON.stringify(weighting_factors));
    
    return {
        stakingKeyPairs: {}, // Already stored in namespace
        userVotes: {},      // Already stored in namespace
        weighting_factors   // The calculated normalized weights with comments
    };
}
