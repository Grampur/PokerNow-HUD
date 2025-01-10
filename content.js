// content.js

// Run when the page loads or updates
document.addEventListener('DOMContentLoaded', () => {
  initHUD();
});

// Function to initialize the HUD and inject boxes
function initHUD() {
  const tablePlayers = document.querySelectorAll('.player');  // Adjust selector as per PokerNow layout
  const hudContainer = createHUDContainer();

  tablePlayers.forEach((player, index) => {
    const playerBox = createPlayerBox(index);  // Create an individual box for each player
    hudContainer.appendChild(playerBox);
  });

  document.body.appendChild(hudContainer);
}

// Function to create a container for all the HUD boxes
function createHUDContainer() {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '0';  // Adjust positioning as needed
  container.style.left = '0';
  container.style.zIndex = '9999';
  return container;
}

// Function to create an individual player box
function createPlayerBox(playerIndex) {
  const box = document.createElement('div');
  box.classList.add('player-box');
  box.style.width = '120px';
  box.style.height = '80px';
  box.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  box.style.color = '#fff';
  box.style.position = 'absolute';
  box.style.top = `${playerIndex * 100}px`;  // Example for placement, adjust as needed
  box.style.left = `${playerIndex * 150}px`;  // Example for placement, adjust as needed
  box.innerText = `Player ${playerIndex + 1}\nVPIP: 0%\nPFR: 0%`; // Placeholder text

  return box;
}

// Function to fetch stats for the player (replace with actual data-fetching logic)
function fetchPlayerStats(playerIndex) {
  // Mock data for demonstration purposes
  return {
    vpip: Math.floor(Math.random() * 100),  // Random VPIP for example
    pfr: Math.floor(Math.random() * 100),   // Random PFR for example
    aggressionFactor: Math.random().toFixed(2)  // Random aggression factor for example
  };
}

// Update the player box with real stats
function updatePlayerBox(playerBox, playerIndex) {
  const stats = fetchPlayerStats(playerIndex);
  playerBox.innerText = `Player ${playerIndex + 1}\nVPIP: ${stats.vpip}%\nPFR: ${stats.pfr}%\nAF: ${stats.aggressionFactor}`;
}

