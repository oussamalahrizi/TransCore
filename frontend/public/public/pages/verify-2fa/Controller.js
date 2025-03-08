

const handleLocation = async (url) => {
    try {
        const response = await fetch("http://localhost:8000" + url, {
            headers : {
                "Accept" : "application/json"
            }
        })
        const data = await response.json()
        if (!response.ok)
        {
            app.utils.showToast(data.detail)
            return
        }
        app.utils.setCookie("access_token", data.access_token)
        app.utils.showToast("Logged in successfully", 'green')
        app.Router.navigate("/")
    } catch (error) {
        app.utils.showToast(error)
        console.log(error);
    }
}

/**
 * @param {object} code - code from form 
*/
const handleVerify = async (code, username) => {
    try {
        const response = await fetch("http://localhost:8000/api/auth/users/verify-2fa/", {
            method : "POST",
            headers : {
                "Content-Type" : "application/json",
                "Accept" : "application/json"
            },
            body : JSON.stringify({code, username})
        })
        const data = await response.json()
        if (!response.ok)
        {
            app.utils.showToast(data.detail)
            return
        }
        console.log(data);
        // send get request to login with value of data.Location
        await handleLocation(data.Location)
    } catch (error) {
        app.utils.showToast(error)
        console.log("error : ", error);
    }
}

export default () => {
    if (!app.username)
    {
        app.utils.showToast("Username missing")
        app.Router.navigate("/auth/login")
        return
    }
    const view = document.getElementById("2fa-view")
    const form = view.querySelector("#form")
    form.addEventListener("submit", async (e) => {
        e.preventDefault()
        const formdata = new FormData(form)
        const data = Object.fromEntries(formdata.entries())
        await handleVerify(data["code"], app.username)
    })
}