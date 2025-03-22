export default () => {
    
    // DOM Elements
    const chatBox = document.getElementById('chat-box');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const chatUserList = document.getElementById('user-list-container');
    const searchInput = document.getElementById('search-user');
    const filterUnreadCheckbox = document.getElementById('filter-unread');
    document.getElementById("menu-button").addEventListener("click", toggleProfileSection);


    // State variables
    let currentUser = null; 
    let selectedChatUser = null; 
    let selectedChatUserId = null; 
    let socket = null; 
    let unreadMessages = {}
    let users = [];
    let lastMessages = {}; 
    let blockedUsers = new Set(JSON.parse(localStorage.getItem('blockedUsers')) || []);
    let currentUserId = null; 
    let roomName = null;

    // document.addEventListener('DOMContentLoaded', () => {
    //     const inviteToGameButton = document.getElementById('invite-to-game-button');
    //     const viewProfileButton = document.getElementById('view-profile-button');

    //     inviteToGameButton.addEventListener('click', () => {
    //       console.log('Invite to game button clicked');
    //       alert('Invitation sent!');
    //     });
      
    //     viewProfileButton.addEventListener('click', () => {
    //       console.log('View profile button clicked');
    //       alert('Redirecting to user profile...');
    //     });
    //   });



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

    function saveStateToLocalStorage() {
        localStorage.setItem('lastMessages', JSON.stringify(lastMessages));
        localStorage.setItem('unreadMessages', JSON.stringify(unreadMessages));
    }

    function loadStateFromLocalStorage() {
        const savedLastMessages = localStorage.getItem('lastMessages');
        const savedUnreadMessages = localStorage.getItem('unreadMessages');

        if (savedLastMessages) {
            lastMessages = JSON.parse(savedLastMessages);
        }
        if (savedUnreadMessages) {
            unreadMessages = JSON.parse(savedUnreadMessages);
        }
    }

    function updateLastMessage(username, message, timestamp) {
        lastMessages[username] = { message, timestamp };
        saveStateToLocalStorage();
    }

    function fetchUsers() {
        const token = app.utils.getCookie("access_token");
        fetch("http://localhost:8000/api/auth/users/?format=json", {
            headers: { "Authorization": `Bearer ${token}` },
        })
            .then(response => response.json())
            .then(fetchedUsers => {
                const newUsers = fetchedUsers.filter(user => !users.some(existingUser => existingUser.id === user.id));
                if (newUsers.length > 0) {
                    users = [...users, ...newUsers];
                    console.log("Fetched new users:", newUsers);
                    updateUserList();
                }
            })
            .catch(error => console.error("Error fetching users:", error));
    }

    
    function filterUsers() {
        let filteredUsers = users.filter(user => user.username !== currentUser?.username);
    
        const searchQuery = searchInput.value.toLowerCase();
        if (searchQuery) {
            filteredUsers = filteredUsers.filter(user => user.username.toLowerCase().includes(searchQuery));
        }
    
        if (filterUnreadCheckbox.checked) {
            filteredUsers = filteredUsers.filter(user => (unreadMessages[user.username] || 0) > 0);
        }
    
        return filteredUsers;
    }

    
    function updateUserList() {
        const filteredUsers = filterUsers();
        const userListContainer = document.getElementById('user-list-container');
        userListContainer.innerHTML = ''; 
    
        filteredUsers.forEach(user => userListContainer.appendChild(createUserItem(user)));
    }



function createUserItem(user) {
    const userItem = document.createElement('div');
    const isBlocked = blockedUsers.has(user.username); 
    userItem.className = `user-item ${isBlocked ? 'blocked' : ''}`;

    const unreadCount = isBlocked ? 0 : unreadMessages[user.username] || 0; 
    const statusColor = user.isActive ? "green" : "grey";
    const lastMessage = isBlocked ? "" : lastMessages[user.username]?.message || ""; 
    const lastMessageTimestamp = isBlocked ? "" : lastMessages[user.username]?.timestamp || ""; 

    userItem.innerHTML = `
        <div class="user-avatar-container">
            <img src="${user.profileImage}" alt="${user.username}" class="user-avatar">
            <span class="active-status" style="background-color: ${statusColor};"></span>
        </div>
        <div class="user-info">
            <div class="username">${user.username}</div>
            ${lastMessage ? `<div class="last-message">${lastMessage}</div>` : ""}
        </div>
        <div class="user-meta">
            ${lastMessageTimestamp ? `<div class="last-message-timestamp">${lastMessageTimestamp}</div>` : ""}
            ${unreadCount > 0 ? `<span class="unread-count">${unreadCount}</span>` : ""}
        </div>
    `;

    userItem.onclick = () => {
        startChat(user.username, user.id);
        userItem.classList.add('active');
        updateUserList();
        toggleProfileSection();
    };

    return userItem;
}


function loadMessages() {
    const storedLastMessages = JSON.parse(localStorage.getItem('lastMessages'));
    const storedUnreadMessages = JSON.parse(localStorage.getItem('unreadMessages'));

    if (storedLastMessages) {
        Object.assign(lastMessages, storedLastMessages);
    }
    if (storedUnreadMessages) {
        Object.assign(unreadMessages, storedUnreadMessages);
    }
}


window.addEventListener('load', () => {
    loadMessages();
});
    

    function pollForNewUsers() {
        setInterval(fetchUsers, 5000);
    }
    
    function initializeUserList() {
        fetchUsers(); 
        pollForNewUsers(); 
        loadStateFromLocalStorage(); 
        setupEventListeners(); 
    }
    
    async function fetchRealUsername(rawUsername) {
        if (typeof rawUsername !== "string" || !rawUsername) {
            console.error("Invalid or missing username:", rawUsername);
            return rawUsername || "Unknown User";
        }

        if (rawUsername && rawUsername[1]) {
            const rawUuid = rawUsername[1];
            
            try {
            
                const user = users.find(user => user.id === rawUuid); 
                
                if (user) {
                
                    return user.username;
                } else {
                    console.error("User not found with UUID:", rawUuid);
                    return rawUsername; 
                }
            } catch (error) {
                console.error("Error fetching real username:", error);
                return rawUsername; 
            }
        }

        return rawUsername; 
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
            console.log('Chat WebSocket connected');
            updateUserList();
            scrollToBottom();
        };
    
        socket.onmessage = async (e) => { 
            const data = JSON.parse(e.data);
            const { type } = data;
            console.log("on message", e.data);
        
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
            updateUserList();
        }
    
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


    // Start a chat
    function startChat(chatWith, chatWithId) {
        selectedChatUser = chatWith;
        selectedChatUserId = chatWithId;
        console.log(`Starting user: ${selectedChatUser} (ID: ${selectedChatUserId})`);
    
        document.getElementById("messages").innerHTML = "";
    
        document.getElementById("chat-with-user").textContent = chatWith;
        document.getElementById("chat-header").classList.add("active");
    
        document.getElementById("input-area").style.display = "flex";
        document.getElementById("select-user-prompt").style.display = "none";
    
        unreadMessages[chatWith] = 0;
    
        updateUserList();
    
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
            if (e.key === 'Enter' ) { 
                e.preventDefault();
                sendMessage();
            }
        });

        searchInput.addEventListener('input', updateUserList);
        filterUnreadCheckbox.addEventListener('change', updateUserList);
    }

    function sendMessage() {
        const message = chatInput.value;
        if (message && socket && selectedChatUser) {
            sendButton.disabled = true;
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
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
    
    initializeUserList();
};