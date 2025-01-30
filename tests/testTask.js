import { taskRunner } from "@_koii/task-manager";
import { distribution } from "../src/task/4-distribution.js";
import "../src/index.js";
import { namespaceWrapper } from "@_koii/namespace-wrapper";

async function executeTasks() {
  let round = 0;
  // await taskRunner.task(round);

  // //   for submission testing
  // await new Promise((resolve) => setTimeout(resolve, 3000));
  // await taskRunner.submitTask(round);
  await distribution(round);
  process.exit(0);
}
executeTasks();
