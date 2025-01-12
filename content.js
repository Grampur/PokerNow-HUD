// Track the last action for each player and current street
const playerLastActions = {};
const playerBlindStatus = {};
const playerActionHistory = {};
const foldedPlayers = {};
let currentStreet = 'Preflop';


function isPlayerAway(playerElement) {
    return playerElement.classList.contains('away') || 
           playerElement.classList.contains('sitting-out');
}

// Function to get blind amounts from the table
function getBlinds() {
    const blindValueContainer = document.querySelector('.blind-value');
    if (blindValueContainer) {
        const blindValues = blindValueContainer.querySelectorAll('.normal-value');
        if (blindValues.length === 2) {
            const blinds = {
                smallBlind: blindValues[0].textContent.trim(),
                bigBlind: blindValues[1].textContent.trim()
            };
            console.log('Detected blinds:', blinds); // Add logging
            return blinds;
        }
    }
    console.log('Could not detect blinds'); // Add logging
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
    let checkedPositions = 0;

    // Find first player for small blind (skip empty seats and waiting players)
    for (let i = 1; i <= 10; i++) {
        let checkPosition = ((dealerPosition + i) % 10) || 10;
        const playerAtPosition = document.querySelector(`.table-player-${checkPosition}`);
        
        if (playerAtPosition && !playerAtPosition.classList.contains('table-player-seat')) {
            // Only skip players who are waiting for next hand or have waiting message
            if (playerAtPosition.classList.contains('in-next-hand') ||
                playerAtPosition.querySelector('.waiting-for-game-message')) {
                continue;
            }

            foundPositions.push({
                position: checkPosition,
                playerName: playerAtPosition.querySelector('.table-player-name a')?.textContent || ''
            });
            break;  // Found small blind
        }
        checkedPositions++;
        if (checkedPositions >= 10) break;
    }

    // Find big blind position
    checkedPositions = 0;
    const smallBlindPos = foundPositions[0]?.position;
    
    if (smallBlindPos) {
        for (let i = 1; i <= 10; i++) {
            let checkPosition = ((smallBlindPos + i) % 10) || 10;
            const playerAtPosition = document.querySelector(`.table-player-${checkPosition}`);
            
            if (playerAtPosition && !playerAtPosition.classList.contains('table-player-seat')) {
                // For big blind, only skip empty seats and waiting players
                if (playerAtPosition.classList.contains('in-next-hand') ||
                    playerAtPosition.querySelector('.waiting-for-game-message')) {
                    continue;
                }

                // Include even if player is away/sitting-out
                foundPositions.push({
                    position: checkPosition,
                    playerName: playerAtPosition.querySelector('.table-player-name a')?.textContent || ''
                });
                break;
            }
            checkedPositions++;
            if (checkedPositions >= 10) break;
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
    const playerElement = Array.from(document.querySelectorAll('.table-player-name a'))
        .find(link => link.textContent === playerName)
        ?.closest('.table-player');

    // Only check for away status if this is not a blind action
    const isBlindAction = action === 'bet' && currentStreet === 'Preflop';
    if (!isBlindAction && playerElement && (playerElement.classList.contains('away') || 
                         playerElement.classList.contains('sitting-out'))) {
        return;
    }

    if (foldedPlayers[playerName] && action === 'folded') {
        return;
    }

    const currentAction = `${action}${amount ? ` ${amount}` : ''}`;
    const actionKey = `${playerName}-${currentStreet}-${currentAction}`;
    
    if (action === 'folded') {
        foldedPlayers[playerName] = true;
    }

    // Special handling for blind posts
    if (action === 'bet' && currentStreet === 'Preflop') {
        const blinds = getBlinds();
        const blindPositions = getBlindPositions();
        
        if (blinds && blindPositions) {
            const amountValue = amount ? amount.replace('$', '').trim() : '';
            console.log('Checking blind action:', {
                playerName,
                amountValue,
                blinds,
                blindPositions
            });
            
            // Handle Small Blind
            if (playerName === blindPositions.smallBlind.playerName && 
                parseFloat(amountValue) === parseFloat(blinds.smallBlind)) {
                
                const blindAction = `Posted Small Blind ${amount}`;
                if (!playerActionHistory[actionKey]) {
                    console.log('Logging small blind for:', playerName);
                    createPlayerHUD(playerName);
                    updateHUDTitle(playerName, 'SMALL BLIND');
                    
                    const log = document.getElementById(`action-log-${playerName}`);
                    if (log) {
                        const actionItem = document.createElement('li');
                        actionItem.textContent = `[${currentStreet}] ${blindAction}`;
                        log.appendChild(actionItem);
                        
                        while (log.children.length >= 5) {
                            log.removeChild(log.firstChild);
                        }
                    }
                    
                    playerActionHistory[actionKey] = true;
                    playerLastActions[playerName] = blindAction;
                    playerBlindStatus[playerName] = 'SMALL BLIND';
                }
                return;
            }
            
            // Handle Big Blind
            if (playerName === blindPositions.bigBlind.playerName && 
                parseFloat(amountValue) === parseFloat(blinds.bigBlind)) {
                
                const blindAction = `Posted Big Blind ${amount}`;
                if (!playerActionHistory[actionKey]) {
                    console.log('Logging big blind for:', playerName);
                    createPlayerHUD(playerName);
                    updateHUDTitle(playerName, 'BIG BLIND');
                    
                    const log = document.getElementById(`action-log-${playerName}`);
                    if (log) {
                        const actionItem = document.createElement('li');
                        actionItem.textContent = `[${currentStreet}] ${blindAction}`;
                        log.appendChild(actionItem);
                        
                        while (log.children.length >= 5) {
                            log.removeChild(log.firstChild);
                        }
                    }
                    
                    playerActionHistory[actionKey] = true;
                    playerLastActions[playerName] = blindAction;
                    playerBlindStatus[playerName] = 'BIG BLIND';
                }
                return;
            }
        }
    }
    
    if (playerActionHistory[actionKey]) {
        return;
    }
    
    playerLastActions[playerName] = currentAction;
    playerActionHistory[actionKey] = true;
    
    createPlayerHUD(playerName);
    const log = document.getElementById(`action-log-${playerName}`);
    const actionItem = document.createElement('li');
    
    currentStreet = updateCurrentStreet();
    
    let actionText = '';
    if (action === 'check') {
        actionText = `[${currentStreet}] checks`;
    } else if (action === 'raised to') {
        actionText = `[${currentStreet}] raised to ${amount}`;
    } else {
        actionText = `[${currentStreet}] ${action}${amount ? ` ${amount}` : ''}`;
    }
    
    actionItem.textContent = actionText;
    
    while (log.children.length >= 5) {
        log.removeChild(log.firstChild);
    }
    
    log.appendChild(actionItem);
}

function clearPlayerHUDs() {
    // Remove all HUD elements
    document.querySelectorAll('[id^="hud-"]').forEach(hud => {
        const playerName = hud.querySelector('h4').textContent.split(' SMALL')[0];
        hud.querySelector('h4').textContent = playerName;
        hud.remove();
    });
    
    // Clear all tracking objects
    Object.keys(playerLastActions).forEach(key => delete playerLastActions[key]);
    Object.keys(playerBlindStatus).forEach(key => delete playerBlindStatus[key]);
    Object.keys(playerActionHistory).forEach(key => delete playerActionHistory[key]);
    Object.keys(foldedPlayers).forEach(key => delete foldedPlayers[key]);
    currentStreet = 'Preflop';
}

function setupActionObserver() {
    const tableElement = document.querySelector('.table');
    if (!tableElement) return;

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.classList.contains('table-cards')) {
                const newStreet = updateCurrentStreet();
                
                if ((currentStreet === 'River' && newStreet === 'Preflop') || 
                    mutation.target.children.length === 0) {
                    clearHUDData();
                }
                
                currentStreet = newStreet;
            }

            if (mutation.target.classList.contains('dealer-button-ctn')) {
                clearHUDData();
            }

            if (mutation.target.classList.contains('table-player')) {
                const playerElement = mutation.target;
                const playerNameElement = playerElement.querySelector('.table-player-name a');
                if (!playerNameElement) return;
                
                const playerName = playerNameElement.textContent;
                const betValueElement = playerElement.querySelector('.table-player-bet-value');
                
                // Check for blind posts first
                if (betValueElement && currentStreet === 'Preflop') {
                    const betAmount = betValueElement.textContent.trim();
                    if (betAmount && betAmount !== '0.00') {
                        logPlayerAction(playerName, 'bet', `$${betAmount}`);
                    }
                }

                if (playerElement.classList.contains('fold')) {
                    logPlayerAction(playerName, 'folded');
                }
                
                if (playerElement.classList.contains('check')) {
                    logPlayerAction(playerName, 'check');
                }
                
                if (betValueElement) {
                    const betAmount = betValueElement.textContent.trim();
                    if (betAmount && betAmount !== '0.00') {
                        const potElement = document.querySelector('.table-pot-size .normal-value');
                        const potAmount = potElement ? potElement.textContent.trim() : '0.00';
                        
                        if (potAmount === '0.00' && currentStreet !== 'Preflop') {
                            logPlayerAction(playerName, 'bet', `$${betAmount}`);
                        } else if (potAmount !== '0.00') {
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

function clearHUDData() {
    clearPlayerHUDs(); // Use existing clearPlayerHUDs function
    
    const hudElements = document.querySelectorAll('[id^="hud-"]');
    hudElements.forEach(element => {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    });
}

// detect the end of a hand
function onHandComplete() {
    clearHUDData();
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    setupActionObserver();
});

// Initialize when HUD is enabled via popup
setupActionObserver();