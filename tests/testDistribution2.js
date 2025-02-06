import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { distribution } from "../src/task/4-distribution.js";

// Run the test
(async () => {
  //  FOR TESTNET
  const submitter = [
    {
      publicKey: "1fZfLS1tGHhZpncWFPEP9Gfd5m772gZ7t3koSHKyRGQ",
      votes: 8,
      stake: 2500,
    },
    {
      publicKey: "23ATejh66udHiUnMyYbZFdpBz5RHdjSKAtKrcG9rsFVA",
      votes: -3,
      stake: 5000,
    },
    {
      publicKey: "2DFR6GHbuesNoSamgneyKwg7iWdwr8wy5r6WoNi12E4A",
      votes: 0,
      stake: 3200,
    },
    {
      publicKey: "3BsT7mVt7hv4shoLAKmKMVQAA1jjAmwRvGNmjvq7A1Wx",
      votes: 15,
      stake: 7000,
    },
    {
      publicKey: "3PUmtUbxCKf8NpgqbhpGKY9H4VLtkB6uSL71zHBJeJmH",
      votes: -1,
      stake: 4000,
    },
    {
      publicKey: "6eW3fwp9X7SpczHHd8SLQPkf5eEZiTdJMyKm7rYC8FXB",
      votes: 5,
      stake: 6000,
    },
    {
      publicKey: "84Q8UKUjfDyukVERVR6a7A2n1kPSXXrG9NuF61298BLD",
      votes: 0,
      stake: 2000,
    },
    {
      publicKey: "9Qgp7b6Tmea83v6hbdtv1CufWCrGLmiBZvBoGXT5hHgu",
      votes: -4,
      stake: 9000,
    },
    {
      publicKey: "CBUmLVZmvnYBqtmxP8U5tZioMSWXFeD3BRRE1Qj3srzA",
      votes: 12,
      stake: 10000,
    },
    {
      publicKey: "DeoH5bZFRzrXfspT11mXDCDR7qPRsSFjm8QVuoNFym1W",
      votes: 3,
      stake: 4500,
    },
  ];

  const bounty = 0;
  const roundNumber = 10;

  const finalDistributionList = {
    "1fZfLS1tGHhZpncWFPEP9Gfd5m772gZ7t3koSHKyRGQ": 1851577459,
    "23ATejh66udHiUnMyYbZFdpBz5RHdjSKAtKrcG9rsFVA": 1110946475,
    "23Zg1K4c2m6zoU6hS4rvrSTGa4XTYpHRZy14SvmcbqDV": 1110946475,
    "25iC3yxNK4rT2ToRBonsLGoop5zfHna4a1iwBH8mcKmA": 1110946475,
    "2DFR6GHbuesNoSamgneyKwg7iWdwr8wy5r6WoNi12E4A": 740630983,
    "2LAXB3esen8wjwZtmgJwTkDXrcdkCyyuGRiHU6np5xLT": 1481261967,
    "2MarxfHuJDxKdmdBaQgsYm47eD6rfSv2bo8HWReH15Zn": 1110946475,
    "2TYpaCHpPQxtX5pAknC1KnvQ9REyGNw1phKeAxagajSe": 1110946475,
    "2dm324iayJUi2xfRNwgDN3j24t5z6iA7qB498oQCp39P": 1851577459,
    "2ehU3G5jbHpKotqSVjQa8SCEeFuS9UY5XuHWdVA7fi2Z": 1481261967,
    "2gd9mrWFdDiQH92M2UfTnPzicJBq9LSmCYnL9rTTRTU9": 1110946475,
    "2nsBVMdShJrDUq31BcUVhCBRf2pxP1v2JDst5Revwrhr": 1110946475,
    "2ozSzuZ85gCwNM2yfAZj6YefPqtyUa5xjY5H192PDpHc": 1110946475,
    "2r417MCLgqdiMKtTzqvQr4sV8StHtXTjNJVVHyyNQQhY": 1110946475,
    "2sjEMwXZUPgRLZr3gzN9VDkJccHMLy5wtEwTHmAi3dFA": 1110946475,
    "2wHmsyAKP6i3pFGcXoEMAZRW9q2b8YQJNCXudbA99W9i": 1851577459,
    "2zR5DaASDtZi8SamU6v7NpXEnf3t7bJoes3fPE3DnPpq": 1481261967,
    "35mg2r6K6DkiunqTruYnvMXaXH3YXkthFXWaJoAiL5xX": 1851577459,
    "38HbE6hAMf3zHjo5HGD5gBYDm6uCH83FW733YMot1JpR": 370315491,
    "3BDD2X2vqK2XXvbygLExnYx5SWotH2fPrJVNzLBxxXVb": 1110946475,
    "3BsT7mVt7hv4shoLAKmKMVQAA1jjAmwRvGNmjvq7A1Wx": 1851577459,
    "3HEzAD4rKaqYqvNFLqRomG2MZFHLRLrwQRYZYu9wLc79": 1110946475,
    "3KawMrDZdzKHXtpQrqN9azGrD117PPGUmo8aLDZhcTpc": 1481261967,
    "3MDzqwGrucJip6xdi2m5Qa68BA57gi2gNCNt37ap6U5B": 1110946475,
    "3MfEZoxqqVe14GCeKJ7SGcJW73bjsJeDCyMEoynrLTrq": 1110946475,
    "3PUmtUbxCKf8NpgqbhpGKY9H4VLtkB6uSL71zHBJeJmH": 1110946475,
    "3QRs8jDYxtVod24vPK3PEWuFupQNCH269e2XqgcbusGd": 1110946475,
    mN4iJ7nmtvBJcGP4sHNwXtPcmne8iKYVpgJEUnvLbGQ: 1851577459,
    mwmFjKtBYdL2R9kmsTRocmSoNVXdBz7zWZB3RBQgGSE: 1110946475,
    p7EkgDEGxsRKdPbiqgGAu8APAgL7q88gra3jSdh69ge: 1110946475,
    pQpkfjx8z26biRHgnSJPSPi3uxYrfp5sDjaMWoMsgMG: 1110946475,
    prtUBKdpHo9YwcU8dZtK3Yfa7wfX96vs5eZviwQuP54: 1110946475,
    tFaQwVJYve25ycVUCfMAUeRfetd39ymJD5MVGzkybWA: 1110946475,
    tY16MfDCRW4g4phTYrNz3dYggUxVrQnYUnPTT8XbALB: 1481261967,
    xHyKDwRfdEnuM1Xcim9zu2RAmTuGvzGiV7cCHCyzmyz: 1110946475,
    znU6W9MsytQNf6TTqjbkmUQgSedSpbEfyQMJcvcXDtB: 1110946475,
    zzuS8rN6is5AWxxvnJ3pCuo6dJ8wJ2v3sAnAbNfgUm7: 1110946475,
    "2ZxEK5SXp1vEtLVHAnviWPEWYSMyqdUotBiY3HrvzpxA": 1110946475,
    "3V2Y9Rfj75L4DTC57bENScKJzFyvv3azqNb1r6B2hm2i": 740630983,
    "5Pqa91BqQ7B7bAiVxkB4XG7ALKvQeporUSH5QqJsqhks": 740630983,
    "6eW3fwp9X7SpczHHd8SLQPkf5eEZiTdJMyKm7rYC8FXB": 1110946475,
    "84Q8UKUjfDyukVERVR6a7A2n1kPSXXrG9NuF61298BLD": 1481261967,
    "9Qgp7b6Tmea83v6hbdtv1CufWCrGLmiBZvBoGXT5hHgu": 1110946477,
    CBUmLVZmvnYBqtmxP8U5tZioMSWXFeD3BRRE1Qj3srzA: 1481261967,
    DeoH5bZFRzrXfspT11mXDCDR7qPRsSFjm8QVuoNFym1W: 1110946475,
    E8nvzXmJ7mApMtNVgiU9hgD3QoP5cGC7UUqxvioGJrQU: 1481261967,
    FStZSCkWnFArFHEWDXE19c3Fys2itMHoK73vtdcqbopQ: 1110946475,
    Fmc5ffH8gpKp2VJD39R9LVDncpoUa5gQXYLptqV67uZC: 1481261967,
    GkL9uwMSKV8zzAC2NuB8vgkiMkejZp61zLUfrNETYuvi: 1110946475,
    daCB6sLw7ZuKuQwoRppEhJ4GhJP6x8eJfTWgqfSf2Q9: 1110946475,
    "48ye2Z1PRFebF3v6wcuoiu4SwY3zNzPFkpLTRVoQqETY": 1110946475,
    ADaW8XzSstEWk4BkkhAnCEFNSxNeZg3c7vxtZYNxLWhA: 370315491,
    BFxta91vKruPb7JjGqhQdPE632JjwzjwjbFGdgNfCXyu: 740630985,
    HgRdTSa339r8UKnKV7oN8v5ZRmhuci9y97gY3UzojC1Q: 148126196,
    yM3yw3Tz5skRe4gY5TGYZGvb2d9wdNPvD84ULepzTp5: 148126196,
  };

  // store in the local db
  await namespaceWrapper.storeSet(
    "finalDistributionList_" + roundNumber,
    finalDistributionList,
  );

  // take from the local db
  const RESULT_TESTNET = await distribution(submitter, 20, 10);
  console.log("Distribution result:", RESULT_TESTNET);

  //  FOR MAINNET
  // const RESULT_MAINNET = await audit(
  //   "", // update the CID HERE
  //   10,
  //   "J4j4BdVwua62r37uHM7S8nkpGnxesxq87zrdrVxuq8Sn",
  // );
  // console.log("Audit result:", RESULT_MAINNET);
})();
