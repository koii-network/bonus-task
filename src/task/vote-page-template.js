export const votePageTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Koii Task Voting</title>
    <style>
        :root {
            --primary-color: #2D5AF0;
            --secondary-color: #171753;
            --background-color: #f5f7ff;
            --text-color: #333;
            --border-radius: 8px;
            --box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--background-color);
            color: var(--text-color);
            line-height: 1.6;
            padding: 2rem;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            margin-bottom: 2rem;
        }

        h1 {
            color: var(--secondary-color);
            margin-bottom: 1rem;
        }

        .voting-instructions {
            background-color: white;
            padding: 2rem;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            margin-bottom: 2rem;
        }

        .task-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .task-card {
            background-color: white;
            padding: 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            cursor: pointer;
            transition: transform 0.2s;
        }

        .task-card:hover {
            transform: translateY(-2px);
        }

        .task-card.selected {
            border: 2px solid var(--primary-color);
        }

        .selected-tasks {
            background-color: white;
            padding: 2rem;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            margin-bottom: 2rem;
        }

        .selection-slot {
            display: grid;
            grid-template-columns: 100px 1fr 80px;
            gap: 1rem;
            padding: 1rem;
            border-bottom: 1px solid #eee;
        }

        .submit-btn {
            display: block;
            width: 100%;
            max-width: 300px;
            margin: 0 auto;
            padding: 1rem;
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: var(--border-radius);
            cursor: pointer;
        }

        .submit-btn:disabled {
            background-color: #ccc;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Koii Task Voting</h1>
        </header>

        <main>
            <div class="voting-instructions">
                <h2>Select Your Top Tasks</h2>
                <p>Choose up to 3 tasks in order of preference:</p>
                <ul>
                    <li>1st choice: 50% weight (if only top 3 selected)</li>
                    <li>2nd choice: 30% weight (if only top 3 selected)</li>
                    <li>3rd choice: 20% weight (if only top 3 selected)</li>
                </ul>
            </div>

            <div class="task-list" id="taskList"></div>

            <div class="selected-tasks">
                <h3>Your Selections</h3>
                <div id="selectedTasks">
                    <div class="selection-slot">
                        <span class="rank">1st Choice</span>
                        <span class="task-name" id="firstChoice">Not selected</span>
                        <span class="weight" id="firstWeight">-</span>
                    </div>
                    <div class="selection-slot">
                        <span class="rank">2nd Choice</span>
                        <span class="task-name" id="secondChoice">Not selected</span>
                        <span class="weight" id="secondWeight">-</span>
                    </div>
                    <div class="selection-slot">
                        <span class="rank">3rd Choice</span>
                        <span class="task-name" id="thirdChoice">Not selected</span>
                        <span class="weight" id="thirdWeight">-</span>
                    </div>
                </div>
            </div>

            <button id="submitVote" class="submit-btn" disabled>Submit Vote</button>
        </main>
    </div>

    <script>
        console.log('Initializing voting system...');
        
        class VotingSystem {
            constructor() {
                console.log('Setting up voting system');
                this.selectedTasks = [];
                this.taskList = [
                    {
                        id: "HRFuq1iK8eTsoG6nFf3PydcpGZLX9Poqk2QhFuRjGs3A",
                        name: "Mask Task",
                        type: "KPL"
                    },
                    {
                        id: "H5CKDzSi2qWs7y7JGMX8sGvAZnWcUDx8k1mCMVWyJf1M",
                        name: "Free Fire Task",
                        type: "KPL"
                    },
                    {
                        id: "AD8KJJn9ysmps74dAdNYA6PaVGRyaZwrtNpEXJWCx4wy",
                        name: "BigBig",
                        type: "KPL",
                    },
                    {
                        id: "BshiEPaoEKkyiadGsRmxg23iDosJKr3seqoN81GYJBBH",
                        name: "Truflation",
                        type: "KPL",
                    },
                    {
                        id: "5s8stHNHhaHo3fS49uwC8jaRCrodCUZg9YfUPkYxsfRc",
                        name: "Astrolink",
                        type: "KPL"
                    },
                    {
                        id: "99dHXaUbJzr8o96qs8sog4PBfM8FksM81mkkPK9jxiLL",
                        name: "[BETA]ArK:Dangerous Dave",
                        type: "KOII"
                    }
                ];
                console.log('Task list loaded:', this.taskList.length, 'tasks');
                
                this.weights = {
                    1: [1],
                    2: [0.7, 0.3],
                    3: [0.5, 0.3, 0.2]
                };

                this.init();
            }

            init() {
                console.log('Initializing UI...');
                this.loadSavedVotes();
                this.renderTasks();
                this.setupEventListeners();
                this.updateUI();
                console.log('UI initialized');
            }

            loadSavedVotes() {
                const savedVotes = localStorage.getItem('taskVotes');
                if (savedVotes) {
                    console.log('Loading saved votes');
                    const { selectedTasks } = JSON.parse(savedVotes);
                    this.selectedTasks = selectedTasks;
                }
            }

            renderTasks() {
                console.log('Rendering task list');
                const taskList = document.getElementById('taskList');
                if (!taskList) {
                    console.error('Task list element not found!');
                    return;
                }
                
                taskList.innerHTML = this.taskList.map(task => {
                    const isSelected = this.selectedTasks.includes(task.id);
                    return \`
                        <div class="task-card \${isSelected ? 'selected' : ''}" data-task-id="\${task.id}">
                            <h3>\${task.name}</h3>
                        </div>
                    \`;
                }).join('');
                console.log('Task list rendered');
            }

            setupEventListeners() {
                console.log('Setting up event listeners');
                document.getElementById('taskList').addEventListener('click', (e) => {
                    const taskCard = e.target.closest('.task-card');
                    if (taskCard) {
                        this.handleTaskSelection(taskCard);
                    }
                });

                document.getElementById('submitVote').addEventListener('click', () => {
                    this.saveVotes();
                });
            }

            handleTaskSelection(taskCard) {
                const taskId = taskCard.dataset.taskId;
                console.log('Task selected:', taskId);
                
                const existingIndex = this.selectedTasks.indexOf(taskId);
                if (existingIndex !== -1) {
                    this.selectedTasks.splice(existingIndex, 1);
                    taskCard.classList.remove('selected');
                    console.log('Task deselected');
                } 
                else if (this.selectedTasks.length < 3) {
                    this.selectedTasks.push(taskId);
                    taskCard.classList.add('selected');
                    console.log('Task added to selection');
                }

                this.updateUI();
            }

            updateUI() {
                console.log('Updating UI with selections:', this.selectedTasks);
                const choiceElements = ['firstChoice', 'secondChoice', 'thirdChoice'];
                const weightElements = ['firstWeight', 'secondWeight', 'thirdWeight'];
                
                choiceElements.forEach((id, index) => {
                    const taskId = this.selectedTasks[index];
                    const task = taskId ? this.taskList.find(t => t.id === taskId) : null;
                    
                    document.getElementById(id).textContent = task ? task.name : 'Not selected';
                });

                const currentWeights = this.weights[this.selectedTasks.length] || [];
                weightElements.forEach((id, index) => {
                    document.getElementById(id).textContent = 
                        currentWeights[index] ? \`\${(currentWeights[index] * 100).toFixed(0)}%\` : '-';
                });

                document.getElementById('submitVote').disabled = this.selectedTasks.length === 0;
            }

            async saveVotes() {
                if (this.selectedTasks.length === 0) return;

                const currentWeights = this.weights[this.selectedTasks.length];
                if (!currentWeights) {
                    console.error('Invalid number of selections');
                    return;
                }

                const votes = this.selectedTasks.map((taskId, index) => ({
                    taskId,
                    weight: currentWeights[index]
                }));

                const voteData = {
                    selectedTasks: [...this.selectedTasks],
                    votes: votes,
                    timestamp: new Date().toISOString()
                };

                try {
                    // Save to localStorage as backup
                    localStorage.setItem('taskVotes', JSON.stringify(voteData));
                    console.log('Votes saved to localStorage:', voteData);
                    
                    // Send data to the parent process
                    window.parent.postMessage({
                        type: 'VOTE_DATA',
                        data: voteData
                    }, '*');
                    
                    // Disable the submit button to prevent double submission
                    document.getElementById('submitVote').disabled = true;
                } catch (error) {
                    console.error('Error saving votes:', error);
                }
            }
        }

        // Initialize the voting system when the page loads
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Page loaded, starting voting system');
            new VotingSystem();
        });
    </script>
</body>
</html>
`; 