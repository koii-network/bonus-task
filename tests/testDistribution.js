import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { getDataFromCID } from "../src/modules/getDataFromCID.js";

const SLASH_PERCENT = 0;

export function distribution(roundNumber) {
  return new Promise(async (resolve) => {
    try {
      const distributionList = {};

      const { distribution_proposal } = await namespaceWrapper.storeGet(
        "dist_" + roundNumber,
      );
      // console.log("distribution_proposal to check in distribution round", distribution_proposal);

      const taskState = {
        submissions: {
          0: {
            AwQj7Y9wCNFxt3PFTuxWcHQfztqb9PsQtbqN8GQwFD9y: {
              submission_value:
                "bafybeib2npqjx4tafalyv3kpx3evtffdy2t5rkrujkbxzbdeayevprdiqi",
              slot: 5914414,
            },
          },
          4: {
            A4uPoFEk58MLDJpsgHZwTmq3dfzjrrhtNZyhAdbNRZDo: {
              submission_value: "",
              slot: 5919065,
            },
          },
        },
      };

      const currentSubmission = taskState.submissions[roundNumber];

      if (!currentSubmission) {
        console.log("Key not found in submissions for round:", roundNumber);
        resolve({});
        return;
      }

      for (const key of Object.keys(currentSubmission)) {
        try {
          const cid = currentSubmission[key].submission_value;
          const cidData = await getDataFromCID(
            "distribution_proposal.json",
            cid,
          );

          if (!cidData?.distribution_proposal?.getStakingKeys) continue;

          const { getKoiiStakingKey, getKPLStakingKey } =
            cidData.distribution_proposal.getStakingKeys;

          if (distribution_proposal.hasOwnProperty(getKPLStakingKey)) {
            distributionList[getKoiiStakingKey] =
              distribution_proposal[getKPLStakingKey];
          }
        } catch (error) {
          console.error("Error processing submission:", error.message);
        }
      }

      resolve(distributionList);
    } catch (error) {
      console.error("Error in distribution function:", error.message);
      resolve({});
    }
  });
}

// Run the test
distribution(0).then((result) => {
  console.log("Test completed with result:", result);
});
