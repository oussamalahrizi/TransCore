
export const checkAccessToken = () => {
	const token = app.utils.getCookie("access_token"); // Use utils.getCookie			
	return !!token;
};

const refreshLocal = async () => {
	try {
		const response = await fetch("http://localhost:8000/api/auth/refresh/", { credentials: "include", method: "GET" });
		const data = await response.json();
		if (response.ok)
			return true
		if (response.status === 400)
			return false;
		else if (response.status === 403) {
			app.utils.showToast(data.detail);
			return false;
		}
	} catch (error) {
		console.error("catch error : ", error);
		return false;
	}
}

const handleAuthGuard = async (content, route) => {
	const token = checkAccessToken()

	if (route.startsWith("/auth"))
	{
		if (token)
		{
			await Router.navigate("/")
			return false
		}
		const res = await refreshLocal()
		if (res)
		{
			await Router.navigate("/")
			return false
		}
		return true
	}
	if (content.auth_guard && !token) {
		const res = await refreshLocal();
		if (res) return true;
		await Router.navigate("/auth/login")
		return false;
	}
	return true;
};

const Router = {
	init : async () => {
		// listen for url changes in history events
		onpopstate = (e) => Router.navigate(e.state.url, false);
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
		// excluding intra and google callback from being added to history
		
		// handling auth guard
		const render = await handleAuthGuard(content, route);
		if (!render)
			return
		if (useHistory)
			history.pushState({ url }, '', url)
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