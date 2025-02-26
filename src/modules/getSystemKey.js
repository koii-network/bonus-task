import { PublicKey } from "@_koii/web3.js";

export async function getSystemKey(connection, stakingKey) {
  try {
    const publicKey = new PublicKey(stakingKey);

    // Fetching transaction signatures for the given public key
    const response = await connection.getConfirmedSignaturesForAddress2(
      publicKey,
      {
        limit: 1, // Only fetch the most recent transaction
        commitment: "confirmed",
      },
    );

    if (response && response.length === 0) return null;

    const transaction = await connection.getConfirmedTransaction(
      response[0].signature,
      "confirmed",
    );

    if (!transaction || !transaction.transaction) return null;

    const syskey = transaction.transaction.signatures[0]?.publicKey?.toString();

    return syskey || null;
  } catch (e) {
    console.error("Something goes wrong when get user system key", e);
    return null;
  }
}
