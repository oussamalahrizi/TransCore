import View from "./View.js";
import { showModalWithAnimation, hideModalWithAnimation } from "../../../../modalAnimations.js";

/**
 * 
 * @param {string} id
 * @param {HTMLElement} container
 * @returns 
 */

const handleUnfriend = async (id, container) =>
{
    if (!id)
    {
        console.error("no id in handle unfriend");
        return
    }
    const body = JSON.stringify({
        change : 'unfriend'
    })
    const {data, error} = await app.utils.fetchWithAuth(
        `/api/auth/friends/change/${id}/`,
        'POST',
        body
    )
    if (error)
    {
        app.utils.showToast(error)
        return
    }
    console.log("unfriend friend : ", data)
    app.utils.showToast(data.detail, 'green')
    container.classList.remove('show');
    container.remove();
    const friendscontainer = document.querySelector("#friend-list-items")
    friendscontainer.dispatchEvent(new CustomEvent("refresh")) 
}
/**
 * 
 * @param {string} id 
 * @param {HTMLElement} container 
 * @returns 
 */

const handleblock = async (id, container) => {
    if (!id)
    {
        console.error("no id in handle unfriend");
        return
    }
    const body = JSON.stringify({
        change : 'block'
    })
    const {data, error} = await app.utils.fetchWithAuth(
        `/api/auth/friends/change/${id}/`,
        'POST',
        body
    )
    if (error)
    {
        app.utils.showToast(error)
        return
    }
    console.log("block friend : ", data)
    app.utils.showToast(data.detail, 'green')
    container.classList.remove('show');
    container.remove();
    const friendscontainer = document.querySelector("#friend-list-items")
    friendscontainer.dispatchEvent(new CustomEvent("refresh")) 
}

/**
 * 
 * @param {HTMLElement} container 
 * @param {{id, username, icon_url}} friend 
 */
const handlers = (container, friend) => {
    const invite = container.querySelector(`#invite-game-${friend.id}`)
    invite.addEventListener('click', (e) => {
        try {
            e.preventDefault();
            app.utils.showToast(`Invited ${friend.username} to a game`, "green");
            hideModalWithAnimation(container);
        } catch (error) {
            if (error instanceof app.utils.AuthError)
                return
            console.log("error in invite friend", error);
        }
        });
    const unfriend = container.querySelector(`#unfriend-${friend.id}`)
    unfriend.addEventListener('click', async () => {
        try {
            await handleUnfriend(friend.id, container)
            hideModalWithAnimation(container);    
        } catch (error) {
            if (error instanceof app.utils.AuthError)
                return
            console.log("error in unfriend friend", error);
        }
    });
    const block = container.querySelector(`#block-${friend.id}`)
    block.addEventListener('click', async (e) => {
        try
        {
            await handleblock(friend.id, container)
            hideModalWithAnimation(container);
        } catch (error) {
            if (error instanceof app.utils.AuthError)
                return
            console.log("error in block friend", error);
        }
    });
}


/**
 * Creates and displays a modal with friend options.
 * @param {{id, username, icon_url}} friend - The friend object to display options for.
 * @param {HTMLElement} target - The target element that triggered the modal.
 * @returns {Promise<void>} - A promise that resolves when the modal is displayed or rejects on error.
 * @throws {app.utils.AuthError} - If there is an authentication error.
 */
export default async (friend, target) => {
    try {
        const existingModal = document.getElementById("friend-modal");
        if (existingModal)
            existingModal.remove();
        
        const friendModal = document.createElement("div");
        friendModal.id = "friend-modal";
        friendModal.className = "friend-options-modal";
        friendModal.style.display = "none";
        
        friendModal.innerHTML = View(friend)
        
        document.body.appendChild(friendModal);
        
        const rect = target.getBoundingClientRect();
        friendModal.style.top = `${rect.bottom + window.scrollY}px`;
        friendModal.style.left = `${rect.left + window.scrollX}px`;
        handlers(friendModal, friend)
        showModalWithAnimation(friendModal);

        document.addEventListener("click", function closeModal(e) {
            if (friendModal.classList.contains("show") && 
                !friendModal.contains(e.target) && 
                !target.contains(e.target)) {
                hideModalWithAnimation(friendModal);
                document.removeEventListener("click", closeModal);
            }
        });

    } catch (error) {
        if (error instanceof app.utils.AuthError)
            return
        console.log("error in show friend modal : ");
        console.error(error);
    }
}