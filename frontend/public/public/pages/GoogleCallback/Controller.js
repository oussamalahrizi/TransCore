import { showToast } from "../../Components/toast.js"

const GoogleCallback = async (code) => {
    try {

        let data;
        const url = new URL("http://localhost:8000/api/auth/google_callback/")
        url.searchParams.append("code", code)
        if (app.utils.getForceState())
            url.searchParams.append("force_logout", "true")
        const response = await fetch(url)
        if (!response.ok)
        {
            data = await response.json()
            throw new Error(JSON.stringify(data, null, 10))
        }
        data = await response.json()
        app.utils.setCookie("access_token", data.access_token)
        showToast("Logged in successfully", 'green')
        app.router.navigate("/")
    } catch (error) {
        showToast(error, "red")
        app.router.navigate("/auth/login")
    }
}

export default () => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get("code")
    if (!code)
    {
        showToast("No code was given", 'red')
        app.router.navigate("/auth/login")
        return
    }
    GoogleCallback(code)
}