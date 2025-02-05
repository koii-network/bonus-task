import { namespaceWrapper } from "@_koii/namespace-wrapper";
import { votePageTemplate } from './vote-page-template.js';
import fs from 'fs';
import open from 'open';
import os from 'os';
import path from 'path';
import http from 'http';

export async function setup() {
  try {
    console.log("CUSTOM SETUP");

    // Check if votes already exist
    const existingVotes = await namespaceWrapper.storeGet("votes");
    if (existingVotes) {
      console.log("Votes already exist in database, skipping voting page");
      return true;
    }
    
    // Create a simple server to receive vote data
    const server = http.createServer((req, res) => {
      // Enable CORS for all routes
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.method === 'POST' && req.url === '/vote') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            const voteData = JSON.parse(body);
            console.log("Received vote data:", voteData);
            
            // Validate vote data
            if (!voteData.votes || !Array.isArray(voteData.votes)) {
              throw new Error('Invalid vote data format');
            }

            // Verify that votes array matches selectedTasks
            if (voteData.selectedTasks.length !== voteData.votes.length) {
              throw new Error('Mismatch between selected tasks and votes');
            }

            // Verify weights sum to approximately 1
            const weightSum = voteData.votes.reduce((sum, vote) => sum + vote.weight, 0);
            if (Math.abs(weightSum - 1) > 0.001) {
              throw new Error('Vote weights do not sum to 1');
            }

            // Store vote data with simplified key
            await namespaceWrapper.storeSet(
              "votes",
              JSON.stringify({
                votes: voteData.votes.reduce((acc, vote, index) => {
                  const taskId = voteData.selectedTasks[index];
                  // Define task types mapping
                  const taskTypes = {
                    "HRFuq1iK8eTsoG6nFf3PydcpGZLX9Poqk2QhFuRjGs3A": "KPL",
                    "H5CKDzSi2qWs7y7JGMX8sGvAZnWcUDx8k1mCMVWyJf1M": "KPL",
                    "AD8KJJn9ysmps74dAdNYA6PaVGRyaZwrtNpEXJWCx4wy": "KPL",
                    "BshiEPaoEKkyiadGsRmxg23iDosJKr3seqoN81GYJBBH": "KPL",
                    "5s8stHNHhaHo3fS49uwC8jaRCrodCUZg9YfUPkYxsfRc": "KPL",
                    "99dHXaUbJzr8o96qs8sog4PBfM8FksM81mkkPK9jxiLL": "KOII"
                  };
                  acc[taskId] = {
                    weighting_factors: vote.weight,
                    type: taskTypes[taskId]
                  };
                  return acc;
                }, {})
              })
            );
            
            console.log("Votes stored successfully:", {
              votes: voteData.votes.reduce((acc, vote, index) => {
                const taskId = voteData.selectedTasks[index];
                const taskTypes = {
                  "HRFuq1iK8eTsoG6nFf3PydcpGZLX9Poqk2QhFuRjGs3A": "KPL",
                  "H5CKDzSi2qWs7y7JGMX8sGvAZnWcUDx8k1mCMVWyJf1M": "KPL",
                  "AD8KJJn9ysmps74dAdNYA6PaVGRyaZwrtNpEXJWCx4wy": "KPL",
                  "BshiEPaoEKkyiadGsRmxg23iDosJKr3seqoN81GYJBBH": "KPL",
                  "5s8stHNHhaHo3fS49uwC8jaRCrodCUZg9YfUPkYxsfRc": "KPL",
                  "99dHXaUbJzr8o96qs8sog4PBfM8FksM81mkkPK9jxiLL": "KOII"
                };
                acc[taskId] = {
                  weighting_factors: vote.weight,
                  type: taskTypes[taskId]
                };
                return acc;
              }, {})
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));

            // Close the server after successful vote
            server.close();
          } catch (error) {
            console.error('Error storing votes:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    // Start server on a random port
    const port = 3000 + Math.floor(Math.random() * 1000);
    
    // Wait for server to start
    await new Promise((resolve, reject) => {
      server.on('error', reject);
      server.listen(port, () => {
        console.log(`Vote server listening on port ${port}`);
        resolve();
      });
    });

    // Test server connection
    try {
      await fetch(`http://localhost:${port}/vote`, { method: 'OPTIONS' });
      console.log('Server connection test successful');
    } catch (error) {
      console.error('Server connection test failed:', error);
      throw new Error('Failed to establish server connection');
    }
    
    // Create the HTML file with the server port
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, 'koii-voting.html');
    
    // Create the modified template with proper fetch call
    const fetchCode = `
      try {
        const response = await fetch('http://localhost:${port}/vote', {
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
      'window.parent.postMessage(',
      `${fetchCode}\nwindow.parent.postMessage(`
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
    console.log("Opening voting page in browser...");
    await open(tempFile);
    console.log("Voting page opened in your default browser");

    // Keep the process running until votes are received or timeout
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log("Vote timeout reached, closing server");
        server.close();
        resolve(true);
      }, 300000); // 5 minutes timeout

      server.on('close', () => {
        console.log("Vote server closed");
        clearTimeout(timeout);
        resolve(true);
      });
    });
  } catch (err) {
    console.error("Setup error:", err);
    return false;
  }
}
