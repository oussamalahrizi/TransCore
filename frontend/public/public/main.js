import Router from "./Router.js";
import utils from "./utils.js";
import routes from "./routes.js";
import { SetOnline } from "./Websockets.js";
import NavProfile, {placeholder} from "./Components/NavProfile.js"
import { showModalWithAnimation, hideModalWithAnimation } from "./modalAnimations.js";

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

addEventListener("navbar-profile", async (e) => {
   const token = app.utils.getCookie("access_token")
   const view = document.getElementById("profile-container")   
   if (!token)
   {
      while(view.firstChild)
         view.removeChild(view.firstChild)
      view.innerHTML = /*html*/`
         <a href="/" class="sign-in-link">
         <img src="/public/assets/signin.svg" alt="Sign In" class="signin-icon">
            <h1 class="signin-text">Sign In</h1>
         </a>
      `
      return
   }
   
   try {
      const {data, error} = await app.utils.fetchWithAuth("/api/auth/users/me/")
      if (error)
      {
         view.innerHTML = placeholder
         app.utils.showToast("Failed to get your data")
         return
      }
      view.innerHTML = NavProfile(data)
      
      const existingModal = document.getElementById("profile-modal")
      if (existingModal) {
         existingModal.remove()
      }
      
      const profileModal = document.createElement("div")
      profileModal.id = "profile-modal"
      profileModal.className = "profile-modal"
      profileModal.style.display = "none"
      profileModal.innerHTML = `
         <div class="modal-content">
            <div class="menu-item">
               <div class="icon-container">
                  <img src="/public/assets/profile.svg" alt="Profile icon" class="menu-icon">
               </div>
               <a href="#" id="profile-link">Your profile</a>
            </div>
            <div class="menu-item">
               <div class="icon-container">
                  <img src="/public/assets/settings.svg" alt="Settings icon" class="menu-icon">
               </div>
               <a href="/settings" id="settings-link">Settings</a>
            </div>
            <div class="menu-divider"></div>
            <div class="menu-item">
               <div class="icon-container">
                  <img src="/public/assets/signout.svg" alt="Sign out icon" class="menu-icon">
               </div>
               <a href="#" id="logout-link">Sign out</a>
            </div>
         </div>
      `
      document.body.appendChild(profileModal)
      
      const button = view.querySelector("#profile-icon")
      button.addEventListener("click", (e) => {
         e.preventDefault()
         e.stopPropagation()
         
         const buttonRect = button.getBoundingClientRect()
         profileModal.style.top = `${buttonRect.bottom + window.scrollY}px`
         profileModal.style.left = `${buttonRect.left + window.scrollX - 16}px`
         
         if (profileModal.style.display === "none") {
            showModalWithAnimation(profileModal)
            console.log("Modal shown with animation")
         } else {
            hideModalWithAnimation(profileModal)
            console.log("Modal hidden with animation")
         }
      })
      
      document.getElementById("profile-link").addEventListener("click", (e) => {
         e.preventDefault()
         hideModalWithAnimation(profileModal)
         app.Router.navigate("/profile")
      })
      
      document.getElementById("settings-link").addEventListener("click", (e) => {
         e.preventDefault()
         hideModalWithAnimation(profileModal)
         app.Router.navigate("/settings")
      })

      document.addEventListener("click", (e) => {
         if (profileModal.classList.contains("show") && 
             !profileModal.contains(e.target) && 
             e.target !== button) {
            hideModalWithAnimation(profileModal)
            console.log("Modal closed by outside click")
         }
      })
      
      document.getElementById("logout-link").addEventListener("click", async (e) => {
         e.preventDefault()
         hideModalWithAnimation(profileModal)
         
         const {data, error} = await app.utils.fetchWithAuth("/api/auth/logout/")
         if (!error) {
            app.utils.removeCookie("access_token")
            dispatchEvent(new CustomEvent("websocket", {detail : {type : "close"}}))
            dispatchEvent(new CustomEvent("navbar-profile"))
            app.Router.navigate("/auth/login")
            return
         }
         app.utils.showToast(data.detail)
      })
      
   } catch (error) {
      if (error instanceof app.utils.AuthError)
      {
         app.Router.navigate("/auth/login")
         return
      }
   }
});