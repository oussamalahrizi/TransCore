
// how data should be 
let players = [
    { id: 1, name: 'Player 1', score: 0 },
    { id: 2, name: 'Player 2', score: 0 },
    { id: 3, name: 'Player 3', score: 0 },
    { id: 4, name: 'Player 4', score: 0 }
];

let tournamentState = {
    semifinal1Winner: null,
    semifinal2Winner: null,
    finalWinner: null,
    currentRound: 'semifinal',
    matchesCompleted: 0,
    isRunning: false
};



export default async () => {
    // DOM Elements
    const view = document.querySelectorAll('#tournament-body');
    const startMatchBtns = document.querySelectorAll('.start-match-btn');
    const semifinalMatchBtns = document.querySelectorAll('.semifinal .start-match-btn');
    const finalMatchBtn = document.querySelector('.final .start-match-btn');
    const winnerContainer = document.querySelector('.winner-container');
    const connectorLines = document.querySelectorAll('.connector-line');
    
    // Tournament auto-play settings
    const AUTO_PLAY = true;  // Set to true to enable automatic tournament play
    const MATCH_DELAY = 500; // Delay between matches in milliseconds
    
    // Initialize the tournament
    initTournament();
    
    function initTournament() {
        // Reset tournament state
        tournamentState = {
            semifinal1Winner: null,
            semifinal2Winner: null,
            finalWinner: null,
            currentRound: 'semifinal',
            matchesCompleted: 0,
            isRunning: false
        };
        
        // Reset player scores
        // players.forEach(player => {
        //     player.score = 0;
        // });
        
        // Update UI
        // updatePlayerDisplay();
        // resetMatchButtons();
        // hideWinnerDisplay();
        
        // Remove winner classes from all players
        document.querySelectorAll('.player.winner').forEach(player => {
            player.classList.remove('winner');
        });
        
        // Start tournament automatically if enabled
        if (AUTO_PLAY) {
            // Short delay before starting the tournament
            setTimeout(() => {
                startTournament();
            }, 1000);
        }
    }
    
    function updatePlayerDisplay() {
        // Update all player displays with current names and scores
        document.querySelectorAll('.player').forEach(playerElement => {
            const playerId = playerElement.getAttribute('data-player-id');
            
            if (playerId) {
                const player = players.find(p => p.id == playerId);
                if (player) {
                    playerElement.querySelector('.player-name').textContent = player.name;
                    playerElement.querySelector('.player-score').textContent = player.score;
                }
            }
        });
        
        // Update finals players based on semifinal winners
        const finalPlayers = document.querySelectorAll('.final .player');
        
        // If we have semifinal winners, update final players
        if (tournamentState.semifinal1Winner) {
            const winner1 = players.find(p => p.id == tournamentState.semifinal1Winner);
            finalPlayers[0].classList.remove('empty');
            finalPlayers[0].setAttribute('data-player-id', winner1.id);
            finalPlayers[0].querySelector('.player-name').textContent = winner1.name;
            finalPlayers[0].querySelector('.player-score').textContent = 0;
            
            // Add entrance animation
            finalPlayers[0].style.animation = 'slide-in 0.5s forwards';
        } else {
            finalPlayers[0].classList.add('empty');
            finalPlayers[0].removeAttribute('data-player-id');
            finalPlayers[0].querySelector('.player-name').textContent = 'TBD';
            finalPlayers[0].querySelector('.player-score').textContent = 0;
            finalPlayers[0].style.animation = 'none';
        }
        
        if (tournamentState.semifinal2Winner) {
            const winner2 = players.find(p => p.id == tournamentState.semifinal2Winner);
            finalPlayers[1].classList.remove('empty');
            finalPlayers[1].setAttribute('data-player-id', winner2.id);
            finalPlayers[1].querySelector('.player-name').textContent = winner2.name;
            finalPlayers[1].querySelector('.player-score').textContent = 0;
            
            // Add entrance animation
            finalPlayers[1].style.animation = 'slide-in 0.5s forwards';
        } else {
            finalPlayers[1].classList.add('empty');
            finalPlayers[1].removeAttribute('data-player-id');
            finalPlayers[1].querySelector('.player-name').textContent = 'TBD';
            finalPlayers[1].querySelector('.player-score').textContent = 0;
            finalPlayers[1].style.animation = 'none';
        }
    }
    
    function hideWinnerDisplay() {
        document.querySelector('.winner-display').classList.remove('show');
    }
    
    function showWinnerDisplay(winnerId) {
        const winner = players.find(p => p.id == winnerId);
        const winnerDisplay = document.querySelector('.winner-display');
        document.querySelector('.winner-name').textContent = winner.name;
        
        // Add show class to display the modal
        winnerDisplay.classList.add('show');
        
        // Add confetti effect
        addConfettiEffect();
    }
    
    // Start the tournament automatically
    function startTournament() {
        if (tournamentState.isRunning) return;
        
        tournamentState.isRunning = true;
        
        // Play semifinal 1
        const semifinal1Players = document.querySelectorAll('.semifinal .match-top .player');
        const player1Id = semifinal1Players[0].getAttribute('data-player-id');
        const player2Id = semifinal1Players[1].getAttribute('data-player-id');
        
        // Play semifinal 2
        const semifinal2Players = document.querySelectorAll('.semifinal .match-bottom .player');
        const player3Id = semifinal2Players[0].getAttribute('data-player-id');
        const player4Id = semifinal2Players[1].getAttribute('data-player-id');
        
        if (player1Id && player2Id) {
            // Disable the button
            semifinalMatchBtns[0].disabled = true;
            
            // Play first semifinal
            simulateMatch(player1Id, player2Id, 'semifinal1').then(winnerId => {
                // Highlight the winner
                semifinal1Players.forEach(player => {
                    if (player.getAttribute('data-player-id') == winnerId) {
                        player.classList.add('winner');
                    } else {
                        player.classList.remove('winner');
                    }
                });
                
                // Check if both semifinals are done and play finals if needed
                checkAndPlayFinals();
            });
        }
        
        if (player3Id && player4Id) {
            // Disable the button
            semifinalMatchBtns[1].disabled = true;
            
            // Play second semifinal simultaneously
            simulateMatch(player3Id, player4Id, 'semifinal2').then(winnerId => {
                // Highlight the winner
                semifinal2Players.forEach(player => {
                    if (player.getAttribute('data-player-id') == winnerId) {
                        player.classList.add('winner');
                    } else {
                        player.classList.remove('winner');
                    }
                });
                
                // Check if both semifinals are done and play finals if needed
                checkAndPlayFinals();
            });
        }
    }
    
    // Helper function to check if both semifinals are complete and play finals if needed
    function checkAndPlayFinals() {
        // If both semifinals are completed, play the final match
        if (AUTO_PLAY && tournamentState.semifinal1Winner && tournamentState.semifinal2Winner) {
            setTimeout(() => {
                playFinalMatch();
            }, MATCH_DELAY);
        }
    }
    
    // Play the final match automatically
    function playFinalMatch() {
        const finalPlayers = document.querySelectorAll('.final .match .player');
        const finalist1Id = finalPlayers[0].getAttribute('data-player-id');
        const finalist2Id = finalPlayers[1].getAttribute('data-player-id');
        
        if (finalist1Id && finalist2Id) {
            // Disable the button
            finalMatchBtn.disabled = true;
            
            // Play the final match
            simulateMatch(finalist1Id, finalist2Id, 'final').then(winnerId => {
                // Highlight the winner
                finalPlayers.forEach(player => {
                    if (player.getAttribute('data-player-id') == winnerId) {
                        player.classList.add('winner');
                    } else {
                        player.classList.remove('winner');
                    }
                });
                
                // Tournament complete
                tournamentState.isRunning = false;
            });
        }
    }
    
    // Simulate a match between two players
    function simulateMatch(player1Id, player2Id, matchType) {
        // Get player objects
        const player1 = players.find(p => p.id == player1Id);
        const player2 = players.find(p => p.id == player2Id);
        
        // Reset scores for this match
        player1.score = 0;
        player2.score = 0;
        
        // Simulate the match visually
        return new Promise(resolve => {
            // Start a visual simulation of the match
            let matchContainer;
            
            if (matchType === 'semifinal1') {
                matchContainer = document.querySelector('.semifinal .match-top .match-container');
            } else if (matchType === 'semifinal2') {
                matchContainer = document.querySelector('.semifinal .match-bottom .match-container');
            } else if (matchType === 'final') {
                matchContainer = document.querySelector('.final .match .match-container');
            }
            
            if (matchContainer) {
                matchContainer.style.animation = 'pulse-match 1s';
            }
            
            // Get the player elements to update their scores
            let playerElements;
            
            if (matchType === 'semifinal1') {
                playerElements = document.querySelectorAll('.semifinal .match-top .player');
            } else if (matchType === 'semifinal2') {
                playerElements = document.querySelectorAll('.semifinal .match-bottom .player');
            } else if (matchType === 'final') {
                playerElements = document.querySelectorAll('.final .match .player');
            }
            
            // Continue simulation until one player reaches 5 points
            let simulationInterval = setInterval(() => {
                // Randomly decide which player scores a point
                const scoringPlayer = Math.random() > 0.5 ? player1 : player2;
                scoringPlayer.score += 1;
                
                // Update the display
                if (playerElements && playerElements.length >= 2) {
                    playerElements[0].querySelector('.player-score').textContent = player1.score;
                    playerElements[1].querySelector('.player-score').textContent = player2.score;
                }
                
                // Check if a player has reached 5 points
                if (player1.score === 5 || player2.score === 5) {
                    clearInterval(simulationInterval);
                    
                    // Determine winner (first to reach 5 points)
                    const winnerId = player1.score === 5 ? player1.id : player2.id;
                    
                    // Update tournament state based on which match this is
                    if (matchType === 'semifinal1') {
                        tournamentState.semifinal1Winner = winnerId;
                        // Animate top connector line
                        animateConnectorLine('top');
                    } else if (matchType === 'semifinal2') {
                        tournamentState.semifinal2Winner = winnerId;
                        // Animate bottom connector line
                        animateConnectorLine('bottom');
                    } else if (matchType === 'final') {
                        tournamentState.finalWinner = winnerId;
                        // Show winner display for the tournament champion
                        setTimeout(() => {
                            showWinnerDisplay(winnerId);
                        }, 1000);
                        
                        // Animate the winner display connection
                        const winnerConnection = document.querySelector('.winner-display');
                        if (winnerConnection) {
                            winnerConnection.style.boxShadow = '0 0 10px #029F5B';
                        }
                    }
                    
                    tournamentState.matchesCompleted++;
                    
                    // Update UI
                    updatePlayerDisplay();
                    
                    // If both semifinals are completed, enable the finals and animate middle connector
                    if (tournamentState.semifinal1Winner && tournamentState.semifinal2Winner) {
                        finalMatchBtn.disabled = false;
                        // Animate middle connector after a short delay
                        setTimeout(() => {
                            animateConnectorLine('middle');
                        }, 300);
                    }
                    
                    resolve(winnerId);
                }
            }, 600); // Slightly slower pace for more dramatic scoring
        });
    }
    
    function animateConnectorLine(position) {
        const line = document.querySelector(`.connector-line.${position}`);
        if (line) {
            line.style.boxShadow = '0 0 10px #029F5B';
            line.style.animation = 'pulse-line 2s infinite';
            
            // Enhance the glow effect with an overlay
            const glow = document.createElement('div');
            glow.className = 'connector-glow';
            glow.style.cssText = `
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
                background: radial-gradient(ellipse at center, rgba(2, 159, 91, 0.5) 0%, rgba(2, 159, 91, 0) 70%);
                opacity: 0;
                animation: fade-in 0.5s forwards, pulse-opacity 2s infinite 0.5s;
                pointer-events: none;
            `;
            
            line.appendChild(glow);
        }
    }
    
    // Add confetti effect for the winner
    function addConfettiEffect() {
        // Create confetti container
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        confettiContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(confettiContainer);
        
        // Create 50 confetti particles
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            const color = i % 2 === 0 ? '#029F5B' : '#04c06e';
            
            confetti.style.cssText = `
                position: absolute;
                width: ${Math.random() * 10 + 5}px;
                height: ${Math.random() * 10 + 5}px;
                background-color: ${color};
                top: -10px;
                left: ${Math.random() * 100}vw;
                opacity: ${Math.random() * 0.7 + 0.3};
                animation: confetti-fall ${Math.random() * 3 + 2}s linear forwards;
                transform: rotate(${Math.random() * 360}deg);
            `;
            
            confettiContainer.appendChild(confetti);
        }
        
        // Remove confetti after 5 seconds
        setTimeout(() => {
            confettiContainer.remove();
        }, 5000);
    }

    // Event listeners for match buttons - semifinal matches (keeping for manual play option)
    semifinalMatchBtns.forEach((btn, index) => {
        btn.addEventListener('click', async () => {
            if (tournamentState.isRunning) return;
            
            const matchContainer = btn.closest('.match-container');
            const players = matchContainer.querySelectorAll('.player');
            const player1Id = players[0].getAttribute('data-player-id');
            const player2Id = players[1].getAttribute('data-player-id');
            
            if (player1Id && player2Id) {
                // Disable this button
                btn.disabled = true;
                
                // Determine which semifinal this is
                const matchType = index === 0 ? 'semifinal1' : 'semifinal2';
                
                // Simulate the match
                const winnerId = await simulateMatch(player1Id, player2Id, matchType);
                
                // Highlight the winner
                players.forEach(player => {
                    if (player.getAttribute('data-player-id') == winnerId) {
                        player.classList.add('winner');
                    } else {
                        player.classList.remove('winner');
                    }
                });
                
                // If both semifinals are completed, automatically play the final match
                if (AUTO_PLAY && tournamentState.semifinal1Winner && tournamentState.semifinal2Winner) {
                    setTimeout(() => {
                        playFinalMatch();
                    }, MATCH_DELAY);
                }
            }
        });
    });
    
    // Close winner modal when clicking the close button
    const closeWinnerBtn = document.querySelector('.close-winner-btn');
    if (closeWinnerBtn) {
        closeWinnerBtn.addEventListener('click', hideWinnerDisplay);
    }
    
    // Allow clicking outside to close the modal
    const winnerDisplay = document.querySelector('.winner-display');
    if (winnerDisplay) {
        winnerDisplay.addEventListener('click', (e) => {
            if (e.target === winnerDisplay) {
                hideWinnerDisplay();
            }
        });
    }
}; 