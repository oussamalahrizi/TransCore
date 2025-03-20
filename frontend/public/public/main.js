import Router from "./Router.js";
import utils from "./utils.js";
import routes from "./routes.js";
import { SetOnline } from "./Websockets.js";
import NavProfile, { placeholder } from "./Components/NavProfile.js";
import {
	showModalWithAnimation,
	hideModalWithAnimation,
} from "./modalAnimations.js";

window.app = {};

app.Router = Router;
app.utils = utils;
app.routes = routes;
app.user_id = null;
app.websocket = null;
app.gameInfo = {};
app.cleanup = []

/*
	to whoever reading this, please read the draft in the eof 
*/

addEventListener("DOMContentLoaded", () => {
	app.Router.init();
});

addEventListener("websocket", (e) => {
	const { type } = e.detail;
	if (type === "close" && app.websocket) {
		app.websocket.close();
		app.websocket = null
		return;
	}
	if (!app.utils.getCookie("access_token")) return;
	SetOnline();
	if (app.websocket.readyState === WebSocket.CLOSED) {
		console.log("failed");
	} else console.log("success");
});

addEventListener("play-button", async (e)=> {
	try
	{
		const Play = /*html*/`<a href="/gamemode" class="playnow">Play</a>`
		const inqueue = /*html*/`<button class="inqueue">In Queue</a>`
		const ingame = /*html*/`<button class="playnow">In Game</a>`
		const token = app.utils.getCookie("access_token")
		if (!token)
				return
		// logged in get player state
		const view = document.getElementById("play-container")
		const {data, error} = await app.utils.fetchWithAuth("/api/main/user/me/")
		if (error)
		{
			app.utils.showToast(error)
			return
		}
		const status = data.status
		console.log("status fetched : ", status);
		switch (status)
		{
			case "online":
				view.innerHTML = Play
				break
			case "inqueue":
				view.innerHTML = inqueue
				button = view.querySelector("button")
				button.addEventListener("click", (e)=>{
					app.utils.showToast("attempt cancel queue", "orange")
					dispatchEvent(new CustomEvent("play-button"))
				})
				break
			case "ingame":
				view.innerHTML = ingame
				view.querySelector("button").disabled = true
				break
			default:
				console.log("something went wrong");
				break
			}
			app.Router.disableReload()
	} catch (error)
	{
		if (error instanceof app.utils.AuthError)
		{
			app.Router.navigate("/auth/login")
			return
		}
		console.log("error in dispatch navbar : ", error);
		return
	}
})

import { handleLogout } from "./pages/Settings/Controller.js";

addEventListener("navbar-profile", async (e) => {
	const token = app.utils.getCookie("access_token");
	const view = document.getElementById("profile-container");
	if (!token) {
		while (view.firstChild) view.removeChild(view.firstChild);
		view.innerHTML = /*html*/ `
				 <a href="/" class="sign-in-link">
				 <img src="/public/assets/signin.svg" alt="Sign In" class="signin-icon">
						<h1 class="signin-text">Sign In</h1>
				 </a>
			`;
		return;
	}
	try {
		const { data, error } = await app.utils.fetchWithAuth(
			"/api/auth/users/me/"
		);
		if (error) {
			view.innerHTML = placeholder;
			app.utils.showToast("Failed to get your data");
			return;
		}
		view.innerHTML = NavProfile(data);

		const existingModal = document.getElementById("profile-modal");
		if (existingModal) {
			existingModal.remove();
		}

		const profileModal = document.createElement("div");
		profileModal.id = "profile-modal";
		profileModal.className = "profile-modal";
		profileModal.style.display = "none";
		profileModal.innerHTML = `
				 <div class="modal-content">
						<div class="menu-item">
							 <div class="icon-container">
									<img src="/public/assets/profile.svg" alt="Profile icon" class="menu-icon">
							 </div>
							 <a href="/profile" id="profile-link">Your profile</a>
						</div>
						<div class="menu-item">
							 <div class="icon-container">
									<img src="/public/assets/settings.svg" alt="Settings icon" class="menu-icon">
							 </div>
							 <a href="/settings" id="settings-link">Settings</a>
						</div>
						<div class="menu-divider"></div>
						<div class="menu-item">
							 <div class="icon-container">
									<img src="/public/assets/signout.svg" alt="Sign out icon" class="menu-icon">
							 </div>
							 <button id="logout-link">Sign out</button>
						</div>
				 </div>
			`;
		document.body.appendChild(profileModal);

		const button = view.querySelector("#profile-icon");
		button.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();

			const buttonRect = button.getBoundingClientRect();
			profileModal.style.top = `${buttonRect.bottom + window.scrollY}px`;
			profileModal.style.left = `${buttonRect.left + window.scrollX - 16}px`;

			if (profileModal.style.display === "none") {
				showModalWithAnimation(profileModal);
				console.log("Modal shown with animation");
			} else {
				hideModalWithAnimation(profileModal);
				console.log("Modal hidden with animation");
			}
		});

		document.getElementById("settings-link").addEventListener("click", (e) => {
			e.preventDefault();
			hideModalWithAnimation(profileModal);
			app.Router.navigate("/settings");
		});

		document.addEventListener("click", (e) => {
			if (
				profileModal.classList.contains("show") &&
				!profileModal.contains(e.target) &&
				e.target !== button
			) {
				hideModalWithAnimation(profileModal);
				console.log("Modal closed by outside click");
			}
		});

		document
			.getElementById("logout-link")
			.addEventListener("click", async (e) => {
				e.preventDefault();
				hideModalWithAnimation(profileModal);

				await handleLogout()
				
			});
			app.Router.disableReload()
	} catch (error) {
		if (error instanceof app.utils.AuthError) {
			app.Router.navigate("/auth/login");
			return;
		}
	}
});

addEventListener("auth-error", () => {
	app.cleanup.map(clean => {
		if (typeof clean === "function")
			clean()
	})
	app.cleanup = []
	app.Router.navigate("/auth/login")
})

/*
	controller running and we saved cleanup
	function inside controller dispatched and threw auth error
	do we have to catch it or just trust the dispatch
	the function inside the controller would be still running so we have to stop it
	to solve this we dispatch and throw auth error , the controller should be surrounded with try
	catch to catch the error and just exit (return the cleanup function optionally)

*/
