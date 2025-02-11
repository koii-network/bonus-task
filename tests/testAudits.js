import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { taskList } from "../src/modules/globalList.js";

// Run the test
async function testAudit() {
  // Create dummy submissions that match the real submission format
  const dummySubmissions = {
    koiiStakingKey1: {
      submission_value: "cid1",
      data: {
        user_vote: {
          getStakingKeys: {
            getKoiiStakingKey: "koiiStakingKey1",
            getKPLStakingKey: "kplStakingKey1",
          },
          vote: JSON.stringify({
            votes: {
              HRFuq1iK8eTsoG6nFf3PydcpGZLX9Poqk2QhFuRjGs3A: {
                weighting_factors: 0.2,
                type: "KPL",
              },
              H5CKDzSi2qWs7y7JGMX8sGvAZnWcUDx8k1mCMVWyJf1M: {
                weighting_factors: 0.3,
                type: "KPL",
              },
              AD8KJJn9ysmps74dAdNYA6PaVGRyaZwrtNpEXJWCx4wy: {
                weighting_factors: 0.5,
                type: "KPL",
              },
            },
          }),
        },
      },
    },
    koiiStakingKey2: {
      submission_value: "cid2",
      data: {
        user_vote: {
          getStakingKeys: {
            getKoiiStakingKey: "koiiStakingKey2",
            getKPLStakingKey: "kplStakingKey2",
          },
          vote: JSON.stringify({
            votes: {
              BshiEPaoEKkyiadGsRmxg23iDosJKr3seqoN81GYJBBH: {
                weighting_factors: 0.5,
                type: "KPL",
              },
              "5s8stHNHhaHo3fS49uwC8jaRCrodCUZg9YfUPkYxsfRc": {
                weighting_factors: 0.3,
                type: "KPL",
              },
              "99dHXaUbJzr8o96qs8sog4PBfM8FksM81mkkPK9jxiLL": {
                weighting_factors: 0.2,
                type: "KOII",
              },
            },
          }),
        },
      },
    },
    koiiStakingKey3: {
      submission_value: "cid3",
      data: {
        user_vote: {
          getStakingKeys: {
            getKoiiStakingKey: "koiiStakingKey3",
            getKPLStakingKey: "kplStakingKey3",
          },
          vote: JSON.stringify({
            votes: {
              BshiEPaoEKkyiadGsRmxg23iDosJKr3seqoN81GYJBBH: {
                weighting_factors: 0.3,
                type: "KPL",
              },
              "5s8stHNHhaHo3fS49uwC8jaRCrodCUZg9YfUPkYxsfRc": {
                weighting_factors: 0.5,
                type: "KPL",
              },
              "99dHXaUbJzr8o96qs8sog4PBfM8FksM81mkkPK9jxiLL": {
                weighting_factors: 0.2,
                type: "KOII",
              },
            },
          }),
        },
      },
    },
    koiiStakingKey4: {
      submission_value: "cid4",
      data: {
        user_vote: {
          getStakingKeys: {
            getKoiiStakingKey: "koiiStakingKey4",
            getKPLStakingKey: "kplStakingKey4",
          },
          vote: JSON.stringify({
            votes: {
              BshiEPaoEKkyiadGsRmxg23iDosJKr3seqoN81GYJBBH: {
                weighting_factors: 1,
                type: "KPL",
              },
            },
          }),
        },
      },
    },
  };
  
  // Process all submissions to collect data from CIDs
  for (const [koiiStakingKey, submission] of Object.entries(dummySubmissions)) {
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
        const cidData = submission.data;
        
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
  taskList.forEach((task) => {
    weighting_factors[task.id] = 0;
    // Extract comment if it exists in the line after the ID
    const comment = task.id.match(/\/\/ (.+)$/);
    taskComments[task.id] = comment ? comment[1].trim() : "";
  });

  // Add debug logs for weight calculation
  console.log('\nCalculating final weights:');
  let totalWeight = 0;
  for (const [koiiStakingKey, submission] of Object.entries(dummySubmissions)) {
    try {
      const voteString = await namespaceWrapper.storeGet(
        `votes_${koiiStakingKey}`,
      );
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
  console.log(`Total weight before normalization: ${totalWeight}`);

  // Normalize weights to sum to 1
  if (totalWeight > 0) {
    for (const taskId in weighting_factors) {
      weighting_factors[taskId] = Number(
        (weighting_factors[taskId] / totalWeight).toFixed(1),
      );
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
  await namespaceWrapper.storeSet(
    "final_weighting_factors",
    JSON.stringify(weighting_factors),
  );
}

// Run the test
testAudit();
