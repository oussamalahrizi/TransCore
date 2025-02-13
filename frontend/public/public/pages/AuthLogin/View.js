export default /*html*/ `
	<div id="auth-view" class="bg-black min-h-screen flex items-center justify-center">
		<div class="flex max-w-md w-full p-6 flex-col rounded-lg shadow-md bg-slate-200">
			<form id="login-form" class="mx-3">
				<h2 class="text-xl font-semibold mb-4 text-center">Login</h2>
				<input type="email" placeholder="Email" required autocomplete="email" name="email" class="mb-3 p-2 border rounded w-full">
				<input type="password" placeholder="Password" name="password" autocomplete="current-password" class="mb-3 p-2 border rounded w-full">
				<button type="submit" id="login-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition duration-300 w-full">
					Login
				</button>
				<div class="flex items-center my-3">
					<input type="checkbox" id="force" class="mr-2 scale-125 bg-black border-white checked:accent-green-500 ">
					<label for="force" class="text-gray-700 ">Force Logout from other devices</label>
				</div>
				<div class="mt-2">Don't have an account? <a class="text-blue-600" href="/auth/register">Register</a></div>
				<div class="mt-2">Forgot password?? <a class="text-blue-600" href="/auth/forgot_password">Reset here</a></div>
			</form>
			<div class="flex flex-col">
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

