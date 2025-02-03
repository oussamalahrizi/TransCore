import { showToast } from "./Components/toast.js"
import routes from "./routes.js"



export const checkAccessToken = async () => {
	const token = app.utils.getCookie("access_token")
	return token
}

const handleAuthGuard = async (content, route) => {
	// url requires authenticated
	if (content.auth_guard && !checkAccessToken()) {
		const res = await app.utils.refreshToken()
		// either 400 or 403  means refresh not in cookies
		if (res)
			return true
		Router.navigate("/auth/login")
		return false;
	}
	if (route.startsWith("/auth") && (await checkAccessToken()))
	{
		showToast("Already logged in", 'green')
		Router.navigate("/")
		return false
	}
	return true;
}


const Router = {
	init :  () => {
		// listen for url changes in history events
		// called only when using forward and backward arrows of browser
		window.addEventListener("popstate", (e) => Router.navigate(e.state.route, false)) 
		Router.navigate(location.href)
	},
	navigate : async (route, useHistory=true) => {
		if (useHistory)
			window.history.pushState({ route }, '', route)
		route = new URL(route, window.location.origin).pathname
		let content = routes[route]
		// redirect uknown routes to 404
		if (!content)
		{
			Router.navigate("/404")
			return
		}
		// handling auth guard
		const authorized = await handleAuthGuard(content, route);
		if (!authorized)
			return;
		// injecting content in the root div and running the controller
		const root = document.getElementById("root")
		while (root.firstChild) {
			root.removeChild(root.firstChild);
		}
		root.innerHTML = content.view;
		document.head.title = content.title
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
	}
}

export default Router