import { KoiiStorageClient } from "@_koii/storage-task-sdk";

/**
 * Fetches and parses JSON data from Koii Storage using CID
 * @param {string} fileName - Name of the file to fetch
 * @param {string} cid - Content Identifier for the file
 * @param {number} [maxRetries=3] - Maximum number of retry attempts
 * @returns {Promise<any>} Parsed JSON data
 * @throws {Error} If file fetch fails or JSON is invalid
 */
export async function getDataFromCID(fileName, cid, maxRetries = 3) {
  if (!fileName || !cid) {
    throw new Error("fileName and cid are required parameters");
  }

  const client = new KoiiStorageClient(undefined, undefined, false);
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const blob = await client.getFile(cid, fileName);
      const text = await blob.text();

      try {
        const data = JSON.parse(text);
        return data;
      } catch (parseError) {
        throw new Error(`Failed to parse JSON: ${parseError.message}`);
      }
    } catch (error) {
      console.log(
        `Attempt ${attempt}: Error fetching file from Koii IPFS: ${error.message}`,
      );
      lastError = error;

      if (attempt === maxRetries) {
        throw new Error(
          `Failed to fetch file after ${maxRetries} attempts: ${lastError.message}`,
        );
      }

      // Wait before next retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, attempt * 3000));
    }
  }
}
