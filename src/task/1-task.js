import { namespaceWrapper } from "@_koii/namespace-wrapper";

export async function task(roundNumber) {
  /**
   * Run your task and store the proofs to be submitted for auditing
   * The submission of the proofs is done in the submission function
   */
  try {
    console.log(`EXECUTE TASK FOR ROUND ${roundNumber}`);
    // you can optionally return this value to be used in debugging

    await new Promise(resolve => setTimeout(resolve, 300000)); // 5 minutes delay, waiting for voting to be done
    // get the votes
    const vote = await namespaceWrapper.storeGet("votes");
    console.log("getVotes", vote);

    // get both kpl and koii staking key
    const getKoiiStakingKey =
      await namespaceWrapper.getSubmitterAccount("KOII");
    const getKPLStakingKey = await namespaceWrapper.getSubmitterAccount("KPL");

    const koiiPublicKey = getKoiiStakingKey.publicKey.toBase58();
    const kplPublicKey = getKPLStakingKey.publicKey.toBase58();

    const getStakingKeys = {
      getKoiiStakingKey: koiiPublicKey,
      getKPLStakingKey: kplPublicKey,
    };

    await namespaceWrapper.storeSet("vote_" + roundNumber, {
      getStakingKeys,
      vote,
    });

  } catch (error) {
    console.error("EXECUTE TASK ERROR:", error);
  }
}
