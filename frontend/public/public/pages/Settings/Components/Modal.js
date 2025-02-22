
export const ModalView = /*html*/ `
    <div class="text-white flex flex-col rounded-lg bg-gray-900 max-w-sm w-full p-4">
        <div class="flex justify-between mb-3">
            <p>2FA Settings</p>
            <button id="close-modal">
                <img src="/public/assets/cross.svg" class="hover:opacity-100 opacity-80"/>
            </button>
        </div>
        <div class="justify-center w-full flex text-2xl font-semibold">
            Enable 2FA
        </div>
        <div class="flex w-full justify-center text-gray-500 mt-1 mb-3 text-sm">
            Scan this QR Code with your authenticator app.
        </div>
        <div id="img_container" class="flex w-full justify-center my-2 mb-3">
            <img id="code-image" />
        </div>
        <input id="code-input" type="text" placeholder="Enter 6-digit verification code."
            class="bg-black px-3 py-2 mb-2 rounded-lg focus:outline-none"/>
        <button id="verify-btn" class="bg-green-600 rounded-full flex justify-center py-2 hover:bg-green-700">
            Verify
        </button>
    </div>
`

const LoadingView = /*html*/ `
    <div class="flex justify-center items-center w-full">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
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
        view.removeChild(modal)
        view.dispatchEvent(new CustomEvent("refresh_state"))
    })
}

export const controller = async () => {
    try {
        const view = document.getElementById("settings")
        const modal = view.querySelector("#modal-wrapper")
        console.log("modal controller");
        const cross = modal.querySelector("#close-modal")
        cross.addEventListener("click", () => {
            view.removeChild(modal)
        })
        // fetch image
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
            app.Router.navigate("/auth/login")
            return
        }
    }

}