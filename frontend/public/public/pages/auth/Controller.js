export default ()=> {
	const btn = document.getElementById("auth-view").querySelector("#generate")
	btn.addEventListener("click", ()=> {
		if (!app.utils.getCookie("access_token"))
		{
			app.utils.setCookie("access_token", "random")
			console.log("generated");
		}
	})
}