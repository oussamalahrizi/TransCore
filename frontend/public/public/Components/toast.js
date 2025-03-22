

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