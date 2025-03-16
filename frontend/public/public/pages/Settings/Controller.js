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
            app.Router.navigate("/auth/login")
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
            app.Router.navigate("/auth/login")
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

const handleLogout = async () => {
    try {
        const {data, error} = await app.utils.fetchWithAuth("/api/auth/logout/")
        if (!error) {
            app.utils.removeCookie("access_token")
            dispatchEvent(new CustomEvent("websocket", {detail : {type : "close"}}))
            dispatchEvent(new CustomEvent("navbar-profile"))
            app.Router.navigate("/auth/login")
            return
        }
        app.utils.showToast(data.detail)
    } catch (error) {
        if (error instanceof app.utils.AuthError) {
            app.Router.navigate("/auth/login")
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
    const view = document.getElementById("acc-security");
    
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
        
        const imageform = document.getElementById("img-form")
        imageform.addEventListener("submit", (e)=>{
            e.preventDefault();
            const formdata = new FormData(imageform);
            const file = formdata.get("image");
            if (file)
            {
                const fileExtension = file.name.split('.').pop().toLowerCase();
                if (fileExtension !== 'png')
                {
                    alert("Please upload a PNG image.");
                    return;
                }
            }
            else
            {
                alert("Please select an image to upload.");
            }
            const data = Object.fromEntries(formdata.entries());
            var profile = document.getElementById("current")
            profile.value = formdata.name;
            console.log(data);
        })
    }
    catch (error) {
        console.error("Error in Settings controller:", error);
        if (error instanceof app.utils.AuthError) {
            app.Router.navigate("/auth/login")
            return
        }
        app.utils.showToast("An error occurred loading settings.");
    }
}
