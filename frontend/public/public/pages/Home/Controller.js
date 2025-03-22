import { showModalWithAnimation, hideModalWithAnimation } from '../../modalAnimations.js';
import receivedComp from "./components/Received/index.js"
import showfriend from "./components/showfriend/index.js"
import AddFriendModal from "./components/AddFriendModal/index.js"
import ProfileModal from "./components/Profile/View.js"


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
		
		friendsData.forEach(friend => {
			const friendItem = document.createElement('li');
			friendItem.className = 'friend-item';
			friendItem.dataset.friendId = friend.auth.id;
			if (!friend.auth.icon_url)
				friend.auth.icon_url = "/public/assets/dog.png"
			friendItem.innerHTML = `
				<img class="profile-photo" src="${friend.auth.icon_url}">
				<div class="friend-info">
					<span class="friend-name">${friend.auth.username}</span>
					<span class="friend-status ${friend.status}">
						<span class="status-circle"></span> ${friend.status.replace('-', ' ').charAt(0).toUpperCase() + friend.status.replace('-', ' ').slice(1)}
					</span>
				</div>
			`;
			
			friendItem.addEventListener('click', (e) => {
				e.preventDefault();
				console.log("friend click data" , friend);
				
				showfriend.Controller(friend.auth, e.currentTarget)
			});
			
			friendList.appendChild(friendItem);
		})
	}


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
	friendsContainer.addEventListener("refresh", () => renderFriendsList(container))
	friendsContainer.dispatchEvent(new CustomEvent("refresh"))
}

export default () => {
	try {
		// Add event listener for add friend button
		console.log("home controller");
		
		const container = document.getElementById("home-view")
		RightSide(container)
		
		const leaderboardContainer = container.querySelector('.left-side');
		if (leaderboardContainer) {
			renderLeaderboard(leaderboardData, leaderboardContainer);
		}
	} catch (error) {
		if (error instanceof app.utils.AuthError)
			return
		console.log("error home");
		console.error(error);
	}
}



const renderLeaderboard = (leaderboardData, container) => {
	if (!Array.isArray(leaderboardData) || !container) return;
	
	const leaderboardList = container.querySelector('#leader-preview');
	// clear content
	leaderboardList.innerHTML = ''
	
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
