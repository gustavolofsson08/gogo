// 1. HÄMTA DATA (Sker direkt när filen laddas)
let players = JSON.parse(localStorage.getItem('golfPlayers')) || [];
let rounds = JSON.parse(localStorage.getItem('golfRounds')) || [];

// 2. STARTA SIDAN
document.addEventListener('DOMContentLoaded', () => {
    // Koppla formuläret till vår funktion
    const playerForm = document.getElementById('add-player-form');
    if (playerForm) {
        playerForm.addEventListener('submit', handleAddPlayer);
    }

    // Rita ut spelarna direkt när sidan laddas
    updateDisplay();
});

// 3. FUNKTION FÖR ATT LÄGGA TILL SPELARE
function handleAddPlayer(e) {
    // Detta stoppar sidan från att ladda om/blinka till
    e.preventDefault(); 

    // Hämta värden från fälten
    const nameVal = document.getElementById('player-name').value.trim();
    const hcpVal = document.getElementById('player-hcp').value;
    const idVal = document.getElementById('player-golfid').value.trim();

    // Skapa det nya spelar-objektet
    const newPlayer = {
        id: Date.now(),
        name: nameVal,
        handicap: parseFloat(hcpVal),
        golfId: idVal || "Saknas"
    };

    // Lägg till i vår lista
    players.push(newPlayer);

    // Spara listan i webbläsarens minne (LocalStorage)
    localStorage.setItem('golfPlayers', JSON.stringify(players));
    
    // Töm formuläret så det blir snyggt
    e.target.reset();
    
    // VIKTIGT: Rita ut listan på nytt direkt!
    updateDisplay();
    
    // Visa en bekräftelse
    showNotification(`Spelaren ${newPlayer.name} har lagts till!`);
}

// 4. FUNKTION FÖR ATT RITA UT LISTAN PÅ SKÄRMEN
function updateDisplay() {
    const listContainer = document.getElementById('players-list');
    const countBadge = document.getElementById('player-count');

    // Avbryt om vi inte hittar listan (t.ex. om vi är på index-sidan)
    if (!listContainer) return; 

    // Uppdatera räknaren
    if (countBadge) {
        countBadge.textContent = `${players.length} spelare`;
    }

    // Om listan är tom
    if (players.length === 0) {
        listContainer.innerHTML = '<p style="color: #666; font-style: italic;">Inga spelare tillagda än.</p>';
        return;
    }

    // Bygg ihop listan
    listContainer.innerHTML = players.map(p => `
        <div class="player-card" style="background: white; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div>
                <h4 style="margin: 0; color: #2c3e50;">${p.name}</h4>
                <small style="color: #7f8c8d;">HCP: ${p.handicap.toFixed(1)} | ID: ${p.golfId}</small>
            </div>
            <button onclick="deletePlayer(${p.id})" style="background: #ff7675; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Ta bort</button>
        </div>
    `).join('');
}

// 5. TA BORT SPELARE
function deletePlayer(id) {
    if (confirm("Vill du ta bort spelaren?")) {
        players = players.filter(p => p.id !== id);
        localStorage.setItem('golfPlayers', JSON.stringify(players));
        updateDisplay();
    }
}

// 6. NOTIFIERING
function showNotification(msg) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: #2ecc71; color: white; padding: 15px 25px;
        border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 1000;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
