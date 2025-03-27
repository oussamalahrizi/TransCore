
export default /*html*/ `
    <div class="tournament-body">
        <div id="tr_view" class="tournament-container">
                <h1 class="tournament-title">Ultimate Ping Pang Worlds 2025<br><span class="tournament-title">TOURNAMENT</span></h1>
                <div class="tournament-bracket">
                    <!-- Round 1 - Semifinals -->
                    <div  class="round semifinal">
                        <h2 class="round-title">Semifinals</h2>
                        
                        <div id="semifinal1" class="match match-top">
                            <div class="match-container">
                                <div class="player" data-player-id="1">
                                    <span id="player1" class="player-name">Player 1</span>
                                    <span id='player1-score' class="player-score">0</span>
                                </div>
                                <div class="player" data-player-id="2">
                                    <span id="player2" class="player-name">Player 2</span>
                                    <span id='player2-score' class="player-score">0</span>
                                </div>
                            </div>
                        </div>
                        
                        <div id="semifinal2" class="match match-bottom">
                            <div class="match-container">
                                <div  class="player" data-player-id="3">
                                    <span id="player3" class="player-name">Player 3</span>
                                    <span id='player3-score' class="player-score">0</span>
                                </div>
                                <div class="player" data-player-id="4">
                                    <span id="player4" class="player-name">Player 4</span>
                                    <span id='player4-score' class="player-score">0</span>
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
                                    <span id='winner1-score' class="player-score">0</span>
                                </div>
                                <div  class="player empty">
                                    <span id="winner2" class="player-name">TBD</span>
                                    <span id='winner2-score' class="player-score">0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            
        </div>
    </div>
`
