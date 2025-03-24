let friendsContainer= null
let chat = null
export let unreadMessages = {};
export let lastMessages = {}; 
import { isChatActive, selectedChatUser } from './pages/chat/Controller.js';

export const SetOnline = () => {
    const token = app.utils.getCookie("access_token")
    
    const ws = new WebSocket("ws://localhost:8000/api/main/ws/?token=" + token)
    ws.onopen = (e) => {
        console.log("websocket connected");
    }
    ws.onclose = (e) => {
        console.log("connection closed :", e.reason);
        if (e.code === 4242)
        {
            app.utils.showToast(e.reason)
            app.utils.removeCookie("access_token")
            app.Router.navigate("/auth/login")
            return
        }
        dispatchEvent(new CustomEvent("navbar-profile"))
        dispatchEvent(new CustomEvent("play-button"))
        e.reason && app.utils.showToast(e.reason)
    }
    ws.onerror = (e)=> {
        console.log("websocket error", e);
    }
    ws.onmessage = async (e) => {
        const data = JSON.parse(e.data)
        const {type} = data
        switch (type)
        {
            case "notification":
                const message = data.message;
                const color = data.color ? data.color : "red";
                Notification(message, color);
            
                if (message.startsWith("New message from")) {
                    const [senderPart, messageContent] = message.split(": ");
                    const username = senderPart.replace("New message from ", "").trim();
            
                    if (!isChatActive || selectedChatUser !== username) {
                        unreadMessages[username] = (unreadMessages[username] || 0) + 1;
                    }            
                    lastMessages[username] = {
                        message: messageContent,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                    };
                    saveStateToLocalStorage();
                    chat = document.getElementById("user-list-container");
                    if (chat) {
                        chat.dispatchEvent(new CustomEvent("refresh"));
                    }
                }
                break;
            case "refresh_friends":
                friendsContainer = document.getElementById("friend-list-items")    
                if (friendsContainer)
                    friendsContainer.dispatchEvent(new CustomEvent('refresh'))
                chat = document.getElementById("user-list-container")
                if (chat)
                {
                    chat.dispatchEvent(new CustomEvent("refresh"))
                }
                break
            
            case 'status_update':
                console.log("received update status event");
                dispatchEvent(new CustomEvent("play-button"))
                break

            case 'ingame':
                console.log("received in game event");
                console.log(data);
                dispatchEvent(new CustomEvent("play-button"))
                app.Router.navigate(`/game?game_id=${data.game_id}`)
                break
            case 'invite':
                app.utils.showToast("wslatk invite")
                break
            case 'update_info':
                if (friendsContainer)
                    friendsContainer.dispatchEvent(new CustomEvent('refresh'))
                dispatchEvent(new CustomEvent("navbar-profile"))
                console.log("update navbar");
                
                break
            default:
                app.utils.showToast("ma3rt chhadshy ja mn back : ", message)
                break
        }
    }
    app.websocket = ws
}


const Notification = (message, color) => {
    app.utils.showToast(message, color)
}

function saveStateToLocalStorage() {
    localStorage.setItem('unreadMessages', JSON.stringify(unreadMessages));
    localStorage.setItem('lastMessages', JSON.stringify(lastMessages));
    console.log("State saved to localStorage");
}