import { sleep } from "../game/websockets.js";

const MOCK_USER_DATA = {
    username: "GamerPro42",
    status: "online",
    avatar: "/public/assets/dog.png",
    game1state: {
        gamesWon: 28,
        gamesLost: 16,
        score: 1250
    },
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
    const resultClass = match.result === 'win' ? 'pf-match-win' : 'pf-match-loss';
    const resultIcon = match.result === 'win' ? '🏆' : '❌';
    
    return `
        <div class="pf-match-item ${resultClass}">
            <div class="pf-match-result-icon">${resultIcon}</div>
            <div class="pf-match-details">
                <p class="pf-match-score">vs ${match.opponent}</p>
                <div class="pf-match-score">${match.score}</div>
            </div>
            <div class="pf-match-time">${match.date}</div>
        </div>
    `;
};

const MOCK_CURRENT_USER = {
    id: "current123",
    username: "CurrentUser",
    status: "online",
    game1state: {
        gamesWon: 28,
        gamesLost: 29,
        score: 1250
    },
}

const fetchUserData = async (user) => {
    var url = "/api/main/user/me/"
    if (user)
        url = "/api/main/user/" + user.id
    const { data, error } = await app.utils.fetchWithAuth(
        url
    );
    if (error) {
        app.utils.showToast('Error loading profile data. Please try again later.');
        return;
    }
    console.log(data, "data")
    MOCK_CURRENT_USER.username = data.username
    // const temp = {
    //     "inqueue" : "in Queue",
    //     "ingame" : "in Game",
    //     "online" : "Online",
    //     "offline" : "Offline",
    // }
    MOCK_CURRENT_USER.status = data.status
    MOCK_CURRENT_USER.avatar = data.icon_url
    return MOCK_CURRENT_USER
};

const fetchMatchHistory = async () => {
    return MOCK_MATCH_HISTORY;
};

export default async (user) => {
    try {
        setTimeout(async () => {
            const userData = await fetchUserData(user);
            console.log("profile fetch");
            
            document.getElementById('username').textContent = userData.username;
            var statustext = document.getElementById('user-status');
            const temp = {
                "inqueue" : "in Queue",
                "ingame" : "in Game",
                "online" : "Online",
                "offline" : "Offline",
        }
            statustext.textContent = temp[userData.status];
            statustext.className = "pf-profile-" + userData.status + "-status";
            document.getElementById('status-circle').className = "pf-" + userData.status + "-status";
            document.getElementById('user-avatar').src = userData.avatar ? userData.avatar : "/public/assets/icon-placeholder.svg";
            const { gamesWon, gamesLost, score } = userData.game1state;
            document.getElementById('games-won').textContent = gamesWon;
            document.getElementById('games-lost').textContent = gamesLost;
            document.getElementById('score').textContent = score;
            const totalGames = gamesWon + gamesLost;
            const winRate = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;
            document.getElementById('win-rate').textContent = `${winRate}%`;
            document.getElementById('win-rate').className = "pf-win-rate-" + (winRate > 50 ? "positive" : "negative");
            const matchHistory = await fetchMatchHistory();
            const matchHistoryContainer = document.getElementById('match-history');
            
            if (matchHistory.length > 0) {
                const matchHistoryHTML = matchHistory.map(createMatchHistoryItem).join('');
                matchHistoryContainer.innerHTML = matchHistoryHTML;
            } else {
                matchHistoryContainer.innerHTML = '<p class="pf-no-matches">No recent matches</p>';
            }
        }, 100);
        
    } catch (error) {
        console.error('Error loading profile:', error);
        
        if (error instanceof app.utils.AuthError) {
            return;
        }
        
        app.utils.showToast('Error loading profile data. Please try again later.');
    }
};
