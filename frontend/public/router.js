import "./UserList.js";

const routes = new Map();

export function addRoute(path, component) {
  routes.set(path, component);
}

addRoute("/", "user-list");

export function navigateTo(path) {
  window.history.pushState({}, path, window.location.origin + path);
  renderRoute();
}

function renderRoute() {
  const path = window.location.pathname;

  const component = routes.get(path);
  if (component) {
    const container = document.getElementById("root");
    container.innerHTML = "";
    const element = document.createElement(component);
    console.log(element);

    container.appendChild(element);
  } else {
    const container = document.getElementById("root");
    container.innerHTML = "404 not found";
  }
}

window.onpopstate = () => {
  document.addEventListener("click", (e) => {
    e.preventDefault();
  });
  renderRoute();
};

export function initRouter() {
  renderRoute();
}

initRouter();
