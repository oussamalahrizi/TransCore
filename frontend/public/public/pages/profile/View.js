export default /*html*/ `
    <div id="profile" class="pf-profile-container">
        <div id="pf-profile-header-id" class="pf-profile-header">
            <div class="pf-match-history-section">
                <h3 class="pf-section-title">Recent Matches</h3>
                <div id="match-history" class="pf-match-history-items">
                    <div class="pf-loading-spinner">
                        <div class="pf-spinner"></div>
                    </div>
                </div>
            </div>
            
            <div class="pf-profile-middle-section">
                <div class="pf-profile-avatar-container">
                    <img id="user-avatar" class="pf-profile-avatar" src="/public/assets/dog.png" alt="Profile picture">
                </div>
                <div class="pf-profile-info">
                    <h1 id="username" class="pf-profile-username">Loading...</h1>
                    <div class="pf-status-container">
                        <div class="pf-online-status pf-online"></div>
                        <p id="user-status" class="pf-profile-status">Online</p>
                    </div>
                    <div class="pf-profile-actions" style="display: flex;">
                    </div>
                </div>
            </div>
            
            <div class="pf-profile-stats">
                <div class="pf-stat-item">
                    <div class="pf-stat-value" id="games-won">0</div>
                    <div class="pf-stat-label">Games Won</div>
                </div>
                <div class="pf-stat-item">
                    <div class="pf-stat-value" id="games-lost">0</div>
                    <div class="pf-stat-label">Games Lost</div>
                </div>
                <div class="pf-stat-item">
                    <div class="pf-stat-value pf-win-rate" id="win-rate">0%</div>
                    <div class="pf-stat-label">Win Rate</div>
                </div>
                <div class="pf-stat-item">
                    <div class="pf-stat-value" id="score">0</div>
                    <div class="pf-stat-label">Score</div>
                </div>
            </div>
        </div>
    </div>
`
