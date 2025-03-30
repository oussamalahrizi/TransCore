export default (receivedRequests) =>  /*html*/`
<div class="received-requests-modal-content">
    <div class="received-requests-header">
        <h3>Friend Requests</h3>
        <button id="close-received" class="close-modal-btn">&times;</button>
    </div>
    <div class="received-requests-container">
        ${receivedRequests.length ? 
            '<div class="received-requests-list">' +
            receivedRequests.map(request => `
                <div class="received-request-item">
                    <div class="received-request-info">
                        <img src="${request.icon_url}" class="received-avatar"/>
                        <span class="received-username">${request.username}</span>
                    </div>
                    <div class="received-request-actions">
                        <button class="accept-request-btn" data-request-id="${request.id}">Accept</button>
                        <button class="decline-request-btn" data-request-id="${request.id}">Decline</button>
                    </div>
                </div>
            `).join('') +
            '</div>'
            : 
            '<div class="no-received-requests">No new friend requests</div>'
        }
    </div>
</div>
`

