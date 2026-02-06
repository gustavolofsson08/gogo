// Data storage
let players = [];
let rounds = [];
let matches = [];

// Load data from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initializeCurrentPage();
});

// Initialize logic based on which page we are on
function initializeCurrentPage() {
    // 1. Hantera formulär (bara om de finns på sidan)
    const playerForm = document.getElementById('add-player-form');
    if (playerForm) playerForm.addEventListener('submit', addPlayer);
    
    const roundForm = document.getElementById('add-round-form');
    if (roundForm) roundForm.addEventListener('submit', addRound);
    
    const matchForm = document.getElementById('add-match-form');
    if (matchForm) matchForm.addEventListener('submit', addMatch);

    // 2. Uppdatera listor och dropdowns (bara om elementen finns)
    displayPlayers();
    displayRounds();
    displayMatches();
    updatePlayerSelects();
    updateStatistics();
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

// --- SPELARHANTERING MED GOLF-ID ---
function addPlayer(e) {
    e.preventDefault();
    
    const name = document.getElementById('player-name').value.trim();
    const hcp = parseFloat(document.getElementById('player-hcp').value);
    
    // Hämta Golf-ID om fältet finns, annars tom sträng
    const golfIdInput = document.getElementById('player-golfid');
    const golfId = golfIdInput ? golfIdInput.value.trim() : "";

    // Validera Golf-ID om det är ifyllt (Format: ÅÅMMDD-XXX)
    if (golfId && !/^\d{6}-\d{3}$/.test(golfId)) {
        alert('Golf-ID måste vara i formatet ÅÅMMDD-XXX');
        return;
    }

    if (!name || isNaN(hcp)) {
        alert('Vänligen fyll i namn och handicap.');
        return;
    }

    const player = {
        id: Date.now(),
        name: name,
        golfId: golfId,
        handicap: hcp,
        startHandicap: hcp // Bra att spara vad man började på
    };

    players.push(player);
    saveData();
    displayPlayers(); // Uppdatera listan direkt
    updatePlayerSelects();
    
    e.target.reset();
    showNotification('Spelare tillagd!');
}

// --- RUNDHANTERING MED WHS (HCP-BERÄKNING) ---
function addRound(e) {
    e.preventDefault();
    
    const playerId = parseInt(document.getElementById('round-player').value);
    const grossScore = parseInt(document.getElementById('round-score').value);
    const date = document.getElementById('round-date').value;
    const course = document.getElementById('round-course').value.trim();
    
    // Hämta Slope och CR om fälten finns, annars standardvärden
    const slopeInput = document.getElementById('round-slope');
    const crInput = document.getElementById('round-cr');
    const slope = slopeInput && slopeInput.value ? parseInt(slopeInput.value) : 113;
    const cr = crInput && crInput.value ? parseFloat(crInput.value) : 72.0;

    if (!playerId || isNaN(grossScore) || !date || !course) {
        alert('Vänligen fyll i alla obligatoriska fält.');
        return;
    }

    const player = players.find(p => p.id === playerId);
    if (!player) return;

    // Beräkna Score Differential för WHS: (Score - CR) * (113 / Slope)
    const scoreDiff = (grossScore - cr) * (113 / slope);

    const round = {
        id: Date.now(),
        playerId: playerId,
        playerName: player.name,
        score: grossScore,
        slope: slope,
        cr: cr,
        scoreDifferential: scoreDiff,
        handicapAtRound: player.handicap,
        netScore: grossScore - player.handicap,
        date: date,
        course: course
    };

    rounds.push(round);
    
    // Uppdatera spelarens handicap enligt WHS-regler
    updatePlayerWHS(playerId);

    saveData();
    displayRounds();
    
    e.target.reset();
    showNotification('Runda registrerad & HCP uppdaterat!');
}

// --- WHS HANDICAP LOGIK ---
function updatePlayerWHS(playerId) {
    const player = players.find(p => p.id === playerId);
    
    // Hämta spelarens alla rundor och sortera (senaste först)
    const playerRounds = rounds.filter(r => r.playerId === playerId);
    playerRounds.sort((a, b) => new Date(b.date) - new Date(a.date));

    // WHS baseras på de senaste 20 rundorna
    const last20 = playerRounds.slice(0, 20);
    const n = last20.length;

    if (n === 0) return;

    let newHcp = player.handicap;
    
    // Sortera de senaste 20 rundorna baserat på lägst Score Differential (bäst först)
    const sortedDiffs = last20.map(r => r.scoreDifferential).sort((a, b) => a - b);

    // WHS Beräkningstabell
    if (n >= 20) {
        // Snitt av de 8 bästa
        const best8 = sortedDiffs.slice(0, 8);
        newHcp = best8.reduce((a, b) => a + b, 0) / 8;
    } else {
        // Färre än 20 rundor (S
