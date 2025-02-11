import { showToast } from "../../Components/toast.js"

const GoogleCallback = async (code) => {
    try {

        let data;
        const url = new URL("http://localhost:8000/api/auth/intra_callback/")
        url.searchParams.append("code", code)
        if (app.utils.getForceState())
            url.searchParams.append("force_logout", "true")
        const response = await fetch(url, {credentials : "include"})
        data = await response.json()
        if (!response.ok)
            throw new Error(data.detail ? data.detail : JSON.stringify(data, null, 2))
        app.utils.setCookie("access_token", data.access_token)
        showToast("Logged in successfully", 'green')
        app.Router.navigate("/")
    } catch (error) {
        showToast(error, "red")
        app.Router.navigate("/auth/login")
    }
}

export default () => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get("code")
    if (!code)
    {
        showToast("No code was given", 'red')
        app.Router.navigate("/auth/login")
        return
    }
    GoogleCallback(code)
}