

const view = (message) =>  /*html*/ `
    <div class="flex p-4">
        <p class="text-lg mx-3">
            ${message}
        </p>
        <div class="flex items-start justify-end">
        <button type="button" class="opacity-25 hover:opacity-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z" fill="#0F1729"/>
            </svg>
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