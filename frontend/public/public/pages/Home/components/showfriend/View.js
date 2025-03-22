/**
 * @param {{id, username, icon_url}} friend
 */
export default (friend) => /*html*/ `
<div class="friend-modal-content">
    <div class="friend-menu-item">
        <div class="friend-icon-container">
            <img src="/public/assets/user.svg" alt="Profile icon" class="friend-menu-icon">
        </div>
        <button id="view-profile-${friend.id}">View profile</button>
    </div>
    <div class="friend-menu-item">
        <div class="friend-icon-container">
            <img src="/public/assets/game.svg" alt="Game icon" class="friend-menu-icon">
        </div>
        <button id="invite-game-${friend.id}">Invite to game</button>
    </div>
    <div class="friend-menu-divider"></div>
    <div class="friend-menu-item">
        <div class="friend-icon-container">
            <img src="/public/assets/unfriend.svg" alt="Unfriend icon" class="friend-menu-icon">
        </div>
        <button id="unfriend-${friend.id}">Unfriend</button>
    </div>
    <div class="friend-menu-item">
        <div class="friend-icon-container">
            <img src="/public/assets/block.svg" alt="Block icon" class="friend-menu-icon">
        </div>
        <button id="block-${friend.id}">Block user</button>
    </div>
</div>
`;