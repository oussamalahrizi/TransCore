let friendsContainer= null
let chat = null
export let unreadMessages = {};
export let lastMessages = {}; 
import { isChatActive, selectedChatUser } from './pages/chat/Controller.js';
import MatchFound from "./Components/matchfound/Controller.js"
import MatchFoundView from "./Components/matchfound/matchfound.js"
import { hideModalWithAnimation } from './modalAnimations.js';
import { sleep } from './pages/game/websockets.js';
import utils from './utils.js';

let matchCallback = null
let modalContainer = null

export const SetOnline = () => {
    const token = app.utils.getCookie("access_token")
    
    const ws = new WebSocket(`wss://${location.host}/api/main/ws/?token=` + token)
    ws.onopen = (e) => {
        console.log("websocket connected");
    }
    ws.onclose = async (e) => {
        console.log("connection closed :", e.reason);
        if (e.code === 4242)
        {
            app.utils.showToast(e.reason)
            app.utils.removeCookie("access_token")
            if (location.pathname !== "/game")
                app.Router.navigate("/auth/login")
            app.websocket = null
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
            case 'tr_update':
                var tr_view = document.getElementById('tr_view')
                if (tr_view)
                    tr_view.dispatchEvent(new CustomEvent('refresh'))
                console.log('TR UPDATE ', location.pathname);
                break
            case 'tr_end':
                var tr_view = document.getElementById('tr_view')
                data
                handletrEnd(data)
                // if (tr_view)
                //     tr_view.dispatchEvent(new CustomEvent('tr_end', {detail : {winner, result, loser}}))
                break
            case "refresh_friends":
                friendsContainer = document.getElementById("friend-list-items")    
                if (friendsContainer)
                    friendsContainer.dispatchEvent(new CustomEvent('refresh'))
                chat = document.getElementById("user-list-container")
                if (chat)
                    chat.dispatchEvent(new CustomEvent("refresh"))
                break
            
            case 'status_update':
                console.log("received update status event");
                dispatchEvent(new CustomEvent("play-button"))
                modalContainer = document.getElementById("match-found-modal")
                if (modalContainer)
                {
                    hideModalWithAnimation(modalContainer)
                    modalContainer.remove()
                }
                break
            case 'invite':
                const event_data = {
                    from : data.from,
                    from_id : data.from_id,
                }
                app.utils.showConfirmToast("green", event_data)
                break
            case 'invite_accepted':
                app.Router.navigate(`/game?game_id=${data.game_id}`)
                break
            case 'update_info':
                friendsContainer = document.getElementById("friend-list-items")    
                if (friendsContainer)
                    friendsContainer.dispatchEvent(new CustomEvent('refresh'))
                dispatchEvent(new CustomEvent("navbar-profile"))
                console.log("update navbar");
                break
            case 'match_found':
                const game_id = data.game_id
                const game = data.game
                matchCallback = await MatchFound(game_id, game)
                if (typeof matchCallback === "function")
                    matchCallback()
                break
            case 'cancel_game':
                modalContainer = document.getElementById("match-found-modal")
                if (modalContainer)
                {
                    hideModalWithAnimation(modalContainer)
                    modalContainer.remove()
                }
                if (typeof matchCallback === "function")
                    matchCallback()
                if (location.pathname === "/game")
                    app.Router.navigate("/")
                break
            default:
                app.utils.showToast("ma3rt chhadshy ja mn back : ", type)
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
}

import { fetchUserData } from './pages/tournament/Controller.js';

const handletrEnd = async (data) => {
    const {winner, result, loser} =  data
    console.log('winner is : ', winner);
    console.log('result is : ', result);
    const winner_data = await fetchUserData(winner) || 'TBD'
    const loser_data = await fetchUserData(loser) || 'TBD'
    if (location.pathname === '/tournament')
    {
        const final1 = document.getElementById('winner1')
        const final1_score = document.getElementById('winner1-score')
        const final2 = document.getElementById('winner2')
        const final2_score = document.getElementById('winner2-score')

        final1_score.innerText = result[0]
        final2_score.innerText = result[1]
        final1.innerText = winner_data
        final2.innerText = loser_data
    }
    // if (location.pathname !== '/game')
    app.utils.showToast(`Tournament Ended, Winner is : ${winner_data}`, 'green')
}