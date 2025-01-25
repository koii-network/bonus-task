import { taskRunner } from "@_koii/task-manager";

import "../src/index.js";
import { namespaceWrapper } from "@_koii/namespace-wrapper";

async function executeTasks() {
  let round = 1;
  await taskRunner.task(round);

  //   for submission testing
  await new Promise((resolve) => setTimeout(resolve, 3000));
  await taskRunner.submitTask(round);
  process.exit(0);
}
executeTasks();
