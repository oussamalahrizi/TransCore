import { showModalWithAnimation, hideModalWithAnimation } from '../../modalAnimations.js';
import receivedComp from "./components/Received/index.js"
import showfriend from "./components/showfriend/index.js"
import AddFriendModal from "./components/AddFriendModal/index.js"
import { fetchUserData } from '../profile/Controller.js';

/**
 * 
 * @param {HTMLElement} container 
 * @returns 
 */
const renderFriendsList = async (container) => {
		
	const statusOrder = {
		"online": 1,
		"inqueue": 2,
		"ingame": 3,
		"offline": 4
	};
		const {data, error} = await app.utils.fetchWithAuth("/api/main/friends/")
		if (error)
		{
			app.utils.showToast(error)
			return
		}
		const friendsData = data;
		friendsData.sort((a, b) => {
			return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
		});
		const friendList = container.querySelector('#friend-list-items');
		friendList.innerHTML = ''
		console.log("cleared friend list");
		const temp = {
			"online" : "Online",
			"inqueue" : "In Queue",
			"ingame" : "In Game",
			"offline" : "Offline",
		}
		friendsData.forEach(friend => {
			const friendItem = document.createElement('li');
			friendItem.className = 'friend-item';
			friendItem.dataset.friendId = friend.id;
			var img = friend.icon_url || "/public/assets/icon-placeholder.svg"
			if (!img.startsWith("https"))
				img += `?nocache=${Date.now()}`
			friendItem.innerHTML = `
				<img class="profile-photo" src="${img}">
				<div class="friend-info">
					<span class="friend-name">${friend.username}</span>
					<span class="friend-status ${friend.status}">
						<span class="status-circle"></span> ${temp[friend.status]}
					</span>
				</div>
			`;
			
			friendItem.addEventListener('click', (e) => {
				e.preventDefault();
				showfriend.Controller(friend, e.currentTarget)
			});
			
			friendList.appendChild(friendItem);
		})
	}


var leaderboardData = [];


/**
 * @param {HTMLElement} container
 */
const RightSide = (container) => {
	// add friend button
	const addFriendBtn = container.querySelector("#add-friend-btn");
	addFriendBtn.addEventListener("click", AddFriendModal.Controller)

	// received friend
	const receivedRequestsBtn = container.querySelector("#received-btn");
	
	receivedRequestsBtn.addEventListener("click", receivedComp.Controller);
	const friendsContainer = container.querySelector("#friend-list-items")
	friendsContainer.addEventListener("refresh", async ()=> await renderFriendsList(container))
	friendsContainer.dispatchEvent(new CustomEvent("refresh"))
}

export default async () => {
	try {
		// Add event listener for add friend button
		console.log("home controller");
		
		const container = document.getElementById("home-view")
		RightSide(container)
		
		const leaderboardContainer = container.querySelector('.left-side');
		if (leaderboardContainer) {
			await renderLeaderboard(leaderboardData, leaderboardContainer);
		}
	} catch (error) {
		if (error instanceof app.utils.AuthError)
			return
		console.log("error home");
		console.error(error);
	}
}


const fetchLeaderBoard = async () => {
	try {
		leaderboardData = []
		const {data, error} = await app.utils.fetchWithAuth('/api/game/pong/leaderboard/')
		if (error)
		{
			app.utils.showToast(error)
			return []
		}
		var count = 1
		
		await Promise.all(data.map(async player => {
            try {
				
                var { username, avatar } = await fetchUserData({ id: player.player_id });
				console.log('avatar',avatar);
				
				if (!avatar)
					avatar = '/public/assets/icon-placeholder.svg'
				else if (!avatar.startsWith('https'))
					avatar += `?nocache=${Date.now()}`
				const to_add = {
					rank: count,
					name: username,
					photoUrl: avatar,
					score: player.score
				}
				count++
               leaderboardData.push(to_add);
            } catch (error) {
                console.error(error);
            }
        }));

		return leaderboardData
	} catch (error) {
		console.log('error', error);
		
		return []
	}
}


const renderLeaderboard = async (leaderboardData, container) => {
	leaderboardData = await fetchLeaderBoard()
	console.log('LEADERS', leaderboardData);
	
	if (!Array.isArray(leaderboardData) || !container) return;
	
	const leaderboardList = container.querySelector('#leader-preview');
	// clear content
	leaderboardList.innerHTML = ''
	
	const leaderboardTitle = document.createElement('div');
	leaderboardTitle.className = 'leaderboard-background';
	leaderboardTitle.innerHTML = '<h1 class="leaderboard-title">Leaderboard</h1>';
	leaderboardList.appendChild(leaderboardTitle);
	
	leaderboardData.forEach( entry => {
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
