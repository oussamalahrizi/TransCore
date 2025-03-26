

const view = (message) =>  /*html*/ `
    <div class="flex p-4">
        <p class="text-lg mx-3">
            ${message}
        </p>
        <div class="flex items-start justify-end">
        <button type="button" class="opacity-hover">
            <img src="/public/assets/X.svg" alt="close">
        </button>
        </div>
    </div>
`

export const showToast = (message, color='red') => {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `max-w-xs bg-${color}-500 text-white rounded-xl shadow-lg mt-14`;
    toast.innerHTML = view(message);
    toastContainer.insertBefore(toast, toastContainer.firstChild);
    const remove = () => {
        toast.remove()
        if (toastContainer.children.length == 0)
            toastContainer.remove()
    }
    toast.querySelector("button").addEventListener("click", remove)
    setTimeout(remove, 3000);
};

const createToastContainer = () => {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-0 right-4 mt-4 ml-4 space-y-4 z-50';
    document.body.appendChild(container);
    return container;
};

/**
 * Shows a toast notification with accept and decline buttons.
 *
 * @param {string} color - The color of the toast (default is 'blue')
 * @param {object} event_data - event data containing username and his id
 * @param {String} event_data.from - username
 * @param {String} event_data.from_id user id
 */
export const showConfirmToast = (color = 'green', event_data) => {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast bg-${color}-100 border-l-4 border-${color}-500 text-${color}-700 p-4 mt-14 mb-4 relative transition 0.3s ease-in-out`;
    
    // Create toast content
    const content = document.createElement('div');
    content.className = 'flex justify-between items-start';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex-grow mr-4';
    messageDiv.textContent = `You received a new Invite to Ping Pong from ${event_data.from}`;
    
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'flex flex-col space-y-2 mt-2';
    
    // Create accept button
    const acceptButton = document.createElement('button');
    acceptButton.id = "accept-invite-" + event_data.from_id;
    acceptButton.className = `px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors`;
    acceptButton.textContent = "Accept";
    acceptButton.addEventListener("click", () => {
        handleAccept(toast, event_data.from_id, timeout)
        if (toastContainer.children.length == 0)
            toastContainer.remove()

    })
    
    // Create decline button
    const declineButton = document.createElement('button');
    declineButton.id = "decline-invite-" + event_data.from_id;
    declineButton.className = `px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors`;
    declineButton.textContent = 'Decline';
    declineButton.addEventListener("click", () => {
        handleDecline(event_data.from_id, toast)
        clearTimeout(timeout)
        if (toastContainer.children.length == 0)
            toastContainer.remove()
    }
)

    
    // Add buttons to the button container
    buttonsDiv.appendChild(acceptButton);
    buttonsDiv.appendChild(declineButton);
    
    // Assemble toast
    content.appendChild(messageDiv);
    content.appendChild(buttonsDiv);
    toast.appendChild(content);

    const timeout = setTimeout(async () => {
        if (toast)
        {
            await handleDecline(event_data.from_id)
            toast.remove()
        }

        if (toastContainer.children.length == 0)
            toastContainer.remove()
        clearTimeout(timeout)
    }, 10000);
    toastContainer.insertBefore(toast, toastContainer.firstChild);    
};


const handleAccept = async (toast, from_id, timeout) => {
    try {
        const body = {
            user_id : from_id,
            decision : "accept"
        }
        clearTimeout(timeout)
        if (toast)
            toast.remove()

        const {data, error} = await app.utils.fetchWithAuth("/api/match/invite/change/", "POST", JSON.stringify(body))
        if (error)
        {
            app.utils.showToast(error)
            return
        }
        const game_id = data.game_id
        app.Router.navigate(`/game?game_id=${game_id}`)
    } catch (error) {
        if (error instanceof app.utils.AuthError)
            return
        console.error("error in accepting invite : ", error);
        
    }
}

/**
 * 
 * @param {HTMLElement} toast 
 * @returns 
 */
const handleDecline = async (from_id, toast=null) => {
    try {
        if (toast)
            toast.remove()
    const body = {
        user_id : from_id,
        decision : "decline"
    }
    const {data, error} = await app.utils.fetchWithAuth("/api/match/invite/change/", "POST", JSON.stringify(body))
        if (error)
        {
            app.utils.showToast(error)
            return
        }
    } catch (error) {
        if (error instanceof app.utils.AuthError)
            return
        console.error("error in declining invite : ", error);
        
    }
}