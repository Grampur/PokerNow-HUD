let lastBottom = 0; // Track the bottom of the last HUD

function createPlayerHUD(playerName) {
    if (!document.getElementById(`hud-${playerName}`)) {
        const hud = document.createElement('div');
        hud.id = `hud-${playerName}`;
        hud.style.position = 'absolute';
        hud.style.zIndex = '9999';
        hud.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        hud.style.color = 'white';
        hud.style.padding = '5px';
        hud.style.borderRadius = '5px';
        hud.style.fontFamily = 'Arial, sans-serif';
        hud.style.fontSize = '12px';
        hud.style.textAlign = 'left';
        hud.innerHTML = `<h4>${playerName}</h4><ul id="action-log-${playerName}" style="list-style:none; padding: 0; margin: 0;"></ul>`;
        document.body.appendChild(hud);

        const playerElement = document.querySelector(`[data-player-name="${playerName}"]`);
        if (playerElement) {
            const rect = playerElement.getBoundingClientRect();
            let topPosition = rect.bottom + window.scrollY + 10;
            
            // Check if the new HUD overlaps with the last one, and adjust if necessary
            if (topPosition < lastBottom) {
                topPosition = lastBottom + 10; // Add some space to avoid overlap
            }
            
            hud.style.top = `${topPosition}px`;
            hud.style.left = `${rect.left + window.scrollX}px`;

            lastBottom = topPosition + rect.height + 10; // Update last bottom position
        }
    }
}


// Function to log player actions in their HUD
function logPlayerAction(playerName, action, amount = '') {
    createPlayerHUD(playerName);
    const log = document.getElementById(`action-log-${playerName}`);
    const actionItem = document.createElement('li');
    actionItem.textContent = `${action}${amount ? ` (${amount})` : ''}`;
    log.appendChild(actionItem);
}

// Function to clear all player HUDs at the end of a hand
function clearPlayerHUDs() {
    document.querySelectorAll('[id^="hud-"]').forEach(hud => hud.remove());
}

// Function to parse the session log
function parseSessionLog() {
    const logEntries = document.querySelectorAll('.log-modal-entries .entry-ctn');

    logEntries.forEach(entry => {
        const content = entry.querySelector('.content').textContent.trim();
        console.log('Parsing log entry:', content); // Log each log entry to debug

        // Match log entries to players and actions
        if (content.includes('posts a big blind') || content.includes('posts a small blind')) {
            // Big blind and small blind actions
            const playerName = content.split(' posts')[0];
            logPlayerAction(playerName, 'posted blind');
        } else if (content.includes('folds')) {
            const playerName = content.split(' folds')[0];
            logPlayerAction(playerName, 'folded');
        } else if (content.includes('raises to')) {
            const [playerName, amount] = content.split(' raises to ');
            logPlayerAction(playerName, 'raised', `$${amount}`);
        } else if (content.includes('bets')) {
            const [playerName, amount] = content.split(' bets ');
            logPlayerAction(playerName, 'bet', `$${amount}`);
        } else if (content.includes('calls')) {
            const [playerName, amount] = content.split(' calls ');
            logPlayerAction(playerName, 'called', `$${amount}`);
        } else if (content.includes('collected')) {
            const playerName = content.split(' collected')[0];
            logPlayerAction(playerName, 'won the hand');
        } else if (content.includes('-- ending hand')) {
            clearPlayerHUDs(); // Clear HUDs at the end of the hand
        }
    });
}

// Periodically update the HUD from the session log
setInterval(() => {
    parseSessionLog();
}, 2000);
