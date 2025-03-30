
import View from "./View.js";

const getReceived = async () => {
    const {data, error} = await app.utils.fetchWithAuth("/api/auth/friends/received/")
    if (error)
    {
        app.utils.showToast(error)
        return
    }
    data.forEach(async user => {
        if (!user.icon_url)
        {
            user.icon_url = '/public/assets/icon-placeholder.svg'
            return
        }
        if (user.icon_url && !user.icon_url.startsWith("/"))
            return
        user.icon_url += `?nocache=${Date.now()}`
    })
    return data
}


/**
 * @param {HTMLElement}  receivedModal
 */
const AttachAccept = (receivedModal) => {
    const acceptBtns = receivedModal.querySelectorAll(".accept-request-btn");
    acceptBtns.forEach(element => {
        element.addEventListener("click", async () => {
            try {    
                const id = element.getAttribute("data-request-id")
                if (!id)
                {
                    console.error("no id in accept");
                    return
                }
                const body = JSON.stringify({
                    change : 'accept'
                })
                const {data, error} = await app.utils.fetchWithAuth(
                    `/api/auth/friends/change/${id}/`,
                    'POST',
                    body
                )
                if (error)
                {
                    app.utils.showToast(error)
                    receivedModal.classList.remove('show');
                    receivedModal.remove();
                    return
                }
                console.log("accept friend : ", data)
                app.utils.showToast(data.detail, 'green')
                receivedModal.classList.remove('show');
                receivedModal.remove();
            } catch (error) {
                if (error instanceof app.utils.AuthError)
                    return
                console.log("error in accept controller", error);
            }
        })
    });
}

/**
 * @param {HTMLElement}  receivedModal
 */
const AttachReject = (receivedModal) => {
    const declineBtns = receivedModal.querySelectorAll(".decline-request-btn");
    declineBtns.forEach(element => {
        element.addEventListener("click", async () => {
            try { 
                const id = element.getAttribute("data-request-id")
                if (!id)
                {
                    console.error("no id in reject");
                    return
                }
                const body = JSON.stringify({
                    change : 'reject'
                })
                const {data, error} = await app.utils.fetchWithAuth(
                    `/api/auth/friends/change/${id}/`,
                    'POST',
                    body
                )
                if (error)
                {
                    app.utils.showToast(error)
                    receivedModal.classList.remove('show');
                    receivedModal.remove();
                    return
                }
                console.log("reject friend : ", data)
                app.utils.showToast(data.detail, 'green')
                receivedModal.classList.remove('show');
                receivedModal.remove();
            } catch (error) {
                if (error instanceof app.utils.AuthError)
                    return
                console.log("error in reject controller", error);
            }
        })
    });
}


export default async () => {
    try {
        console.log("received controller");
        
        // Check if modal already exists and remove it
        const existingModal = document.getElementById("received-requests-modal");
        if (existingModal) {
            existingModal.remove();
        }
        // Create modal container
        const receivedModal = document.createElement("div");
        receivedModal.id = "received-requests-modal";
        receivedModal.className = "received-requests-modal";
        
        // Fetch received friend requests
        const users = await getReceived()
        console.log("users", users);
        const rec = users
        console.log("users", rec);

        // Create modal content
        while(receivedModal.firstChild)
            receivedModal.removeChild(receivedModal.firstChild)
        receivedModal.innerHTML = View(rec)
        AttachAccept(receivedModal)
        AttachReject(receivedModal)
        
        // Add modal to DOM
        document.body.appendChild(receivedModal);
        
        // Show modal with animation
        setTimeout(() => {
            receivedModal.classList.add('show');
        }, 10);
        
        // Close button functionality
        const closeBtn = receivedModal.querySelector("#close-received");
        closeBtn.addEventListener("click", () => {
            receivedModal.classList.remove('show');
            setTimeout(() => {
                receivedModal.remove();
            }, 300);
        });
        
        
        // Close when clicking outside the modal
        receivedModal.addEventListener("click", (e) => {
            if (e.target !== receivedModal)
                return
            receivedModal.classList.remove('show');
            setTimeout(() => {
                receivedModal.remove();
            }, 300);
        });
    } catch (error) {
        if (error instanceof app.utils.AuthError)
            return
        console.log("error in received controller", error);
    }
};