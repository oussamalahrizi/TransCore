const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const userList = document.getElementById('user-list');
const chatUserList = document.getElementById('user-list-container'); 
const notification = document.getElementById('notification');
const searchInput = document.getElementById('search-user');
const filterUnreadCheckbox = document.getElementById('filter-unread');

let currentUser = null;
let selectedChatUser = null;
let selectedChatUserId = null;
let socket = null;
let userToken = null;
let notificationSocket = null;
let unreadMessages = {};  

///////////////////////// NOTIFICATION WEBSOCKET FUNCTIONS///////////////////////////////////////////////////

function connectNotificationSocket() {
    if (notificationSocket && notificationSocket.readyState === WebSocket.OPEN) return;
    
    try {
        notificationSocket = new WebSocket(`ws://localhost:8001/ws/notifications/?token=${userToken}`);
        
        notificationSocket.onopen = () => {
            console.log('Notification WebSocket connected');
            notificationSocket.send(JSON.stringify({ type: "fetch_notifications" }));
        };

        notificationSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("Notification received:", data);

                if (data.type === "notification") {
                    showNotification(data.message);
                    playNotificationSound();
                    handleUnreadMessages(data.message);
                } else if (data.type === "active_notifications") {
                    data.notifications.forEach(notification => {
                        showNotification(`${notification.sender}: ${notification.message}`);
                        playNotificationSound();
                        handleUnreadMessages(notification.sender);
                    });
                }
                updateUserList();
            } catch (error) {
                console.error("Error parsing notification message:", error);
            }
        };

        notificationSocket.onclose = (event) => {
            console.log('Notification WebSocket closed:', event.reason);
            setTimeout(connectNotificationSocket, 5000);
        };

        notificationSocket.onerror = (error) => {
            console.error('Notification WebSocket Error:', error);
            notificationSocket.close();
        };
    } catch (error) {
        console.error("Error establishing WebSocket connection:", error);
    }
}

function handleUnreadMessages(message) {
    const senderMatch = message.match(/^New message from (\w+):/); 
    if (senderMatch) {
        const sender = senderMatch[1];
        if (sender && sender !== currentUser && sender !== selectedChatUser) {
            unreadMessages[sender] = (unreadMessages[sender] || 0) + 1;
            console.log(`Updated unreadMessages:`, unreadMessages);
        }
    }
}

function playNotificationSound() {
    const audio = new Audio('notification.mp3');
    audio.play().catch(error => console.error("Error playing notification sound:", error));
}

function showNotification(message, sender) {
    const notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) return;

    const notificationElement = document.createElement('div');
    notificationElement.className = 'notification-item';

    const senderUser = fakeUsers.find(user => user.username === sender);
    const profileImage = senderUser ? senderUser.profileImage : 'images.png';

    notificationElement.innerHTML = `
        <img src="${profileImage}" alt="${sender}">
        <span>${message}</span>
    `;

    notificationContainer.appendChild(notificationElement);

    setTimeout(() => {
        notificationElement.style.opacity = '0';
        setTimeout(() => {
            notificationContainer.removeChild(notificationElement);
        }, 500);
    }, 3000);
}

function updateUserList() {
    const chatUserList = document.getElementById('user-list-container');
    if (!chatUserList) return; 
    chatUserList.innerHTML = ''; 

    let filteredUsers = fakeUsers.filter(user => user.username !== currentUser);

    const searchQuery = searchInput.value.toLowerCase();
    if (searchQuery) {
        filteredUsers = filteredUsers.filter(user => user.username.toLowerCase().includes(searchQuery));
    }

    if (filterUnreadCheckbox.checked) {
        filteredUsers = filteredUsers.filter(user => (unreadMessages[user.username] || 0) > 0);
    }

    filteredUsers.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';

        const unreadCount = unreadMessages[user.username] || 0;
        const statusColor = "green"; 

        userItem.innerHTML = `
            <img src="${user.profileImage}" alt="${user.username}" class="user-avatar">
            <span>${user.username}</span>
            <span class="status-indicator" style="background-color: ${statusColor};"></span>
            ${unreadCount > 0 ? `<span class="unread-count">${unreadCount}</span>` : ''}
        `;

        userItem.onclick = () => startChat(user.username, user.id);

        chatUserList.appendChild(userItem);
    });
}

searchInput.addEventListener('input', updateUserList);
filterUnreadCheckbox.addEventListener('change', updateUserList);

////////////////////////////////////////////CHAT WEBSOCKET FUNCTION//////////////////////////////////////////////////

function startChat(chatWith, chatWithId) {
    initializeChat(chatWith, chatWithId);
    connectWebSocket();
}

function initializeChat(chatWith, chatWithId) {
    selectedChatUser = chatWith;
    selectedChatUserId = chatWithId;

    console.log(`Starting chat with user: ${selectedChatUser} (ID: ${selectedChatUserId})`);

    document.getElementById("messages").innerHTML = "";
    document.querySelector("#chat-box h3").textContent = `Chat with ${chatWith}`;
    document.getElementById("input-area").style.display = "flex";

    unreadMessages[chatWith] = 0;
    updateUserList();

    if (socket) socket.close();
}

function connectWebSocket() {
    socket = new WebSocket(`ws://localhost:8001/ws/chat/${selectedChatUser}/?token=${userToken}`);

    socket.onopen = () => {
        console.log('Chat WebSocket connected');
        socket.send(JSON.stringify({ type: "user_id", user_id: selectedChatUserId }));

        unreadMessages[selectedChatUser] = 0;
        updateUserList();
        scrollToBottom();
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);

        if (data.type === "chat_message") {
            renderMessage(data);
        }
    };

    socket.onclose = (event) => {
        console.log('Chat WebSocket closed:', event.reason);
        showNotification(`Disconnected: ${event.reason || "New chat created"}`);
    };

    socket.onerror = (error) => console.error('Chat WebSocket Error:', error);
}

function renderMessage(data) {
    const { sender, message, timestamp, date } = data;

    if (sender !== currentUser && sender !== selectedChatUser) {
        unreadMessages[sender] = (unreadMessages[sender] || 0) + 1;
        console.log(`Updated unreadMessages:`, unreadMessages);
        updateUserList();
        playNotificationSound();
    }

    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let formattedDate = '';
    if (messageDate.toDateString() === today.toDateString()) {
        formattedDate = 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
        formattedDate = 'Yesterday';
    } else {
        formattedDate = messageDate.toLocaleDateString();
    }

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
    messageElement.classList.add('message', sender === currentUser ? 'sender' : 'recipient');
    messageElement.innerHTML = `
        <div class="message-text">${message}</div>
        <div class="timestamp">${timestamp}</div>
    `;

    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

function scrollToBottom() {
    const messagesContainer = document.getElementById("messages");
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

sendButton.onclick = function () {
    const message = chatInput.value;
    if (message && socket && selectedChatUser) {
        const currentDate = new Date().toISOString().split('T')[0];
        socket.send(JSON.stringify({
            type: "chat_message",
            sender: currentUser,
            message: message,
            date: currentDate
        }));
        chatInput.value = '';
        scrollToBottom();
    }
};

chatInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') sendButton.click();
});


