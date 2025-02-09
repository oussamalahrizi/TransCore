
import { showToast } from "../../Components/toast.js"
import { QRCodeView } from "./View.js"

const show = (state, view, enable) => {
    const container = view.querySelector("#qrcode-container")
    state ? container.innerHTML = '' : container.innerHTML = QRCodeView
    enable.textContent = state ? "Enable" : "Disable"
    return !state
}

const getState = async () => {
    const { data, status, error } = await app.utils.fetchWithAuth("http://localhost:8000/api/auth/users/me/")
    if (error)
    {
        showToast(error)
        return
    }
}

export default async () => {
    const view = document.getElementById("settings")
    const enable = view.querySelector("#enable")

    let state = false
    state = show(state, view, enable)
    enable.addEventListener("click", () => {
        state = show(state, view, enable)
    })
}