import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { writeFileSync } from "fs";

export async function storeInFile(distribution_proposal) {
  try {
    const getBasePath = await namespaceWrapper.getBasePath();

    let distributionProposalPath = getBasePath.endsWith("/")
      ? `${getBasePath}distribution_proposal.json`
      : `${getBasePath}/distribution_proposal.json`;

    writeFileSync(
      distributionProposalPath,
      JSON.stringify(distribution_proposal, null, 2),
    );

    return distributionProposalPath;
  } catch (error) {
    console.error("Error writing distribution proposal to file", error);
    return "";
  }
}
