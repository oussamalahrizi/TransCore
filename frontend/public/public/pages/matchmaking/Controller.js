import View from "./View.js";

let matchmakingActive = false;
let matchmakingTimeout = null;
let invitationActive = false;
let invitationTimeout = null;
let opponentReady = false; // Is opponent ready to play
let userReady = false; // Is user ready to play
let opponentReadyTimeout = null; // Timeout for simulating opponent ready state
let autoStartTimeout = null; // Timeout for auto-starting the match

const mockUserData = {
    username: "Player1",
    avatar: "/public/assets/dog.png",
    wins: 15,
    losses: 7,
    rating: 1250
};

const possibleOpponents = [
    {
        username: "GrandMaster42",
        avatar: "/public/assets/dog.png",
        wins: 42,
        losses: 3,
        rating: 2100
    },
    {
        username: "PingPongKing",
        avatar: "/public/assets/dog.png",
        wins: 25,
        losses: 12,
        rating: 1450
    },
    {
        username: "Paddleman",
        avatar: "/public/assets/dog.png",
        wins: 18,
        losses: 15,
        rating: 1200
    },
    {
        username: "TableTennisLegend",
        avatar: "/public/assets/dog.png",
        wins: 32,
        losses: 5,
        rating: 1800
    }
];

const mockFriends = [
    {
        id: 1,
        username: "BestFriend42",
        avatar: "/public/assets/dog.png",
        status: "online"
    },
    {
        id: 2,
        username: "GamingBuddy",
        avatar: "/public/assets/dog.png",
        status: "online"
    },
    {
        id: 3,
        username: "PongMaster",
        avatar: "/public/assets/dog.png",
        status: "online"
    },
    {
        id: 4,
        username: "TableTennisChamp",
        avatar: "/public/assets/dog.png",
        status: "offline"
    },
    {
        id: 5,
        username: "CasualGamer",
        avatar: "/public/assets/dog.png",
        status: "in-game"
    }
];

const updateUserInfo = (userData) => {
    document.getElementById("user-name").textContent = userData.username;
    document.getElementById("user-avatar").src = userData.avatar;
    document.getElementById("user-wins").textContent = userData.wins;
    document.getElementById("user-losses").textContent = userData.losses;
    document.getElementById("user-rating").textContent = userData.rating;
};

const updateOpponentInfo = (opponentData) => {
    document.getElementById("opponent-name").textContent = opponentData.username;
    document.getElementById("opponent-avatar").src = opponentData.avatar;
    document.getElementById("opponent-wins").textContent = opponentData.wins;
    document.getElementById("opponent-losses").textContent = opponentData.losses;
    document.getElementById("opponent-rating").textContent = opponentData.rating;
    
    // Show the opponent's online status circle
    const opponentOnlineStatus = document.querySelector(".opponent-online-status");
    opponentOnlineStatus.style.display = "block";
    
    const opponentStatus = document.querySelector(".opponent-card .player-status");
    opponentStatus.textContent = "Ready";
    opponentStatus.classList.remove("searching");
    
    // Show the kick button
    document.getElementById("kick-opponent").style.display = "block";
    
    // Set opponent as present (but not ready yet)
    opponentReady = false;
    document.getElementById("opponent-ready-indicator").classList.remove("active");
    
    // Switch buttons to show Ready toggle instead of Start Matchmaking
    updateMatchButtons();
};

const resetOpponentInfo = () => {
    document.getElementById("opponent-name").textContent = "Waiting for opponent...";
    document.getElementById("opponent-avatar").src = "/public/assets/dog.png";
    document.getElementById("opponent-wins").textContent = "-";
    document.getElementById("opponent-losses").textContent = "-";
    document.getElementById("opponent-rating").textContent = "-";
    
    // Hide the opponent's online status circle
    const opponentOnlineStatus = document.querySelector(".opponent-online-status");
    opponentOnlineStatus.style.display = "none";
    
    // Hide the kick button
    document.getElementById("kick-opponent").style.display = "none";
    
    const opponentStatus = document.querySelector(".opponent-card .player-status");
    opponentStatus.textContent = "Waiting...";
    opponentStatus.classList.remove("searching");
    
    // Reset opponent ready state
    opponentReady = false;
    document.getElementById("opponent-ready-indicator").classList.remove("active");
    
    // Reset user ready state as well
    setUserReady(false);
    
    // Update buttons to show Start Matchmaking
    updateMatchButtons();
    
    // Clear any pending timeouts
    if (opponentReadyTimeout) {
        clearTimeout(opponentReadyTimeout);
        opponentReadyTimeout = null;
    }
    
    if (autoStartTimeout) {
        clearTimeout(autoStartTimeout);
        autoStartTimeout = null;
    }
};

// Update buttons based on the current matchmaking state
const updateMatchButtons = () => {
    const startMatchmakingBtn = document.getElementById("start-matchmaking");
    const toggleReadyBtn = document.getElementById("toggle-ready");
    const cancelBtn = document.getElementById("cancel-matchmaking");
    const inviteBtn = document.getElementById("invite-friend");
    
    if (matchmakingActive) {
        // During matchmaking, show cancel button
        startMatchmakingBtn.style.display = "none";
        toggleReadyBtn.style.display = "none";
        cancelBtn.style.display = "block";
        inviteBtn.style.display = "none";
    } else if (document.getElementById("opponent-name").textContent !== "Waiting for opponent...") {
        // When opponent is present, show Ready toggle button
        startMatchmakingBtn.style.display = "none";
        toggleReadyBtn.style.display = "block";
        cancelBtn.style.display = "none";
        inviteBtn.style.display = "block";
        
        // Update Ready button text based on state
        toggleReadyBtn.textContent = userReady ? "Cancel Ready" : "Ready";
        toggleReadyBtn.classList.toggle("ready-active", userReady);
    } else {
        // Default state
        startMatchmakingBtn.style.display = "block";
        toggleReadyBtn.style.display = "none";
        cancelBtn.style.display = "none";
        inviteBtn.style.display = "block";
    }
};

const startMatchmaking = () => {
    if (matchmakingActive) return;
    
    matchmakingActive = true;
    updateMatchButtons();
    
    const statusText = document.querySelector(".status-text");
    statusText.textContent = "Finding opponent...";
    statusText.classList.add("searching");
    
    resetOpponentInfo();
    
    // Simulate matchmaking with a delay
    const randomTime = Math.floor(Math.random() * 3000) + 2000; // 2-5 seconds
    matchmakingTimeout = setTimeout(() => {
        // Choose a random opponent
        const randomOpponent = possibleOpponents[Math.floor(Math.random() * possibleOpponents.length)];
        
        updateOpponentInfo(randomOpponent);
        
        statusText.textContent = "Opponent found!";
        statusText.classList.remove("searching");
        statusText.classList.add("matched");
        
        setTimeout(() => {
            statusText.textContent = "Click Ready when you're prepared to play";
            statusText.classList.remove("matched");
        }, 2000);
        
        // Stop the matchmaking process
        matchmakingActive = false;
        updateMatchButtons();
    }, randomTime);
};

const stopMatchmaking = () => {
    if (!matchmakingActive) return;
    
    matchmakingActive = false;
    
    if (matchmakingTimeout) {
        clearTimeout(matchmakingTimeout);
        matchmakingTimeout = null;
    }
    
    updateMatchButtons();
    
    const statusText = document.querySelector(".status-text");
    statusText.textContent = "Ready to play";
    statusText.classList.remove("searching");
    statusText.classList.remove("matched");
    
    resetOpponentInfo();
};

// Set user ready state and update UI
const setUserReady = (isReady) => {
    userReady = isReady;
    
    // Update visual indicator
    document.getElementById("user-ready-indicator").classList.toggle("active", isReady);
    
    // Update button text
    const toggleReadyBtn = document.getElementById("toggle-ready");
    toggleReadyBtn.textContent = isReady ? "Cancel Ready" : "Ready";
    toggleReadyBtn.classList.toggle("ready-active", isReady);
    
    // Check if both players are ready
    checkBothPlayersReady();
};

// Set opponent ready state and update UI
const setOpponentReady = (isReady) => {
    opponentReady = isReady;
    
    // Update visual indicator
    document.getElementById("opponent-ready-indicator").classList.toggle("active", isReady);
    
    // Check if both players are ready
    checkBothPlayersReady();
};

// Toggle user ready state
const toggleReady = () => {
    setUserReady(!userReady);
    
    // Toggle the ready-active class based on the new state
    const toggleReadyBtn = document.getElementById("toggle-ready");
    toggleReadyBtn.classList.toggle("ready-active", userReady);
    
    // If user becomes ready, simulate opponent getting ready after a delay
    if (userReady && !opponentReady && !opponentReadyTimeout) {
        const randomDelay = Math.floor(Math.random() * 4000) + 2000; // 2-6 seconds
        opponentReadyTimeout = setTimeout(() => {
            setOpponentReady(true);
            opponentReadyTimeout = null;
        }, randomDelay);
    }
    
    // If user cancels ready, cancel opponent simulation
    if (!userReady && opponentReadyTimeout) {
        clearTimeout(opponentReadyTimeout);
        opponentReadyTimeout = null;
    }
};

// Check if both players are ready, and if so, start the match
const checkBothPlayersReady = () => {
    if (userReady && opponentReady) {
        const statusText = document.querySelector(".status-text");
        statusText.textContent = "Both players ready! Starting game...";
        statusText.classList.add("matched");
        
        // Disable buttons during match start
        document.getElementById("toggle-ready").disabled = true;
        document.getElementById("invite-friend").disabled = true;
        document.getElementById("kick-opponent").disabled = true;
        
        // Auto-start the match after a delay
        autoStartTimeout = setTimeout(() => {
            startMatch();
        }, 2000);
    }
};

// Start the match when both players are ready
const startMatch = () => {
    const statusText = document.querySelector(".status-text");
    statusText.textContent = "Game in progress...";
    
    // Simulate a game lasting a few seconds
    setTimeout(() => {
        statusText.textContent = "Game completed!";
        
        // Reset ready states but keep opponent
        setUserReady(false);
        setOpponentReady(false);
        
        // Re-enable buttons
        document.getElementById("toggle-ready").disabled = false;
        document.getElementById("invite-friend").disabled = false;
        document.getElementById("kick-opponent").disabled = false;
        
        setTimeout(() => {
            statusText.textContent = "Ready for another match?";
        }, 2000);
    }, 3000);
};

// Add a kickOpponent function
const kickOpponent = () => {
    const statusText = document.querySelector(".status-text");
    statusText.textContent = "Opponent kicked";
    
    // Reset the opponent info
    resetOpponentInfo();
    
    // Ensure all buttons are properly enabled
    document.getElementById("start-matchmaking").disabled = false;
    document.getElementById("invite-friend").disabled = false;
    
    // Reset after a brief delay
    setTimeout(() => {
        statusText.textContent = "Ready to play";
    }, 2000);
};

// New implementations for invite functionality
const showInviteOverlay = () => {
    console.log("Showing invite overlay");
    const overlay = document.getElementById("invite-overlay");
    if (!overlay) {
        console.error("Invite overlay not found");
        return;
    }
    
    // Display the overlay
    overlay.classList.add("active");
    
    // Populate friends list
    const friendsList = document.getElementById("friends-list");
    if (!friendsList) {
        console.error("Friends list not found");
        return;
    }
    
    friendsList.innerHTML = "";
    
    mockFriends.forEach(friend => {
        const friendElement = document.createElement("div");
        friendElement.className = `friend-item ${friend.status}`;
        friendElement.innerHTML = `
            <div class="friend-item-avatar">
                <img src="${friend.avatar}" alt="${friend.username}">
                <span class="friend-status-dot ${friend.status}"></span>
            </div>
            <div class="friend-item-info">
                <span class="friend-item-name">${friend.username}</span>
                <span class="friend-item-status">${friend.status}</span>
            </div>
            <button class="invite-btn" data-username="${friend.username}">Invite</button>
        `;
        friendsList.appendChild(friendElement);
    });
    
    // Add event listeners to invite buttons
    document.querySelectorAll(".invite-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const username = btn.getAttribute("data-username");
            sendInvitation(mockFriends.find(f => f.username === username));
        });
    });
};

const hideInviteOverlay = () => {
    console.log("Hiding invite overlay");
    const overlay = document.getElementById("invite-overlay");
    if (overlay) {
        overlay.classList.remove("active");
    }
};

const showWaitingOverlay = (friend) => {
    console.log("Showing waiting overlay for", friend.username);
    const overlay = document.getElementById("waiting-overlay");
    if (!overlay) {
        console.error("Waiting overlay not found");
        return;
    }
    
    document.getElementById("invited-friend-name").textContent = friend.username;
    overlay.classList.add("active");
};

const hideWaitingOverlay = () => {
    console.log("Hiding waiting overlay");
    const overlay = document.getElementById("waiting-overlay");
    if (overlay) {
        overlay.classList.remove("active");
    }
};

const sendInvitation = (friend) => {
    console.log("Sending invitation to", friend.username);
    
    // Hide invite overlay
    hideInviteOverlay();
    
    // Show waiting overlay
    showWaitingOverlay(friend);
    
    invitationActive = true;
    
    // Disable buttons
    document.getElementById("start-matchmaking").disabled = true;
    document.getElementById("invite-friend").disabled = true;
    
    // Simulate friend response
    const responseTime = Math.floor(Math.random() * 4000) + 2000; // 2-6 seconds
    invitationTimeout = setTimeout(() => {
        // 70% chance to accept
        const accepted = Math.random() < 0.7;
        
        if (accepted) {
            console.log("Friend accepted invitation");
            // Hide waiting overlay
            hideWaitingOverlay();
            
            // Update the status text
            const statusText = document.querySelector(".status-text");
            statusText.textContent = "Friend accepted! Get ready to play";
            statusText.classList.add("matched");
            
            setTimeout(() => {
                statusText.classList.remove("matched");
                statusText.textContent = "Click Ready when you're prepared to play";
            }, 2000);
            
            // Update opponent info with friend data
            const opponentData = {
                username: friend.username,
                avatar: friend.avatar,
                wins: Math.floor(Math.random() * 30),
                losses: Math.floor(Math.random() * 15),
                rating: 1000 + Math.floor(Math.random() * 500)
            };
            updateOpponentInfo(opponentData);
            
            // Re-enable buttons
            document.getElementById("invite-friend").disabled = false;
            invitationActive = false;
        } else {
            console.log("Friend declined invitation");
            // Hide waiting overlay
            hideWaitingOverlay();
            
            // Update status
            const statusText = document.querySelector(".status-text");
            statusText.textContent = "Invitation declined";
            
            // Re-enable buttons
            document.getElementById("start-matchmaking").disabled = false;
            document.getElementById("invite-friend").disabled = false;
            invitationActive = false;
            
            // Reset after delay
            setTimeout(() => {
                statusText.textContent = "Ready to play";
            }, 2000);
        }
    }, responseTime);
};

const cancelInvitation = () => {
    console.log("Cancelling invitation");
    if (!invitationActive) return;
    
    invitationActive = false;
    
    if (invitationTimeout) {
        clearTimeout(invitationTimeout);
        invitationTimeout = null;
    }
    
    // Hide waiting overlay
    hideWaitingOverlay();
    
    // Update status
    const statusText = document.querySelector(".status-text");
    statusText.textContent = "Invitation cancelled";
    
    // Re-enable buttons
    document.getElementById("start-matchmaking").disabled = false;
    document.getElementById("invite-friend").disabled = false;
    
    // Reset after delay
    setTimeout(() => {
        statusText.textContent = "Ready to play";
    }, 2000);
};

export default () => {
    console.log("Initializing matchmaking page");
    
    // Try to find an appropriate container
    const container = document.getElementById("app") || 
                     document.getElementById("root") ||
                     document.querySelector(".root-class") ||
                     document.body;
    
    // Create a dedicated container for matchmaking
    const matchmakingDiv = document.createElement("div");
    matchmakingDiv.id = "matchmaking";
    container.appendChild(matchmakingDiv);
    
    // Set the view HTML
    matchmakingDiv.innerHTML = View;
    
    console.log("View rendered");
    
    // Load and display user data
    updateUserInfo(mockUserData);
    
    // Hide ready indicators initially
    document.getElementById("user-ready-indicator").classList.remove("active");
    document.getElementById("opponent-ready-indicator").classList.remove("active");
    
    // Set up event handlers for matchmaking
    const startButton = document.getElementById("start-matchmaking");
    if (startButton) {
        startButton.addEventListener("click", startMatchmaking);
    } else {
        console.error("Start matchmaking button not found");
    }
    
    const cancelButton = document.getElementById("cancel-matchmaking");
    if (cancelButton) {
        cancelButton.addEventListener("click", stopMatchmaking);
    } else {
        console.error("Cancel matchmaking button not found");
    }
    
    // Set up Ready button
    const toggleReadyButton = document.getElementById("toggle-ready");
    if (toggleReadyButton) {
        toggleReadyButton.addEventListener("click", toggleReady);
    } else {
        console.error("Toggle ready button not found");
    }
    
    // Set up kick button
    const kickButton = document.getElementById("kick-opponent");
    if (kickButton) {
        kickButton.addEventListener("click", kickOpponent);
    } else {
        console.error("Kick button not found");
    }
    
    // Set up invite functionality
    const inviteButton = document.getElementById("invite-friend");
    if (inviteButton) {
        console.log("Adding event listener to invite button");
        inviteButton.addEventListener("click", () => {
            console.log("Invite button clicked");
            showInviteOverlay();
        });
    } else {
        console.error("Invite friend button not found");
    }
    
    const closeInviteButton = document.getElementById("close-invite-panel");
    if (closeInviteButton) {
        closeInviteButton.addEventListener("click", hideInviteOverlay);
    } else {
        console.error("Close invite panel button not found");
    }
    
    const cancelInviteButton = document.getElementById("cancel-invitation");
    if (cancelInviteButton) {
        cancelInviteButton.addEventListener("click", cancelInvitation);
    } else {
        console.error("Cancel invitation button not found");
    }
    
    // Set up search functionality
    const searchInput = document.getElementById("friend-search-input");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const searchTerm = searchInput.value.toLowerCase();
            const friendItems = document.querySelectorAll(".friend-item");
            
            friendItems.forEach(item => {
                const friendName = item.querySelector(".friend-item-name").textContent.toLowerCase();
                if (friendName.includes(searchTerm)) {
                    item.style.display = "flex";
                } else {
                    item.style.display = "none";
                }
            });
        });
    }
    
    // Set up click outside to close overlay
    document.addEventListener("click", (event) => {
        const inviteOverlay = document.getElementById("invite-overlay");
        if (inviteOverlay && inviteOverlay.classList.contains("active")) {
            const invitePanel = document.querySelector(".invite-friend-panel");
            if (invitePanel && !invitePanel.contains(event.target) && event.target !== inviteButton) {
                hideInviteOverlay();
            }
        }
    });
    
    console.log("Matchmaking setup complete");
    
    // Clean up function
    return () => {
        console.log("Cleaning up matchmaking");
        if (matchmakingTimeout) {
            clearTimeout(matchmakingTimeout);
        }
        if (invitationTimeout) {
            clearTimeout(invitationTimeout);
        }
        if (opponentReadyTimeout) {
            clearTimeout(opponentReadyTimeout);
        }
        if (autoStartTimeout) {
            clearTimeout(autoStartTimeout);
        }
        
        // Remove container
        if (matchmakingDiv && matchmakingDiv.parentNode) {
            matchmakingDiv.parentNode.removeChild(matchmakingDiv);
        }
    };
};
