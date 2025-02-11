import { showToast } from "../../Components/toast.js"

const login = async ({email, password}) => {
    try {
        const headers = {
            "Content-Type" : "application/json",
            "Accept" : "application/json"
        }
        const force_logout = app.utils.getForceState();
        const body = JSON.stringify({email, password, force_logout})
        console.log(body);
        
        const response = await fetch("http://localhost:8000/api/auth/login/", {
            method : "POST",
            headers,
            body 
        })
        const data = await response.json()
        if (!response.ok)
            throw new Error(data.detail ? data.detail : JSON.stringify(data, null, 2))
        app.utils.setCookie("access_token", data.access_token)
        showToast("Logged in successfully", 'green')
        return true
    } catch (error) {
        showToast(error, 'red')
        console.error(error)
        return false
    }
}

export default () => {
    const view = document.getElementById('auth-view')
    const form = view.querySelector("#login-form")
    const button = view.querySelector("#login-btn")
    // set force state
    const force = view.querySelector("#force")
    force.checked = app.utils.getForceState() 
    force.addEventListener("change", (e) => app.utils.setForceState(e.target.checked) ) 
    
    form.addEventListener("submit",async (e) => {
        
        e.preventDefault()
        button.disabled = true
        const list = button.className
        button.className = "bg-gray-200 text-white font-semibold py-2 rounded-lg w-full"
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const res = await login({...data, force_logout: false})
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
    if (intra)
        intra.addEventListener("click", IntraLogin)
    const google = view.querySelector("#login-google")
    if (google)
        google.addEventListener("click", GoogleLogin)
}

export const IntraLogin = async () => {
    
    const url = new URL("https://api.intra.42.fr/oauth/authorize");
    url.searchParams.append("client_id", "u-s4t2ud-18f8278d214900868a7d2706fc12e3de85389d73c1b7bdc246e3590e477d423f");
    url.searchParams.append("redirect_uri", "http://localhost:8000/auth/intra_callback");
    url.searchParams.append("response_type", "code");
    window.location.href = url.toString()
}

export const GoogleLogin = async () => {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.append("client_id", "497827531703-p9gdfs3jsnjm8hld9ot1uilao6lk1vup.apps.googleusercontent.com");
    url.searchParams.append("redirect_uri", "http://localhost:8000/auth/google_callback");
    url.searchParams.append("response_type", "code");
    url.searchParams.append("scope", "email profile");
    window.location.href = url.toString()
}