import "dotenv/config";

export const K2_URL = "https://mainnet.koii.network";
export const DB_NAME = "migration";
export const COLLECTION_NAME = "stakingwallets";
export const DB_BATCH_SIZE = 500;
export const IS_TESTING = false;
export const TESTING_BATCH_LIMIT = 5;
export const REWARD_PER_ROUND = 1500000000000;

export const KOII_PROGRAM_ACCOUNT =
  "Koiitask22222222222222222222222222222222222";
export const KPL_PROGRAM_ACCOUNT =
  "KPLTRVs6jA7QTthuJH2cEmyCEskFbSV2xpZw46cganN";
export const KOII_BYTE_FILTER = "2A7XGNY2nv87Z6mpUWwBSnfj";

const taskFiles = {
  DEAD: "deadTasks.json",
  UNPROCESSED: "unprocessedTasks.json",
};

export const TASK_RECORDS = { KOII: {}, KPL: {} };

for (const [fileType, fileName] of Object.entries(taskFiles)) {
  TASK_RECORDS["KOII"][fileType] = `./taskData/koii/${fileName}`;
  TASK_RECORDS["KPL"][fileType] = `./taskData/kpl/${fileName}`;
}
