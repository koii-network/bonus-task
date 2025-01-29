// the weighting factors are stored in array formatted with the taskId as the key, and the weighting factor as the value, the sum of all weighting factors should equal 1
// eventually, these factors will be decided by a public vote of anyone running this task

// FOR THE MAINNET
let taskList = [
  {
    id: "HRFuq1iK8eTsoG6nFf3PydcpGZLX9Poqk2QhFuRjGs3A", // Mask Task
    type: "KPL",
  },
  {
    id: "7BBKnthEGMnc5pfixTJu7FwkmuTt99naFd8NsRMsaEYh", //Free Fire Task
    type: "KPL",
  },
  {
    id: "AD8KJJn9ysmps74dAdNYA6PaVGRyaZwrtNpEXJWCx4wy", // BigBig
    type: "KPL",
  },
  {
    id: "3BXESVkbTou7ZNSXwTFrGoqkFa79FondJZZ5uRag3tiZ", // Truflation
    type: "KPL",
  },
];
let weighting_factors = {
  HRFuq1iK8eTsoG6nFf3PydcpGZLX9Poqk2QhFuRjGs3A: 0.3, // Mask Task
  "7BBKnthEGMnc5pfixTJu7FwkmuTt99naFd8NsRMsaEYh": 0.2, // Free Token Task
  AD8KJJn9ysmps74dAdNYA6PaVGRyaZwrtNpEXJWCx4wy: 0.3, // BIGBIG
  "3BXESVkbTou7ZNSXwTFrGoqkFa79FondJZZ5uRag3tiZ": 0.2, // Truflation
};

// FOR THE TESTNET
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

export { taskList, weighting_factors };
