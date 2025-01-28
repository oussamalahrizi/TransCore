import routes from "./routes.js"


export const checkAccessToken = () => {
	const token = app.utils.getCookie("access_token")
	return token
}

const handleAuthGuard =  (content, route) => {
	// url requires auth and no access token
	if (content.auth_guard && !checkAccessToken()) {
		Router.navigate("/auth")
		return false;
	}
	if (route.startsWith("/auth") && checkAccessToken())
	{
		console.log("already logged in");
		Router.navigate("/")
		return false
	}
	// url starts with /auth there is an access token
	return true;
}

const startTokenRefresh =  () => {
	if (!Router.intervalId) {
		console.log("Starting refresh auto");
		Router.intervalId = setInterval(refreshToken, 3000); // Refresh token every 4 minutes
	}
	else
		console.log("interval id NOTTTTTT null : ",Router.intervalId);
}

const stopTokenRefresh =  () => {
	if (Router.intervalId) {
		clearInterval(Router.intervalId);
		Router.intervalId = null;
		app.utils.removeCookie("access_token")
		console.log("stopped worker and removed token");
	}
}


const Router = {
	init : () => {
		// listen for url changes in history events
		// called only when using forward and backward arrows of browser
		window.addEventListener("popstate", (e) => Router.navigate(e.state.route, false))
		Router.navigate(location.pathname)
	},
	navigate : (route, useHistory=true) => {
		if (useHistory)
			window.history.pushState({ route }, '', route)
		let content = routes[route]
		// redirect uknown routes to 404
		if (!content)
		{
			Router.navigate("/404")
			return
		}
		// handling auth guard
		if (!handleAuthGuard(content, route))
			return
		// injecting content in the root div and running the controller
		const root = document.getElementById("root")
		document.head.title = content.title
		root.innerHTML = ''
		root.innerHTML = content.view
		if (content.controller)
			content.controller()
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
	},
	intervalId : null
}

export {stopTokenRefresh}

export default Router