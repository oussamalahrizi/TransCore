export default () => /*html*/`
    <div class="matchfound-modal-container">
        <div class="matchfound-modal">
            <div class="matchfound-content">
                <h1>Match Found</h1>
                <div class="matchfound-timer">
                    <svg viewBox="0 0 100 100" class="countdown-circle">
                        <circle cx="50" cy="50" r="45" class="countdown-circle-bg" />
                        <circle cx="50" cy="50" r="45" class="countdown-circle-progress" />
                    </svg>
                    <span class="timer-text">15</span>
                </div>
                <p class="matchfound-message">Game invitation received. Accept or decline?</p>
                <div class="matchfound-buttons">
                    <button class="decline-btn">Decline</button>
                    <button class="accept-btn">Accept</button>
                </div>
            </div>
        </div>
    </div>
`