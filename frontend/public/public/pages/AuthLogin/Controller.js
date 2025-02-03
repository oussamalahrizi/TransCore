import { showToast } from "../../Components/toast.js"

const login = async ({email, password, force_logout}) => {
    try {
        const headers = {
            "Content-Type" : "application/json",
            "Accept" : "application/json"
        }
        const body = JSON.stringify({email, password, force_logout})
        console.log(body);
        
        const response = await fetch("http://localhost:8000/api/auth/login/", {
            method : "POST",
            headers,
            body 
        })
        const data = await response.json()
        if (!response.ok)
            throw new Error(`${JSON.stringify(data, null, 10)}`)
        console.log(data);
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
    
    form.addEventListener("submit",async (e) => {
        
        e.preventDefault()
        button.disabled = true
        const list = button.className
        button.className = "bg-gray-500 text-white font-semibold py-2 rounded-lg w-full"
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        console.log(data);
        const res = await login({...data, force_logout: false})
        if (res)
        {
            app.router.navigate("/")
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
    
    const url = "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-bb8bb45d805dea5d561774903f1d1899c73b0ac051410cd7cae382331781f8cf&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fauth%2Fintra_callback%2F&response_type=code"
    window.location.href = url;
}

export const GoogleLogin = async () => {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.append("client_id", "497827531703-p9gdfs3jsnjm8hld9ot1uilao6lk1vup.apps.googleusercontent.com");
    url.searchParams.append("redirect_uri", "http://localhost:8000/auth/google_callback");
    url.searchParams.append("response_type", "code");
    url.searchParams.append("scope", "email profile");
    window.location.href = url.toString()
}