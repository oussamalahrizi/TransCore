import { showToast } from "./Components/toast.js";
import Router from "./Router.js"

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


const getForceState = () => {
	const force = localStorage.getItem('TransCore-force');
	return force === 'true';
}

const setForceState = (value) => {
	localStorage.setItem('TransCore-force', value ? 'true' : 'false');
}


const refreshToken = async () => {
    try {
        const res = await fetch("http://localhost:8000/api/auth/refresh/", {
            headers: {
                "Accept": "application/json"
            },
            credentials: "include"
        });

        if (!res.ok) {
            const data = await res.json();
            if (res.status === 403) { // blacklisted
                showToast(data.detail ? data.detail : JSON.stringify(data, null, 2), 'red');
                removeCookie("access_token");
                Router.navigate("/auth/login");
				return false
            } else if (res.status === 400) { // missing,
                removeCookie("access_token");
                Router.navigate("/auth/login");
				return false
            }
			throw new Error(data.detail)
        }

        const data = await res.json();
        setCookie("access_token", data.access_token);
        return true;
    } catch (error) {
        showToast(error, 'red');
        removeCookie("access_token");
        return false;
    }
};

const fetchWithAuth = async (url) => {
    try {
        let response = await fetch(url, {
            headers: {
                'Authorization': "Bearer " + getCookie("access_token"),
                'Accept': 'application/json'
            }
        });
        let data;
        if (response.ok) {
            data = await response.json()
            return {
                data,
                status : response.status,
                error : null
            }
        }

        if (response.status === 401) {
            const refresh = await refreshToken();
            if (!refresh) return {data : null, status: null, error : null};

            response = await fetch(url, {
                headers: {
                    'Authorization': "Bearer " + getCookie("access_token"),
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                data = await response.json()
                return {
                    data,
                    status : response.status,
                    error : null
                }
            }
        }

        if (response.status === 423) {
            data = await response.json();
            removeCookie("access_token");
            showToast(data.detail, 'red');
            Router.navigate('/auth/login');
            const error = data.detail ? data.detail : JSON.stringify(data)
            return {data : null, status : null, error};
        }

        data = await response.json();
        return {data , status : response.status, error : null};
    } catch (err) {
        const error = err
        showToast(err, 'red');
        return {data : null, status : null, error};
    }
}

const fetchWithout = async (url, method=null, body=null) => {
    try {
        let options = {
            headers : {"Content-Type" : "application/json"},
            method : method ? method : "GET",
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

export default {
	setCookie,
	removeCookie,
	getCookie,
	refreshToken,
	getForceState,
	setForceState,
	fetchWithAuth,
    fetchWithout,
    showToast
};

