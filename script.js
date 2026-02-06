// Data storage
let players = [];
let rounds = [];
let matches = [];

// Load data from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initializeEventListeners();
    updateAllDisplays();
});

// Initialize all event listeners
function initializeEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Form submissions - only add listeners if elements exist
    const playerForm = document.getElementById('add-player-form');
    if (playerForm) {
        playerForm.addEventListener('submit', addPlayer);
    }
    
    const roundForm = document.getElementById('add-round-form');
    if (roundForm) {
        roundForm.addEventListener('submit', addRound);
    }
    
    const matchForm = document.getElementById('add-match-form');
    if (matchForm) {
        matchForm.addEventListener('submit', addMatch);
    }
}

// Tab switching
function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Update displays when switching to certain tabs
    if (tabName === 'stats') {
        updateStatistics();
    }
}

// Load data from localStorage
function loadData() {
    const savedPlayers = localStorage.getItem('golfPlayers');
    const savedRounds = localStorage.getItem('golfRounds');
    const savedMatches = localStorage.getItem('golfMatches');

    if (savedPlayers) players = JSON.parse(savedPlayers);
    if (savedRounds) rounds = JSON.parse(savedRounds);
    if (savedMatches) matches = JSON.parse(savedMatches);
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('golfPlayers', JSON.stringify(players));
    localStorage.setItem('golfRounds', JSON.stringify(rounds));
    localStorage.setItem('golfMatches', JSON.stringify(matches));
}

// Add new player
function addPlayer(e) {
    e.preventDefault();
    
    const name = document.getElementById('player-name').value.trim();
    const hcp = parseFloat(document.getElementById('player-hcp').value);

    if (!name || isNaN(hcp)) {
        alert('Vänligen fyll i alla fält korrekt.');
        return;
    }

    const player = {
        id: Date.now(),
        name: name,
        handicap: hcp
    };

    players.push(player);
    saveData();
    updateAllDisplays();
    
    e.target.reset();
    showNotification('Spelare tillagd!');
}

// Add new round
function addRound(e) {
    e.preventDefault();
    
    const playerId = parseInt(document.getElementById('round-player').value);
    const score = parseInt(document.getElementById('round-score').value);
    const date = document.getElementById('round-date').value;
    const course = document.getElementById('round-course').value.trim();

    if (!playerId || isNaN(score) || !date || !course) {
        alert('Vänligen fyll i alla fält korrekt.');
        return;
    }

    const player = players.find(p => p.id === playerId);
    if (!player) {
        alert('Spelare hittades inte.');
        return;
    }

    const round = {
        id: Date.now(),
        playerId: playerId,
        playerName: player.name,
        score: score,
        handicap: player.handicap,
        netScore: score - player.handicap,
        date: date,
        course: course
    };

    rounds.push(round);
    saveData();
    updateAllDisplays();
    
    e.target.reset();
    showNotification('Runda registrerad!');
}

// Add new match
function addMatch(e) {
    e.preventDefault();
    
    const player1Id = parseInt(document.getElementById('match-player1').value);
    const player2Id = parseInt(document.getElementById('match-player2').value);
    const score1 = parseInt(document.getElementById('match-score1').value);
    const score2 = parseInt(document.getElementById('match-score2').value);
    const date = document.getElementById('match-date').value;

    if (!player1Id || !player2Id || isNaN(score1) || isNaN(score2) || !date) {
        alert('Vänligen fyll i alla fält korrekt.');
        return;
    }

    if (player1Id === player2Id) {
        alert('Välj två olika spelare.');
        return;
    }

    const player1 = players.find(p => p.id === player1Id);
    const player2 = players.find(p => p.id === player2Id);

    if (!player1 || !player2) {
        alert('Spelare hittades inte.');
        return;
    }

    const match = {
        id: Date.now(),
        player1: {
            id: player1Id,
            name: player1.name,
            score: score1,
            handicap: player1.handicap,
            netScore: score1 - player1.handicap
        },
        player2: {
            id: player2Id,
            name: player2.name,
            score: score2,
            handicap: player2.handicap,
            netScore: score2 - player2.handicap
        },
        date: date,
        winnerId: score1 < score2 ? player1Id : (score2 < score1 ? player2Id : null)
    };

    matches.push(match);
    saveData();
    updateAllDisplays();
    
    e.target.reset();
    showNotification('Matchspel registrerat!');
}

// Delete player
function deletePlayer(id) {
    if (!confirm('Är du säker på att du vill ta bort denna spelare? Alla rundor och matcher kommer att raderas.')) {
        return;
    }

    players = players.filter(p => p.id !== id);
    rounds = rounds.filter(r => r.playerId !== id);
    matches = matches.filter(m => m.player1.id !== id && m.player2.id !== id);
    
    saveData();
    updateAllDisplays();
    showNotification('Spelare borttagen!');
}

// Update all displays
function updateAllDisplays() {
    displayPlayers();
    displayRounds();
    displayMatches();
    updatePlayerSelects();
    updateStatistics();
}

// Display players
function displayPlayers() {
    const container = document.getElementById('players-list');
    if (!container) return; // Exit if element doesn't exist
    
    const countBadge = document.getElementById('player-count');
    
    if (countBadge) {
        countBadge.textContent = `${players.length} ${players.length === 1 ? 'spelare' : 'spelare'}`;
    }
    
    if (players.length === 0) {
        container.innerHTML = '<div class="empty-message">Inga spelare registrerade ännu. Lägg till din första spelare ovan!</div>';
        return;
    }

    container.innerHTML = players.map(player => `
        <div class="player-card">
            <h4>${player.name}</h4>
            <p>Handicap: ${player.handicap.toFixed(1)}</p>
            <button class="btn btn-danger" onclick="deletePlayer(${player.id})">Ta bort</button>
        </div>
    `).join('');
}

// Display rounds
function displayRounds() {
    const container = document.getElementById('rounds-list');
    if (!container) return; // Exit if element doesn't exist
    
    if (rounds.length === 0) {
        container.innerHTML = '<div class="empty-message">Inga rundor registrerade ännu.</div>';
        return;
    }

    const sortedRounds = [...rounds].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = sortedRounds.map(round => `
        <div class="round-item">
            <div class="round-header">
                <h4>${round.playerName}</h4>
                <span class="score-badge">${round.score}</span>
            </div>
            <div class="round-details">
                <p><strong>Bana:</strong> ${round.course}</p>
                <p><strong>Datum:</strong> ${formatDate(round.date)}</p>
                <p><strong>Netto score (med HCP):</strong> ${round.netScore.toFixed(1)}</p>
            </div>
        </div>
    `).join('');
}

// Display matches
function displayMatches() {
    const container = document.getElementById('matches-list');
    if (!container) return; // Exit if element doesn't exist
    
    if (matches.length === 0) {
        container.innerHTML = '<div class="empty-message">Inga matchspel registrerade ännu.</div>';
        return;
    }

    const sortedMatches = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = sortedMatches.map(match => {
        const winnerName = match.winnerId === match.player1.id ? match.player1.name :
                          match.winnerId === match.player2.id ? match.player2.name : 'Oavgjort';
        
        return `
            <div class="match-item">
                <div class="match-header">
                    <h4>${match.player1.name} vs ${match.player2.name}</h4>
                    <span class="winner-badge">${winnerName}</span>
                </div>
                <div class="match-details">
                    <p><strong>Datum:</strong> ${formatDate(match.date)}</p>
                    <p><strong>${match.player1.name}:</strong> ${match.player1.score} (Netto: ${match.player1.netScore.toFixed(1)})</p>
                    <p><strong>${match.player2.name}:</strong> ${match.player2.score} (Netto: ${match.player2.netScore.toFixed(1)})</p>
                </div>
            </div>
        `;
    }).join('');
}

// Update player select dropdowns
function updatePlayerSelects() {
    const selects = [
        document.getElementById('round-player'),
        document.getElementById('match-player1'),
        document.getElementById('match-player2')
    ].filter(select => select !== null); // Only include elements that exist

    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Välj spelare...</option>' +
            players.map(player => 
                `<option value="${player.id}">${player.name} (HCP: ${player.handicap.toFixed(1)})</option>`
            ).join('');
        select.value = currentValue;
    });
}

// Update statistics
function updateStatistics() {
    updateBestRawScore();
    updateBestNetScore();
    updateMatchRanking();
    updateAverageScores();
}

// Update best raw score ranking
function updateBestRawScore() {
    const container = document.getElementById('best-raw-score');
    if (!container) return; // Exit if element doesn't exist
    
    if (rounds.length === 0) {
        container.innerHTML = '<div class="empty-message">Inga rundor att visa.</div>';
        return;
    }

    // Get best score for each player
    const bestScores = {};
    rounds.forEach(round => {
        if (!bestScores[round.playerId] || round.score < bestScores[round.playerId].score) {
            bestScores[round.playerId] = {
                name: round.playerName,
                score: round.score
            };
        }
    });

    // Sort by score
    const sorted = Object.values(bestScores).sort((a, b) => a.score - b.score);

    container.innerHTML = sorted.map((player, index) => `
        <div class="ranking-item ${index < 3 ? `top-${index + 1}` : ''}">
            <span class="ranking-position">${index + 1}</span>
            <span class="ranking-name">${player.name}</span>
            <span class="ranking-score">${player.score}</span>
        </div>
    `).join('');
}

// Update best net score ranking
function updateBestNetScore() {
    const container = document.getElementById('best-net-score');
    if (!container) return; // Exit if element doesn't exist
    
    if (rounds.length === 0) {
        container.innerHTML = '<div class="empty-message">Inga rundor att visa.</div>';
        return;
    }

    // Get best net score for each player
    const bestScores = {};
    rounds.forEach(round => {
        if (!bestScores[round.playerId] || round.netScore < bestScores[round.playerId].netScore) {
            bestScores[round.playerId] = {
                name: round.playerName,
                netScore: round.netScore
            };
        }
    });

    // Sort by net score
    const sorted = Object.values(bestScores).sort((a, b) => a.netScore - b.netScore);

    container.innerHTML = sorted.map((player, index) => `
        <div class="ranking-item ${index < 3 ? `top-${index + 1}` : ''}">
            <span class="ranking-position">${index + 1}</span>
            <span class="ranking-name">${player.name}</span>
            <span class="ranking-score">${player.netScore.toFixed(1)}</span>
        </div>
    `).join('');
}

// Update match play ranking
function updateMatchRanking() {
    const container = document.getElementById('match-ranking');
    if (!container) return; // Exit if element doesn't exist
    
    if (matches.length === 0) {
        container.innerHTML = '<div class="empty-message">Inga matchspel att visa.</div>';
        return;
    }

    // Calculate wins for each player
    const playerStats = {};
    
    players.forEach(player => {
        playerStats[player.id] = {
            name: player.name,
            wins: 0,
            losses: 0,
            draws: 0
        };
    });

    matches.forEach(match => {
        if (match.winnerId === match.player1.id) {
            playerStats[match.player1.id].wins++;
            playerStats[match.player2.id].losses++;
        } else if (match.winnerId === match.player2.id) {
            playerStats[match.player2.id].wins++;
            playerStats[match.player1.id].losses++;
        } else {
            playerStats[match.player1.id].draws++;
            playerStats[match.player2.id].draws++;
        }
    });

    // Sort by wins
    const sorted = Object.values(playerStats)
        .filter(p => p.wins + p.losses + p.draws > 0)
        .sort((a, b) => b.wins - a.wins);

    container.innerHTML = sorted.map((player, index) => `
        <div class="ranking-item ${index < 3 ? `top-${index + 1}` : ''}">
            <span class="ranking-position">${index + 1}</span>
            <span class="ranking-name">${player.name}</span>
            <span class="ranking-score">${player.wins}V-${player.losses}F-${player.draws}O</span>
        </div>
    `).join('');
}

// Update average scores
function updateAverageScores() {
    const container = document.getElementById('average-scores');
    if (!container) return; // Exit if element doesn't exist
    
    if (rounds.length === 0) {
        container.innerHTML = '<div class="empty-message">Inga rundor att visa.</div>';
        return;
    }

    // Calculate average for each player
    const playerScores = {};
    rounds.forEach(round => {
        if (!playerScores[round.playerId]) {
            playerScores[round.playerId] = {
                name: round.playerName,
                scores: []
            };
        }
        playerScores[round.playerId].scores.push(round.score);
    });

    // Calculate averages and sort
    const sorted = Object.values(playerScores)
        .map(player => ({
            name: player.name,
            average: player.scores.reduce((a, b) => a + b, 0) / player.scores.length,
            rounds: player.scores.length
        }))
        .sort((a, b) => a.average - b.average);

    container.innerHTML = sorted.map((player, index) => `
        <div class="ranking-item ${index < 3 ? `top-${index + 1}` : ''}">
            <span class="ranking-position">${index + 1}</span>
            <span class="ranking-name">${player.name} (${player.rounds} rundor)</span>
            <span class="ranking-score">${player.average.toFixed(1)}</span>
        </div>
    `).join('');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE');
}

// Show notification
function showNotification(message) {
    // Simple alert for now - could be replaced with a nicer notification system
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
