
export default /*html*/ `
    <div class="tournament-body">
        <div class="tournament-container">
                <h1 class="tournament-title">Ultimate Ping Pang Worlds 2025<br><span class="tournament-title">TOURNAMENT</span></h1>
                
                <div class="tournament-bracket">
                    <!-- Round 1 - Semifinals -->
                    <div class="round semifinal">
                        <h2 class="round-title">Semifinals</h2>
                        
                        <div class="match match-top">
                            <div class="match-container">
                                <div class="player" data-player-id="1">
                                    <span class="player-name">Player 1</span>
                                    <span class="player-score">0</span>
                                </div>
                                <div class="player" data-player-id="2">
                                    <span class="player-name">Player 2</span>
                                    <span class="player-score">0</span>
                                </div>
                                <button class="start-match-btn">Start Match</button>
                            </div>
                        </div>
                        
                        <div class="match match-bottom">
                            <div class="match-container">
                                <div class="player" data-player-id="3">
                                    <span class="player-name">Player 3</span>
                                    <span class="player-score">0</span>
                                </div>
                                <div class="player" data-player-id="4">
                                    <span class="player-name">Player 4</span>
                                    <span class="player-score">0</span>
                                </div>
                                <button class="start-match-btn">Start Match</button>
                            </div>
                        </div>
                    </div>
                    <div class="round final">
                        <h2 class="round-title">Finals</h2>
                        
                        <div class="match">
                            <div class="match-container">
                                <div class="player empty">
                                    <span class="player-name">TBD</span>
                                    <span class="player-score">0</span>
                                </div>
                                <div class="player empty">
                                    <span class="player-name">TBD</span>
                                    <span class="player-score">0</span>
                                </div>
                                <button class="start-match-btn" disabled>Start Match</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="winner-display">
                <div class="winner-container">
                    <div class="trophy-icon">🏆</div>
                    <div class="winner-name">TBD</div>
                    <div class="winner-label">Tournament Champion</div>
                    <button class="close-winner-btn">Close</button>
                </div>
            </div>
        </div>
    </div>
`
