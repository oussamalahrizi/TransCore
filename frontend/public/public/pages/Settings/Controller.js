
import {ModalView, controller as modalController} from "./Components/Modal.js"

const getState = async () => {
    try
    {
        const {data, error} = await app.utils.fetchWithAuth("/api/auth/users/me/")
        if (error)
        {
            app.utils.showToast(error)
            return null
        }
        console.log("data 2Fa : ", data.two_factor_enabled);
        
        return data.two_factor_enabled
    }
    catch (error)
    {
        if (error instanceof app.utils.AuthError)
            app.Router.navigate("/auth/login")
        return null
    }
}

const enable = async () => {
    const view = document.getElementById("settings")
    const wrapper = document.createElement("div")
    wrapper.id = "modal-wrapper"
    wrapper.className = "fixed top-0 left-0 min-h-screen w-full flex justify-center items-center bg-black/50"
    wrapper.innerHTML = ModalView
    view.appendChild(wrapper)
    modalController()
}
const disable = async () => {
    const view = document.getElementById("settings")
    const {data, error} = await app.utils.fetchWithAuth("/api/auth/users/disable-2fa/")
    if (error)
    {
        app.utils.showToast(error)
        return
    }
    console.log("data in disable : ", data);
    app.utils.showToast(data.detail, "green")
    view.dispatchEvent(new CustomEvent("refresh_state"))
}

const toggleCallback = async (state, e) => {
    
    try {    
        console.log("state in toggle :", state);

        if(state === true)
        {
            e.target.innerText = "Disable"   
            await disable()
        }
        else
        {
            e.target.innerText = "Enable"
            await enable()
        }
    } catch (error) {
        if (error instanceof app.utils.AuthError)
        {
            app.Router.navigate("/auth/login")
            return
        }
    }
}


const handleRefreshState = async (e) => {
    const state = await getState()
    if (state === null)
        return
    const toggle = e.target.querySelector("#toggle-2fa")    
    const newToggle = toggle.cloneNode(true)
    newToggle.innerText = state === true ? "Disable" : "Enable"
    newToggle.addEventListener("click",(e)=> toggleCallback(state, e))
    toggle.replaceWith(newToggle)
}

export default async () => {
    const view = document.getElementById("settings")
    try {
        view.addEventListener("refresh_state", handleRefreshState)
        view.dispatchEvent(new CustomEvent("refresh_state"))
    } catch (error) {
        if (error instanceof app.utils.AuthError)
        {
            app.Router.navigate("/auth/login")
            return
        }
    }
}
