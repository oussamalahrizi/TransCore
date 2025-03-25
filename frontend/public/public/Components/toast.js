

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
 * @param {string} message - The message to display in the toast
 * @param {string} color - The color of the toast (default is 'blue')
 * @param {string} acceptBtnId - ID for the accept button
 * @param {string} declineBtnId - ID for the decline button
 */
export const showConfirmToast = (message, color = 'green', acceptBtnId, declineBtnId) => {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast bg-${color}-100 border-l-4 border-${color}-500 text-${color}-700 p-4 mt-14 mb-4 relative transition 0.3s ease-in-out`;
    
    // Create toast content
    const content = document.createElement('div');
    content.className = 'flex justify-between items-start';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex-grow mr-4';
    messageDiv.textContent = message;
    
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'flex flex-col space-y-2 mt-2';
    
    // Create accept button
    const acceptButton = document.createElement('button');
    acceptButton.id = acceptBtnId;
    acceptButton.className = `px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors`;
    acceptButton.textContent = "Accept";
    
    // Create decline button
    const declineButton = document.createElement('button');
    declineButton.id = declineBtnId;
    declineButton.className = `px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors`;
    declineButton.textContent = 'Decline';
    
    // Add buttons to the button container
    buttonsDiv.appendChild(acceptButton);
    buttonsDiv.appendChild(declineButton);
    
    // Assemble toast
    content.appendChild(messageDiv);
    content.appendChild(buttonsDiv);
    toast.appendChild(content);
    
    toastContainer.insertBefore(toast, toastContainer.firstChild);    
};