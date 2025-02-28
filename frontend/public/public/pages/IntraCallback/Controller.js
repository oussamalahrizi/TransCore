import { showToast } from "../../Components/toast.js"

const IntraCallback = async (code) => {
    try {

        let data;
        const url = new URL("http://localhost:8000/api/auth/intra_callback/")
        url.searchParams.append("code", code)
        const response = await fetch(url, {credentials : "include"})
        data = await response.json()
        if (!response.ok)
            throw new Error(data.detail ? data.detail : JSON.stringify(data, null, 2))
        if (data["2fa"] === true)
        {        
            app.username = data.username
            app.Router.navigate("/auth/verify-2fa")
            return
        }
        app.utils.setCookie("access_token", data.access_token)
        dispatchEvent(new CustomEvent("websocket", {detail : {type : "open"}}))
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
    IntraCallback(code)
}