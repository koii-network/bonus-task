import { Connection, PublicKey } from "@_koii/web3.js";

import fs from "fs";

import { retryWithMaxCount } from "./retryWithMaxCount.js";

import {
  TASK_RECORDS,
  KOII_PROGRAM_ACCOUNT,
  KPL_PROGRAM_ACCOUNT,
  KOII_BYTE_FILTER,
} from "../config/constants.js";

export default async function getTaskList(connection, taskType) {
  let success = false;
  let allTasks = null;

  try {
    if (taskType === "KOII") {
      ({ success, data: allTasks } = await getKoiiTasks(connection));
    } else {
      ({ success, data: allTasks } = await retryWithMaxCount(
        getKplTasks,
        [connection],
        3,
        30,
      ));
    }
  } catch (err) {
    throw new Error("Failed to get tasks", err);
  }

  if (!success || !allTasks) {
    throw new Error("Failed to get tasks");
  }
  console.log("Number of tasks: " + allTasks.length);

  const taskPubKeys = allTasks.map((task) => task.pubkey);

  return { taskPubKeys };
}

async function getKoiiTasks(connection) {
  return await retryWithMaxCount(
    connection.getProgramAccounts.bind(connection),
    [
      new PublicKey(KOII_PROGRAM_ACCOUNT),
      {
        dataSlice: { offset: 0, length: 0 },
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: KOII_BYTE_FILTER,
            },
          },
        ],
      },
    ],
    3,
    30,
  );
}

async function getKplTasks(connection) {
  const allAccounts = await connection.getProgramAccounts(
    new PublicKey(KPL_PROGRAM_ACCOUNT),
    {
      dataSlice: { offset: 0, length: 0 },
      filters: [
        {
          memcmp: {
            offset: 3,
            bytes: "111",
          },
        },
      ],
    },
  );

  const filteredAccounts = await connection.getProgramAccounts(
    new PublicKey(KPL_PROGRAM_ACCOUNT),
    {
      dataSlice: { offset: 0, length: 0 },
      filters: [
        {
          memcmp: {
            offset: 2,
            bytes: "1",
          },
        },
      ],
    },
  );

  const filteredPubKeys = new Set(
    filteredAccounts.map((account) => account.pubkey.toBase58()),
  );

  return allAccounts.filter(
    (task) => !filteredPubKeys.has(task.pubkey.toBase58()),
  );
}
