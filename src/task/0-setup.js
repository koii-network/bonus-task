import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { fileURLToPath } from 'url';
import path from 'path';
import open from 'open';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setup() {
  try {
    console.log("CUSTOM SETUP");
    
    // Open the voting page in default browser
    const votingPagePath = path.join(__dirname, '../../vote_page/index.html');
    await open(votingPagePath);
    console.log("Voting page opened in your default browser");

    return true;
  } catch (err) {
    console.log("ERR", err);
    return false;
  }
}
