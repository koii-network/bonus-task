import { namespaceWrapper } from "@_koii/namespace-wrapper";
import getTaskList from "../modules/getTaskList.js";
import { Connection, PublicKey } from "@_koii/web3.js";

import {
	K2_URL
} from "../config/constants.js";

export async function task(roundNumber) {
  // Run your task and store the proofs to be submitted for auditing
  // The submission of the proofs is done in the submission function
  try {
    console.log(`EXECUTE TASK FOR ROUND ${roundNumber}`);
    // you can optionally return this value to be used in debugging

    let connection = new Connection(K2_URL);
    // console.log('connection', connection);

    let koiiTaskList = await getTaskList(connection, 'KOII');
    console.log('tasklist', koiiTaskList)
    // let kplTaskList = await getTaskList(connection, 'kpl');
    // loop over the task list and review available balances

    // console.log('taskList', koiiTaskList, kplTaskList)


    await namespaceWrapper.storeSet("value", "Hello, World!");
  } catch (error) {
    console.error("EXECUTE TASK ERROR:", error);
  }
}
