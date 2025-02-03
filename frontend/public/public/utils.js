import { showToast } from "./Components/toast.js";
import {checkAccessToken} from "./Router.js"

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

const refreshToken =  async () => {
	try {
		let data;
		const res = await fetch("http://localhost:8000/api/auth/refresh/", {
			headers : {
				"Accept" : "application/json"
			},
			credentials : "include"
		})
		if (!res.ok)
		{
			if (res.status === 500)
				throw new Error("Internal Server Error")
			if (res.status === 400)
				th
			data = await res.json();
			throw new Error(JSON.stringify(data, null, 10))			
		}
		data = await res.json()
		app.utils.setCookie("access_token", data.access_token) // Set cookie with max_age of 4 minutes and 30 seconds
		console.log("Just refreshed the access token", data.access_token, data)
		return true
	}
	catch (error) {
		showToast(error, 'red')
		app.utils.removeCookie("access_token")
		return false
	}
}

const withAuth = async (url, options = {}) => {
	// first add the access token from cookies
	const access = checkAccessToken();
	if (access) {
		options.headers = {
			...options.headers,
			"Authorization": `Bearer ${access}`
		};
	}
	try {
		const response = await fetch(url, options);
		// how do you know if the response tells you to refresh the token
		// or you just cant access this route
		if (!response.ok) {
			if (response.status === 400) {
				const ref = await refreshToken();
				if (!ref)
					throw new Error("Failed to get the refresh token.")
				const newToken = checkAccessToken();
				if (newToken) {
					options.headers["Authorization"] = `Bearer ${newToken}`;
					const retryResponse = await fetch(url, options);
					if (!retryResponse.ok)
						throw new Error(`Request failed with status ${retryResponse.status}`);
					return retryResponse;
				}
			}
			throw new Error(`Request failed with status ${response.status}`);
		}
		return response;
	}
	catch (error) {
		console.error("Fetch error: ", error);
		return Promise.reject(null)
	}
};


const utils = { setCookie, removeCookie, getCookie, refreshToken };

export default utils;
