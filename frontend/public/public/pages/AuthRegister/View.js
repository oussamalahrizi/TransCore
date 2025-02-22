// export const chihaja =/*html*/ `
// <div id="auth-view" class="bg-gray-100 min-h-screen flex items-center justify-center">
// <div class="flex max-w-md w-full p-6 flex-col rounded-lg shadow-md bg-white">
// 		<form id="register-form" class="mx-3">
// 			<h2 class="text-xl font-semibold mb-4 text-center">Register</h2>
// 			<input type="email" placeholder="Email" name="email" class="mb-3 p-2 border rounded w-full" >
// 			<input type="text" placeholder="Username" name="username" class="mb-3 p-2 border rounded w-full" >
// 			<input type="password" placeholder="Password" name="password1" class="mb-3 p-2 border rounded w-full" >
// 			<input type="password" placeholder="Confirm Password" name="password2" class="mb-3 p-2 border rounded w-full" >
// 			<button type="submit" id="register-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition duration-300 w-full">
// 				Register
// 			</button>
// 			<div class="mt-5">Already have an account? <a class="text-blue-600" href="/auth/login">Login</a></div>
// 		</form>
// 		<div class="flex flex-col mt-2">
// 				<div class="flex items-center my-4">
// 					<hr class="flex-grow border-t border-gray-300">
// 					<span class="mx-2 text-gray-500">OR</span>
// 					<hr class="flex-grow border-t border-gray-300">
// 				</div>
// 				<button id="login-intra"
// 					class="mb-2 bg-black text-white  p-2 rounded-lg">Sign in with 42 Intra</button>
// 				<button id="login-google"
// 					class="bg-black text-white p-2 rounded-lg">Sign in with Google</button>
// 		</div>
// </div>
// </div>
// `;

export default /*html*/`
<div id="auth-view" class="register-container">
	<div class="inner-container">
		<form id="register-form" class="register-form-css">
			<h2 class="register-title">Create new account</h2>
			<p class="notes">Create your account in a few steps</p>
			<br>
			<p class="infos">Email</p>
			<input type="email" placeholder="Player123@gmail.com" name="email" class="register-form-input" >
			<p class="infos">Username</p>
			<input type="text" placeholder="Player123" name="username" class="register-form-input" >
			<p class="infos">Password</p>
			<input type="password" placeholder="***********" name="password1" class="register-form-input" >
			<p class="infos">Password confirmation</p>
			<input type="password" placeholder="***********" name="password2" class="register-form-input" >
			<button type="submit" id="register-btn" class="register-button">Register</button>
		</form>
		<div class="flex items-center my-4">
			<hr class="border">
				<span>OR</span>
			<hr class="border">
		</div>
		<button id="login-google" class="signingooglebutton">
			<img src="/public/assets/google.svg" alt="SVG Icon">
			<p style="margin-left: 0.75rem;">Sign in with google</p>
		</button>
		<button id="login-intra" class="signingooglebutton">
			<img width="25" height="25" style="margin-right: 0.75rem;" src="/public/assets/intra.svg" alt="SVG Icon">
			<p style="margin-right: 0.75rem;">Sign in with intra</p>
		</button>
		<div class="login-page-div">
			<p class="notes">Already have an account?</p>
			<a class="login-page" href="/auth/login"> Login</a>
		</div>
	</div>
</div>

`