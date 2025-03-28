
/**
 * @param {Array} pendingRequests
 */
export default (pendingRequests) => /*html*/`
    <div class="add-friend-modal-content">
        <div class="add-friend-header">
            <h3>Add Friend</h3>
            <button id="close-modal" class="close-modal-btn">&times;</button>
        </div>
        <div class="add-friend-form-container">
            <form id="add-friend-form" class="add-friend-form">
                <input 
                    type="text" 
                    name="username" 
                    placeholder="Enter username" 
                    required
                />
                <button type="submit" class="send-request-btn">Send Request</button>
            </form>
        </div>
        <div class="pending-requests-container">
            <h4>Pending Requests</h4>
            <div class="pending-requests-list">
                ${pendingRequests.length ? 
                    pendingRequests.map(request => `
                        <div class="pending-request-item">
                            <div class="pending-request-info">
                                <img src="${request.icon_url}" class="pending-avatar">
                                <span class="pending-username">${request.username}</span>
                            </div>
                            <span class="pending-status">Pending</span>
                            <button class="cancel-request-btn" data-request-id="${request.id}">Cancel</button>
                        </div>
                    `).join('') 
                    : 
                    '<div class="no-pending-requests">No pending friend requests</div>'
                }
            </div>
        </div>
    </div>
`;