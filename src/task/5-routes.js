import { namespaceWrapper, app } from "@_koii/namespace-wrapper";
import path from "path";
import fs from "fs";

export function routes() {
  /**
   *
   * Define all your custom routes here
   *
   */

  // Example route
  app.get("/value", async (_req, res) => {
    const value = await namespaceWrapper.storeGet("value");
    console.log("value", value);
    res.status(200).json({ value: value });
  });

  // Serve the voting HTML file
  app.get('/koii-voting.html', async (req, res) => {
    try {
      const koiiPath = await namespaceWrapper.getBasePath();
      const filePath = path.join(koiiPath, "koii-voting.html");
      
      // Check if file exists
      try {
        await fs.promises.access(filePath);
        console.log('Serving voting page from:', filePath);
      } catch (err) {
        console.error('Voting page not found:', err);
        return res.status(404).send("Voting page not found");
      }

      // Read and serve the file
      const content = await fs.promises.readFile(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(content);
    } catch (error) {
      console.error('Error serving voting page:', error);
      res.status(500).send('Error serving voting page');
    }
  });

  // Handle voting endpoint
  app.post('/vote', async (req, res) => {
    try {
      const voteData = req.body;
      console.log("Received vote data:", voteData);

      // Validate vote data
      if (!voteData.votes || !Array.isArray(voteData.votes)) {
        throw new Error("Invalid vote data format");
      }

      // Verify that votes array matches selectedTasks
      if (voteData.selectedTasks.length !== voteData.votes.length) {
        throw new Error("Mismatch between selected tasks and votes");
      }

      // Verify weights sum to approximately 1
      const weightSum = voteData.votes.reduce(
        (sum, vote) => sum + vote.weight,
        0,
      );
      if (Math.abs(weightSum - 1) > 0.001) {
        throw new Error("Vote weights do not sum to 1");
      }

      // Store vote data with simplified key
      await namespaceWrapper.storeSet(
        "votes",
        JSON.stringify({
          votes: voteData.votes.reduce((acc, vote, index) => {
            const taskId = voteData.selectedTasks[index];
            // Define task types mapping
            const taskTypes = {
              "FscMYDMwfexFrFtEQ5SKLJDTYnYCbeBPkJGyeYeXs3va": "KPL",
              "H5CKDzSi2qWs7y7JGMX8sGvAZnWcUDx8k1mCMVWyJf1M": "KPL",
              "AD8KJJn9ysmps74dAdNYA6PaVGRyaZwrtNpEXJWCx4wy": "KPL",
              "Bvq5oi1dWWfqtUY8nxe7F1ZDwpr49yKX4uXxuxDq8NNf": "KPL",
              "2Rsix6MnuehaB8Vov33Bv5LUwRvrhVN4pLnsTeBoGXbB": "KPL",
              "99dHXaUbJzr8o96qs8sog4PBfM8FksM81mkkPK9jxiLL": "KOII",
              "CjKiguQ1AkehkFWpMnjHWohC33VN4wU6WnzucazkZgUC": "KPL",
              "4ESVAytVPEmTWeVGxKX3kVhFrfFYPkXSCTMqFmWc5M4v": "KOII"
            };
            acc[taskId] = {
              weighting_factors: vote.weight,
              type: taskTypes[taskId],
            };
            return acc;
          }, {}),
        }),
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Error storing votes:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
