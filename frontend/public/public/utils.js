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
	try
	{
		let data;
		const res = await fetch("http://localhost:8000/api/auth/refresh/", {
			headers : {
				"Accept" : "application/json"
			},
			credentials : "include"
		})
		if (!res.ok)
		{
			if (res.status === 403) // blacklisted
			{
				data = await res.json()
				throw new Error("Error: ", JSON.stringify(data, null, 10))
			}
			if (res.status === 400) // missing
			{
				app.utils.removeCookie("access_token")
				return false
			}	
		}
		// new token
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


const getForceState = () => {
	const force = localStorage.getItem('TransCore-force');
	return force === 'true';
}

const setForceState = (value) => {
	localStorage.setItem('TransCore-force', value ? 'true' : 'false');
}

const utils = { setCookie, removeCookie, getCookie, refreshToken , getForceState, setForceState};

export default utils;
