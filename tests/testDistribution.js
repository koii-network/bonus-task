import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { getDataFromCID } from "../src/modules/getDataFromCID.js";

const SLASH_PERCENT = 0.7;

export async function distribution(roundNumber) {
  const distributionList = {};

  try {
    const { distribution_proposal } = await namespaceWrapper.storeGet(
      "dist_" + roundNumber,
    );
    // console.log("distribution_proposal to check in distribution round", distribution_proposal);

    const taskState = {
      task_id: '',
      task_name: 'DummyTestState',
      task_manager: '',
      is_allowlisted: false,
      is_active: false,
      task_audit_program: 'test',
      stake_pot_account: '',
      total_bounty_amount: 10000000000,
      bounty_amount_per_round: 1000000000,
      current_round: 0,
      available_balances: {},
      stake_list: {},
      task_metadata: 'test',
      task_description: 'Dummy Task state for testing flow',
      submissions: 
        {
          "0": {
            "AwQj7Y9wCNFxt3PFTuxWcHQfztqb9PsQtbqN8GQwFD9y": {
              "submission_value": "bafybeifcrqbofdm2rpqogmbtkjpqlwepma6mfj77wrmwh5bqlxi6moclde",
              "slot": 5914414
            },
            "q8p7ZwNL1dVngMHstsm7VP62uAe9W7vN3v3mjG1Xnds": {
              "submission_value": "bafybeiccvcxhbvqrvyacii6otgcsesbhnyh7gx2iip72putwwgx2c3znqy",
              "slot": 5921738
            }
          },
          "4": {
            "A4uPoFEk58MLDJpsgHZwTmq3dfzjrrhtNZyhAdbNRZDo": {
              "submission_value": "",
              "slot": 5919065
            }
          },
          "6": {
            "AwQj7Y9wCNFxt3PFTuxWcHQfztqb9PsQtbqN8GQwFD9y": {
              "submission_value": "bafybeidposn2cang5gwwqkhxhgmuzkdyz6kvecruqqlxgboxnq5wc7ea6m",
              "slot": 5921708
            },
            
          }
        },
      submissions_audit_trigger: {},
      total_stake_amount: 50000000000,
      minimum_stake_amount: 5000000000,
      ip_address_list: {},
      round_time: 600,
      starting_slot: 0,
      audit_window: 200,
      submission_window: 200,
      task_executable_network: 'IPFS',
      distribution_rewards_submission: {},
      distributions_audit_trigger: {},
      distributions_audit_record: {},
      task_vars: 'test',
      koii_vars: 'test',
      is_migrated: false,
      migrated_to: '',
      allowed_failed_distributions: 0
    }

    // console.log("Get taskState", taskState);
    const { submissions } = taskState;
    const currentSubmission = submissions[roundNumber];

    console.log("Get currentSubmission", currentSubmission);
    
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

        const { getKoiiStakingKey, getKPLStakingKey } = cidData.distribution_proposal.getStakingKeys;

        console.log("Checking KOII wallet:", getKoiiStakingKey);
        console.log("Checking KPL wallet:", getKPLStakingKey);
        console.log("The number of distribution proposal available:", Object.keys(distribution_proposal).length);

        // Check if either KPL or KOII staking wallet exists in distribution_proposal
        const kplBounty = distribution_proposal[getKPLStakingKey] || 0;
        const koiiBounty = distribution_proposal[getKoiiStakingKey] || 0;
        const currentBounty = Math.max(kplBounty, koiiBounty);

        if (currentBounty > 0) {
            distributionList[getKoiiStakingKey] = currentBounty;
            console.log(`Assigned highest bounty ${currentBounty} to KOII wallet ${getKoiiStakingKey} (KPL: ${kplBounty}, KOII: ${koiiBounty})`);
        } else {
            distributionList[getKoiiStakingKey] = 0;
            console.log(`No bounty found for either KPL wallet ${getKPLStakingKey} or KOII wallet ${getKoiiStakingKey}`);
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

distribution(0);