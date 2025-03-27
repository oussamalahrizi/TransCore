import { showToast, showConfirmToast } from "./Components/toast.js";

const removeCookie = (name) =>  {
	if (getCookie(name))
    	document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

const setCookie = (name, value) => {
    let expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}

const  getCookie = (name) => {
	// Split document.cookie string and get all individual name=value pairs in an array
	const cookies = document.cookie.split(';');
  
	// Loop through the cookies array
	for (let i = 0; i < cookies.length; i++) {
	  let cookie = cookies[i].trim();
  
	  // If this cookie starts with the name we want, extract its value
	  if (cookie.startsWith(name + '=')) {
		return cookie.substring(name.length + 1); // Return the cookie value
	  }
	}
	return null
}

class AuthError extends Error
{
    constructor()
    {
        super()
        this.message = "requires login"
    }
}

const refreshToken = async () => {
    const res = await fetch("/api/auth/refresh/", {
        headers: {
            "Accept": "application/json"
        },
        credentials: "include"
    });
    const data = await res.json()
    if (!res.ok) {
        if (res.status === 403) {
            // blacklisted
            showToast(data.detail ? data.detail : JSON.stringify(data, null, 2), 'red');
            removeCookie("access_token");
            // Router.navigate("/auth/login");
            dispatchEvent(new CustomEvent( "auth-error"))
            throw new AuthError()
        } else if (res.status === 400) {
            
            removeCookie("access_token");
            dispatchEvent(new CustomEvent("auth-error"))
            throw new AuthError()
        }
    }
    setCookie("access_token", data.access_token);
};

const fetchWithAuth = async (url, method=null, body=null, content_type=null) => {
    const finalurl = url
    
    let options = {
        method : method ?? "GET",
    }
    let headers = {
        'Authorization': "Bearer " + getCookie("access_token"),
        'Accept': 'application/json'
    }
    if (body)
    {
        options = {...options, body}
        headers = {...headers, 'Content-Type' : content_type ? content_type :  "application/json"}
    }

    let response = await fetch(finalurl, {
        ...options,
        headers
    });
    const data = await response.json();
    if (response.ok) {
        return {
            data,
            status : response.status,
            error : null
        }
    }

    if (response.status === 401) {
        await refreshToken()
        return await fetchWithAuth(url, method, body)
    }

    if (response.status === 423) {
        removeCookie("access_token");
        showToast(data.detail, 'red');
        dispatchEvent(new CustomEvent("auth-error"))
        throw new AuthError()
    }
    
    return {
        data ,
        status : response.status,
        error : data.detail ? data.detail : JSON.stringify(data, null, 2)};
}

const fetchWithout = async (url, method=null, body=null) => {
    try {
        let options = {
            headers : {"Content-Type" : "application/json"},
            method : method ?? "GET",
        }
        if (body)
            options = {...options, body}
        const response = await fetch(url, options);
        let data
        if (!response.ok)
        {
            if (response.headers.get("Content-Type") !== "application/json") {
                return {
                    data, 
                    status : response.status,
                    error : "Something went wrong : " + response.status
                }
            }
            data = await response.json()
            return {
                data,
                status: response.status,
                error: data.detail ? data.detail : JSON.stringify(data, null, 2)
            };
        }
        data = await response.json()
        return { data, status: response.status, error: null };
    } catch (error) {
        console.error(error);
        return { data: null, status: null, error };
    }
}

/**
 * Sets the loading state for a button element.
 *
 * @param {HTMLButtonElement} button - The button element to set the loading state for.
 * @param {Function} handler - button handler.
 * @param {Event} e - button handler.
 */
const ButtonHandler = async (button, handler) => {
    try
    {
        const child = button.firstChild
        const img = document.createElement("img")
        img.src = "/public/assets/loading.svg"
        img.className = "w-5 h-5 invert animate-spin"
        button.replaceChild(img, child)
        button.disabled = true
        // run the handler
        await handler();
        // restore button
        button.disabled = false
        button.replaceChild(child ,img)
    
    }
    catch (error) {
        if (error instanceof AuthError)
        {
            console.log("logged out button handler");
            app.Router.navigate("/auth/login")
            return
        }
        console.log("error button handler : ", error);
        return
    }
}

const LoadCss = async (href) => {

    const load = () =>  new Promise((resolve) => {

        const link = document.head.querySelector("#loadcss");
        if (link)
            link.remove()
        const newlink = document.createElement("link")
        
        newlink.onload = () => {
            console.log(`✅ CSS loaded: ${href}`);
            resolve(true);
        };
        newlink.onerror = (error) => {
            console.log("on error");
            resolve(false)
        }
        newlink.href = href
        newlink.id = "loadcss"
        newlink.rel = 'stylesheet'
        document.head.appendChild(newlink)
    })
    return await load()

}



const LoadCompCss = async (href) => {
    const load = ()=> new Promise((resolve) => {
        const link = document.createElement("link")
        link.onload = () => resolve({loaded : true, elment : link})
        link.onerror = () => resolve({loaded : false, elment : link})
        link.href = href
        link.rel = "stylesheet"
        document.head.appendChild(link)
    })
    return await load()
}

export default {
	setCookie,
	removeCookie,
	getCookie,
	refreshToken,
	fetchWithAuth,
    fetchWithout,
    showToast,
    showConfirmToast,
    AuthError,
    ButtonHandler,
    LoadCss,
    LoadCompCss
};
