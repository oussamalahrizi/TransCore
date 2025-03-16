import Home from "./pages/Home/index.js"
import authLogin from "./pages/AuthLogin/index.js";
import authRegister from "./pages/AuthRegister/index.js";
import NotFound from "./pages/NotFound/index.js"
import AuthGoogle from "./pages/GoogleCallback/index.js";
import AuthIntra from "./pages/IntraCallback/index.js";
import PasswordReset from "./pages/PasswordReset/index.js"
import Settings from "./pages/Settings/index.js"
import Verify from "./pages/verify-2fa/index.js"
import Game from "./pages/game/index.js"
import Chat from "./pages/chat/index.js"
import Profile from "./pages/profile/index.js"
import matchmaking from "./pages/matchmaking/index.js"

export default {
	"/auth/verify-2fa" : {
		view : Verify.View,
		controller: Verify.Controller,
		auth_guard: false,
		style : "/public/styles/2fa.css"
	},
	"/404": {
		view: NotFound.View,
		controller: null,
		auth_guard: false,
		style : "/public/styles/notfound.css"
	},
	"/": {
		view: Home.View,
		controller: Home.Controller,
		auth_guard: true,
		style : "/public/styles/home.css"
	},
	"/profile": {
		view: Profile.View,
		controller: Profile.Controller,
		auth_guard: true,
		style: "/public/styles/profile.css"
	},
	"/matchmaking": {
		view: matchmaking.View,
		controller: matchmaking.Controller,
		auth_guard: true,
		style: "/public/styles/matchmaking.css"
	},
	"/auth/google_callback": {
		view: AuthGoogle.View,
		controller: AuthGoogle.Controller,
		auth_guard: false,
	},
	"/chat" : {
		view : Chat.View,
		controller: Chat.Controller,
		auth_guard: true,
		style : "/public/pages/chat/style.css"
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
		style : "/public/styles/forgotpass.css"
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
		style : "/public/styles/settings.css"
	},
	"/game": {
		view: Game.View,
		controller: Game.Controller,
		auth_guard: true,
	}
};

