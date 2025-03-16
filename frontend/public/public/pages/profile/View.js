export default /*html*/ `
    <div id="profile" class="profile-container">
        <div class="profile-header">
            <div class="match-history-section">
                <h3 class="section-title">Recent Matches</h3>
                <div id="match-history" class="match-history-items">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>
            
            <div class="profile-middle-section">
                <div class="profile-avatar-container">
                    <img id="user-avatar" class="profile-avatar" src="/public/assets/dog.png" alt="Profile picture">
                </div>
                <div class="profile-info">
                    <h1 id="username" class="profile-username">Loading...</h1>
                    <div class="status-container">
                        <div class="online-status online"></div>
                        <p id="user-status" class="profile-status">Online</p>
                    </div>
                    <div class="profile-actions" style="display: flex;">
                    </div>
                </div>
            </div>
            
            <div class="profile-stats">
                <div class="stat-item">
                    <div class="stat-value" id="games-won">0</div>
                    <div class="stat-label">Games Won</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="games-lost">0</div>
                    <div class="stat-label">Games Lost</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value win-rate" id="win-rate">0%</div>
                    <div class="stat-label">Win Rate</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="score">0</div>
                    <div class="stat-label">Score</div>
                </div>
            </div>
        </div>
    </div>
`
