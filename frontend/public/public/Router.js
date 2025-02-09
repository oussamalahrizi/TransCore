import { showToast } from "./Components/toast.js";
import routes from "./routes.js";

export const checkAccessToken = () => {
	const token = app.utils.getCookie("access_token"); // Use utils.getCookie
	return token;
};

const refreshLocal = async () => {
	try
	{
		const response = await fetch("http://localhost:8000/api/auth/refresh/", { credentials : "include"})
		const data = await response.json()
		if (response.status === 400)
			return false
		else if (response.status === 403)
		{
			showToast(data.detail)
			return false
		}
		return true
	} catch (error) {
		console.error(error);
		return false
	}
}

const handleAuthGuard = async (content, route) => {
	const token = checkAccessToken();

	if (route.startsWith("/auth"))
	{
		if (token)
		{
			showToast("You are already logged in", "green")
			return false
		}
		console.log("refresh starts with auth");
		const res = await refreshLocal()
		if (res) return false
		return true
	}	
	if (content.auth_guard && !token) {
		console.log("refresh requires auth");
		const res = await refreshLocal(); // Use utils.refreshToken
		if (res) return true;
		Router.navigate("/auth/login")
		return false;
	}
	return true;
};	

const Router = {
	init :  () => {
		// listen for url changes in history events
		// called only when using forward and backward arrows of browser
		window.addEventListener("popstate", (e) => Router.navigate(e.state.url, false))
		Router.navigate(location.href)
	},
	navigate : async (url, useHistory=true) => {
		const route = new URL(url, window.location.origin).pathname
		const content = app.routes[route]
		// redirect uknown routes to 404
		if (!content)
		{
			Router.navigate("/404")
			return
		}
		// handling auth guard
	
		const authorized = await handleAuthGuard(content, route);
		if (!authorized)
			return
		if (useHistory)
			window.history.pushState({ url }, '', url)
		/*
			TODO :
				make sure if you are signing out or something to close the online websocket
		*/
		// injecting content in the root div and running the controller
		const root = document.getElementById("root")
		
		while (root.firstChild)
			root.removeChild(root.firstChild);

		root.innerHTML = content.view;
		document.head.title = content.title
		content.controller && content.controller()
		// disabling default behavior for anchor tags
		Router.disableReload()
	},
	disableReload : ()=> {
		const a = document.querySelectorAll("a")
		if (a.length)
		{
			a.forEach(tag => {
				tag.addEventListener("click", e => {
					const external = /^(http|https|mailto|ftp):/.test(tag.getAttribute("href"))
					if (!external)
					{
						e.preventDefault()
						Router.navigate(e.target.getAttribute("href"))
					}
				})
			})
		}
	}
}

export default Router