class VotingSystem {
    constructor() {
        this.selectedTasks = [];
        this.taskList = [
            {
                id: "HRFuq1iK8eTsoG6nFf3PydcpGZLX9Poqk2QhFuRjGs3A",
                name: "Mask Task"
            },
            {
                id: "H5CKDzSi2qWs7y7JGMX8sGvAZnWcUDx8k1mCMVWyJf1M",
                name: "Free Fire Task"
            },
            {
                id: "AD8KJJn9ysmps74dAdNYA6PaVGRyaZwrtNpEXJWCx4wy",
                name: "BigBig"
            },
            {
                id: "BshiEPaoEKkyiadGsRmxg23iDosJKr3seqoN81GYJBBH",
                name: "Truflation"
            },
            {
                id: "5s8stHNHhaHo3fS49uwC8jaRCrodCUZg9YfUPkYxsfRc",
                name: "Astrolink"
            },
            {
                id: "99dHXaUbJzr8o96qs8sog4PBfM8FksM81mkkPK9jxiLL",
                name: "[BETA]ArK:Dangerous Dave"
            }
        ];
        this.weights = {
            1: [1],
            2: [0.7, 0.3],
            3: [0.5, 0.3, 0.2]
        };

        this.init();
    }

    init() {
        this.renderTasks();
        this.setupEventListeners();
        this.updateUI();
    }

    renderTasks() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = this.taskList.map(task => `
            <div class="task-card" data-task-id="${task.id}">
                <h3>${task.name}</h3>
            </div>
        `).join('');
    }

    setupEventListeners() {
        document.getElementById('taskList').addEventListener('click', (e) => {
            const taskCard = e.target.closest('.task-card');
            if (taskCard) {
                this.handleTaskSelection(taskCard);
            }
        });

        document.getElementById('submitVote').addEventListener('click', () => {
            this.submitVote();
        });
    }

    handleTaskSelection(taskCard) {
        const taskId = taskCard.dataset.taskId;
        
        // If task is already selected, remove it
        const existingIndex = this.selectedTasks.indexOf(taskId);
        if (existingIndex !== -1) {
            this.selectedTasks.splice(existingIndex, 1);
            taskCard.classList.remove('selected');
        } 
        // If we can add more tasks and this task isn't selected
        else if (this.selectedTasks.length < 3) {
            this.selectedTasks.push(taskId);
            taskCard.classList.add('selected');
        }

        this.updateUI();
    }

    updateUI() {
        const choiceElements = ['firstChoice', 'secondChoice', 'thirdChoice'];
        const weightElements = ['firstWeight', 'secondWeight', 'thirdWeight'];
        
        // Reset all elements
        choiceElements.forEach((id, index) => {
            const taskId = this.selectedTasks[index];
            const task = taskId ? this.taskList.find(t => t.id === taskId) : null;
            
            document.getElementById(id).textContent = task ? task.name : 'Not selected';
        });

        // Update weights based on number of selections
        const currentWeights = this.weights[this.selectedTasks.length] || [];
        weightElements.forEach((id, index) => {
            document.getElementById(id).textContent = 
                currentWeights[index] ? `${(currentWeights[index] * 100).toFixed(0)}%` : '-';
        });

        // Enable/disable submit button
        const submitBtn = document.getElementById('submitVote');
        submitBtn.disabled = this.selectedTasks.length === 0;

        // Log the current selection state
        console.log('Current Selections:', this.selectedTasks.map(taskId => {
            const task = this.taskList.find(t => t.id === taskId);
            return {
                id: taskId,
                name: task.name
            };
        }));
    }

    async submitVote() {
        if (this.selectedTasks.length === 0) return;

        const currentWeights = this.weights[this.selectedTasks.length];
        const votes = this.selectedTasks.map((taskId, index) => ({
            taskId,
            weight: currentWeights[index]
        }));

        console.log('Submitting votes:', votes);
        alert('Votes recorded:\n' + JSON.stringify(votes, null, 2));

        // Reset selections after submission
        this.selectedTasks = [];
        document.querySelectorAll('.task-card.selected')
            .forEach(card => card.classList.remove('selected'));
        this.updateUI();
    }
}

// Initialize the voting system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VotingSystem();
}); 