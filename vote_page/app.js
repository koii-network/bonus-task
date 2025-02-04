class VotingSystem {
    constructor() {
        this.selectedTasks = [];
        this.userStake = 0;
        this.tasks = [];
        this.weights = {
            1: [1],
            2: [0.7, 0.3],
            3: [0.5, 0.3, 0.2]
        };

        this.init();
    }

    async init() {
        await this.fetchUserStake();
        await this.fetchTasks();
        this.setupEventListeners();
        this.updateUI();
    }

    async fetchUserStake() {
        try {
            // Replace with actual API call to fetch user's stake
            const response = await fetch('/api/user/stake');
            const data = await response.json();
            this.userStake = data.stake;
            document.getElementById('userStake').textContent = this.userStake;
        } catch (error) {
            console.error('Error fetching user stake:', error);
            document.getElementById('userStake').textContent = 'Error loading stake';
        }
    }

    async fetchTasks() {
        try {
            // Replace with actual API call to fetch tasks
            const response = await fetch('/api/tasks');
            this.tasks = await response.json();
            this.renderTasks();
        } catch (error) {
            console.error('Error fetching tasks:', error);
            document.getElementById('taskList').innerHTML = '<p class="error">Error loading tasks</p>';
        }
    }

    renderTasks() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = this.tasks.map(task => `
            <div class="task-card" data-task-id="${task.id}">
                <h3>${task.name}</h3>
                <p>${task.description}</p>
                <div class="task-stats">
                    <span>Current Votes: ${task.votes || 0}</span>
                </div>
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
            const task = taskId ? this.tasks.find(t => t.id === taskId) : null;
            
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
    }

    async submitVote() {
        if (this.selectedTasks.length === 0) return;

        const currentWeights = this.weights[this.selectedTasks.length];
        const votes = this.selectedTasks.map((taskId, index) => ({
            taskId,
            weight: currentWeights[index]
        }));

        try {
            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    votes,
                    stake: this.userStake
                })
            });

            if (response.ok) {
                alert('Vote submitted successfully!');
                // Reset selections
                this.selectedTasks = [];
                document.querySelectorAll('.task-card.selected')
                    .forEach(card => card.classList.remove('selected'));
                this.updateUI();
            } else {
                throw new Error('Failed to submit vote');
            }
        } catch (error) {
            console.error('Error submitting vote:', error);
            alert('Failed to submit vote. Please try again.');
        }
    }
}

// Initialize the voting system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VotingSystem();
}); 