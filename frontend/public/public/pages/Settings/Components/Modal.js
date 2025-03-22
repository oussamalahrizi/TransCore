import { hideModalWithAnimation } from "/public/modalAnimations.js";

export const ModalView = /*html*/ `
    <div class="fa-container">
        <div class="fa-cross-title-div">
            <p class="fa-title">2FA Settings</p>
            <button id="close-modal">
                <img src="/public/assets/cross.svg" class="cross-hover"/>
            </button>
        </div>
        <h1 class="fa-enable2fatext">Enable 2FA</h1>
        <p class="fa-notes">Scan this QR Code with your authenticator app.</p>
        <div id="img_container" class="fa-image">
            <img id="code-image" />
        </div>
        <input id="code-input" type="text" placeholder="Enter 6-digit verification code."class="fa-code-input"/>
        <button id="verify-btn" class="fa-verifybutton">Verify</button>
    </div>
`

const LoadingView = /*html*/ `
    <div class="loading-div">
        <div class="loading-animation"></div>
    </div>
`

const fetchImage = async () => {
    const {data, error} = await app.utils.fetchWithAuth("/api/auth/users/enable-2fa/")
    if (error)
    {
        app.utils.showToast(error)
        return null
    }
    return data
}

const fetchCode = async (code) => { 
    const body = JSON.stringify({code})
    const {data, error} = await app.utils.fetchWithAuth("/api/auth/users/enable-2fa/", "POST", body)
    if (error)
    {
        app.utils.showToast(error)
        return false
    }
    app.utils.showToast(data.detail, "green")
    return true
}

const handleVerify = async (e, modal, view) => {
    await app.utils.ButtonHandler(e.target, async () => {
        const input = modal.querySelector("#code-input")
        if (!input.value.length)
        {
            app.utils.showToast("Please Enter the verification code")
            return
        }
        const bool = await fetchCode(input.value)
        if (!bool)
            return
            
        if (window.twoFAEnabledCallback && typeof window.twoFAEnabledCallback === 'function') {
            try {
                console.log("Calling twoFAEnabledCallback");
                window.twoFAEnabledCallback();
            } catch (err) {
                console.error("Error in twoFAEnabledCallback", err);
            }
        } else {
            console.log("twoFAEnabledCallback not found");
        }
        
        if (typeof hideModalWithAnimation === 'function') {
            hideModalWithAnimation(modal, () => {
                view.removeChild(modal);
            });
        } else {
            view.removeChild(modal);
        }
    })
}

export const controller = async () => {
    try {
        const view = document.getElementById("settings")
        const modal = view.querySelector("#modal-wrapper")
        modal.addEventListener("click", (e) => {
            if (e.target === modal)
                hideModalWithAnimation(modal, () => view.removeChild(modal))
        })
        console.log("modal controller");
        const cross = modal.querySelector("#close-modal")
        cross.addEventListener("click", () => {
            if (typeof hideModalWithAnimation === 'function') {
                hideModalWithAnimation(modal, () => {
                    view.removeChild(modal);
                });
            } else {
                view.removeChild(modal);
            }
        })
        
        const img_container = modal.querySelector("#img_container")
        const loading = document.createElement("div")
        loading.innerHTML = LoadingView 
        img_container.appendChild(loading)
        const data = await fetchImage()
        if (data === null)
            return
        const img = document.createElement("img")
        img.src = `data:image/png;base64,${data}`
        img.className = "w-75 h-75"
        img_container.removeChild(loading)
        img_container.appendChild(img)
        const verify = modal.querySelector("#verify-btn")
        verify.addEventListener("click", (e) => handleVerify(e, modal, view))
    } catch (error) {
        if (error instanceof app.utils.AuthError)
        {
            return
        }
    }
}