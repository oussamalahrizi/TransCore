
import Profile from "../profile/index.js"
import { hideModalWithAnimation } from "../../modalAnimations.js";


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
import profile from "../profile/index.js";
import { sleep } from "../game/websockets.js";
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
            const users = await fetchUsers();
            if (users) {
                updateUserList(users);
            } else {
                console.error('Failed to fetch users');
            }
        });

        function toggleProfileSection() {
            const profileSection = document.getElementById('profile-section');
            const chatBox = document.getElementById('chat-box');
            if (!profileSection || !chatBox) {
                console.error('Profile section or chat box not found');
                return;
            }
        
            if (profileSection.classList.contains('hidden')) {
                profileSection.classList.remove('hidden');
                chatBox.classList.remove('flex-1', 'w-3/4');
                chatBox.classList.add('flex-1');
            } else {
                profileSection.classList.add('hidden');
                chatBox.classList.remove('flex-1');
                if (selectedChatUser) {
                    chatBox.classList.add('flex-1');
                } else {
                    chatBox.classList.add('flex-1');
                }
            }
        }


        function updateUserList(friends = []) {
            try {
                const userListContainer = document.getElementById('user-list-container');
                if (!userListContainer) {
                    console.error('User list container not found');
                    return;
                }
        
                userListContainer.textContent = '';
        
                const filteredUsers = filterUsers(friends);
        
                if (selectedChatUser) {
                    const userStillExists = filteredUsers.some(user => 
                        user?.auth?.username === selectedChatUser && 
                        !blockedUsers.has(user.auth.username)
                    );
        
                    if (!userStillExists) {
                        const previousUser = selectedChatUser;
                        resetChatBox();
                        
                        setTimeout(() => {
                            const chatBox = document.getElementById("chat-box");
                            if (chatBox) {
                                chatBox.classList.remove("w-1/2", "w-3/4");
                                chatBox.classList.add("w-full");
                            }
                        }, 50);
                    }
                }
        
                const fragment = document.createDocumentFragment();
                filteredUsers.forEach(user => {
                    try {
                        const userItem = createUserItem(user);
                        if (userItem) {
                            fragment.appendChild(userItem);
                        }
                    } catch (error) {
                        console.error('Error creating user item:', error);
                    }
                });
                userListContainer.appendChild(fragment);
        
            } catch (error) {
                console.error('Error updating user list:', error);
            }
        }
        
        function startChat(chatWith, chatWithId) {
            const messagesContainer = document.getElementById("messages");
            const chatHeader = document.getElementById("chat-header");
            const inputArea = document.getElementById("input-area");
            const selectUserPrompt = document.getElementById("select-user-prompt");
            const chatWithUserElement = document.getElementById("chat-with-user");
            const profileUserName = document.getElementById("profile-user-name");
            const profileSection = document.getElementById("profile-section");
            const chatBox = document.getElementById("chat-box");
        
            if (!messagesContainer || !chatHeader || !inputArea || !selectUserPrompt || 
                !chatWithUserElement || !profileUserName || !profileSection || !chatBox) {
                console.error("Required chat elements not found");
                return;
            }
        
            selectedChatUser = chatWith;
            selectedChatUserId = chatWithId;
            isChatActive = true;
        
            unreadMessages[chatWith] = 0;
            saveStateToLocalStorage();
        
            messagesContainer.innerHTML = "";
            chatWithUserElement.textContent = chatWith;
            chatHeader.classList.add("active");
            inputArea.style.display = "flex";
            selectUserPrompt.style.display = "none";
        
            const userItems = document.querySelectorAll('.user-item');
            userItems.forEach(item => {
                item.classList.remove('active');
                const usernameElement = item.querySelector('.username');
                if (usernameElement && usernameElement.textContent === chatWith) {
                    item.classList.add('active');
                }
            });
        
            if (socket) {
                socket.close();
            }
            connectChatSocket();
        
            profileUserName.textContent = chatWith;
            profileSection.classList.add("hidden");
            chatBox.classList.remove("w-1/2");
            chatBox.classList.add("w-3/4");
        }
        
        function resetChatBox() {
            const messagesContainer = document.getElementById("messages");
            const chatHeader = document.getElementById("chat-header");
            const inputArea = document.getElementById("input-area");
            const selectUserPrompt = document.getElementById("select-user-prompt");
            const profileSection = document.getElementById("profile-section");
            const chatBox = document.getElementById("chat-box");
            const chatContainer = document.querySelector(".chat-container"); 
            const userListContainer = document.getElementById("user-list-container");
        
            if (messagesContainer) messagesContainer.innerHTML = "";
            if (chatHeader) chatHeader.classList.remove("active");
            if (inputArea) inputArea.style.display = "none";
            if (selectUserPrompt) selectUserPrompt.style.display = "flex";
        
            selectedChatUser = null;
            selectedChatUserId = null;
            isChatActive = false;
        
            if (socket) {
                socket.close();
                socket = null;
            }
        
            if (profileSection) {
                profileSection.classList.add("hidden");
            }
            
            if (chatBox) {
                chatBox.classList.remove("w-1/2", "w-3/4", "w-full"); 
                chatBox.classList.add("w-full"); 
            }
        
            if (chatContainer) {
                chatContainer.classList.remove("grid-cols-2"); 
                chatContainer.classList.add("grid-cols-1"); 
            }
        
            if (userListContainer) {
                userListContainer.classList.remove("w-1/4");
                userListContainer.classList.add("w-full");
            }
        }

        function createUserItem(user) {
            const statusColors = {
                'online': { indicator: '#029F5B', text: '#029F5B' },
                'inqueue': { indicator: '#FF9F1C', text: '#FF9F1C' },
                'ingame': { indicator: '#2EC4B6', text: '#2EC4B6' },
                'offline': { indicator: '#A9A9A9', text: '#A9A9A9' }
            };
        
            const isBlocked = blockedUsers.has(user.auth.username);
            const userItem = document.createElement('div');
            userItem.className = `user-item ${isBlocked ? 'blocked' : ''} ${user.status}`;
            
            const unreadCount = unreadMessages[user.auth.username] || 0;
            const lastMessage = lastMessages[user.auth.username]?.message || "";
            const lastMessageTimestamp = lastMessages[user.auth.username]?.timestamp || "";
            
            const status = user.status.toLowerCase();
            const { indicator: statusColor, text: textColor } = statusColors[status] || statusColors.offline;
        
            const chatUserImage = document.getElementById('chat-user-image');
            if (chatUserImage) {
                chatUserImage.src = user.auth.icon_url || '/public/assets/icon-placeholder.svg';
                if (user.auth.icon_url && !user.auth.icon_url.startsWith("https"))
                    chatUserImage.src += `?nocache=${Date.now()}` 
                chatUserImage.style = "object-fit : cover;"
            }

            const profileImage = document.querySelector('#profile-section .profile-header img');
            if (profileImage) {
                profileImage.src = user.auth.icon_url || '/public/assets/icon-placeholder.svg';
                if (user.auth.icon_url && !user.auth.icon_url.startsWith("https"))
                    profileImage.src += `?nocache=${Date.now()}` 
            }

            const chatWithUser = document.getElementById('chat-with-user');
            if (chatWithUser) {
                chatWithUser.textContent = user.auth.username;
            }
            updateElement('profile-user-name', el => el.textContent = user.auth.username);
            
            const chatUserStatus = document.getElementById('chat-user-status');
            if (chatUserStatus) {
                const statusIndicator = chatUserStatus.querySelector('.status-indicator');
                const statusText = chatUserStatus.querySelector('.status-text');
                if (statusIndicator) statusIndicator.style.backgroundColor = statusColor;
                if (statusText) {
                    statusText.textContent = user.status;
                    statusText.style.color = textColor;
                }
            }
        
            userItem.innerHTML = `
                <div class="user-avatar-container">
                    <img src="${user.auth.icon_url || 'default-profile.png'}" 
                         alt="${user.auth.username}" 
                         class="user-avatar">
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
        
        function updateElement(selector, callback) {
            const element = document.querySelector(selector);
            if (element) callback(element);
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
            setTimeout(() => {
                if (socket.readyState === WebSocket.CONNECTING)
                    socket.close()
            }, 2000);
            
            socket.onopen = () => {
                scrollToBottom();
            };

            socket.onmessage = async (e) => {
                const data = JSON.parse(e.data);
                const { type } = data;
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
                resetChatBox()
                var str = "Failed to connect to Chat Server"
                e.reason ?? str + e.reason
                app.utils.showToast(str);
                localStorage.removeItem('unreadMessages');
                localStorage.removeItem('lastMessages');
                
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
                    blockUser(selectedChatUserId);
                });
            }

        
            const viewProfileButton = document.getElementById('view-profile-button');
            if (viewProfileButton) {
                viewProfileButton.addEventListener('click', () => {
                    viewProfile(selectedChatUserId);
                });
            }
        
            const inviteToGameButton = document.getElementById('invite-to-game-button');
            if (inviteToGameButton) {
                inviteToGameButton.addEventListener('click', () => {
                    inviteToGame(selectedChatUser);
                });
            }
        }
        async function blockUser(user_id) {
            try {
                const body = JSON.stringify({
                    change : 'block'
                })
                const {data, error} = await app.utils.fetchWithAuth(
                    `/api/auth/friends/change/${user_id}/`,
                    'POST',
                    body
                )
                if (error)
                {
                    app.utils.showToast(error)
                    return
                }
                app.utils.showToast(data.detail, 'green')
            } catch (error) {
                if (error instanceof app.utils.AuthError)
                    return
                console.log("error in block friend chat", error);
            }
        }
        
        async function viewProfile(user_id) {
            const view = profile.View
            var modal = document.getElementById("profile-view-modal")
            if (modal)
                modal.remove()
            modal = document.createElement("div")
            modal.id = "profile-view-modal"
            modal.className = "profile-show-modal"
            // Remove first and last line of the view HTML
            const viewLines = view.trim().split('\n');
            const trimmedView = viewLines.slice(1, -1).join('\n');
            modal.innerHTML = trimmedView;
            document.body.appendChild(modal)
            void modal.offsetWidth;
            modal.classList.add("show")
            await profile.Controller({id : user_id})
            modal.addEventListener("click", (e) => {
                if (e.target === modal)
                {
                    hideModalWithAnimation(modal)
                    modal.remove()
                }
            })
            
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