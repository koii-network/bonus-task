// the weighting factors are stored in array formatted with the taskId as the key, and the weighting factor as the value, the sum of all weighting factors should equal 1
// eventually, these factors will be decided by a public vote of anyone running this task

// FOR THE MAINNET
let taskList = [
  {
    id: "HRFuq1iK8eTsoG6nFf3PydcpGZLX9Poqk2QhFuRjGs3A", // Mask Task
    type: "KPL",
  },
  {
    id: "H5CKDzSi2qWs7y7JGMX8sGvAZnWcUDx8k1mCMVWyJf1M", //Free Fire Task
    type: "KPL",
  },
  {
    id: "AD8KJJn9ysmps74dAdNYA6PaVGRyaZwrtNpEXJWCx4wy", // BigBig
    type: "KPL",
  },
  {
    id: "BshiEPaoEKkyiadGsRmxg23iDosJKr3seqoN81GYJBBH", // Truflation
    type: "KPL",
  },
  {
    id: "5s8stHNHhaHo3fS49uwC8jaRCrodCUZg9YfUPkYxsfRc", // Astrolink
    type: "KPL",
  },
  {
    id: "99dHXaUbJzr8o96qs8sog4PBfM8FksM81mkkPK9jxiLL", // [BETA]ArK:Dangerous Dave
    type: "KOII",
  },
];
let weighting_factors = {
  HRFuq1iK8eTsoG6nFf3PydcpGZLX9Poqk2QhFuRjGs3A: 0.1, // Mask Task
  H5CKDzSi2qWs7y7JGMX8sGvAZnWcUDx8k1mCMVWyJf1M: 0.2, // Free Token Task
  AD8KJJn9ysmps74dAdNYA6PaVGRyaZwrtNpEXJWCx4wy: 0.2, // BIGBIG
  "5s8stHNHhaHo3fS49uwC8jaRCrodCUZg9YfUPkYxsfRc": 0.2, // Astrolink
  BshiEPaoEKkyiadGsRmxg23iDosJKr3seqoN81GYJBBH: 0.1, // Truflation
  "99dHXaUbJzr8o96qs8sog4PBfM8FksM81mkkPK9jxiLL": 0.2, // [BETA]ArK:Dangerous Dave
};

let developerKey = {
  // system key
  HkvGCWS9KprczB4iCwq1ApQTyo7QjyWPrKRP5cQMaqj3: {
    // task id
    "99dHXaUbJzr8o96qs8sog4PBfM8FksM81mkkPK9jxiLL": {
      getKoiiStakingKey: "Gxrzpce2FquJMom5EtHEN8fciULNEeHmBocd3d6zGFmz",
      getKPLStakingKey: "6nUQFLuEzVXr5xLeHqh9b7GvqaCTFp16UJi4bVwF4dWi",
    },
  },
};

// // FOR THE TESTNET
// let taskList = [
//   {
//     id: "E5ThjNUEYoe3bnwAhq2m3v9PK5SeiVNn8PTgaQL5zpvr",
//     type: "KOII",
//   },
//   {
//     id: "GX5dfxY5Ns82KZrJX4a8bBw3a6WMPHJ3sBxmycfoXR2Y",
//     type: "KOII",
//   },
//   {
//     id: "KiwDeyqgkC8bgKgXkBLa4qQ2honuBB4Zu152C6Ggb9J",
//     type: "KOII",
//   },
//   {
//     id: "D5G1uRNHwZiNkDAdrs3SjFtsdH683fKRQTNa8X9Cj3Nv",
//     type: "KOII",
//   },
// ];
// let weighting_factors = {
//   E5ThjNUEYoe3bnwAhq2m3v9PK5SeiVNn8PTgaQL5zpvr: 0.3, // Mask Task
//   GX5dfxY5Ns82KZrJX4a8bBw3a6WMPHJ3sBxmycfoXR2Y: 0.2, // Free Token Task
//   KiwDeyqgkC8bgKgXkBLa4qQ2honuBB4Zu152C6Ggb9J: 0.3, // BIGBIG
//   D5G1uRNHwZiNkDAdrs3SjFtsdH683fKRQTNa8X9Cj3Nv: 0.2, // Truflation
// };

export { taskList, weighting_factors, developerKey };
