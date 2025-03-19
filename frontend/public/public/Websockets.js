
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
        const {message, type} = JSON.parse(e.data)
        console.log(e.data);
        switch (type)
        {
            case "notification":
                Notification(message)
                break
            
            case "refresh_friends":
                refresh_friends(message)
                break
            
            case 'inqueue':
                app.utils.showToast("You are now in queue, bdel play a imad")
                break

            case 'ingame':
                app.utils.showToast("You are in game, ha game id a ilyass", data.game_id)
                break
            default:
                app.utils.showToast("ma3rt chhadshy ja mn back : ", message)
                break
        }
    }

    const fetchNotifs = async () => {
        try {
            const {data, error} = await app.utils.fetchWithAuth("/api/main/user/notifications/")
            if (error)
            {
                app.utils.showToast(error)
                return
            }
            const view = document.getElementById("notif-container")
            const li = document.createElement("li")
            li.innerHTML = ` <pre>${JSON.stringify(data)}</pre>`
            view.appendChild(li)
        } catch (error) {
            console.log("error fetch notif", error);
        }
    }

    app.websocket = ws
}


const Notification = (message) => {
    app.utils.showToast(message, "green")
}


const refresh_friends  = (data) => {
    app.utils.showToast("refresh friends akhay imad")
}