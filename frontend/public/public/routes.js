import Home from "./pages/Home/index.js"
import authLogin from "./pages/AuthLogin/index.js";
import authRegister from "./pages/AuthRegister/index.js";
import NotFound from "./pages/NotFound/index.js"
import AuthGoogle from "./pages/GoogleCallback/index.js";
import AuthIntra from "./pages/IntraCallback/index.js";
import Socket from "./pages/Socket/index.js";
import PasswordReset from "./pages/PasswordReset/index.js"
import Settings from "./pages/Settings/index.js"
import Verify from "./pages/verify-2fa/index.js"

export default {
	"/auth/verify-2fa" : {
		view : Verify.View,
		controller: Verify.Controller,
		auth_guard: false	
	},
	"/sockets" : {
		view : Socket.View,
		controller: Socket.Controller,
		auth_guard: false
	},
	"/404": {
		view: NotFound.View,
		controller: null,
		auth_guard: false,
		style : null
	},
	"/": {
		view: Home.View,
		controller: Home.Controller,
		auth_guard: true
	},
	"/profile": {
		view: Home.View,
		controller: Home.Controller,
		auth_guard: true
	},
	"/auth/google_callback": {
		view: AuthGoogle.View,
		controller: AuthGoogle.Controller,
		auth_guard: false,
	},
	"/auth/intra_callback": {
		view: AuthIntra.View,
		controller: AuthIntra.Controller,
		auth_guard: false,
	},
	"/auth/forgot_password": {
		view: PasswordReset.View,
		controller: PasswordReset.Controller,
		auth_guard: false,
	},
	"/auth/2fa": {
		view: NotFound.View,
		controller: null,
		auth_guard: false,
	},
	"/auth/login": {
		view: authLogin.View,
		controller: authLogin.Controller,
		auth_guard: false,
		style: "/public/styles/authlogin.css"
	},
	"/auth/register": {
		view: authRegister.View,
		controller: authRegister.Controller,
		auth_guard: false,
		style: "/public/styles/register.css"
	},
	"/settings": {
		view: Settings.View,
		controller: Settings.Controller,
		auth_guard: true,
	},
};

