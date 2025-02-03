import { showToast } from "../../Components/toast.js"

const GoogleCallback = async (code) => {
    try {

        let data;
        const response = await fetch("http://localhost:8000/api/auth/google_callback/?code=" + code)
        if (!response.ok)
        {
            if (response.status === 500)
                throw new Error("Internal server Error")
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