import { namespaceWrapper } from "@_koii/namespace-wrapper";

export async function setup() {
  // define any steps that must be executed before the task starts
  console.log("CUSTOM SETUP");
  
  // disabled for now, used for local management later if necessary

  // await namespaceWrapper.fs("mkdir", `taskData`, {
  //   recursive: true,
  // });
  // await namespaceWrapper.fs("mkdir", `taskData/koii`, {
  //   recursive: true,
  // });
  // await namespaceWrapper.fs("mkdir", `taskData/kpl`, {
  //   recursive: true,
  // });
  // await namespaceWrapper.fs("writeFile", `taskData/koii/deadTasks.json`, '[]');
  // await namespaceWrapper.fs("writeFile", `taskData/kpl/unprocessedTasks.json`, '[]');
}
