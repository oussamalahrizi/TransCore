import { rendergame } from "../../../game/websockets.js";
import View from "./View.js";

const getPending = async () => {
    const {data, error} = await app.utils.fetchWithAuth("/api/auth/friends/sent/");
    if (error)
    {
        app.utils.showToast(error, "red");
        return []
    }
    data.forEach(async user => {
        if (user.icon_url && !user.icon_url.startsWith("/"))
            return
        
        user.icon_url += `?nocache=${Date.now()}`
    })
    return data
}

/**
 * 
 * @param {HTMLElement} container 
 */
const attachCancel = (container) => {
    const cancelBtns = container.querySelectorAll(".cancel-request-btn");
    cancelBtns.forEach(btn => {
		btn.addEventListener("click", async () => {
			const requestId = btn.dataset.requestId;
			try {
                const body = JSON.stringify({
                    change : "cancel"
                })
				const {data, error} = await app.utils.fetchWithAuth(
                    `/api/auth/friends/change/${requestId}/`,
                    "POST",
                    body
                );
				if (error) {
					app.utils.showToast(error, "red");
                    // Remove the modal
                    container.classList.remove('show');
                    setTimeout(() => {
                        container.remove();
                    }, 300);
					return;
				}
				app.utils.showToast(data.detail, "green");
				
				// Remove the modal
				container.classList.remove('show');
				setTimeout(() => {
					container.remove();
				}, 300);
				
			} catch (error) {
				if (error instanceof app.utils.AuthError) {
					return;
				}
				console.error("Error cancelling friend request:", error);
			}
		});
	});
}

export default async () => {
    try
    {
        const homeContainer = document.getElementById("home-view")
        const existingModal = document.getElementById("add-friend-modal");
        if (existingModal) {
            existingModal.remove();
        }
        // Create modal container
        const addFriendModal = document.createElement("div");
        addFriendModal.id = "add-friend-modal";
        addFriendModal.className = "add-friend-modal";
        
        // Fetch pending friend requests
        const pendingRequests = await getPending()
        addFriendModal.innerHTML = View(pendingRequests)

        homeContainer.appendChild(addFriendModal)
        setTimeout(() => addFriendModal.classList.add('show'), 10);
        const closeBtn = addFriendModal.querySelector("#close-modal");
        // close button
        closeBtn.addEventListener("click", () => {
            addFriendModal.classList.remove('show');
            setTimeout(() => {
                addFriendModal.remove();
            }, 300);
        })
        // form
        const form = addFriendModal.querySelector("#add-friend-form")
        form.addEventListener("submit", async (e) => {
            try {
                e.preventDefault()
                const formData = new FormData(form);
                const username = formData.get("username");
                if (!username) {
                    app.utils.showToast("Please enter a username", "red");
                    return;
                }
                const {data, error} = await app.utils.fetchWithAuth(`/api/auth/add_friend/${username}/`);
                if (error)
                {
                    app.utils.showToast(error)
                    return
                }
                app.utils.showToast(data.detail, "green");
                setTimeout(() => addFriendModal.remove(), 300);
            } catch (error) {
                if (error instanceof app.utils.AuthError)
                    return
                console.log("error in add friend form :", error);
            }
        })
        // cancel button
        attachCancel(addFriendModal)
        // remove from view if pressed outside
        addFriendModal.addEventListener("click", (e) => {
            if (e.target !== addFriendModal)
                return
            addFriendModal.classList.remove('show');
            setTimeout(() => {
                addFriendModal.remove();
            }, 300);
        });
    }
    catch (error)
    {
        if (error instanceof app.utils.AuthError)
            return
        console.error("error in add friend modal", error);
    }
}