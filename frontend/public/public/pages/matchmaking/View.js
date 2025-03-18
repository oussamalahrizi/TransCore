export default /*html*/`
<link rel="stylesheet" href="/public/styles/matchmaking.css">
<div class="matchmaking-container">
    <div class="matchmaking-header">
        <h1>Matchmaking</h1>
        <p class="status-text">Ready to play</p>
    </div>
    
    <div class="players-container">
        <div class="player-card user-card">
            <div class="player-avatar">
                <img src="/public/assets/dog.png" id="user-avatar" alt="Your Avatar">
                <div class="online-status"></div>
            </div>
            <div class="player-info">
                <h2 id="user-name">Your Username</h2>
                <div class="player-stats">
                    <div class="stat-item">
                        <span class="stat-label">Wins:</span>
                        <span class="stat-value" id="user-wins">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Losses:</span>
                        <span class="stat-value" id="user-losses">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Rating:</span>
                        <span class="stat-value" id="user-rating">1000</span>
                    </div>
                </div>
            </div>
            <div class="player-status">Ready</div>
            <div class="ready-indicator user-ready-indicator" id="user-ready-indicator">
                <span class="ready-checkmark">✓</span>
            </div>
        </div>
        
        <div class="versus-container">
            <span>VS</span>
        </div>
        
        <div class="player-card opponent-card">
            <div class="player-avatar">
                <img src="/public/assets/dog.png" id="opponent-avatar" alt="Opponent Avatar">
                <div class="online-status opponent-online-status" style="display: none;"></div>
            </div>
            <div class="player-info">
                <h2 id="opponent-name">Waiting for opponent...</h2>
                <div class="player-stats">
                    <div class="stat-item">
                        <span class="stat-label">Wins:</span>
                        <span class="stat-value" id="opponent-wins">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Losses:</span>
                        <span class="stat-value" id="opponent-losses">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Rating:</span>
                        <span class="stat-value" id="opponent-rating">-</span>
                    </div>
                </div>
            </div>
            <div class="player-status">Searching...</div>
            <div class="ready-indicator opponent-ready-indicator" id="opponent-ready-indicator">
                <span class="ready-checkmark">✓</span>
            </div>
            <button class="kick-button" id="kick-opponent" style="display: none;">
                <span class="kick-icon">×</span>
                <span class="kick-text">Kick</span>
            </button>
        </div>
    </div>
    
    <div class="matchmaking-controls">
        <button id="start-matchmaking" class="action-button">Start Matchmaking</button>
        <button id="cancel-matchmaking" class="action-button cancel-button" style="display: none;">Cancel</button>
        <button id="toggle-ready" class="action-button ready-button" style="display: none;">Ready</button>
        <button id="invite-friend" class="action-button invite-button">Invite Friend</button>
    </div>
    
    <div class="invite-friend-overlay" id="invite-overlay">
        <div class="invite-friend-panel">
            <div class="invite-panel-header">
                <h2>Invite a Friend</h2>
                <button id="close-invite-panel" class="close-panel">&times;</button>
            </div>
            <div class="invite-panel-content">
                <input type="text" id="friend-search-input" placeholder="Search friends...">
                <div class="friends-list" id="friends-list">
                    <!-- Friends will be added here by the JS -->
                </div>
            </div>
        </div>
    </div>
    
    <div class="waiting-overlay" id="waiting-overlay">
        <div class="waiting-panel">
            <h2>Waiting for Response</h2>
            <p>Waiting for <span id="invited-friend-name">your friend</span> to respond...</p>
            <div class="loading-spinner"></div>
            <button id="cancel-invitation" class="action-button cancel-button">Cancel</button>
        </div>
    </div>
</div>
`
