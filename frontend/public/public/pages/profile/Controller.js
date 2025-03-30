import { sleep } from "../game/websockets.js";

const createMatchHistoryItem = (match) => {
    console.log('create match', match);
    
    const resultClass = match.result === 'Win' ? 'pf-match-win' : 'pf-match-loss';
    const resultIcon = match.result === 'Win' ? '🏆' : '❌';
    
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

const USER_STATS = {
    game : "pong",
    game_stats: {
        gamesWon: 28,
        gamesLost: 28,
        score: 1250
    },
    matchHistory: [
        { opponent: "Player1", result: "win", score: "10-5", date: "2 hrs ago" },
        { opponent: "Player2", result: "loss", score: "7-10", date: "5 hrs ago" },
        { opponent: "Player3", result: "win", score: "10-3", date: "Yesterday" },
        { opponent: "Player4", result: "win", score: "10-8", date: "Yesterday" },
        // { opponent: "Player5", result: "loss", score: "4-10", date: "2 days ago" },
        // { opponent: "Player6", result: "win", score: "10-6", date: "2 days ago" },
        // { opponent: "Player7", result: "loss", score: "9-10", date: "3 days ago" },
        // { opponent: "Player8", result: "win", score: "10-2", date: "3 days ago" },
        // { opponent: "Player9", result: "win", score: "10-7", date: "4 days ago" },
        // { opponent: "Player10", result: "loss", score: "5-10", date: "5 days ago" }
    ]
}

export const fetchUserData = async (user) => {
    var url = "/api/main/user/me/"
    if (user)
        url = "/api/main/user/" + user.id
    const { data, error } = await app.utils.fetchWithAuth(
        url
    );
    if (error) {
        app.utils.showToast('Error loading profile data. Please try again later.');
        return null;
    }
    return {
        username: data.username,
        status: data.status,
        avatar: data.icon_url
    }
};

const fetchStats = async (game) => {
    if (game === "pong")
        return USER_STATS.game_stats;
    else
        return USER_STATS.game_stats;
};

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1,
    };

    for (const [unit, seconds] of Object.entries(intervals)) {
        const delta = Math.floor(diffInSeconds / seconds);
        if (delta !== 0) {
            return rtf.format(-delta, unit);
        }
    }
    return 'Just now';
}

// Example usage
console.log(timeAgo("2025-03-28T08:12:54.829899Z"));


const fetchMatchHistory = async (game, user) => {

    const matches =  await fetchMatchHistoryUser(game, user)

    USER_STATS.matchHistory = []
    await Promise.all(matches.map(async match => {
        try {
            const { username } = await fetchUserData({ id: match.opponent });
    
            USER_STATS.matchHistory.push({
                opponent: username,
                result: match.result,
                score: `${match.current_player_score} - ${match.opponent_score}`,
                date: timeAgo(match.played_at)
            });
    
        } catch (error) {
            console.error(error);
        }
    }));
    return USER_STATS.matchHistory
    
};



const fetchPlayerStats = async (game, user=null) => {
    var url = `/api/game/${game}/players/`
    if (user)
        url += user.id + "/"
    try {
        const {data, error, status} = await app.utils.fetchWithAuth(url)
        if (error)
        {
            if (status === 404 && !user)
                return
            app.utils.showToast(error)
            return
        }
        console.log(data)
        console.log("error : ", error)
        return data
    } catch (error) {
        if (error instanceof app.utils.AuthError)
            return
    }
}

const fetchMatchHistoryUser = async (game, user=null) => {
    var url = `/api/game/${game}/matches/`
    if (user)
        url += user.id + "/"
    try {
        const {data, error, status} = await app.utils.fetchWithAuth(url)
        if (error)
        {
            if (status === 404 && !user)
                return []
            app.utils.showToast(error)
            return []
        }
        console.log('MATCHES, ', data);
        
        return data
    } catch (error) {
        if (error instanceof app.utils.AuthError)
            return []
    }
}



export default async (user) => {
    try {
            setTimeout(async () => {
            const userData = await fetchUserData(user);
            document.getElementById('username').textContent = userData.username;
            var statustext = document.getElementById('user-status');
            const temp = {
                "inqueue" : "in Queue",
                "ingame" : "in Game",
                "online" : "Online",
                "offline" : "Offline",
            }
            var button = document.getElementById('switch-button')
            button.addEventListener("click", async function () {
                if (USER_STATS.game === "pong")
                {
                    USER_STATS.matchHistory = await fetchMatchHistory('pong',user);
                    button.innerHTML =  'Tic Tac Toe'
                    
                    const matchHistoryContainer = document.getElementById('match-history');
                    const matchHistory = USER_STATS.matchHistory
                    if (matchHistory.length > 0) {
                        const matchHistoryHTML = matchHistory.map(createMatchHistoryItem).join('');
                        console.log('html : ', matchHistoryHTML);
                        
                        matchHistoryContainer.innerHTML = matchHistoryHTML;
                    } else
                    matchHistoryContainer.innerHTML = '<p class="pf-no-matches">No recent matches</p>';
                    const data = await fetchPlayerStats("tic", user)
                    if (data)
                    {
                        USER_STATS.game_stats.gamesWon = data.matches_won
                        USER_STATS.game_stats.gamesLost = data.matches_lost
                        USER_STATS.game_stats.score = data.score
                        const { gamesWon, gamesLost, score } = USER_STATS.game_stats;
                        document.getElementById('games-won').textContent = gamesWon;
                        document.getElementById('games-lost').textContent = gamesLost;
                        document.getElementById('score').textContent = score;
                        const totalGames = gamesWon + gamesLost;
                        const winRate = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;
                        document.getElementById('win-rate').textContent = `${winRate}%`;
                        document.getElementById('win-rate').className = "pf-win-rate-" + (winRate >= 50 ? "positive" : "negative");
                    }
                    else
                    {
                        USER_STATS.game_stats.gamesWon = 0
                        USER_STATS.game_stats.gamesLost = 0
                        USER_STATS.game_stats.score = 400
                        const { gamesWon, gamesLost, score } = USER_STATS.game_stats;
                        document.getElementById('games-won').textContent = gamesWon;
                        document.getElementById('games-lost').textContent = gamesLost;
                        document.getElementById('score').textContent = score;
                        const totalGames = gamesWon + gamesLost;
                        const winRate = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;
                        document.getElementById('win-rate').textContent = `${winRate}%`;
                        document.getElementById('win-rate').className = "pf-win-rate-" + (winRate >= 50 ? "positive" : "negative");
                    }
                    USER_STATS.game = "tictac"
                }
                else
                {
                    USER_STATS.matchHistory = await fetchMatchHistory('tictac', user);
                    button.innerHTML = 'Ping Pong'
                    const matchHistoryContainer = document.getElementById('match-history');
                    const matchHistory = USER_STATS.matchHistory
                    if (matchHistory.length > 0) {
                        const matchHistoryHTML = matchHistory.map(createMatchHistoryItem).join('');
                        console.log('html : ', matchHistoryHTML);
                        
                        matchHistoryContainer.innerHTML = matchHistoryHTML;
                    } else 
                    matchHistoryContainer.innerHTML = '<p class="pf-no-matches">No recent matches</p>';
                    const data = await fetchPlayerStats(USER_STATS.game, user)
                    if (data)
                    {
                        USER_STATS.game_stats.gamesWon = data.matches_won
                        USER_STATS.game_stats.gamesLost = data.matches_lost
                        USER_STATS.game_stats.score = data.score
                        const { gamesWon, gamesLost, score } = USER_STATS.game_stats;
                        document.getElementById('games-won').textContent = gamesWon;
                        document.getElementById('games-lost').textContent = gamesLost;
                        document.getElementById('score').textContent = score;
                        const totalGames = gamesWon + gamesLost;
                        const winRate = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;
                        document.getElementById('win-rate').textContent = `${winRate}%`;
                        document.getElementById('win-rate').className = "pf-win-rate-" + (winRate >= 50 ? "positive" : "negative");
                    }
                    else
                    {
                        USER_STATS.game_stats.gamesWon = 0
                        USER_STATS.game_stats.gamesLost = 0
                        USER_STATS.game_stats.score = 400
                        const { gamesWon, gamesLost, score } = USER_STATS.game_stats;
                        document.getElementById('games-won').textContent = gamesWon;
                        document.getElementById('games-lost').textContent = gamesLost;
                        document.getElementById('score').textContent = score;
                        const totalGames = gamesWon + gamesLost;
                        const winRate = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;
                        document.getElementById('win-rate').textContent = `${winRate}%`;
                        document.getElementById('win-rate').className = "pf-win-rate-" + (winRate >= 50 ? "positive" : "negative");
                    }
                    USER_STATS.game = "pong"
                }
            })
            statustext.textContent = temp[userData.status];
            statustext.className = "pf-profile-" + userData.status + "-status";
            document.getElementById('status-circle').className = "pf-" + userData.status + "-status";
            document.getElementById('user-avatar').src = userData.avatar ? userData.avatar : "/public/assets/icon-placeholder.svg";
            const data = await fetchPlayerStats("pong", user)
            if (data)
            {
                USER_STATS.game_stats.gamesWon = data.matches_won
                USER_STATS.game_stats.gamesLost = data.matches_lost
                USER_STATS.game_stats.score = data.score
                const { gamesWon, gamesLost, score } = USER_STATS.game_stats;
                document.getElementById('games-won').textContent = gamesWon;
                document.getElementById('games-lost').textContent = gamesLost;
                document.getElementById('score').textContent = score;
                const totalGames = gamesWon + gamesLost;
                const winRate = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;
                document.getElementById('win-rate').textContent = `${winRate}%`;
                document.getElementById('win-rate').className = "pf-win-rate-" + (winRate >= 50 ? "positive" : "negative");
            }
            else
            {
                USER_STATS.game_stats.gamesWon = 0
                USER_STATS.game_stats.gamesLost = 0
                USER_STATS.game_stats.score = 400
                const { gamesWon, gamesLost, score } = USER_STATS.game_stats;
                document.getElementById('games-won').textContent = gamesWon;
                document.getElementById('games-lost').textContent = gamesLost;
                document.getElementById('score').textContent = score;
                const totalGames = gamesWon + gamesLost;
                const winRate = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;
                document.getElementById('win-rate').textContent = `${winRate}%`;
                document.getElementById('win-rate').className = "pf-win-rate-" + (winRate >= 50 ? "positive" : "negative");
            }
            const matchHistory = await fetchMatchHistory('pong', user);
            
            const matchHistoryContainer = document.getElementById('match-history');
            if (matchHistory.length > 0) {
                const matchHistoryHTML = matchHistory.map(createMatchHistoryItem).join('');
                console.log('html : ', matchHistoryHTML);
                
                matchHistoryContainer.innerHTML = matchHistoryHTML;
            } else {
                matchHistoryContainer.innerHTML = '<p class="pf-no-matches">No recent matches</p>';
            }
            USER_STATS.game = "tictac"
        }, 100);
        
    } catch (error) {
        console.error('Error loading profile:', error);
        
        if (error instanceof app.utils.AuthError) {
            return;
        }
        
        app.utils.showToast('Error loading profile data. Please try again later.');
    }
};
