
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
                const color = data.color ? data.color : "red"
                Notification(message, color)
                break
            
            case "refresh_friends":
                const friendsContainer = document.getElementById("friend-list-items")                
                if (!friendsContainer)
                    break
                friendsContainer.dispatchEvent(new CustomEvent('refresh'))
                break
            
            case 'inqueue':
                console.log("received in queue event");
                
                dispatchEvent(new CustomEvent("play-button"))
                break

            case 'ingame':
                console.log("received in game event");
                
                dispatchEvent(new CustomEvent("play-button"))
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


const Notification = (message, color) => {
    app.utils.showToast(message, color)
}
