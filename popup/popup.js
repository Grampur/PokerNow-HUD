// popup.js

// This will track whether the HUD is enabled or disabled
let hudEnabled = false;

// Event listener for the "Enable HUD" button
document.getElementById("enable-hud").addEventListener("click", function() {
  // Toggle the HUD state
  hudEnabled = !hudEnabled;

  // Update the button text based on the HUD state
  updateButtonText();

  // Send a message to content.js to enable or disable the HUD
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: toggleHUD,
      args: [hudEnabled]  // Pass the current HUD state (enabled/disabled)
    });
  });
});

// Function to update the button text
function updateButtonText() {
  const button = document.getElementById("enable-hud");
  if (hudEnabled) {
    button.innerText = "Disable HUD";
  } else {
    button.innerText = "Enable HUD";
  }
}

// Function that enables or disables the HUD (called in content.js)
function toggleHUD(enabled) {
  // Check the current state and toggle accordingly
  if (enabled) {
    // Add the HUD to the page
    enableHUD();
  } else {
    // Remove the HUD from the page
    disableHUD();
  }
}

// Function to enable the HUD on the page
function enableHUD() {
  console.log("Enabling HUD...");
  // Here, you can include the logic to inject your HUD elements, such as creating the boxes, tracking stats, etc.
  // For example, this could trigger a flag or a script to start displaying the HUD.

  // You could add a class or show the HUD element (if you created a div container for the HUD).
  const hudContainer = document.getElementById('hud-container');
  if (!hudContainer) {
    const newHudContainer = document.createElement('div');
    newHudContainer.id = 'hud-container';
    document.body.appendChild(newHudContainer);
    // Here you would populate the container with player stats boxes.
  }
}

// Function to disable the HUD on the page
function disableHUD() {
  console.log("Disabling HUD...");
  // Remove the HUD from the page
  const hudContainer = document.getElementById('hud-container');
  if (hudContainer) {
    document.body.removeChild(hudContainer);
  }
}
