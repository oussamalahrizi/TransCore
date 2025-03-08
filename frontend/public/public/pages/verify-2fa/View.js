
export default /*html*/`
    <div id="2fa-view" class="twofa-container">
        <div class="inner-container">    
            <form id="form" class="verify-form">
                <h1 class="title">2fa Verification</h1>
                <p class="notes">Please enter the code we sent you!</p>
                <input name="code" type="text" placeholder="6 digit verification" class="verify-input"/>
                <button class="verify-button" type="submit">Verify</button>
                <div class="login-page-div">
                    <p class="notes">Back to login page</p>
                    <a class="login-page" href="/auth/login"> Login</a>
                </div>
            </form>
        </div>
    </div>
`