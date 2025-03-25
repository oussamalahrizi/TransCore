export default /*html*/ `
<div id="chat-view" class="w-full min-h-screen text-white flex flex-col justify-center items-center" style="background: linear-gradient(to top, #057343, #1D1D1D);">
    <div id="chat-container" class="flex">
        <!-- User List Section -->
        <div id="chat-user-list" class="w-1/4">
            <!-- Search Section -->
            <div id="search-section" class="search-section">
            <div class="search-input-container">
                <!-- Search Icon on the Left -->
                <span class="search-icon"></span>
                <!-- Search Input -->
                <input type="text" id="search-user" class="search-input" placeholder="Search users..." aria-label="Search users">
                <!-- Filter Checkbox -->
                <!-- Filter Checkbox (Replaced by Filter Icon) -->
                <label class="filter-label" aria-label="Filter unread messages">
                <input type="checkbox" id="filter-unread" class="filter-checkbox">
                </label>
            </div>
            </div>
            <!-- User List Container -->
            <div id="user-list-container" class="user-list-container"></div>
        </div>
        <!-- Chat Box Section -->
        <div id="chat-box" class="w-3/4 relative">
            <!-- Chat Header with Menu Button -->
            <div id="chat-header" class="chat-header flex justify-between items-center">
                <!-- Chat User Info (Left Side) -->
                <div class="chat-header-info flex items-center">
                    <img id="chat-user-image" src="default-profile.png" alt="User Profile" class="profile-image">
                    <div class="ml-2">
                        <h3 class="chat-with-user"><span id="chat-with-user">User Name</span></h3>
                        <div id="chat-user-status" class="text-sm flex items-center">
                            <span class="status-indicator"></span>
                            <span class="status-text ml-1">Offline</span> <!-- Default status -->
                        </div>
                    </div>
                </div>
                <!-- Menu Button -->
                <button id="menu-button" class="text-gray-400 hover:text-white transition-colors text-2xl" aria-label="Open menu">⋮</button>
            </div>
            <!-- Scrollable Messages Container -->
            <div id="messages" class="messages-container"></div>
            <!-- Input Area -->
            <div id="input-area" class="input-area">
                <input type="text" id="chat-input" class="chat-input" placeholder="Type a message..." aria-label="Type a message">
                <button id="send-button" class="send-button" aria-label="Send message">Send</button>
            </div>
            <!-- User Selection Prompt -->
            <div id="select-user-prompt" class="select-user-prompt">
                <div class="chat-icon"></div> <!-- Use a div for the background image -->

                <p>Select a user to start chatting</p>
            </div>
        </div>
        <!-- Profile Section  -->
        <div id="profile-section" class="w-1/4 hidden"> <!-- Width: 25% -->
            <div class="profile-header">
                <img src="default-profile.png" alt="Profile Image" class="profile-image">
                <h3 class="profile-name"><span id="profile-user-name">User Name</span></h3>
            </div>
                <div class="profile-buttons">
                <button id="block-button" class="profile-button" aria-label="Block user">
                    <span class="icon block-icon"></span> Block User
                </button>
                <button id="unblock-button" class="profile-button" aria-label="Unblock user" style="display: none;">
                    <span class="icon unblock-icon"></span> Unblock User
                </button>
                <button id="view-profile-button" class="profile-button" aria-label="View profile">
                <span class="icon profile-icon"></span> View Profile
                </button>
                <button id="invite-to-game-button" class="profile-button" aria-label="Invite to game">
                    <span class="icon game-icon"></span> Invite to Game
                </button>
                </div>
        </div>
    </div>
</div>
`;