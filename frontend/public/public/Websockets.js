
export const SetOnline = () => {
    const token = app.utils.getCookie("access_token")
    
    const ws = new WebSocket("ws://localhost:8000/api/main/ws/?token=" + token)
    ws.onopen = (e) => {
        console.log("websocket connected");
    }
    ws.onclose = (e) => {
        console.log("connection closed :", e.reason);
        e.reason && app.utils.showToast(e.reason)
    }
    ws.onerror = (e)=> {
        console.log("websocket error", e);
    }
    ws.onmessage = async (e) => {
        const data = JSON.parse(e.data)
        const {message, type} = data
        console.log(e.data);
        switch (type)
        {
            case "notification":
                Notification(message, data.color ? color : "red")
                break
            
            case "refresh_friends":
                const friendsContainer = document.getElementById("friend-list-items")                
                if (!friendsContainer)
                    break
                friendsContainer.dispatchEvent(new CustomEvent('refresh'))
                break
            
            case 'inqueue':
                app.utils.showToast("You are now in queue, bdel play a imad")
                break

            case 'ingame':
                app.utils.showToast("You are in game, ha game id a ilyass", data.game_id)
                break
            case 'invite':
                app.utils.showToast("wslatk invite")
                break
            default:
                app.utils.showToast("ma3rt chhadshy ja mn back : ", message)
                break
        }
    }
    app.websocket = ws
}


const Notification = (message) => {
    app.utils.showToast(message, "green")
}

