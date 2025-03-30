import { IntraLogin, GoogleLogin } from "../AuthLogin/Controller.js"

const register = async ({username, email, password1, password2}) => {
    try {
        if (password1 !== password2)
        {
            app.utils.showToast('password missmatch', 'red')
            return false
        }
        const headers = {
            "Content-Type" : "application/json",
            "Accept" : "application/json"
        }
        const body = JSON.stringify({username, email, password : password1, password2})
        
        const response = await fetch("/api/auth/register/", {
            method : "POST",
            headers,
            body
        })
        const data = await response.json()
        if (!response.ok)
            throw new Error(data.detail ? data.detail : JSON.stringify(data, null, 2))
        app.utils.showToast(data.detail ? data.detail : JSON.stringify(data, null, 2)
            , 'green')
        return true
    } catch (error) {
        app.utils.showToast(error, 'red')
        console.error(error)
        return false
    }
}

export default ()=> {

        const view = document.getElementById('auth-view')
        const form = view.querySelector("#register-form")
        const button = view.querySelector("#register-btn")
    
        form.addEventListener("submit", async (e) => {
            e.preventDefault()
            const list = button.className
            button.disabled = true
            button.className = "bg-gray-500 text-white font-semibold py-2 rounded-lg w-full"
            const formData = new FormData(form)
            const data = Object.fromEntries(formData.entries())
            const res = await register(data)
            if (res)
            {
                app.Router.navigate("/auth/login")
                return
            }
            button.className = list
            button.disabled = false
        })
        // social login
        const intra = view.querySelector("#login-intra")
        if (intra)
            intra.addEventListener("click", IntraLogin)
        const google = view.querySelector("#login-google")
        if (google)
            google.addEventListener("click", GoogleLogin)
   
}