document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('rouletteGrid');
    const playButton = document.getElementById('playButton');
    const betAmount = document.getElementById('betAmount');
    const resultDiv = document.getElementById('result');
    const balanceSpan = document.getElementById('balance');
    const usernameSpan = document.getElementById('username');
    const logoutButton = document.getElementById('logout');
    const hashInput = document.getElementById('hashInput');
    const verifyButton = document.getElementById('verifyButton');
    const verificationResult = document.getElementById('verificationResult');
    const historyTable = document.querySelector('#historyTable tbody');
    
    let selectedCells = [];
    let userData = {};
    
    // Initialize grid
    for (let i = 1; i <= 99; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = i;
        cell.dataset.number = i;
        
        cell.addEventListener('click', () => {
            if (cell.classList.contains('selected')) {
                cell.classList.remove('selected');
                selectedCells = selectedCells.filter(num => num !== i);
            } else if (selectedCells.length < 3) {
                cell.classList.add('selected');
                selectedCells.push(i);
            }
        });
        
        grid.appendChild(cell);
    }
    
    // Load user data
    async function loadUserData() {
        try {
            const response = await fetch('/api/user');
            if (response.ok) {
                userData = await response.json();
                usernameSpan.textContent = userData.username;
                balanceSpan.textContent = `Balance: $${userData.balance.toFixed(2)}`;
                loadHistory();
            } else {
                window.location.href = '/auth/login';
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }
    
    // Load bet history
    async function loadHistory() {
        try {
            const response = await fetch('/api/bets');
            if (response.ok) {
                const bets = await response.json();
                historyTable.innerHTML = '';
                
                bets.forEach(bet => {
                    const row = document.createElement('tr');
                    
                    const cells = [
                        new Date(bet.timestamp).toLocaleString(),
                        bet.selected_cells,
                        bet.winning_cell,
                        `$${bet.amount.toFixed(2)}`,
                        `$${bet.prize.toFixed(2)}`,
                        bet.game_hash.substring(0, 8) + '...'
                    ];
                    
                    cells.forEach(text => {
                        const td = document.createElement('td');
                        td.textContent = text;
                        row.appendChild(td);
                    });
                    
                    historyTable.appendChild(row);
                });
            }
        } catch (error) {
            console.error('Error loading bet history:', error);
        }
    }
    
    // Play button handler
    playButton.addEventListener('click', async () => {
        if (selectedCells.length === 0) {
            alert('Please select at least 1 cell');
            return;
        }
        
        const amount = parseFloat(betAmount.value);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid bet amount');
            return;
        }
        
        try {
            const response = await fetch('/api/place_bet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cells: selectedCells,
                    amount: amount
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Update UI with results
                balanceSpan.textContent = `Balance: $${result.new_balance.toFixed(2)}`;
                
                // Highlight winning cell
                const allCells = document.querySelectorAll('.cell');
                allCells.forEach(cell => {
                    cell.classList.remove('winning');
                    if (parseInt(cell.dataset.number) === result.winning_cell) {
                        cell.classList.add('winning');
                    }
                });
                
                // Show result message
                if (result.is_winner) {
                    resultDiv.innerHTML = `
                        <h3>Congratulations! You won $${result.prize.toFixed(2)}</h3>
                        <p>Winning cell: ${result.winning_cell}</p>
                        <p>Game hash: ${result.game_hash}</p>
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <h3>Sorry, you didn't win this time</h3>
                        <p>Winning cell: ${result.winning_cell}</p>
                        <p>Game hash: ${result.game_hash}</p>
                    `;
                }
                
                // Reset selection and reload history
                selectedCells = [];
                allCells.forEach(cell => cell.classList.remove('selected'));
                loadHistory();
            } else {
                const error = await response.json();
                alert(error.error || 'Error placing bet');
            }
        } catch (error) {
            console.error('Error placing bet:', error);
            alert('Error placing bet');
        }
    });
    
    // Verify hash button handler
    verifyButton.addEventListener('click', async () => {
        const hash = hashInput.value.trim();
        if (!hash) {
            alert('Please enter a game hash');
            return;
        }
        
        try {
            const response = await fetch('/api/verify_hash', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    selected_cells: selectedCells,
                    winning_cell: 0, // This would need to be from the game result
                    amount: parseFloat(betAmount.value),
                    hash: hash
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                verificationResult.textContent = result.valid ? 
                    '✅ Hash is valid' : '❌ Hash is invalid';
            } else {
                verificationResult.textContent = 'Error verifying hash';
            }
        } catch (error) {
            console.error('Error verifying hash:', error);
            verificationResult.textContent = 'Error verifying hash';
        }
    });
    
    // Logout button handler
    logoutButton.addEventListener('click', async () => {
        try {
            await fetch('/auth/logout', { method: 'POST' });
            window.location.href = '/auth/login';
        } catch (error) {
            console.error('Error logging out:', error);
        }
    });
    
    // Initial load
    loadUserData();
});