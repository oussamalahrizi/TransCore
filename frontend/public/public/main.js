import Router from "./Router.js";
import utils from "./utils.js";
import routes from "./routes.js";
import { SetOnline } from "./Websockets.js";

window.app = {};

app.Router = Router
app.utils = utils
app.routes = routes
app.username = null
app.websocket = null

window.addEventListener("DOMContentLoaded", () => {
   app.Router.init()
});

window.addEventListener("websocket", (e) => {
   const { type } = e.detail
   if (type === "close" && app.websocket)
   {
      app.websocket.close()
      app.utils.showToast("Your now offline")
      console.log("websocket event : closed socket");
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