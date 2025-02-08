import Router from "./Router.js";
import utils from "./utils.js";
window.app = {};

app.router = Router;
app.utils = utils;
window.addEventListener("DOMContentLoaded", () => {
  app.router.init();
});
