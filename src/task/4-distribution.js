// Define the percentage by which to slash the stake of submitters who submitted incorrect values

import { namespaceWrapper } from "@_koii/namespace-wrapper";

// 0.7 = 70%
const SLASH_PERCENT = 0.7;

export async function distribution(submitters, bounty, roundNumber) {
  // fetch the distribution from the state
  const get_distribution_proposal = await namespaceWrapper.storeGet(
    "dist_" + roundNumber,
  );

  // Return the final distribution list
  return get_distribution_proposal;
}
