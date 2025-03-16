const MOCK_USER_DATA = {
    username: "GamerPro42",
    status: "online",
    avatar: "/public/assets/dog.png",
    stats: {
        gamesWon: 28,
        gamesLost: 12,
        score: 1250
    }
};

const MOCK_MATCH_HISTORY = [
    { opponent: "Player1", result: "win", score: "10-5", date: "2 hrs ago" },
    { opponent: "Player2", result: "loss", score: "7-10", date: "5 hrs ago" },
    { opponent: "Player3", result: "win", score: "10-3", date: "Yesterday" },
    { opponent: "Player4", result: "win", score: "10-8", date: "Yesterday" },
    { opponent: "Player5", result: "loss", score: "4-10", date: "2 days ago" },
    { opponent: "Player6", result: "win", score: "10-6", date: "2 days ago" },
    { opponent: "Player7", result: "loss", score: "9-10", date: "3 days ago" },
    { opponent: "Player8", result: "win", score: "10-2", date: "3 days ago" },
    { opponent: "Player9", result: "win", score: "10-7", date: "4 days ago" },
    { opponent: "Player10", result: "loss", score: "5-10", date: "5 days ago" }
];

const createMatchHistoryItem = (match) => {
    const resultClass = match.result === 'win' ? 'match-win' : 'match-loss';
    const resultIcon = match.result === 'win' ? '🏆' : '❌';
    
    return `
        <div class="match-item ${resultClass}">
            <div class="match-result-icon">${resultIcon}</div>
            <div class="match-details">
                <div>vs ${match.opponent}</div>
                <div class="match-score">${match.score}</div>
            </div>
            <div class="match-time">${match.date}</div>
        </div>
    `;
};

const MOCK_CURRENT_USER = {
    id: "current123",
    username: "CurrentUser"
};

const fetchUserData = async (userId) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return MOCK_USER_DATA;
};

const fetchMatchHistory = async (userId) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return MOCK_MATCH_HISTORY;
};

export default async () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('id'); // If null, we'll use a dummy ID to show buttons
        const userData = await fetchUserData(userId || 'some-user-id');
        document.getElementById('username').textContent = userData.username;
        document.getElementById('user-status').textContent = userData.status;
        document.getElementById('user-avatar').src = userData.avatar;
        const { gamesWon, gamesLost, score } = userData.stats;
        document.getElementById('games-won').textContent = gamesWon;
        document.getElementById('games-lost').textContent = gamesLost;
        document.getElementById('score').textContent = score;
        const totalGames = gamesWon + gamesLost;
        const winRate = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;
        document.getElementById('win-rate').textContent = `${winRate}%`;
        const matchHistory = await fetchMatchHistory(userId || 'some-user-id');
        const matchHistoryContainer = document.getElementById('match-history');
        
        if (matchHistory.length > 0) {
            const matchHistoryHTML = matchHistory.map(createMatchHistoryItem).join('');
            matchHistoryContainer.innerHTML = matchHistoryHTML;
        } else {
            matchHistoryContainer.innerHTML = '<p class="no-matches">No recent matches</p>';
        }
        
    } catch (error) {
        console.error('Error loading profile:', error);
        
        if (error instanceof app.utils.AuthError) {
            app.Router.navigate('/auth/login');
            return;
        }
        
        app.utils.showToast('Error loading profile data. Please try again later.');
    }
};
