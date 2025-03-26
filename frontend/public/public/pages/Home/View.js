

export default /*html*/ `

<div id="home-view" class="home-container">
	<div class="inner-container">
		<div class="left-side">
			<div class="tournament-view">
				<div class="content">
					<h1 class="tournament-title">Ultimate Ping Pang Worlds 2025<h1>
					<p class="notes" >Ping pong tournament made to make you experience an intense gameplay with a lot of rewards, dont miss it!<p>
					<div class="button-div">
						<a href='/tournament' id="join-tournament-btn" class="join">Join now</a>
					</div>
				</div>
			</div>
			<div id="leader-preview" class="leaderboard-preview"></div>
		</div>
		<div class="right-side">
			<div class="header-div">
				<h1 class="titles">Friends list<h1>
			</div class="friend-list-container">
			<div class="svgs-div">
				<button id="add-friend-btn">
					<img src="/public/assets/addfriend.svg" height="24" width="24">
				</button>
				<button id="received-btn">
					<img src="/public/assets/recieved.svg" height="24" width="24">
				</button>
			</div class="friend-list-container">
				<ul id="friend-list-items" class="friend-list"></ul>
		</div>
	</div>
</div>

`