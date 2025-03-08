
export default /*html*/ `
    <div id="settings" class="settings-container">
        <div id=settings-container class="main-div">
            <h1 class="header">Settings<h1>
            <div id="perso-info" class="infos">
                <h4 class="headers">Personal informations</h4>
                <p class="notes">Update your personal informations</p>
                <form id="img-form" class="profile-card">
                    <h1>Profile picture</h1>
                    <input id="current" name="image" type="file" accept="image/png">
                    <button type="submit" for="input-profile">Update profile</button>
                </form>
                <form id="infos-form" class="form-class">
                    <label class="input-titles" >First Name</label>
                    <input class="big-input" type="name" placeholder="Imad">
                    <label class="input-titles" >Last name</label>
                    <input class="big-input" type="name" placeholder="Delfag">
                    <label class="input-titles" >Username</label>
                    <input class="big-input" type="name" placeholder="Yachiro">
                    <label class="input-titles" >Email</label>
                    <input class="big-input" type="email" placeholder="Player123@gmail.com">
                    <div class="button-div">
                        <button class="save">Save changes</button>
                    </div>
                </form>
            </div>
            <div id="update-pass" class="password">
                <h4 class="headers">Update your password</h4>
                <p class="notes">Complet the steps below to change your password</p>
                <form id="update-pass-form" class="form-class">
                    <label class="input-titles" >Current password</label>
                    <input class="big-input" type="password" placeholder="Current password">
                    <label class="input-titles">New password</label>
                    <input class="big-input" type="password" placeholder="New password">
                    <label class="input-titles" >Password confirmation</label>
                    <input class="big-input" type="password" placeholder="Password confirmation">
                    <div class="button-div">
                        <button class="save">Save changes</button>
                    </div>
                </form>
            </div>
            <div id="acc-security" class="security">
                <h4 class="headers">Account security</h4>
                <p class="notes">Manage your security settings</p>
                <div class="section">
                    <div class="logout">
                        <p class="twofa-title">Enable 2FA</p>
                        <p class="twofanote">This will show a modal to complet 2fa steps</p>
                    </div>
                    <button id="toggle-2fa" class="enable" type="button">Enable</button>
                </div>
                <div class="section">
                    <div class="logout">
                        <h1 class="twofa-title">Blocklist<h1>
                        <p class="twofanote">list of all users that you have blocked</p>
                    </div>
                    <button id="blocklist-btn" type="button">
                        <img src="/public/assets/white-arrow.svg">
                    </button>
                </div>
                <div class="section">
                    <div class="logout">
                        <h1 class="logout-title">Log out<h1>
                        <p class="logout-small">This will take you back to login page</p>
                    </div>
                    <button id="logout-btn" type="button">
                        <img src="/public/assets/red-arrow.svg">
                    </button>
                </div>
            </div>
        </div>
    </div>
`