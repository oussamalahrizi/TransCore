
export const SetOnline = () => {
    const token = app.utils.getCookie("access_token")
    
    const ws = new WebSocket("ws://localhost:8000/api/ws/?token=" + token)
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
        app.utils.showToast("You have a notification : " + message, "green")
        await fetchNotifs()
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

