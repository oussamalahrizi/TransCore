import Home from "./pages/Home/index.js"
import authLogin from "./pages/AuthLogin/index.js";
import authRegister from "./pages/AuthRegister/index.js";
import NotFound from "./pages/NotFound/index.js"
import AuthGoogle from "./pages/AuthGoogle/index.js";

const routes = {
	"/404": {
		view: NotFound.View,
		controller: null,
		title: "404",
		auth_guard: false,
	},
	"/": {
		view: Home.View,
		controller: () => Home.Controller(),
		title: "HomePage",
		auth_guard: true
	},
	"/profile": {
		view: Home.View,
		controller: () => Home.Controller(),
		title: "HomePage",
		auth_guard: true
	},
	"/auth/google_callback": {
		view: AuthGoogle.View,
		controller: AuthGoogle.Controller,
		title: "Signing in Google",
		auth_guard: false,
	},
	"/auth/intra_callback": {
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
	},
	"/auth/login": {
		view: authLogin.View,
		controller: authLogin.Controller,
		title: "Login",
		auth_guard: false,
	},
	"/auth/register": {
		view: authRegister.View,
		controller: authRegister.Controller,
		title: "Register",
		auth_guard: false,
	},
};

export default routes;
