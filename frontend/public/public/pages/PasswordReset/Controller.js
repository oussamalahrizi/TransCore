import Router from "../../Router.js"
import { verifyView } from "./View.js"

const handleSubmit = async (email) => {
    const body = JSON.stringify({email})
    const {data, status, error} = await app.utils.fetchWithout("/api/auth/password_reset/",
    "POST",body
    )
    
    if (status !== 202)
    {
        app.utils.showToast(error)
        return false
    }
    app.utils.showToast(data.detail, 'green')
    return true
}

const handleCodeSubmit = async (code, email) => {
    const body = JSON.stringify({code, email})
    const {data, status, error} = await app.utils.fetchWithout("/api/auth/password_verify/",
        "POST", body
    )

    if (status !== 200)
    {
        app.utils.showToast(error)
        return false
    }
    app.utils.showToast(data.detail, "green")
    return true
}

const handleVerify = async (view, email) => {

    const form = document.getElementById("verify-form")
    const verify = form.querySelector("#verify-btn")
    form.addEventListener("submit", async (e) => {
        e.preventDefault()
        const formData = new FormData(form)
        const { code } = Object.fromEntries(formData.entries())
        if (!code)
        {
            app.utils.showToast("Please enter the code received from email")
            return
        }
        verify.disabled = true
        const list = verify.className
        verify.className = "bg-gray-200 text-white font-semibold py-2 rounded-lg"
        const bool = await handleCodeSubmit(code, email)
        if (bool)
        {
            app.Router.navigate("/auth/login")
            return
        }
        verify.className = list
        verify.disabled = false
    })
}


export default async () => {
    try {
        const view = document.getElementById("reset-pw-view")
        const form = view.querySelector("#reset-form")
        const reset = view.querySelector("#reset-btn")
        form.addEventListener("submit", async(e) => {
            e.preventDefault()
            const formData = new FormData(form);
            const { email } = Object.fromEntries(formData.entries());
            if (!email)
            {
                app.utils.showToast("Please enter an email")
                return
            }
            reset.disabled = true
            const list = reset.className
            reset.className = "bg-gray-200 text-white font-semibold py-2 rounded-lg"
            const bool = await handleSubmit(email)
            if (bool)
            {
                while (view.firstChild) {
                    view.removeChild(view.firstChild);
                }
                view.innerHTML = verifyView
                handleVerify(view, email)
                return
            }
            reset.className = list
            reset.disabled = false
        })
    } catch (error) {
        app.utils.showToast("failed to load css")
        app.router.navigate("/404")
        return
    }
}