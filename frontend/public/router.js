import { AuthPage } from "./pages/Auth.js";

const routes = new Map();
const root = document.querySelector("#root");

export const Router = {
  init() {
    // Handle initial load
    this.handleLocation();

    // Handle browser back/forward
    window.addEventListener("popstate", () => {
      this.handleLocation();
    });

    // Handle clicks on links
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-link]")) {
        e.preventDefault();
        this.navigateTo(e.target.href);
      }
    });
  },

  addRoute(path, component) {
    routes.set(path, component);
  },

  navigateTo(url) {
    history.pushState(null, null, url);
    this.handleLocation();
  },

  async handleLocation() {
    const path = window.location.pathname;
    const component = routes.get(path) || routes.get("/404");    

    if (typeof component === "function") {
      // Handle web component class
      const tagName = component.name.toLowerCase();
      // Ensure component is registered
      if (!customElements.get(`${tagName}-comp`)) {
        console.log(`${tagName}-comp`);
        customElements.define(`${tagName}-comp`, component);
      }
      root.innerHTML = `<${tagName}-comp></${tagName}-comp>`;
    }
    else if (typeof component === "string")
      root.innerHTML = component
  },
};

// Default 404 route
Router.addRoute("/404", "<h1>404 Not Found</h1>");

// Add routes
Router.addRoute("/", AuthPage);

// Initialize router
Router.init();
