import { showToast } from "../../Components/toast.js";


const LoadCss = (href) => {
	return new Promise(async (resolve, reject) => {
        const existingLink = document.head.querySelector(`link[href="${href}"]`);
        if (existingLink)
            return resolve()
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;

        link.onload = () => {
            console.log(`✅ CSS loaded: ${href}`);
            resolve();
        };

        link.onerror = (error) => {
            console.error(`❌ Failed to load CSS: ${href}`, error);
			document.head.removeChild(link)
            reject(new Error(`Failed to load CSS at ${href}`));
        };

        // Append the new link to the head
        document.head.appendChild(link);
        console.log(`📥 Added new CSS with href: ${href}`);
    })
}


const fetchWithAuth = async (url, method="GET", body=null) => {
    try {
        const headers = {
            'Authorization': "Bearer " + app.utils.getCookie("access_token"),
            'Accept' : 'application/json' 
        };
        const options = { method, headers };
        if ((method === "POST" || method === "PATCH") && body) {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
        let response = await fetch(url, options);
        if (!response.ok)
        {
            if (response.status === 401)
            {
                const retry = await app.utils.refreshToken();
                // refresh also failed
                if (!retry) return false;
                // got new token
                // also update the auth header with newly access token from cookies
                response = await fetch(url, {...options, headers : {...headers, 'Authorization': "Bearer " + app.utils.getCookie("access_token")}});
                // failed again and its not 401
                if (!response.ok)
                {
                    const data = await response.json();
                    throw new Error(`Error: ${JSON.stringify(data, null, 10)}`);
                }
                // bypassed 401 after retrying again
                return true;
            }
            // another error other than 401
            const data = await response.json();
            throw new Error(`Error: ${JSON.stringify(data, null, 10)}`);
        }
        return true;
    } catch (error) {
        showToast(step + error , 'red');
        return false;
    }
}


export default  () => {
    const view = document.getElementById("home-view")
    const logout = view.querySelector("#logout")
    logout.addEventListener("click", async () => {
        const res = await fetchWithAuth("http://localhost:8000/api/auth/logout/")
        if (res)
        {
            app.utils.removeCookie("access_token")
            showToast("Logged out successfully", 'green')
            app.router.navigate("/auth/login")
        }
    })
}