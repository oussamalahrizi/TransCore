
export default /*html*/ `
    <div class="tournament-body">
        <div class="tournament-container">
                <h1 class="tournament-title">Ultimate Ping Pang Worlds 2025<br><span class="tournament-title">TOURNAMENT</span></h1>
                <div class="tournament-bracket">
                    <!-- Round 1 - Semifinals -->
                    <div  class="round semifinal">
                        <h2 class="round-title">Semifinals</h2>
                        
                        <div id="semifinal1" class="match match-top">
                            <div class="match-container">
                                <div class="player" data-player-id="1">
                                    <span id="player1" class="player-name">Player 1</span>
                                    <span class="player-score">0</span>
                                </div>
                                <div id="player2" class="player" data-player-id="2">
                                    <span class="player-name">Player 2</span>
                                    <span class="player-score">0</span>
                                </div>
                            </div>
                        </div>
                        
                        <div id="semifinal2" class="match match-bottom">
                            <div class="match-container">
                                <div id="player3" class="player" data-player-id="3">
                                    <span class="player-name">Player 3</span>
                                    <span class="player-score">0</span>
                                </div>
                                <div id="player4" class="player" data-player-id="4">
                                    <span class="player-name">Player 4</span>
                                    <span class="player-score">0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="final" class="round final">
                        <h2 class="round-title">Finals</h2>
                        
                        <div class="match">
                            <div class="match-container">
                                <div class="player empty">
                                    <span id="winner1" class="player-name">TBD</span>
                                    <span class="player-score">0</span>
                                </div>
                                <div id="winner2" class="player empty">
                                    <span class="player-name">TBD</span>
                                    <span class="player-score">0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="winner-modal" class="winner-display">
                <div class="winner-container">
                    <div class="trophy-icon">🏆</div>
                    <div id="final-winner" class="winner-name">TBD</div>
                    <div class="winner-label">Tournament Champion</div>
                    <button id="close-winner" class="close-winner-btn">Close</button>
                </div>
            </div>
        </div>
    </div>
`
