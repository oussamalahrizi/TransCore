import Router from "./Router.js";
import utils from "./utils.js";
import routes from "./routes.js";

window.app = {};

app.Router = Router
app.utils = utils
app.routes = routes

window.addEventListener("DOMContentLoaded", () => {
  app.Router.init()  
});
