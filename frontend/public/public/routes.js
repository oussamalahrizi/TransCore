import Home from "./pages/Home/index.js"
import authLogin from "./pages/AuthLogin/index.js";
import authRegister from "./pages/AuthRegister/index.js";
import NotFound from "./pages/NotFound/index.js"
import AuthGoogle from "./pages/GoogleCallback/index.js";
import AuthIntra from "./pages/IntraCallback/index.js";
import Socket from "./pages/Socket/index.js";
import PasswordReset from "./pages/PasswordReset/index.js"

const routes = {
	"/sockets" : {
		view : Socket.View,
		controller: Socket.Controller,
		title: "Sockets Baby",
		auth_guard: false
	},
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
		view: AuthIntra.View,
		controller: AuthIntra.Controller,
		title: "Signing in Intra 42",
		auth_guard: false,
	},
	"/auth/forgot_password": {
		view: PasswordReset.View,
		controller: PasswordReset.Controller,
		title: "Reset Password",
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
