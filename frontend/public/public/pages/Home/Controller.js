import { showModalWithAnimation, hideModalWithAnimation } from '../../modalAnimations.js';

const LoadCss = (href) => {
	return new Promise(async (resolve, reject) => {
        const existingLink = document.head.querySelector(`link[href="${href}"]`);
        if (existingLink)
            return resolve()
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;

        link.onload = () => {
            console.log(`✅ CSS loaded: ${href}`);
            resolve();
        };

        link.onerror = (error) => {
            console.error(`❌ Failed to load CSS: ${href}`, error);
			document.head.removeChild(link)
            reject(new Error(`Failed to load CSS at ${href}`));
        };

        document.head.appendChild(link);
        console.log(`📥 Added new CSS with href: ${href}`);
    })
}


const my_data = async (view) => {
    try {
        const {error, data} = await app.utils.fetchWithAuth("/api/auth/users/me/")
        if (error)
        {
            app.utils.showToast(error)
            return
        }
        view.querySelector("#auth-data").innerText = JSON.stringify(data, null, 4)
    } catch (error) {
        if (error instanceof app.utils.AuthError)
        {
            app.Router.navigate("/auth/login")
            return
        }
        console.log(error);
        return
    }
}

const api_data = async (view) => {
    try {
        const {data, error} = await app.utils.fetchWithAuth("/api/main/user/me/")
        if (error)
        {
            app.utils.showToast(error)
            return
        }
        view.querySelector("#api-data").innerText = JSON.stringify(data, null, 4)
    } catch (error) {
        if (error instanceof app.utils.AuthError)
        {
            app.Router.navigate("/auth/login")
            return
        }
        console.log(error);
        return
    }
}

const sendNotif = async () => {
    try {
        const {data, error} = await app.utils.fetchWithAuth('/api/auth/send_notif/')
        if (error)
        {
            app.utils.showToast(error)
            return
        }
        app.utils.showToast(data.detail, 'green')
    } catch (error) {
        if (error instanceof app.utils.AuthError)
        {
            app.Router.navigate("/auth/login")
            return
        }
        console.log(error);
    }
}

const fetch_friends = async (view) => {
    try {
        const {data, error} = await app.utils.fetchWithAuth("/api/auth/friends/")
        if (error)
        {
            app.utils.showToast(error)
            return
        }
        const pre = view.querySelector("#friends-data")
        pre.innerText = data
    } catch (error) {
        if (error instanceof app.utils.AuthError)
        {
            app.Router.navigate("/auth/login")
            return
        }
        console.log(error);
    }
}

const add_friend = async (view, e, form) => {
    try {
        e.preventDefault()
        const formdata = new FormData(form)
        const body = Object.fromEntries(formdata.entries())
        const username = body["username"]
        if (!username.length)
        {
            app.utils.showToast("empty username")
            return
        }
        const {data, error} = await app.utils.fetchWithAuth(`/api/auth/add_friend/${username}/`)
        if (error)
        {
            app.utils.showToast(error)
            return
        }
        console.log("data : ",data);
        
    } catch (error) {
        if (error instanceof app.utils.AuthError)
        {
            app.Router.navigate("/auth/login")
            return
        }
        console.log(error);
    }
}

const findMatch = async () => {
    try {
        const {data, error} = await app.utils.fetchWithAuth("/api/match/findmatch/pong/")
        if (error)
        {
            app.utils.showToast(error)
            return
        }
        console.log(data);
    } catch (error) {
        if (error instanceof app.utils.AuthError)
        {
            app.Router.navigate("/auth/login")
            return
        }
        console.log(error);
    }
}

const renderFriendsList = (friendsData, container) => {
    if (!Array.isArray(friendsData) || !container) return;
    
    const statusOrder = {
        "online": 1,
        "in-queue": 2,
        "in-game": 3,
        "offline": 4
    };

    friendsData.sort((a, b) => {
        return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
    });
    
    let friendList = container.querySelector('.friend-list');
    if (!friendList) {
        friendList = document.createElement('ul');
        friendList.className = 'friend-list';
        container.appendChild(friendList);
    } else {
        friendList.innerHTML = '';
    }
    
    friendsData.forEach(friend => {
        const friendItem = document.createElement('li');
        friendItem.className = 'friend-item';
        friendItem.dataset.friendId = friend.id;
        
        friendItem.innerHTML = `
            <img class="profile-photo" src="${friend.photoUrl}" alt="Profile photo of ${friend.name}">
            <div class="friend-info">
                <span class="friend-name">${friend.name}</span>
                <span class="friend-status ${friend.status}">
                    <span class="status-circle"></span> ${friend.status.replace('-', ' ').charAt(0).toUpperCase() + friend.status.replace('-', ' ').slice(1)}
                </span>
            </div>
        `;
        
        friendItem.addEventListener('click', (e) => {
            e.preventDefault();
            showFriendModal(friend, e.currentTarget);
        });
        
        friendList.appendChild(friendItem);
    });
}

const showFriendModal = (friend, element) => {
    const existingModal = document.getElementById("friend-modal");
    if (existingModal) {
        existingModal.remove();
    }
    
    const friendModal = document.createElement("div");
    friendModal.id = "friend-modal";
    friendModal.className = "friend-options-modal";
    friendModal.style.display = "none";
    
    friendModal.innerHTML = `
        <div class="friend-modal-content">
            <div class="friend-menu-item">
                <div class="friend-icon-container">
                    <img src="/public/assets/user.svg" alt="Profile icon" class="friend-menu-icon">
                </div>
                <a href="#" id="view-profile-${friend.id}">View profile</a>
            </div>
            <div class="friend-menu-item">
                <div class="friend-icon-container">
                    <img src="/public/assets/message.svg" alt="Message icon" class="friend-menu-icon">
                </div>
                <a href="#" id="send-message-${friend.id}">Send message</a>
            </div>
            <div class="friend-menu-item">
                <div class="friend-icon-container">
                    <img src="/public/assets/game.svg" alt="Game icon" class="friend-menu-icon">
                </div>
                <a href="#" id="invite-game-${friend.id}">Invite to game</a>
            </div>
            <div class="friend-menu-divider"></div>
            <div class="friend-menu-item">
                <div class="friend-icon-container">
                    <img src="/public/assets/unfriend.svg" alt="Unfriend icon" class="friend-menu-icon">
                </div>
                <a href="#" id="unfriend-${friend.id}">Unfriend</a>
            </div>
            <div class="friend-menu-item">
                <div class="friend-icon-container">
                    <img src="/public/assets/block.svg" alt="Block icon" class="friend-menu-icon">
                </div>
                <a href="#" id="block-${friend.id}">Block user</a>
            </div>
        </div>
    `;
    
    document.body.appendChild(friendModal);
    
    const rect = element.getBoundingClientRect();
    friendModal.style.top = `${rect.bottom + window.scrollY}px`;
    friendModal.style.left = `${rect.left + window.scrollX}px`;
    
    showModalWithAnimation(friendModal);
    
    document.getElementById(`view-profile-${friend.id}`).addEventListener('click', (e) => {
        e.preventDefault();
        console.log(`View profile for ${friend.name}`);
        
        // Create the profile modal
        const modal = document.createElement('div');
        modal.className = 'profile-view-modal';
        
        // Calculate stats (use friend data if available, otherwise use defaults from the photo)
        const wins = friend.wins || 28;
        const losses = friend.losses || 12;
        const winRate = friend.winRate || 70;
        const score = friend.score || 1250;
        
        // Sample match history (use friend match history if available)
        const matchHistory = friend.matchHistory || [
            { opponent: 'Player1', score: '10-5', result: 'win', time: '2 hrs ago' },
            { opponent: 'Player2', score: '7-10', result: 'loss', time: '5 hrs ago' },
            { opponent: 'Player3', score: '10-3', result: 'win', time: 'Yesterday' },
            { opponent: 'Player4', score: '10-8', result: 'win', time: 'Yesterday' },
            { opponent: 'Player5', score: '4-10', result: 'loss', time: '2 days ago' },
            { opponent: 'Player6', score: '10-6', result: 'win', time: '2 days ago' },
            { opponent: 'Player7', score: '3-10', result: 'loss', time: '2 days ago' }
        ];
        
        // Create the modal content to exactly match the photo
        modal.innerHTML = `
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
        
        // Add to the DOM
        document.body.appendChild(modal);
        
        // Show with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // Close button functionality
        const closeButton = modal.querySelector('.close-profile-modal');
        closeButton.addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        });
        
        // Close when clicking outside the modal content
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.remove();
                }, 300);
            }
        });
        
        // Add button functionality
        const addFriendBtn = modal.querySelector('.add-friend');
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => {
                app.utils.showToast(`Friend request sent to ${friend.name}`, "green");
            });
        }
        
        // Message button functionality
        const messageBtn = modal.querySelector('.message');
        if (messageBtn) {
            messageBtn.addEventListener('click', () => {
                app.utils.showToast(`Opening chat with ${friend.name}`, "green");
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.remove();
                }, 300);
            });
        }
        
        // Block button functionality
        const blockBtn = modal.querySelector('.block');
        if (blockBtn) {
            blockBtn.addEventListener('click', () => {
                app.utils.showToast(`${friend.name} has been blocked`, "red");
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.remove();
                }, 300);
            });
        }
        
        // Hide friend modal
        hideModalWithAnimation(friendModal);
    });
    
    document.getElementById(`send-message-${friend.id}`).addEventListener('click', (e) => {
        e.preventDefault();
        console.log(`Send message to ${friend.name}`);
        app.utils.showToast(`Opening chat with ${friend.name}`, "green");
        hideModalWithAnimation(friendModal);
    });
    
    document.getElementById(`invite-game-${friend.id}`).addEventListener('click', (e) => {
        e.preventDefault();
        console.log(`Invite ${friend.name} to game`);
        app.utils.showToast(`Invited ${friend.name} to a game`, "green");
        hideModalWithAnimation(friendModal);
    });
    
    document.getElementById(`unfriend-${friend.id}`).addEventListener('click', (e) => {
        e.preventDefault();
        console.log(`Unfriend ${friend.name}`);
        app.utils.showToast(`Removed ${friend.name} from friends list`, "orange");
        hideModalWithAnimation(friendModal);
    });
    
    document.getElementById(`block-${friend.id}`).addEventListener('click', (e) => {
        e.preventDefault();
        console.log(`Block ${friend.name}`);
        app.utils.showToast(`Blocked ${friend.name}`, "orange");
        hideModalWithAnimation(friendModal);
    });
    
    document.addEventListener("click", function closeModal(e) {
        if (friendModal.classList.contains("show") && 
            !friendModal.contains(e.target) && 
            !element.contains(e.target)) {
            hideModalWithAnimation(friendModal);
            document.removeEventListener("click", closeModal);
        }
    });
}

const friendsData = [
    {
      id: 1,
      name: "Alice",
      photoUrl: "/public/assets/dog.png",
      status: "online"
    },
    {
      id: 2,
      name: "Bob",
      photoUrl: "/public/assets/dog.png",
      status: "offline"
    },
    {
      id: 3,
      name: "Charlie",
      photoUrl: "/public/assets/dog.png",
      status: "in-queue"
    },
    {
      id: 4,
      name: "Dana",
      photoUrl: "/public/assets/dog.png",
      status: "in-game"
    },
    {
      id: 5,
      name: "Evan",
      photoUrl: "/public/assets/dog.png",
      status: "online"
    },
    {
        id: 6,
        name: "Imad",
        photoUrl: "/public/assets/dog.png",
        status: "online"
      }
];

const leaderboardData = [
    {
      rank: 1,
      name: "Player One",
      photoUrl: "/public/assets/dog.png",
      score: 2000
    },
    {
      rank: 2,
      name: "Player Two",
      photoUrl: "/public/assets/dog.png",
      score: 1800
    },
    {
      rank: 3,
      name: "Player Three",
      photoUrl: "/public/assets/dog.png",
      score: 1600
    },
    {
      rank: 4,
      name: "Player Four",
      photoUrl: "/public/assets/dog.png",
      score: 1400
    },
    {
      rank: 5,
      name: "Player Five",
      photoUrl: "/public/assets/dog.png",
      score: 1200
    },
    {
        rank: 6,
        name: "Player Six",
        photoUrl: "/public/assets/dog.png",
        score: 1000
    },
    {
        rank: 7,
        name: "Player Seven",
        photoUrl: "/public/assets/dog.png",
        score: 800
    }
];

export default () => {
    const tournament_btn = document.getElementById("join-tournament-btn");
    var status = false;
    tournament_btn.addEventListener("click", function()
    {
        if (!status)
        {
            console.log("Player successfuly joined the tournament");
            app.utils.showToast("Player successfuly joined the tournament", "green");
            tournament_btn.textContent = "Joined!";
            status = true;
        }
        else if (status)
        {
            console.log("Player successfuly left the tournament");
            app.utils.showToast("Player successfuly left the tournament", "orange");
            tournament_btn.textContent = "Join now";
            status = false;
        }
    })
    const friendsContainer = document.querySelector('.right-side');
    if (friendsContainer) {
        renderFriendsList(friendsData, friendsContainer);
    }
    
    const leaderboardContainer = document.querySelector('.left-side');
    if (leaderboardContainer) {
        renderLeaderboard(leaderboardData, leaderboardContainer);
    }
}

const renderLeaderboard = (leaderboardData, container) => {
    if (!Array.isArray(leaderboardData) || !container) return;
    
    let leaderboardList = container.querySelector('.leaderboard-preview');
    if (!leaderboardList) {
        leaderboardList = document.createElement('div');
        leaderboardList.className = 'leaderboard-preview';
        container.appendChild(leaderboardList);
    } else {
        leaderboardList.innerHTML = '';
    }
    
    const leaderboardTitle = document.createElement('div');
    leaderboardTitle.className = 'leaderboard-background';
    leaderboardTitle.innerHTML = '<h1 class="leaderboard-title">Leaderboard</h1>';
    leaderboardList.appendChild(leaderboardTitle);
    
    leaderboardData.forEach(entry => {
        const leaderboardItem = document.createElement('div');
        leaderboardItem.className = 'leaderboard-item';
        
        let rankClass = '';
        switch (entry.rank) {
            case 1:
                rankClass = 'rankone';
                break;
            case 2:
                rankClass = 'ranktwo';
                break;
            case 3:
                rankClass = 'rankthree';
                break;
            default:
                rankClass = 'rank';
        }
        
        leaderboardItem.innerHTML = `
            <span class="${rankClass}">${entry.rank}</span>
            <img class="profile-photo" src="${entry.photoUrl}" alt="Profile photo of ${entry.name}">
            <span class="name">${entry.name}</span>
            <span class="score">${entry.score}</span>
        `;
        
        leaderboardList.appendChild(leaderboardItem);
    });
}