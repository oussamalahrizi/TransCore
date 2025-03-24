async function fetchUsers() {
    try {
        const { data, error } = await app.utils.fetchWithAuth("/api/main/friends/");
        if (error) {
            app.utils.showToast(error);
            return [];
        }

        const friends = data;

        const updatedFriends = await Promise.all(
            friends.map(async (friend) => {
                try {
                    const { data, error } = await app.utils.fetchWithAuth(`/api/main/user/${friend.auth.id}`);
                    if (error) {
                        app.utils.showToast(error);
                        return friend;
                    }
                    return data;
                } catch (error) {
                    if (error instanceof app.utils.AuthError) return friend;
                    console.log("error in fetching friend info", error);
                    return friend;
                }
            })
        );

        return updatedFriends;
    } catch (error) {
        if (error instanceof app.utils.AuthError) return [];
        console.log("error in fetch friends ", error);
        return [];
    }
}
import { unreadMessages, lastMessages } from '../../Websockets.js'; 
export let isChatActive = false; 
export let selectedChatUser = null;

export default async () => {
    try {
        const chatBox = document.getElementById('chat-box');
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-button');
        const chatUserList = document.getElementById('user-list-container');
        const searchInput = document.getElementById('search-user');
        const filterUnreadCheckbox = document.getElementById('filter-unread');
        document.getElementById("menu-button").addEventListener("click", toggleProfileSection);

        let selectedChatUserId = null;
        let socket = null;
        let users = [];
        let blockedUsers = new Set(JSON.parse(localStorage.getItem('blockedUsers')) || []);
        let currentUserId = null;
        let roomName = null;


        
        function toggleProfileSection() {
            const profileSection = document.getElementById('profile-section');
            const chatBox = document.getElementById('chat-box');
            if (!profileSection || !chatBox) {
                console.error('Profile section or chat box not found');
                return;
            }

            if (profileSection.classList.contains('hidden')) {
                profileSection.classList.remove('hidden');
                chatBox.classList.add('w-1-2');
            } else {
                profileSection.classList.add('hidden');
                chatBox.classList.remove('w-1-2');
            }
        }

        if (!selectedChatUser) {
            resetChatBox();
        }



        const friends = await fetchUsers();
        updateUserList(friends);

        function filterUsers(users) {
            users = users || [];

            let filteredUsers = users;

            const searchQuery = searchInput.value.toLowerCase();
            if (searchQuery) {
                filteredUsers = filteredUsers.filter(user => user.auth.username.toLowerCase().includes(searchQuery));
            }

            if (filterUnreadCheckbox.checked) {
                filteredUsers = filteredUsers.filter(user => (unreadMessages[user.auth.username] || 0) > 0);
            }

            return filteredUsers;
        }

        const userListContainer = document.getElementById('user-list-container');
        userListContainer.addEventListener('refresh', async () => {
            // console.log("Refresh event triggered");
            const users = await fetchUsers();
            if (users) {
                // console.log("Updating user list with users:", users);
                updateUserList(users);
            } else {
                console.error('Failed to fetch users');
            }
        });

        function updateUserList(friends) {
            friends = friends || [];
            // console.log("Updating user list with friends:", friends);
        
            const filteredUsers = filterUsers(friends);
        
            const userListContainer = document.getElementById('user-list-container');
            if (!userListContainer) {
                console.error('user-list-container element not found');
                return;
            }
        
            userListContainer.innerHTML = '';
        
            filteredUsers.forEach(user => {
                const userItem = createUserItem(user); 
                if (userItem) {
                    userListContainer.appendChild(userItem);
                }
            });
        }


        function createUserItem(user) {
            const isBlocked = blockedUsers.has(user.auth.username);
            const userItem = document.createElement('div');
            userItem.className = `user-item ${isBlocked ? 'blocked' : ''}`;
        
            const unreadCount = unreadMessages[user.auth.username] || 0;
            const lastMessage =  lastMessages[user.auth.username]?.message || "";
            const lastMessageTimestamp =  lastMessages[user.auth.username]?.timestamp || "";
        
            // console.log(`Creating user item for ${user.auth.username} with unread count: ${unreadCount}`);
        
            const statusColor = user.status === "online" ? "green" : "grey";
            const chatUserImage = document.getElementById('chat-user-image');
            if (chatUserImage) {
                chatUserImage.src = user.auth.icon_url || 'default-profile.png';
            }

            const profileImage = document.querySelector('#profile-section .profile-header img');
            if (profileImage) {
                profileImage.src = user.auth.icon_url || 'default-profile.png';
            }

            const chatWithUser = document.getElementById('chat-with-user');
            if (chatWithUser) {
                chatWithUser.textContent = user.auth.username;
            }
            const chatUserStatus = document.getElementById('chat-user-status');

            if (chatUserStatus) {
                const statusIndicator = chatUserStatus.querySelector('.status-indicator');
                const statusText = chatUserStatus.querySelector('.status-text');

                if (user.status === "online") {
                    chatUserStatus.classList.add('online');
                    statusText.textContent = "Online";
                } else {
                    chatUserStatus.classList.remove('online');
                    statusText.textContent = "Offline";
                }
            }
            const profileUserName = document.getElementById('profile-user-name');
            if (profileUserName) {
                profileUserName.textContent = user.auth.username;
            }
        
            userItem.innerHTML = `
                <div class="user-avatar-container">
                    <img src="${user.auth.icon_url || 'default-profile.png'}" alt="${user.auth.username}" class="user-avatar">
                    <span class="active-status" style="background-color: ${statusColor};"></span>
                </div>
                <div class="user-info">
                    <div class="username">${user.auth.username}</div>
                    ${lastMessage ? `<div class="last-message">${lastMessage}</div>` : ""}
                </div>
                <div class="user-meta">
                    ${lastMessageTimestamp ? `<div class="last-message-timestamp">${lastMessageTimestamp}</div>` : ""}
                    ${unreadCount > 0 ? `<span class="unread-count">${unreadCount}</span>` : ""}
                </div>
            `;
        
            userItem.onclick = () => {
                startChat(user.auth.username, user.auth.id);
                userItem.classList.add('active');
                toggleProfileSection();
        
                unreadMessages[user.auth.username] = 0;
                updateUserList(friends);
            };
        
            return userItem;
        }
        async function fetchInitialMessages() {
            if (!roomName) {
                console.error("Room name is not available.");
                return;
            }

            try {
                const response = await fetch(`http://localhost:8000/api/chat/${roomName}/`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch messages: ${response.statusText}`);
                }

                const data = await response.json();
                const messages = data.messages;

                await renderMessage(messages);
            } catch (error) {
                console.error("Error fetching initial messages:", error);
            }
        }

        function connectChatSocket() {
            if (socket?.readyState === WebSocket.OPEN) return;

            const token = app.utils.getCookie("access_token");
            socket = new WebSocket(`ws://localhost:8000/api/chat/ws/chat/${selectedChatUser}/?token=${token}`);

            socket.onopen = () => {
                // console.log('Chat WebSocket connected');
                scrollToBottom();
            };

            socket.onmessage = async (e) => {
                const data = JSON.parse(e.data);
                const { type } = data;
                // console.log("on message", e.data);

                switch (type) {
                    case 'user_info':
                        currentUserId = data.user_id;
                        roomName = data.roomname;
                        await fetchInitialMessages();
                        break;
                    case 'message':
                        renderMessage(data);
                        break;
                    default:
                        break;
                }
            };

            socket.onclose = (e) => {
                console.log('WebSocket closed:', e.reason);
                // localStorage.removeItem('unreadMessages');
                // localStorage.removeItem('lastMessages');
            };

            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                socket.close();
            };
        }

        async function renderMessage(data) {
            if (Array.isArray(data)) {
                for (const message of data) {
                    await renderMessage(message);
                }
                return;
            }
            const { sender_id, message, timestamp } = data;

            const formattedTime = new Date(timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });

            if (selectedChatUser) {
                lastMessages[selectedChatUser] = { message, timestamp: formattedTime };
            }
            updateUserList(friends);
            saveStateToLocalStorage();
            const formattedDate = formatDate(new Date(timestamp));

            const messagesContainer = document.getElementById("messages");
            if (!messagesContainer) {
                console.error("Messages container not found!");
                return;
            }

            let dateHeader = document.querySelector(`.date-header[data-date="${formattedDate}"]`);
            if (!dateHeader) {
                dateHeader = document.createElement('div');
                dateHeader.classList.add('date-header');
                dateHeader.setAttribute('data-date', formattedDate);
                dateHeader.textContent = formattedDate;
                messagesContainer.appendChild(dateHeader);
            }

            const messageElement = document.createElement('div');
            messageElement.classList.add('message', sender_id === currentUserId ? 'sender' : 'recipient');
            messageElement.innerHTML = `
                <div class="message-text">${message}</div>
                <div class="timestamp">${formattedTime}</div>
            `;

            messagesContainer.appendChild(messageElement);

            scrollToBottom();
        }

        function resetChatBox() {
            document.getElementById("messages").innerHTML = "";
            document.getElementById("chat-header").classList.remove("active");
            document.getElementById("input-area").style.display = "none";
            document.getElementById("select-user-prompt").style.display = "flex";
            selectedChatUser = null;
            selectedChatUserId = null;
            isChatActive = false; 

            if (socket) {
                socket.close();
                socket = null;
            }

            const profileSection = document.getElementById("profile-section");
            const chatBox = document.getElementById("chat-box");
            profileSection.classList.add("hidden");
            chatBox.classList.remove("w-1/2");
            chatBox.classList.add("w-3/4");
        }

        function startChat(chatWith, chatWithId) {
            selectedChatUser = chatWith;
            selectedChatUserId = chatWithId;
            isChatActive = true;
        
            unreadMessages[chatWith] = 0;
        
            saveStateToLocalStorage();
        
            document.getElementById("messages").innerHTML = "";
        
            document.getElementById("chat-with-user").textContent = chatWith;
            document.getElementById("chat-header").classList.add("active");
        
            document.getElementById("input-area").style.display = "flex";
            document.getElementById("select-user-prompt").style.display = "none";
        
            // Update the block/unblock buttons
            toggleBlockButtons(chatWith);
        
            const userItems = document.querySelectorAll('.user-item');
            userItems.forEach(item => {
                item.classList.remove('active');
                if (item.querySelector('.username').textContent === chatWith) {
                    item.classList.add('active');
                }
            });
        
            if (socket) socket.close();
            connectChatSocket();
        
            document.getElementById("profile-user-name").textContent = chatWith;
        
            const profileSection = document.getElementById("profile-section");
            const chatBox = document.getElementById("chat-box");
            profileSection.classList.add("hidden");
            chatBox.classList.remove("w-1/2");
            chatBox.classList.add("w-3/4");
        }

        function formatDate(date) {
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (date.toDateString() === today.toDateString()) return 'Today';
            if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
            return date.toLocaleDateString();
        }

        function scrollToBottom() {
            const messagesContainer = document.getElementById("messages");
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function setupEventListeners() {
            sendButton.onclick = sendMessage;
        
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                }
            });
        
            searchInput.addEventListener('input', async () => {
                const users = await fetchUsers();
                updateUserList(users);
            });
        
            filterUnreadCheckbox.addEventListener('change', async () => {
                const users = await fetchUsers();
                updateUserList(users);
            });
        
            const blockButton = document.getElementById('block-button');
            if (blockButton) {
                blockButton.addEventListener('click', () => {
                    blockUser(selectedChatUser);
                });
            }
        
            const unblockButton = document.getElementById('unblock-button');
            if (unblockButton) {
                unblockButton.addEventListener('click', () => {
                    unblockUser(selectedChatUser);
                });
            }
        
            const viewProfileButton = document.getElementById('view-profile-button');
            if (viewProfileButton) {
                viewProfileButton.addEventListener('click', () => {
                    viewProfile(selectedChatUser);
                });
            }
        
            const inviteToGameButton = document.getElementById('invite-to-game-button');
            if (inviteToGameButton) {
                inviteToGameButton.addEventListener('click', () => {
                    inviteToGame(selectedChatUser);
                });
            }
        }
        function blockUser(username) {
            if (username && !blockedUsers.has(username)) {
                blockedUsers.add(username);
                // localStorage.setItem('blockedUsers', JSON.stringify([...blockedUsers]));
                console.log(`Blocked user: ${username}`);
        
                updateUserList(friends);
                toggleBlockButtons(username);
            }
        }
        
        function unblockUser(username) {
            if (username && blockedUsers.has(username)) {
                blockedUsers.delete(username);
                // localStorage.setItem('blockedUsers', JSON.stringify([...blockedUsers])); // Save to localStorage
                console.log(`Unblocked user: ${username}`);
        
                updateUserList(friends);
                toggleBlockButtons(username);
            }
        }
        
        function viewProfile(username) {
            if (username) {
                console.log(`Viewing profile of: ${username}`);
                // app.Router.navigate(`/profile/${username}`);
            }
        }
        
        function inviteToGame(username) {
            if (username) {
                console.log(`Inviting ${username} to a game`);
                const ws = app.websocket;
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: "invite",
                        username: username,
                    }));
                }
            }
        }
        
        function toggleBlockButtons(username) {
            const blockButton = document.getElementById('block-button');
            const unblockButton = document.getElementById('unblock-button');
        
            if (blockedUsers.has(username)) {
                blockButton.style.display = 'none';
                unblockButton.style.display = 'block';
            } else {
                blockButton.style.display = 'block';
                unblockButton.style.display = 'none';
            }
        }
        function sendMessage() {
            const message = chatInput.value;
            if (message && socket && selectedChatUser) {
                sendButton.disabled = true;
        
                socket.send(JSON.stringify({
                    type: "message",
                    message: message,
                    sender_id: currentUserId,
                }));
        
                chatInput.value = '';
                scrollToBottom();
        
                setTimeout(() => {
                    sendButton.disabled = false;
                }, 1000);
            }
        }
        

        function loadStateFromLocalStorage() {
            const savedUnreadMessages = localStorage.getItem('unreadMessages');
            if (savedUnreadMessages) {
                Object.assign(unreadMessages, JSON.parse(savedUnreadMessages)); 
            }
        
            const savedLastMessages = localStorage.getItem('lastMessages');
            if (savedLastMessages) {
                Object.assign(lastMessages, JSON.parse(savedLastMessages)); 
            }
        
            updateUserList(friends);
        }
        function saveStateToLocalStorage() {
            localStorage.setItem('unreadMessages', JSON.stringify(unreadMessages));
        
            localStorage.setItem('lastMessages', JSON.stringify(lastMessages));
        
            console.log("State saved to localStorage");
        }
        
        function initializeUserList() {
            fetchUsers();
            setupEventListeners();
            loadStateFromLocalStorage(); 
        }
        
        initializeUserList();
    } catch (error) {
        if (error instanceof app.utils.AuthError)
            return;
        console.log("error in chat controller :", error);
    }
};