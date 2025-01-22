import { namespaceWrapper } from "@_koii/namespace-wrapper";

export async function storeInFile(distribution_proposal) {
  try {
    const getBasePath = await namespaceWrapper.getBasePath();
    let distributionProposalPath;
    if (getBasePath.endsWith("/")) {
      distributionProposalPath = `${getBasePath}distribution_proposal.json`;
    } else {
      distributionProposalPath = `${getBasePath}/distribution_proposal.json`;
    }

    await namespaceWrapper.fs(
      "writeFile",
      distributionProposalPath,
      JSON.stringify(distribution_proposal, null, 2),
    );

    return distributionProposalPath;
  } catch (error) {
    console.error("Error writing distribution proposal to file", error);
  }
}
