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


const my_data = async (view) => {
    try {
        const {error, data} = await app.utils.fetchWithAuth("/api/auth/users/me/")
        if (error)
        {
            app.utils.showToast(error)
            return
        }
        view.querySelector("#auth-data").innerText = JSON.stringify(data, null, 4)
    } catch (error) {
        if (error instanceof app.utils.AuthError)
        {
            app.Router.navigate("/auth/login")
            return
        }
        console.log(error);
        return
    }
}

const api_data = async (view) => {
    try {
        const {data, error} = await app.utils.fetchWithAuth("/api/main/user/me/")
        if (error)
        {
            app.utils.showToast(error)
            return
        }
        view.querySelector("#api-data").innerText = JSON.stringify(data, null, 4)
    } catch (error) {
        if (error instanceof app.utils.AuthError)
        {
            app.Router.navigate("/auth/login")
            return
        }
        console.log(error);
        return
    }
}

const sendNotif = async () => {
    try {
        const {data, error} = await app.utils.fetchWithAuth('/api/auth/send_notif/')
        if (error)
        {
            app.utils.showToast(error)
            return
        }
        app.utils.showToast(data.detail, 'green')
    } catch (error) {
        if (error instanceof app.utils.AuthError)
        {
            app.Router.navigate("/auth/login")
            return
        }
        console.log(error);
    }
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
            dispatchEvent(new CustomEvent("websocket", {detail : {type : "close"}}))
            app.Router.navigate("/auth/login")
            return
        }
        showToast(data.detail)
        return
    })
    view.querySelector("#fetch-data").addEventListener("click", () => my_data(view))
    view.querySelector("#fetchapi-data").addEventListener("click", () => api_data(view))
    view.querySelector("#send-notif").addEventListener("click", sendNotif)
    const banme = view.querySelector("#ban-self")
    banme.addEventListener("click", async () => {
        const {error, data} = await app.utils.fetchWithAuth("/api/auth/users/ban_me/")
        if (error)
            return
        showToast(data.detail, "green")
    })
}