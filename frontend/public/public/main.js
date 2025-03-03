import Router from "./Router.js";
import utils from "./utils.js";
import routes from "./routes.js";
import { SetOnline } from "./Websockets.js";
import NavProfile, {placeholder} from "./Components/NavProfile.js"

window.app = {};

app.Router = Router
app.utils = utils
app.routes = routes
app.username = null
app.websocket = null

addEventListener("DOMContentLoaded", () => {
   app.Router.init()
});

addEventListener("websocket", (e) => {
   const { type } = e.detail
   if (type === "close" && app.websocket)
   {
      app.websocket.close()
      return
   }
   if (!app.utils.getCookie("access_token"))
      return
   SetOnline()
   if (app.websocket.readyState === WebSocket.CLOSED)
   {
      console.log("failed");
   }
   else
      console.log("success");
})

addEventListener("navbar-profile", async (e)=> {
   const token = app.utils.getCookie("access_token")
   const view = document.getElementById("profile-container")   
   if (!token)
   {
      while(view.firstChild)
         view.removeChild(view.firstChild)
      view.innerHTML = /*html*/`
         <a href="/"
         class="text-[#94979C] hover:text-[#94979C] text-lg font-semibold mx-2" >Sign In</a>
      `
      return
   }
   
   // user logged in, display user profile button to go to profile page
   // display place holder view in case fetching user data failed
   try {
      const {data, error} = await app.utils.fetchWithAuth("/api/auth/users/me/")
      if (error)
      {
         view.innerHTML = placeholder
         app.utils.showToast("Failed to get your data")
         return
      }
      view.innerHTML = NavProfile(data)
      const button = view.querySelector("#profile-icon")
      button.addEventListener("click", ()=> {
         app.Router.navigate("/404")
      })
   } catch (error) {
      if (error instanceof app.utils.AuthError)
      {
         app.Router.navigate("/auth/login")
         return
      }
   }
})