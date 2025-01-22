import { PublicKey } from "@_koii/web3.js";

export async function getSystemKey(connection, stakingKey) {
    const publicKey = new PublicKey(stakingKey);
    // Fetching transaction signatures for the given public key
    const response = await connection.getConfirmedSignaturesForAddress2(
      publicKey,
      {
        limit: 1, // Only fetch the most recent transaction
        commitment: "confirmed",
      },
    );
  
    if (response && response.length > 0) {
      // Use the first transaction signature to get transaction details
      const transaction = await connection.getConfirmedTransaction(
        response[0].signature,
        "confirmed",
      );
  
      if (transaction && transaction.transaction) {
        const syskey = transaction.transaction.signatures[0].publicKey.toString();
        console.log("syskey", syskey);
        return syskey;
      } else {
        return null;
      }
    } else {
      console.log(`No transactions found for ${stakingKey}`);
    }
}