import { namespaceWrapper, TASK_ID } from "@_koii/namespace-wrapper";
import { votePageTemplate } from "./vote-page-template.js";
import fs from "fs";
import open from "open";
import path from "path";

export async function setup() {
  try {
    console.log("CUSTOM SETUP");
    // TESTING USE
    const taskIdString = TASK_ID || '';
    // const taskIdString = process.argv[3];
    // Check if votes already exist
    const existingVotes = await namespaceWrapper.storeGet("votes");
    if (existingVotes) {
      console.log("Votes already exist in database, skipping voting page");
      return true;
    }

    const koiiPath = await namespaceWrapper.getBasePath();
    const tempFile = path.join(koiiPath, "koii-voting.html");

    // Create the modified template with proper fetch call
    const fetchCode = `
      try {
        const response = await fetch('/task/${taskIdString}/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(voteData),
          mode: 'cors'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Server returned ' + response.status);
        }

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to store votes');

        // Show success message with vote details
        const voteDetails = voteData.votes.map((vote, index) => {
          const task = voteData.selectedTasks[index];
          const percentage = (vote.weight * 100).toFixed(0);
          return \`Task \${index + 1}: \${task} (\${percentage}%)\`;
        }).join('\\n');

        alert(\`Votes saved successfully! It's now safe to close this page.\`);

        // Try to close the window
        window.close();
      } catch (error) {
        console.error('Error:', error);
        alert(\`Failed to store votes: \${error.message}\\nPlease try again.\`);
      }
    `;

    // Replace the postMessage call with our fetch code
    const modifiedTemplate = votePageTemplate.replace(
      "window.parent.postMessage(",
      `${fetchCode}\nwindow.parent.postMessage(`,
    );

    // Write the file and log its location
    fs.writeFileSync(tempFile, modifiedTemplate);
    console.log("Created voting page at:", tempFile);

    // Verify the file exists and has content
    if (fs.existsSync(tempFile)) {
      const stats = fs.statSync(tempFile);
      console.log("File size:", stats.size, "bytes");
    } else {
      throw new Error("Failed to create voting page file");
    }
    // Open the voting page
    console.log("taskID is ", taskIdString);
    console.log("Opening voting page in browser...");
    if (taskIdString !== undefined) {
      console.log("Attempting to open URL", `/task/${taskIdString}/koii-voting.html`);
      open(`http://localhost:30017/task/${taskIdString}/koii-voting.html`);
    }
  } catch (err) {
    console.error("Setup error:", err);
    return false;
  }
}
