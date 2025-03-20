const modal = /*html*/`
<div class="profile-modal-content">
    <button class="close-profile-modal">&times;</button>
    <div class="profile-card">
        <div class="profile-matches">
            <h3>Recent Matches</h3>
            <div class="matches-list">
                ${matchHistory.map(match => `
                    <div class="match-row ${match.result}">
                        <div class="match-indicator"></div>
                        <div class="match-info">
                            <div class="match-player">
                                <span class="match-icon">${match.result === 'win' ? '🏆' : '✕'}</span>
                                <span>vs ${match.opponent}</span>
                            </div>
                            <div class="match-score">${match.score}</div>
                        </div>
                        <div class="match-time">${match.time}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="profile-info">
            <div class="avatar-container">
                <img src="${friend.avatar || '/public/assets/dog.png'}" class="avatar" alt="Profile avatar">
            </div>
            <h2 class="username">${friend.name || 'GamerPro42'}</h2>
            <div class="status">
                <span class="status-dot"></span>
                <span class="status-text">Online</span>
            </div>
            <div class="profile-actions">
                <button class="action-btn add-friend">Add Friend</button>
                <button class="action-btn message">Message</button>
                <button class="action-btn block">Block</button>
            </div>
        </div>
        
        <div class="profile-stats">
            <div class="stat">
                <div class="stat-value">${wins}</div>
                <div class="stat-label">Games Won</div>
            </div>
            <div class="stat">
                <div class="stat-value">${losses}</div>
                <div class="stat-label">Games Lost</div>
            </div>
            <div class="stat">
                <div class="stat-value win-rate">${winRate}%</div>
                <div class="stat-label">Win Rate</div>
            </div>
            <div class="stat">
                <div class="stat-value">${score}</div>
                <div class="stat-label">Score</div>
            </div>
        </div>
    </div>
</div>
`;