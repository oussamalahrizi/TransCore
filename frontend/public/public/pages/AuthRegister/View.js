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
		<div style="display: flex; align-items: center; margin-top: 1rem; margin-bottom: 1rem;">
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