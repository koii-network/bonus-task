import { audit } from "../src/task/3-audit.js"; // Assuming your function is in auditModule.js

// Run the test
(async () => {
  //  FOR TESTNET
  const RESULT_TESTNET = await audit(
    "bafybeie7aqwpr7esruscqmg2vjda7hq4zuf7xmzqttdeui2j7ns7u4hdqi",
    10,
    "J4j4BdVwua62r37uHM7S8nkpGnxesxq87zrdrVxuq8Sn",
  );
  console.log("Audit result:", RESULT_TESTNET);

  //  FOR MAINNET
  // upload to ipfs and get the CID
  const RESULT_MAINNET = await audit(
    "", // update the CID HERE
    10,
    "J4j4BdVwua62r37uHM7S8nkpGnxesxq87zrdrVxuq8Sn",
  );
  console.log("Audit result:", RESULT_MAINNET);
})();
