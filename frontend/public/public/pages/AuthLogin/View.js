export default /*html*/`
	<div id ="auth-view" class="login-container">
		<div class="inner-container">
			<form id="login-form" class="login-form-css">
				<h2 class="login-title">Log In to your account</h2>
				<p class="notes">Welcome back! Please enter your details.</p>
				<br>
				<p class="emailandpass">Email</p>
				<input type="email" placeholder="Please enter your Email" required autocomplete="email" name="email" class="login-form-input">
				<p class="emailandpass">Password</p>
				<input type="password" placeholder="Please enter your Password" name="password" autocomplete="current-password" class="login-form-input">
					<button type="submit" id="login-btn" class="signinbutton">Sign in</button>
			</form>
			<button id="login-google" class="signingooglebutton">
				<img src="/public/assets/google.svg" alt="SVG Icon">
				<p style="margin-left: 0.75rem;">Sign in with google</p>
			</button>
			<button id="login-intra" class="signingooglebutton">
				<img width="25" height="25" style="margin-right: 0.75rem;" src="/public/assets/intra.svg" alt="SVG Icon">
				<p style="margin-right: 0.75rem;">Sign in with intra</p>
			</button>
			<div class="register-div">
				<p class="notes">Don't have an account ?</p>
				<a class="register" href="/auth/register">Register</a>
			</div>
			<div class=" forgot-pass-div">
				<p class="notes">Forgot your password ?</p>
				<a class="forgot-pass" href="/auth/forgot_password" >Reset</a>
			</div>
		</div>
	</div>
`