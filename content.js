// Track the last action for each player and current street
const playerLastActions = {};
const playerBlindStatus = {};
let currentStreet = 'Preflop';

// Function to get blind amounts from the table
function getBlinds() {
    const blindValueContainer = document.querySelector('.blind-value');
    if (blindValueContainer) {
        const blindValues = blindValueContainer.querySelectorAll('.normal-value');
        if (blindValues.length === 2) {
            return {
                smallBlind: blindValues[0].textContent,
                bigBlind: blindValues[1].textContent
            };
        }
    }
    return null;
}

// Function to determine blind positions based on dealer button
function getBlindPositions() {
    const dealerButton = document.querySelector('.dealer-button-ctn');
    if (!dealerButton) return null;

    const dealerPositionMatch = dealerButton.className.match(/dealer-position-(\d+)/);
    if (!dealerPositionMatch) return null;

    const dealerPosition = parseInt(dealerPositionMatch[1]);
    let foundPositions = [];

    for (let i = 1; i <= 10; i++) {
        let checkPosition = ((dealerPosition + i) % 10) || 10;
        const playerAtPosition = document.querySelector(`.table-player-${checkPosition}`);
        
        if (playerAtPosition && !playerAtPosition.classList.contains('table-player-seat')) {
            foundPositions.push({
                position: checkPosition,
                playerName: playerAtPosition.querySelector('.table-player-name a')?.textContent || ''
            });
            
            if (foundPositions.length === 2) break;
        }
    }

    return foundPositions.length === 2 ? {
        smallBlind: foundPositions[0],
        bigBlind: foundPositions[1]
    } : null;
}

function updateCurrentStreet() {
    const communityCards = document.querySelector('.table-cards');
    if (!communityCards) return 'Preflop';
    
    const cardCount = communityCards.children.length;
    if (cardCount === 0) return 'Preflop';
    if (cardCount === 3) return 'Flop';
    if (cardCount === 4) return 'Turn';
    if (cardCount === 5) return 'River';
    
    return 'Preflop';
}

function updateHUDTitle(playerName, blindType) {
    const hud = document.getElementById(`hud-${playerName}`);
    if (hud) {
        const titleElement = hud.querySelector('h4');
        if (titleElement) {
            titleElement.textContent = `${playerName} ${blindType}`;
        }
    }
}

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

        const playerNameLink = Array.from(document.querySelectorAll('.table-player-name a')).find(
            link => link.textContent === playerName
        );

        if (playerNameLink) {
            const tablePlayerDiv = playerNameLink.closest('.table-player');
            const rect = tablePlayerDiv.getBoundingClientRect();
            
            hud.style.top = `${rect.top + window.scrollY - 5}px`;
            hud.style.left = `${rect.left + window.scrollX}px`;
            
            const hudHeight = hud.getBoundingClientRect().height;
            hud.style.top = `${rect.top + window.scrollY - hudHeight - 10}px`;
        }
    }
}

function logPlayerAction(playerName, action, amount = '') {
    const currentAction = `${action}${amount ? ` ${amount}` : ''}`;
    
    // Special handling for blind posts
    if (action === 'bet' && currentStreet === 'Preflop') {
        const blinds = getBlinds();
        const blindPositions = getBlindPositions();
        
        if (blinds && blindPositions) {
            const amountValue = amount ? amount.replace('$', '') : '';
            
            // Handle Small Blind
            if (playerName === blindPositions.smallBlind.playerName && 
                amountValue === blinds.smallBlind) {
                
                // Check if we've already logged this blind post
                const blindAction = `Posted Small Blind ${amount}`;
                if (playerLastActions[playerName] === blindAction) {
                    return;
                }
                
                createPlayerHUD(playerName);
                const hud = document.getElementById(`hud-${playerName}`);
                if (hud) {
                    const titleElement = hud.querySelector('h4');
                    if (titleElement) {
                        titleElement.textContent = `${playerName} SMALL BLIND`;
                    }
                }
                const log = document.getElementById(`action-log-${playerName}`);
                const actionItem = document.createElement('li');
                actionItem.textContent = `[${currentStreet}] ${blindAction}`;
                
                // Store this as the last action
                playerLastActions[playerName] = blindAction;
                
                // Keep only the last 5 actions
                while (log.children.length >= 5) {
                    log.removeChild(log.firstChild);
                }
                
                log.appendChild(actionItem);
                return;
            }
            
            // Handle Big Blind
            if (playerName === blindPositions.bigBlind.playerName && 
                amountValue === blinds.bigBlind) {
                
                // Check if we've already logged this blind post
                const blindAction = `Posted Big Blind ${amount}`;
                if (playerLastActions[playerName] === blindAction) {
                    return;
                }
                
                createPlayerHUD(playerName);
                const hud = document.getElementById(`hud-${playerName}`);
                if (hud) {
                    const titleElement = hud.querySelector('h4');
                    if (titleElement) {
                        titleElement.textContent = `${playerName} BIG BLIND`;
                    }
                }
                const log = document.getElementById(`action-log-${playerName}`);
                const actionItem = document.createElement('li');
                actionItem.textContent = `[${currentStreet}] ${blindAction}`;
                
                // Store this as the last action
                playerLastActions[playerName] = blindAction;
                
                // Keep only the last 5 actions
                while (log.children.length >= 5) {
                    log.removeChild(log.firstChild);
                }
                
                log.appendChild(actionItem);
                return;
            }
        }
    }
    
    // Check if this is the same as the player's last action
    if (playerLastActions[playerName] === currentAction) {
        return; // Skip if it's a duplicate action
    }
    
    // Update the player's last action
    playerLastActions[playerName] = currentAction;
    
    createPlayerHUD(playerName);
    const log = document.getElementById(`action-log-${playerName}`);
    const actionItem = document.createElement('li');
    
    // Update current street
    currentStreet = updateCurrentStreet();
    
    // Format the action text
    let actionText = '';
    if (action === 'check') {
        actionText = `[${currentStreet}] checks`;
    } else if (action === 'raised to') {
        actionText = `[${currentStreet}] raised to ${amount}`;
    } else {
        actionText = `[${currentStreet}] ${action}${amount ? ` ${amount}` : ''}`;
    }
    
    actionItem.textContent = actionText;
    
    // Keep only the last 5 actions
    while (log.children.length >= 5) {
        log.removeChild(log.firstChild);
    }
    
    log.appendChild(actionItem);
}

function clearPlayerHUDs() {
    document.querySelectorAll('[id^="hud-"]').forEach(hud => {
        const playerName = hud.querySelector('h4').textContent.split(' SMALL')[0]; // Get original name
        hud.querySelector('h4').textContent = playerName; // Reset to original name
        hud.remove();
    });
    Object.keys(playerLastActions).forEach(key => delete playerLastActions[key]);
    Object.keys(playerBlindStatus).forEach(key => delete playerBlindStatus[key]);
    currentStreet = 'Preflop';
}

function setupActionObserver() {
    const tableElement = document.querySelector('.table');
    if (!tableElement) return;

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.classList.contains('table-cards')) {
                currentStreet = updateCurrentStreet();
                if (mutation.target.children.length === 0) {
                    clearPlayerHUDs();
                }
            }

            if (mutation.target.classList.contains('table-player')) {
                const playerElement = mutation.target;
                const playerNameElement = playerElement.querySelector('.table-player-name a');
                if (!playerNameElement) return;
                
                const playerName = playerNameElement.textContent;

                if (playerElement.classList.contains('fold')) {
                    logPlayerAction(playerName, 'folded');
                }
                
                if (playerElement.classList.contains('check')) {
                    logPlayerAction(playerName, 'check');
                }
                
                const betValueElement = playerElement.querySelector('.table-player-bet-value');
                if (betValueElement) {
                    const betAmount = betValueElement.textContent.trim();
                    if (betAmount && betAmount !== '0.00') {
                        const potElement = document.querySelector('.table-pot-size .normal-value');
                        const potAmount = potElement ? potElement.textContent.trim() : '0.00';
                        
                        if (potAmount === '0.00') {
                            logPlayerAction(playerName, 'bet', `$${betAmount}`);
                        } else {
                            logPlayerAction(playerName, 'raised to', `$${betAmount}`);
                        }
                    }
                }

                if (playerElement.classList.contains('call')) {
                    const betAmount = betValueElement ? betValueElement.textContent.trim() : '';
                    logPlayerAction(playerName, 'called', betAmount ? `$${betAmount}` : '');
                }
            }
        });
    });

    observer.observe(tableElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['class']
    });
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    setupActionObserver();
});

// Initialize when HUD is enabled via popup
setupActionObserver();