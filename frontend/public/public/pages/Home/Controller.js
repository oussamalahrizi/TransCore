import { showToast } from "../../Components/toast.js";


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

        // Append the new link to the head
        document.head.appendChild(link);
        console.log(`📥 Added new CSS with href: ${href}`);
    })
}



export default  () => {
    const view = document.getElementById("home-view")
    const logout = view.querySelector("#logout")
    logout.addEventListener("click", async () => {
        const {data, error} = await app.utils.fetchWithAuth("http://localhost:8000/api/auth/logout/")
        if (!error)
        {
            app.utils.removeCookie("access_token")
            showToast("Logged out successfully", 'green')
            app.router.navigate("/auth/login")
            return
        }
        showToast(data.detail)
        return
    })
    view.querySelector("#fetch-data").addEventListener("click", async (e)=> {
        e.preventDefault()
        const {error, data} = await app.utils.fetchWithAuth("http://localhost:8000/api/auth/users/me/")
        if (error)
            return
        view.querySelector("p").innerText = JSON.stringify(data, null, 2)
    })
    const banme = view.querySelector("#ban-self")
    banme.addEventListener("click", async () => {
        const {error, data} = await app.utils.fetchWithAuth("http://localhost:8000/api/auth/users/ban_me/")
        if (error)
            return
        showToast(data.detail, "green")
    })
}