import { hideModalWithAnimation } from "/public/modalAnimations.js";

export const BlocklistModalView = /*html*/ `
    <div class="fa-container blocklist-container">
        <div class="fa-cross-title-div">
            <p class="fa-title">Blocked Users</p>
            <button id="close-blocklist-modal">
                <img src="/public/assets/cross.svg" class="cross-hover"/>
            </button>
        </div>
        <h1 class="fa-enable2fatext">Blocklist</h1>
        <p class="fa-notes">Users you have blocked will not be able to interact with you.</p>
        
        <div id="blocklist-container" class="blocklist-items">
            <div class="loading-div">
                <div class="loading-animation"></div>
            </div>
        </div>
    </div>
`


const LoadingView = /*html*/ `
    <div class="loading-div">
        <div class="loading-animation"></div>
    </div>
`


const EmptyBlocklistView = /*html*/ `
    <div class="empty-blocklist">
        <p>Your blocklist is empty</p>
    </div>
`

const MOCK_BLOCKED_USERS = [
    {
        id: "user1",
        username: "toxic_player42",
        avatar: "/public/assets/dog.png"
    },
    {
        id: "user2",
        username: "spammer_9000",
        avatar: "/public/assets/dog.png"
    },
    {
        id: "user3",
        username: "rude_gamer",
        avatar: "/public/assets/dog.png"
    },
    {
        id: "user4",
        username: "unfair_opponent",
        avatar: "/public/assets/dog.png"
    },
    {
        id: "user5",
        username: "trash_talker",
        avatar: "/public/assets/dog.png"
    }
];

const createBlockedUserItem = (user) => {
    return `
        <div class="blocked-user-item" data-user-id="${user.id}">
            <div class="blocked-user-info">
                <img src="${user.icon_url || '/public/assets/dog.png'}" class="blocked-user-avatar">
                <span class="blocked-user-name">${user.username}</span>
            </div>
            <button class="unblock-btn" data-user-id="${user.id}">Unblock</button>
        </div>
    `;
};

const fetchBlocklist = async () => {
    const {data, error} = await app.utils.fetchWithAuth("/api/auth/friends/blocked/")
    if (error)
    {
        app.utils.showToast(error)
        return
    }
    return data
};

const unblockUser = async (userId) => {
    const body = JSON.stringify({
        change : "unblock"
    })
    const {data, error} = await app.utils.fetchWithAuth(`/api/auth/friends/change/${userId}/`,
        "POST",
        body
    )
    if (error)
    {
        app.utils.showToast(error)
        return
    }
    app.utils.showToast(data.detail, "green")
};

/**
 * 
 * @param {HTMLElement} container 
 * @param {Array} users 
 * @returns 
 */
const renderBlocklist = (container, users) => {
    
    if (!users || users.length === 0) {
        container.innerHTML = EmptyBlocklistView;
        return;
    }
    
    const blocklistHTML = users.map(user => createBlockedUserItem(user)).join('');
    container.innerHTML = blocklistHTML;
    
    const unblockButtons = container.querySelectorAll('.unblock-btn');
    unblockButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const userId = e.target.dataset.userId;
            await unblockUser(userId)
            const item = container.querySelector(`.blocked-user-item[data-user-id="${userId}"]`);
            if (item) {
                item.remove();
            }
            if (container.querySelectorAll('.blocked-user-item').length === 0) {
                container.innerHTML = EmptyBlocklistView;
            }
        });
    });
};

export const controller = async () => {
    try {
        const view = document.getElementById("settings");
        const modal = view.querySelector("#blocklist-modal-wrapper");
        
        const closeButton = modal.querySelector("#close-blocklist-modal");
        view.addEventListener("click", (e) => {
            if (e.target === modal)
                hideModalWithAnimation(modal, () => view.removeChild(modal))
        })
        closeButton.addEventListener("click", () => {
            if (typeof hideModalWithAnimation === 'function') {
                hideModalWithAnimation(modal, () => {
                    view.removeChild(modal);
                });
            } else {
                view.removeChild(modal);
            }
        });
        
        const blocklistContainer = modal.querySelector("#blocklist-container");
        
        const blockedUsers = await fetchBlocklist();
        if (blockedUsers === null) {
            blocklistContainer.innerHTML = '<p class="error-message">Failed to load blocklist</p>';
            return;
        }
        
        renderBlocklist(blocklistContainer, blockedUsers);
        
    } catch (error) {
        if (error instanceof app.utils.AuthError)
            return;
        console.log("error controller blocklist modal", error);
        
    }
}; 