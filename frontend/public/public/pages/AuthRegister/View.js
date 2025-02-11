export default /*html*/ `
<div id="auth-view" class="bg-gray-100 min-h-screen flex items-center justify-center">
	<div class="flex max-w-md w-full p-6 flex-col rounded-lg shadow-md bg-white">
		<form id="register-form" class="mx-3">
			<h2 class="text-xl font-semibold mb-4 text-center">Register</h2>
			<input type="email" placeholder="Email" name="email" class="mb-3 p-2 border rounded w-full" >
			<input type="text" placeholder="Username" name="username" class="mb-3 p-2 border rounded w-full" >
			<input type="password" placeholder="Password" name="password1" class="mb-3 p-2 border rounded w-full" >
			<input type="password" placeholder="Confirm Password" name="password2" class="mb-3 p-2 border rounded w-full" >
			<button type="submit" id="register-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition duration-300 w-full">
				Register
			</button>
			<div class="mt-5">Already have an account? <a class="text-blue-600" href="/auth/login">Login</a></div>
		</form>
		<div class="flex flex-col mt-2">
			<div class="flex items-center my-4">
				<hr class="flex-grow border-t border-gray-300">
				<span class="mx-2 text-gray-500">OR</span>
				<hr class="flex-grow border-t border-gray-300">
			</div>
			<button id="login-intra"
				class="mb-2 bg-black text-white  p-2 rounded-lg">Sign in with 42 Intra</button>
			<button id="login-google"
				class="bg-black text-white p-2 rounded-lg">Sign in with Google</button>
		</div>
	</div>
</div>
`;