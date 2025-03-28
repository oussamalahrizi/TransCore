
const login = async ({email, password}) => {
    try {
        const headers = {
            "Content-Type" : "application/json",
            "Accept" : "application/json"
        }
        const body = JSON.stringify({email, password})
        console.log(body);
        
        const response = await fetch("/api/auth/login/", {
            method : "POST",
            headers,
            body 
        })
        const data = await response.json()
        if (!response.ok)
            throw new Error(data.detail ? data.detail : JSON.stringify(data, null, 2))
        if (data["2fa"] === true)
        {
            app.user_id = data.user_id
            app.Router.navigate("/auth/verify-2fa")
            return
        }
        app.utils.setCookie("access_token", data.access_token)
        dispatchEvent(new CustomEvent("websocket", {detail : {type : "open"}}))
        dispatchEvent(new CustomEvent("navbar-profile"))
        dispatchEvent(new CustomEvent("play-button"));
        return true
    } catch (error) {
        app.utils.showToast(error, 'red')
        console.error(error)
        return false
    }
}


export default  () => {
 
        const view = document.getElementById('auth-view')
        const form = view.querySelector("#login-form")
        const button = view.querySelector("#login-btn")
        
        form.addEventListener("submit", async (e) => {
            e.preventDefault()
            button.disabled = true
            const list = button.className
            button.style = "background-color: #e2e8f0; color: white; font-weight: 600; padding-top: 0.5rem; padding-bottom: 0.5rem; border-radius: 0.5rem; width: 100%;"
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            const res = await login(data)
            if (res)
            {
                app.Router.navigate("/")
                return
            }
            button.className = list
            button.disabled = false
        })
    
        // social login
        const intra = view.querySelector("#login-intra")
        intra.addEventListener("click", IntraLogin)
        const google = view.querySelector("#login-google")
        google.addEventListener("click", GoogleLogin)

}

export const IntraLogin = async () => {
    
    const url = new URL("https://api.intra.42.fr/oauth/authorize");
    url.searchParams.append("client_id", "u-s4t2ud-18f8278d214900868a7d2706fc12e3de85389d73c1b7bdc246e3590e477d423f");
    url.searchParams.append("redirect_uri", "https://localhost:8000/auth/intra_callback");
    url.searchParams.append("response_type", "code");
    window.location.href = url.toString()
}

export const GoogleLogin = async () => {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.append("client_id", "497827531703-p9gdfs3jsnjm8hld9ot1uilao6lk1vup.apps.googleusercontent.com");
    url.searchParams.append("redirect_uri", "https://localhost:8000/auth/google_callback");
    url.searchParams.append("response_type", "code");
    url.searchParams.append("scope", "email profile");
    window.location.href = url.toString()
}