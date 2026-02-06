// 1. DATA-HANTERING (Hämtar det som finns sparat)
let players = JSON.parse(localStorage.getItem('golfPlayers')) || [];
let rounds = JSON.parse(localStorage.getItem('golfRounds')) || [];

// 2. KÖRS NÄR SIDAN LADDAS
document.addEventListener('DOMContentLoaded', () => {
    console.log("Sidan laddad. Hittade antal spelare:", players.length);

    // Koppla formulär (Spelare)
    const playerForm = document.getElementById('add-player-form');
    if (playerForm) playerForm.addEventListener('submit', handleAddPlayer);

    // Koppla formulär (Rundor)
    const roundForm = document.getElementById('add-round-form');
    if (roundForm) roundForm.addEventListener('submit', handleAddRound);

    // UPPDATERA ALLT PÅ SKÄRMEN
    updatePlayerDisplay(); // Visar listan på spelarsidan
    updateRoundDisplay();  // Visar listan på rundor-sidan
    populatePlayerDropdown(); // Fyller i väljaren på rundor-sidan
});

// 3. FYLL I DROP-DOWN MENYN (Välj spelare)
function populatePlayerDropdown() {
    const dropdown = document.getElementById('round-player');
    
    // Om vi inte hittar dropdown-menyn (t.ex. på index.html), avbryt.
    if (!dropdown) return; 

    if (players.length === 0) {
        dropdown.innerHTML = '<option value="">Inga spelare hittades...</option>';
        return;
    }

    // Skapa valen i menyn
    let optionsHTML = '<option value="">-- Välj vem som spelat --</option>';
    players.forEach(p => {
        optionsHTML += `<option value="${p.id}">${p.name} (HCP: ${p.handicap.toFixed(1)})</option>`;
    });

    dropdown.innerHTML = optionsHTML;
    console.log("Dropdown fylld med spelare.");
}

// 4. SPARA NY SPELARE
function handleAddPlayer(e) {
    e.preventDefault();
    const nameVal = document.getElementById('player-name').value.trim();
    const hcpVal = document.getElementById('player-hcp').value;
    const idVal = document.getElementById('player-golfid').value.trim();

    const newPlayer = {
        id: Date.now(),
        name: nameVal,
        handicap: parseFloat(hcpVal),
        golfId: idVal || "Saknas"
    };

    players.push(newPlayer);
    localStorage.setItem('golfPlayers', JSON.stringify(players));
    
    e.target.reset();
    updatePlayerDisplay();
    showNotification(`Spelaren ${newPlayer.name} tillagd!`);
}

// 5. SPARA NY RUNDA
function handleAddRound(e) {
    e.preventDefault();
    const playerId = parseInt(document.getElementById('round-player').value);
    const score = parseInt(document.getElementById('round-score').value);
    const cr = parseFloat(document.getElementById('round-cr').value);
    const slope = parseInt(document.getElementById('round-slope').value);
    const date = document.getElementById('round-date').value;
    const course = document.getElementById('round-course').value;

    if (!playerId) {
        alert("Du måste välja en spelare i listan!");
        return;
    }

    // WHS Formel: Score Differential
    const differential = (score - cr) * (113 / slope);

    const newRound = {
        id: Date.now(),
        playerId: playerId,
        playerName: players.find(p => p.id === playerId).name,
        score: score,
        differential: differential,
        date: date,
        course: course
    };

    rounds.push(newRound);
    localStorage.setItem('golfRounds', JSON.stringify(rounds));
    
    // Uppdatera handicap och spara
    calculateNewHcp(playerId);

    e.target.reset();
    updateRoundDisplay();
    showNotification("Runda sparad!");
}

// 6. RÄKNA UT NYTT HCP (Enligt WHS)
function calculateNewHcp(playerId) {
    const playerRounds = rounds.filter(r => r.playerId === playerId);
    playerRounds.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const last20 = playerRounds.slice(0, 20);
    const sortedDiffs = last20.map(r => r.differential).sort((a, b) => a - b);
    
    let newHcp;
    const n = last20.length;

    if (n >= 20) {
        const best8 = sortedDiffs.slice(0, 8);
        newHcp = best8.reduce((a, b) => a + b, 0) / 8;
    } else {
        // Enkel beräkning för färre än 20 rundor
        newHcp = sortedDiffs[0]; // För enkelhetens skull, ta bästa rundan
    }

    const pIdx = players.findIndex(p => p.id === playerId);
    if (pIdx !== -1) {
        players[pIdx].handicap = Math.round(newHcp * 10) / 10;
        localStorage.setItem('golfPlayers', JSON.stringify(players));
    }
}

// 7. RITA UT LISTOR
function updatePlayerDisplay() {
    const list = document.getElementById('players-list');
    if (!list) return;
    list.innerHTML = players.map(p => `
        <div class="player-card" style="background:white; padding:10px; border-radius:8px; margin-bottom:10px; border:1px solid #ddd;">
            <strong>${p.name}</strong> - HCP: ${p.handicap.toFixed(1)}
            <button onclick="deletePlayer(${p.id})" style="float:right; background:red; color:white; border:none; border-radius:4px;">X</button>
        </div>
    `).join('');
}

function updateRoundDisplay() {
    const list = document.getElementById('rounds-list');
    if (!list) return;
    const sorted = [...rounds].sort((a, b) => new Date(b.date) - new Date(a.date));
    list.innerHTML = sorted.map(r => `
        <div style="background:#eee; padding:10px; margin-bottom:5px; border-radius:5px;">
            <strong>${r.playerName}</strong>: ${r.score} slag på ${r.course} (${r.date})
        </div>
    `).join('');
}

function deletePlayer(id) {
    if (confirm("Ta bort?")) {
        players = players.filter(p => p.id !== id);
        localStorage.setItem('golfPlayers', JSON.stringify(players));
        updatePlayerDisplay();
        populatePlayerDropdown(); // Uppdatera menyn om man tar bort någon
    }
}

function showNotification(msg) {
    const n = document.createElement('div');
    n.textContent = msg;
    n.style.cssText = "position:fixed; top:10px; right:10px; background:green; color:white; padding:10px; border-radius:5px; z-index:9999;";
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}
