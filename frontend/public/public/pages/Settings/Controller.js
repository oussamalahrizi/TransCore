import {ModalView, controller as modalController} from "./Components/Modal.js"
import {BlocklistModalView, controller as blocklistModalController} from "./Components/BlocklistModal.js"
import { showModalWithAnimation } from "/public/modalAnimations.js"

let currentTwoFAState = null;

const getState = async (forceRefresh = false) => {
    if (currentTwoFAState !== null && !forceRefresh) {
        return currentTwoFAState;
    }

    try {
        const {data, error} = await app.utils.fetchWithAuth("/api/auth/users/me/")
        if (error) {
            app.utils.showToast(error)
            return null
        }
        console.log("Fetched 2FA state:", data.two_factor_enabled);
        
        currentTwoFAState = data.two_factor_enabled;
        return currentTwoFAState;
    }
    catch (error) {
        if (error instanceof app.utils.AuthError)
            return
        return null
    }
}

const updateButtonText = (state) => {
    const toggle = document.getElementById("toggle-2fa");
    if (!toggle) {
        console.error("Toggle button not found");
        return;
    }
    
    toggle.innerText = state ? "Disable" : "Enable";
    
    toggle.dataset.enabled = state;
    
    console.log(`Button updated: ${toggle.innerText}`);
}

const enable = async () => {
    try {
        const view = document.getElementById("settings")
        const wrapper = document.createElement("div")
        wrapper.id = "modal-wrapper"
        wrapper.className = "fixed top-0 left-0 min-h-screen w-full flex justify-center items-center bg-black/50"
        wrapper.style.display = "none"
        wrapper.innerHTML = ModalView
        
        window.twoFAEnabledCallback = async () => {
            console.log("2FA enabled callback triggered");
            currentTwoFAState = true;
            updateButtonText(true);
        };
        
        view.appendChild(wrapper)
        if (typeof showModalWithAnimation === 'function') {
            showModalWithAnimation(wrapper);
        } else {
            wrapper.style.display = "block";
        }
        modalController()
    } catch (error) {
        console.error("Error enabling 2FA:", error);
        app.utils.showToast("Error enabling 2FA. Please try again.");
    }
}

const disable = async () => {
    try {
        const {data, error} = await app.utils.fetchWithAuth("/api/auth/users/disable-2fa/")
        if (error) {
            app.utils.showToast(error)
            return false;
        }
        
        console.log("2FA disabled successfully");
        app.utils.showToast(data.detail, "green")
        
        currentTwoFAState = false;
        updateButtonText(false);
        
        return true;
    } catch (error) {
        console.error("Error disabling 2FA:", error);
        app.utils.showToast("Error disabling 2FA. Please try again.");
        return false;
    }
}

const toggleCallback = async (e) => {
    const button = e.target;
    const currentState = button.dataset.enabled === "true";
    
    try {
        console.log("Current button state:", currentState);
        
        button.disabled = true;
        
        if (currentState) {
            const success = await disable();
            if (success) {
                button.innerText = "Enable";
                button.dataset.enabled = "false";
            }
        } else {
            await enable();
        }
    } catch (error) {
        console.error("Error in toggle callback:", error);
        if (error instanceof app.utils.AuthError) {
            return;
        }
        app.utils.showToast("An error occurred. Please try again.");
    } finally {
        button.disabled = false;
    }
}

const handleRefreshState = async () => {
    const state = await getState(true);
    console.log("Refreshed state from server:", state);
    
    if (state === null) {
        console.error("Could not retrieve 2FA state");
        return;
    }
    
    updateButtonText(state);
}

export const handleLogout = async () => {
    try {
        const {data, error} = await app.utils.fetchWithAuth("/api/auth/logout/")
        if (!error) {
            app.utils.removeCookie("access_token")
            dispatchEvent(new CustomEvent("websocket", {detail : {type : "close"}}))
            console.log("dispatch socket");
            dispatchEvent(new CustomEvent("navbar-profile"))
            console.log("dispatch navbar");
            dispatchEvent(new CustomEvent("play-button"));
            console.log("dispatch play button");
            app.Router.navigate("/auth/login")
            return
        }
        app.utils.showToast(data.detail)
    } catch (error) {
        if (error instanceof app.utils.AuthError) {
            return
        }
        console.error("Logout error:", error)
    }
}

const openBlocklistModal = async () => {
    try {
        const view = document.getElementById("settings")
        const wrapper = document.createElement("div")
        wrapper.id = "blocklist-modal-wrapper"
        wrapper.className = "fixed top-0 left-0 min-h-screen w-full flex justify-center items-center bg-black/50"
        wrapper.style.display = "none"
        wrapper.innerHTML = BlocklistModalView
        view.appendChild(wrapper)
        if (typeof showModalWithAnimation === 'function') {
            showModalWithAnimation(wrapper);
        } else {
            wrapper.style.display = "block";
        }
        blocklistModalController()
    } catch (error) {
        console.error("Error opening blocklist modal:", error);
        app.utils.showToast("Error opening blocklist. Please try again.");
    }
}

export default async () => {
    
    try {
        const initialState = await getState(true);
        console.log("Initial 2FA state:", initialState);
        
        const toggleButton = document.getElementById("toggle-2fa");
        const twoFASection = document.getElementById("twofa-section");
        const twoFADiv = twoFASection.querySelector(".logout");
        
        if (toggleButton) {
            toggleButton.innerText = initialState ? "Disable" : "Enable";
            toggleButton.dataset.enabled = initialState;
            
            toggleButton.addEventListener("click", toggleCallback);
            
            twoFADiv.style.cursor = "pointer";
            twoFADiv.addEventListener("click", (e) => {
                if (!e.target.closest("#toggle-2fa")) {
                    toggleCallback({
                        target: toggleButton
                    });
                }
            });
        } else {
            console.error("2FA toggle button not found");
        }
        
        const blocklistSection = document.getElementById("blocklist-section");
        const blocklistDiv = blocklistSection.querySelector(".logout");
        const blocklistBtn = document.getElementById("blocklist-btn");
        
        blocklistDiv.style.cursor = "pointer";
        blocklistDiv.addEventListener("click", openBlocklistModal);
        
        blocklistBtn.addEventListener("click", openBlocklistModal);
        
        const logoutSection = document.getElementById("logout-section")
        const logoutDiv = logoutSection.querySelector(".logout")
        const logoutBtn = document.getElementById("logout-btn")
        
        logoutDiv.style.cursor = "pointer"
        logoutDiv.addEventListener("click", handleLogout)
        
        logoutBtn.addEventListener("click", handleLogout)
        
        // set image for display
        await setImageUpload()
        // bind image form to submit
        const imageform = document.getElementById("img-form")
        imageform.addEventListener("submit", async (e)=>{
            e.preventDefault();
            const formdata = new FormData(imageform);
            const file = formdata.get("image");
            if (file)
            {                
                if (file.type !== 'image/png')
                {
                    alert("Please upload a PNG image.");
                    imageform.reset()
                    return;
                }
            }
            else
            {
                alert("Please select an image to upload.");
                imageform.reset()
                return
            }
            const data = Object.fromEntries(formdata.entries());            
            await handleUpload({image : data["image"]})
            imageform.reset()
        })
        // hady dial bind form event to send request to update user info f backend
        bindUpdateInfo()
        // other bind forms ba9i dial icon and password 

        const pw_container = document.getElementById("update-pass")
        const form_password = pw_container.querySelector("#update-pass-form")
        form_password.addEventListener("submit", async (e)=> {
            e.preventDefault()
            e.stopPropagation()
            const formdata = new FormData(form_password)
            const data = Object.fromEntries(formdata.entries())
            console.log("form data",data);
            await handlePassword({
                current : data.current_password,
                new_pass : data.password,
                confirm_pass : data.confirm_password
            })
            form_password.reset()
        })
    }
    catch (error) {
        console.error("Error in Settings controller:", error);
        if (error instanceof app.utils.AuthError) {
            return
        }
        app.utils.showToast("An error occurred loading settings.");
    }
}

const setImageUpload = async () => {
    console.log("setting image");
    
    const {error, data} = await app.utils.fetchWithAuth("/api/auth/users/me/")
    const current = document.getElementById("current")
    var url = "/public/assets/icon-placeholder.svg"
    current.className ="object-cover"    
    if (error)
    {
        app.utils.showToast(error)
        current.src = url
        return
    }
    url = data.icon_url
    if (url && !url.startsWith("https"))
        url += `?nocache=${Date.now()}`
    current.src = url    
}

const handleUpload = async ({image}) => {
    
    const {data, error} = await app.utils.fetchWithAuth(
        "/api/auth/users/image/",
        'POST',
        image,
        "image/png"
    )
    if (error)
    {
        console.error(error);
        app.utils.showToast(error)
        await setImageUpload()
        return
    }
    app.utils.showToast(data.detail, "green")
    await setImageUpload()
}

/**
 * @param {Object} options
 * @param {string} options.current
 * @param {string} options.new_pass
 * @param {string} options.confirm_pass
 */
const handlePassword = async ({current, new_pass , confirm_pass}) => {
    const body = {}
    if (!current || !current.trim().length)
    {
        app.utils.showToast("missing value current")
        return
    }
    if (!new_pass || !new_pass.trim().length)
    {
        app.utils.showToast("missing value new password")
        return
    }
    if (!confirm_pass || !confirm_pass.trim().length)
    {
        app.utils.showToast("missing value confirm password")
        return
    }
    if (confirm_pass !== new_pass)
    {
        app.utils.showToast("Password Missmatch")
        return
    }
    body.old_password = current
    body.new_password = confirm_pass
    const {error, data} = await app.utils.fetchWithAuth("/api/auth/users/update_password/",
        'PATCH',
        JSON.stringify(body)
    )
    if (error)
    {
        app.utils.showToast(error)
        return
    }
    app.utils.showToast(data.detail, "green")
}

/**
 * 
 * @param {Object} options
 * @param {string} options.username 
 * @param {string} options.email 
 * @returns 
 */

const handleUpdate = async ({username, email}) => {
    // Only include non-empty fields in the request body
    const requestBody = {};
    if (username && username.trim() !== '') {
        requestBody.username = username;
    }
    if (email && email.trim() !== '') {
        requestBody.email = email;
    }
    if (Object.keys(requestBody).length === 0)
    {
        app.utils.showToast("Please fill in your infos")
        return
    }
    console.log(requestBody);
    
    const {data, error} = await app.utils.fetchWithAuth(
        "/api/auth/users/update/",
        "PATCH",
       JSON.stringify(requestBody)
    )
    if (error)
    {
        app.utils.showToast(error)
        return
    }
    console.log("data after patch info : ", data);
    app.utils.showToast(data.detail, "green")
}

const bindUpdateInfo = () => {
    try {
        const view = document.getElementById("settings")
        const form = view.querySelector("#infos-form")
        const button = view.querySelector("#save-change-infos")
        form.addEventListener("submit", async (e)=> {
            e.preventDefault()
            button.disabled = true
            const formdata = new FormData(form)
            const data = Object.fromEntries(formdata.entries())
            await handleUpdate(data)
            button.disabled = false
            form.reset()
    })
    } catch (error) {
        if (error instanceof app.utils.AuthError)
        {
            return
        }
        app.utils.showToast("Something went wrong, check console")
        console.log(error);
        return
    }
}
