import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { writeFileSync } from "fs";

export async function storeInFile(distribution_proposal) {
  try {
    const getBasePath = await namespaceWrapper.getBasePath();

    let votePath = getBasePath.endsWith("/")
      ? `${getBasePath}vote.json`
      : `${getBasePath}/vote.json`;

    writeFileSync(
      votePath,
      JSON.stringify(distribution_proposal, null, 2),
    );

    return votePath;
  } catch (error) {
    console.error("Error writing distribution proposal to file", error);
    return "";
  }
}
