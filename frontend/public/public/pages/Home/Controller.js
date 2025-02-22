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
        const {data, error} = await app.utils.fetchWithAuth("/api/auth/logout/")
        if (!error)
        {
            app.utils.removeCookie("access_token")
            showToast("Logged out successfully", 'green')
            app.Router.navigate("/auth/login")
            return
        }
        showToast(data.detail)
        return
    })
    view.querySelector("#fetch-data").addEventListener("click", async (e)=> {
        e.preventDefault()
        try {
            const {error, data, status} = await app.utils.fetchWithAuth("/api/auth/users/me/")
            if (error)
            {
                showToast(error)
                return
            }
            view.querySelector("p").innerText = JSON.stringify(data, null, 2)
        } catch (error) {
            if (error instanceof app.utils.AuthError)
            {
                app.Router.navigate("/auth/login")
                return
            }
            console.log(error);
            return
        }
    })
    const banme = view.querySelector("#ban-self")
    banme.addEventListener("click", async () => {
        const {error, data} = await app.utils.fetchWithAuth("/api/auth/users/ban_me/")
        if (error)
            return
        showToast(data.detail, "green")
    })
}