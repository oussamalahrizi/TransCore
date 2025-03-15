export default () => {
    // Retrieve the access token from cookies
    const token = app.utils.getCookie("access_token");
    if (!token) {
        console.error("Access token not found in cookies.");
        return;
    }

    // DOM Elements
    const chatBox = document.getElementById('chat-box');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const chatUserList = document.getElementById('user-list-container');
    const notificationContainer = document.getElementById('notification-container');
    const searchInput = document.getElementById('search-user');
    const filterUnreadCheckbox = document.getElementById('filter-unread');

    // State variables
    let currentUser = null; 
    let selectedChatUser = null; 
    let selectedChatUserId = null; 
    let socket = null; 
    let notificationSocket = null; 
    let unreadMessages = {};
    let users = [];
    let lastMessages = {}; 


    // document.addEventListener('DOMContentLoaded', () => {
    //     const blockButton = document.getElementById('block-button');
    //     const inviteToGameButton = document.getElementById('invite-to-game-button');
    //     const viewProfileButton = document.getElementById('view-profile-button');
      
    //     blockButton.addEventListener('click', () => {
    //       console.log('Block button clicked');
    //       alert('User blocked!');
    //     });
      
    //     inviteToGameButton.addEventListener('click', () => {
    //       console.log('Invite to game button clicked');
    //       alert('Invitation sent!');
    //     });
      
    //     viewProfileButton.addEventListener('click', () => {
    //       console.log('View profile button clicked');
    //       alert('Redirecting to user profile...');
    //     });
    //   });

    document.addEventListener("DOMContentLoaded", () => {
        const sendButton = document.getElementById('send-button');
        const chatInput = document.getElementById('chat-input');
        const searchInput = document.getElementById('search-user');
        const filterUnreadCheckbox = document.getElementById('filter-unread');
    
        if (sendButton && chatInput && searchInput && filterUnreadCheckbox) {
            sendButton.addEventListener('click', sendMessage);
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessage();
            });
            searchInput.addEventListener('input', updateUserList);
            filterUnreadCheckbox.addEventListener('change', updateUserList);
        } else {
            console.error('One or more DOM elements not found');
        }
    });

    // Toggle profile section visibility and adjust chat box width
    function toggleProfileSection() {
        const profileSection = document.getElementById('profile-section');
        const chatBox = document.getElementById('chat-box');
        // Check if elements exist before modifying
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

    // Add event listener to the menu button
    document.getElementById("menu-button").addEventListener("click", toggleProfileSection);


    // Reset the chat box on initial load if no user is selected
    if (!selectedChatUser) {
        resetChatBox();
    }

    // Save application state to localStorage
    function saveStateToLocalStorage() {
        localStorage.setItem('lastMessages', JSON.stringify(lastMessages));
        localStorage.setItem('unreadMessages', JSON.stringify(unreadMessages));
    }

    // Load application state from localStorage
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

    // Update the last message for a specific user
    function updateLastMessage(username, message, timestamp) {
        lastMessages[username] = { message, timestamp };
        saveStateToLocalStorage();
    }

    // Fetch users from the server
    function fetchUsers() {
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

    
    // Function to filter users (search and unread message filters)
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

    
    // Function to update the user list UI
    function updateUserList() {
        const filteredUsers = filterUsers();
        const userListContainer = document.getElementById('user-list-container');
        userListContainer.innerHTML = ''; 
    
        filteredUsers.forEach(user => userListContainer.appendChild(createUserItem(user)));
    }
// Initialize blocked users array
let blockedUsers = [];

// Function to create a user item
function createUserItem(user) {
    const userItem = document.createElement('div');
    userItem.className = 'user-item';

    const unreadCount = unreadMessages[user.username] || 0;
    const statusColor = user.isActive = "green"; 

    const lastMessageData = lastMessages[user.username] || {};
    const lastMessage = lastMessageData.message || "";
    const lastMessageTimestamp = lastMessageData.timestamp || "";

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

    // If user is blocked, disable interaction
    if (blockedUsers.includes(user.username)) {
        userItem.classList.add('blocked');
        userItem.onclick = () => {
            alert('You have blocked this user. You cannot chat with them.');
        };
    } else {
        userItem.onclick = () => {
            startChat(user.username, user.id); 
            userItem.classList.add('active');
            updateUserList(); 
            toggleProfileSection(); 
        };
    }

    return userItem;
}

// When the "Block" button is clicked
const blockButton = document.getElementById('block-button');
blockButton.addEventListener('click', () => {
    console.log('Block button clicked');
    // Disable further chat interactions
    const userToBlock = document.getElementById('chat-with-user').textContent; // Get username from the chat header
    blockedUsers.push(userToBlock); // Add the user to the blocked list
    alert(`You have blocked ${userToBlock}. You cannot send or receive any messages from them.`);

    // Show select user to chat section
    const selectUserPrompt = document.getElementById('select-user-prompt');
    selectUserPrompt.style.display = 'block';

    // Remove current chat and profile
    document.getElementById('chat-box').style.display = 'none';
    document.getElementById('profile-section').style.display = 'none';
    
    // Optionally, reset the chat input field and other UI elements
    document.getElementById('chat-input').value = ''; 
});

// When the "Unblock" button is clicked
const unblockButton = document.getElementById('unblock-button');
unblockButton.addEventListener('click', () => {
    console.log('Unblock button clicked');
    const userToUnblock = document.getElementById('chat-with-user').textContent; // Get username from the chat header
    const index = blockedUsers.indexOf(userToUnblock);
    if (index > -1) {
        blockedUsers.splice(index, 1); // Remove the user from the blocked list
        alert(`You have unblocked ${userToUnblock}. You can now send and receive messages.`);
    }
    updateUserList(); // Refresh user list to reflect unblock action
    toggleProfileSection(); // Reopen profile section after unblocking
});
    
    function pollForNewUsers() {
        setInterval(fetchUsers, 5000);
    }
    
    // Initialize by fetching users and setting up polling
    function initializeUserList() {
        fetchUsers(); 
        pollForNewUsers(); 
        loadStateFromLocalStorage(); 
        connectNotificationSocket();
        setupEventListeners(); 
    }
    
    async function fetchRealUsername(rawUsername) {
        if (typeof rawUsername !== "string" || !rawUsername) {
            console.error("Invalid or missing username:", rawUsername);
            return rawUsername || "Unknown User";
        }

        const uuidMatch = rawUsername.match(/^user_(.*)$/);
        if (uuidMatch && uuidMatch[1]) {
            const rawUuid = uuidMatch[1];
            
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

    // Connect to the notification WebSocket
    function connectNotificationSocket() {
        if (notificationSocket?.readyState === WebSocket.OPEN) return;

        notificationSocket = new WebSocket(`ws://localhost:8000/api/chat/ws/notifications/?token=${token}`);

        notificationSocket.onopen = () => {
            console.log('Notification WebSocket connected');
            notificationSocket.send(JSON.stringify({ type: "fetch_notifications" }));
        };

        notificationSocket.onmessage = handleNotificationMessage;
        notificationSocket.onclose = () => setTimeout(connectNotificationSocket, 5000); 
        notificationSocket.onerror = (error) => {
            console.error('Notification WebSocket Error:', error);
            notificationSocket.close();
        };
    }

    // Handle incoming notification messages
    async function handleNotificationMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log("Notification received:", data);

            if (data.type === "user_info") {
                handleUserInfo(data); 
            } else if (data.type === "notification") {
                handleNewNotification(data); 
            } else if (data.type === "active_notifications") {
                handleActiveNotifications(data); 
            }
        } catch (error) {
            console.error("Error parsing notification message:", error);
        }
    }

    // Handle new notifications
    async function handleNewNotification(data) {
        const rawUsername = extractUsername(data.username, data.message);
        if (rawUsername) {
            const realUsername = await fetchRealUsername(rawUsername);
            const messageContent = data.message.replace(`New message from ${rawUsername}:`, "").trim();
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

            lastMessages[realUsername] = { message: messageContent, timestamp };
            if (realUsername !== selectedChatUser) {
                unreadMessages[realUsername] = (unreadMessages[realUsername] || 0) + 1;
            }

            showNotification(messageContent, realUsername); 
            playNotificationSound();
            updateUserList(); 
        } else {
            console.warn("Could not extract username from the message:", data.message);
            showNotification(data.message, "Unknown User"); 
            playNotificationSound();
        }
    }

    // Handle active notifications
    async function handleActiveNotifications(data) {
        for (const notification of data.notifications || []) {
            const rawUsername = extractUsername(notification.sender, notification.message);
            if (rawUsername) {
                const realUsername = await fetchRealUsername(rawUsername);
                const messageContent = notification.message.replace(`New message from ${rawUsername}:`, "").trim();
                const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

                lastMessages[realUsername] = { message: messageContent, timestamp };
                if (realUsername !== selectedChatUser) {
                    unreadMessages[realUsername] = (unreadMessages[realUsername] || 0) + 1;
                }
                showNotification(messageContent, realUsername);
                playNotificationSound(); 
            } else {
                console.warn("Could not extract username from the message:", notification.message);
                showNotification(notification.message, "Unknown User"); 
                playNotificationSound();
            }
        }
        updateUserList(); 
    }

    // Extract username from a message
    function extractUsername(username, message) {
        if (username) return username;
        const messageMatch = message?.match(/New message from (\S+):/);
        return messageMatch?.[1];
    }



    // Handle user info updates
    function handleUserInfo(data) {
        currentUser = { id: data.user_id, username: data.username };
    }


    // Display a notification in the UI
    function showNotification(message, sender) {
        if (!notificationContainer) return;

        const notificationElement = document.createElement('div');
        notificationElement.className = 'notification-item';

        const senderUser = users.find(user => user.username === sender);
        const profileImage = senderUser ? senderUser.profileImage : 'images.png';

        notificationElement.innerHTML = `
            <img src="${profileImage}" alt="${sender}">
            <span>${message}</span>
        `;

        notificationContainer.appendChild(notificationElement);

        setTimeout(() => {
            notificationElement.style.opacity = '0';
            setTimeout(() => notificationContainer.removeChild(notificationElement), 500);
        }, 3000);
    }


    // Handle incoming chat messages
    function handleChatMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log("Received message:", data);

            if (data.type === "chat_message") {
                const { sender, message, timestamp } = data;

                if (selectedChatUser) {
                    updateLastMessage(selectedChatUser, message, timestamp);
                    updateUserList();
                }

                renderMessage(data); 
            } else if (data.type === "error") {
                console.error("WebSocket error:", data.message);
                showNotification(`Error: ${data.message}`); 
            } else if (data.type === "user_info") {
                handleUserInfo(data);
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    }

    // Connect to the chat WebSocket
    function connectChatSocket() {
        if (socket?.readyState === WebSocket.OPEN) return;

        socket = new WebSocket(`ws://localhost:8000/api/chat/ws/chat/${selectedChatUser}/?token=${token}`);

        socket.onopen = () => {
            console.log('Chat WebSocket connected');
            socket.send(JSON.stringify({ type: "user_id", user_id: selectedChatUserId }));
            updateUserList(); 
            scrollToBottom(); 
        };

        socket.onmessage = handleChatMessage;
        socket.onclose = () => setTimeout(connectChatSocket, 5000); 
        socket.onerror = (error) => {
            console.error('Chat WebSocket Error:', error);
            socket.close();
        };
    }

    // Function to reset the chat box when no user is selected
    function resetChatBox() {
        document.getElementById("messages").innerHTML = ""; 
        document.getElementById("chat-header").classList.remove("active"); 
        document.getElementById("input-area").style.display = "none"; 
        document.getElementById("select-user-prompt").style.display = "flex"; 
        selectedChatUser = null;
        selectedChatUserId = null;
    
        // Close the existing socket if any
        if (socket) {
        socket.close();
        socket = null;
        }

        // Hide the profile section and reset chat box width
        const profileSection = document.getElementById("profile-section");
        const chatBox = document.getElementById("chat-box");
        profileSection.classList.add("hidden");
        chatBox.classList.remove("w-1/2");
        chatBox.classList.add("w-3/4");
    }


    // Start a chat with a specific user
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


    // Render a chat message in the UI
    async function renderMessage(data) {
        const { sender, message, timestamp, date } = data;

        if (selectedChatUser) {
            lastMessages[selectedChatUser] = { message, timestamp };
            updateUserList(); 
        }

        const formattedDate = formatDate(new Date(date));
        const messagesContainer = document.getElementById("messages");

        let dateHeader = document.querySelector(`.date-header[data-date="${formattedDate}"]`);
        if (!dateHeader) {
            dateHeader = document.createElement('div');
            dateHeader.classList.add('date-header');
            dateHeader.setAttribute('data-date', formattedDate);
            dateHeader.textContent = formattedDate;
            messagesContainer.appendChild(dateHeader);
        }
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === currentUser?.username ? 'sender' : 'recipient');
        messageElement.innerHTML = `
            <div class="message-text">${message}</div>
            <div class="timestamp">${timestamp}</div>
        `;
        messagesContainer.appendChild(messageElement);
        scrollToBottom(); 
    }

    // Format the date for display
    function formatDate(date) {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString();
    }

    // Scroll the chat container to the bottom
    function scrollToBottom() {
        const messagesContainer = document.getElementById("messages");
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Play a notification sound
    function playNotificationSound() {
        // const audio = new Audio('notification.mp3');
        // audio.play().catch(error => console.error("Error playing notification sound:", error));
    }

    // Set up event listeners for UI interactions
    function setupEventListeners() {
        sendButton.onclick = sendMessage;

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });

        searchInput.addEventListener('input', updateUserList);
        filterUnreadCheckbox.addEventListener('change', updateUserList);
    }

    // Send a chat message
    function sendMessage() {
        const message = chatInput.value;
        if (message && socket && selectedChatUser) {
            sendButton.disabled = true;
            const currentDate = new Date().toISOString().split('T')[0];
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            socket.send(JSON.stringify({
                type: "chat_message",
                sender: currentUser?.username,
                message: message,
                date: currentDate,
                timestamp: timestamp
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