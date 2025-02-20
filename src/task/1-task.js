import { namespaceWrapper } from "@_koii/namespace-wrapper";

export async function task(roundNumber) {
  /**
   * Run your task and store the proofs to be submitted for auditing
   * The submission of the proofs is done in the submission function
   */
  try {
    console.log(`EXECUTE TASK FOR ROUND ${roundNumber}`);
    // you can optionally return this value to be used in debugging

    // await new Promise(resolve => setTimeout(resolve, 300000)); // 5 minutes delay, waiting for voting to be done
    
    // get the votes
    const voteData = await namespaceWrapper.storeGet("votes");
    console.log("Raw vote data:", voteData);
    console.log("voteData type:", typeof voteData);
    
    // Parse the entire voteData string
    const parsedVoteData = JSON.parse(voteData);
    const vote = parsedVoteData.votes;
    console.log("Votes:", vote);
    
    // Process each vote and check for task upgrades
    let latestVotes = { ...vote };
    
    for (const voteKey in vote) {
      if (vote[voteKey]) {
        let currentTaskId = voteKey; // voteKey is the taskId
        let latestTaskId = currentTaskId;
        const taskType = vote[voteKey].type; // Get the task type (KOII or KPL)
        
        try {
          let currentTaskState = await namespaceWrapper.getTaskStateById(currentTaskId, taskType);

          // Keep track of seen task IDs to prevent infinite loops
          const seenTaskIds = new Set([currentTaskId]);
          
          // Follow the migration chain
          while (currentTaskState && currentTaskState.is_migrated && currentTaskState.migrated_to) {
            const nextTaskId = currentTaskState.migrated_to;
            console.log(`Found migration: ${currentTaskId} -> ${nextTaskId}`);
            
            // Check for circular migrations
            if (seenTaskIds.has(nextTaskId)) {
              console.error(`Circular migration detected for task ${currentTaskId}, stopping at ${latestTaskId}`);
              break;
            }
            
            // Update tracking
            seenTaskIds.add(nextTaskId);
            currentTaskId = nextTaskId;
            latestTaskId = currentTaskId; // Always update latestTaskId with the current valid ID
            
            // Get the next state
            currentTaskState = await namespaceWrapper.getTaskStateById(currentTaskId, taskType);
          }

          // Update vote with latest taskId if different from original
          if (latestTaskId !== voteKey) {
            console.log(`Migration complete: ${voteKey} -> ${latestTaskId}`);
            // Move the vote data to the new task ID
            latestVotes[latestTaskId] = {
              ...vote[voteKey],
              type: taskType // Preserve the task type
            };
            // Remove the old task entry since we've migrated to a new taskId
            delete latestVotes[voteKey];
          }
        } catch (error) {
          console.error(`Error checking migrations for task ${currentTaskId}:`, error);
          // Keep the original vote if there's an error checking migrations
          continue;
        }
      }
    }
    
    // get both kpl and koii staking key
    const getKoiiStakingKey = await namespaceWrapper.getSubmitterAccount("KOII");
    const getKPLStakingKey = await namespaceWrapper.getSubmitterAccount("KPL");

    const koiiPublicKey = getKoiiStakingKey.publicKey.toBase58();
    const kplPublicKey = getKPLStakingKey.publicKey.toBase58();

    const getStakingKeys = {
      getKoiiStakingKey: koiiPublicKey,
      getKPLStakingKey: kplPublicKey,
    };

    await namespaceWrapper.storeSet("vote_" + roundNumber, {
      getStakingKeys,
      vote: latestVotes,
    });

  } catch (error) {
    console.error("EXECUTE TASK ERROR:", error);
  }
}
