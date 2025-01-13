import Home from "./pages/Home/index.js"
import auth from "./pages/auth/index.js";
import NotFound from "./pages/NotFound/index.js"

const routes = {
	"/404": {
		view: NotFound.View,
		controller: null,
		title: "404",
		auth_guard: false,
		css : "/public/pages/404/style"
	},
	"/": {
		view: Home.View,
		controller: () => Home.Controller(),
		title: "HomePage",
		css : "/public/pages/Home/style",
		auth_guard: true
	},
	"/profile": {
		view: Home.View,
		controller: () => Home.Controller(),
		title: "HomePage",
		css : "/public/pages/Home/style",
		auth_guard: true
	},
	"/auth": {
		view: auth.View,
		controller: auth.Controller,
		title: "Auth",
		auth_guard: false,
		css : "/public/pages/Home/style"
	},
	"/auth/check_google": {
		view: NotFound.View,
		controller: null,
		title: "Redirecting",
		auth_guard: false,
	},
	"/auth/check_intra": {
		view: NotFound.View,
		controller: null,
		title: "Redirecting",
		auth_guard: false,
	},
	"/auth/2fa": {
		view: NotFound.View,
		controller: null,
		title: "Check 2FA",
		auth_guard: false,
		css : "/public/pages/auth/2fa/style"
	},
};

export default routes;
