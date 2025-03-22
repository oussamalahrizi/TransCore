export default /*html*/ `
    <div id="settings" class="settings-container">
        <div id=settings-container class="main-div">
            <h1 class="header">Settings<h1>
            <div id="perso-info" class="infos">
                <h4 class="headers">Personal informations</h4>
                <p class="notes">Update your personal informations</p>
                <form id="img-form" class="profile-card">
                    <h1>Profile picture</h1>
                    <label id="label-img-form" for="input-image">
                        <img id="current" class="w-full" />
                        <input name="image" id="input-image" type="file" accept="image/png" hidden>
                    </label>
                    <button type="submit" for="input-profile">Update profile</button>
                </form>
                <form id="infos-form" class="form-class">
                    <label class="input-titles" >Username</label>
                    <input class="big-input" type="name" name="username" placeholder="Current Username">
                    <label class="input-titles" >Email</label>
                    <input class="big-input" type="email" name="email" placeholder="Current Email">
                    <div class="button-div">
                        <button id="save-change-infos" class="save">Save changes</button>
                    </div>
                </form>
            </div>
            <div id="update-pass" class="password">
                <h4 class="headers">Update your password</h4>
                <p class="notes">Complet the steps below to change your password</p>
                <form id="update-pass-form" class="form-class">
                    <label class="input-titles" >Current password</label>
                    <input class="big-input" name="current_password" type="password" placeholder="Current password">
                    <label class="input-titles">New password</label>
                    <input class="big-input" name="password" type="password" placeholder="New password">
                    <label class="input-titles" >Password confirmation</label>
                    <input class="big-input" name="confirm_password" type="password" placeholder="Password confirmation">
                    <div class="button-div">
                        <button class="save">Save changes</button>
                    </div>
                </form>
            </div>
            <div id="acc-security" class="security">
                <h4 class="headers">Account security</h4>
                <p class="notes">Manage your security settings</p>
                <div id="twofa-section" class="section">
                    <div class="logout" aria-label="Toggle Two-Factor Authentication" title="Click to toggle 2FA">
                        <p class="twofa-title">Enable 2FA</p>
                        <p class="twofanote">This will show a modal to complet 2fa steps</p>
                    </div>
                    <button id="toggle-2fa" class="enable" type="button">Enable</button>
                </div>
                <div id="blocklist-section" class="section">
                    <div class="logout" aria-label="View Blocklist" title="Click to view your blocklist">
                        <h1 class="twofa-title">Blocklist<h1>
                        <p class="twofanote">list of all users that you have blocked</p>
                    </div>
                    <button id="blocklist-btn" type="button">
                        <img src="/public/assets/white-arrow.png">
                    </button>
                </div>
                <div id="logout-section" class="section">
                    <div class="logout" aria-label="Log out" title="Click to log out">
                        <h1 class="logout-title">Log out<h1>
                        <p class="logout-small">This will take you back to login page</p>
                    </div>
                    <button id="logout-btn" type="button">
                        <img src="/public/assets/red-arrow.png">
                    </button>
                </div>
            </div>
        </div>
    </div>
`