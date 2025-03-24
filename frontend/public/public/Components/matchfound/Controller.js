import matchFoundTemplate from './matchfound.js';
import { showModalWithAnimation, hideModalWithAnimation } from '../../modalAnimations.js';


/**
 * Controller for the Match Found modal
 * @param {number} timeoutSeconds - Seconds before auto-declining (default: 15)
 */
export default async  (game_id, timeoutSeconds = 120) => {
    // Create modal container if it doesn't exist
    const {loaded, element} = await app.utils.LoadCompCss("/public/Components/matchfound/matchfound-modal.css")
    if (!loaded)
    {
        await handleDecline(game_id)
        element.remove()
        return
    }
    const modalContainer = document.createElement('div');
    modalContainer.id = "match-found-modal"
    modalContainer.innerHTML = matchFoundTemplate
    modalContainer.className = "matchfound-modal-container"
    
    // Set modal content    
    // Get timer elements
    const timerText = modalContainer.querySelector('.timer-text');
    const timerCircle = modalContainer.querySelector('.countdown-circle-progress');
    const circumference = 2 * Math.PI * 45; // Based on circle radius in SVG
    
    // Set initial styles for progress circle
    timerCircle.style.strokeDasharray = circumference;
    timerCircle.style.strokeDashoffset = '0';
    
    // Initialize remaining time
    let remainingTime = timeoutSeconds;
    timerText.textContent = remainingTime;
    
    // Show the modal with animation
    document.body.appendChild(modalContainer)
    void modalContainer.offsetWidth;
    modalContainer.classList.add("show");
    modalContainer.addEventListener("click", async (e) => {
        if (e.target === modalContainer)
        {
            await handleDecline(game_id)
            hideModalWithAnimation(modalContainer)
        }
    })

    // Setup countdown timer
    const countdownInterval = setInterval(async () => {
        remainingTime--;
        timerText.textContent = remainingTime;
        
        // Update circle progress
        const offset = circumference * (1 - remainingTime / timeoutSeconds);
        timerCircle.style.strokeDashoffset = offset;
        
        // Auto-decline when timer reaches 0
        if (remainingTime <= 0) {
            clearInterval(countdownInterval);
            await handleDecline(game_id);
        }
        
        // Change color to red when time is running out (last 5 seconds)
        if (remainingTime <= 5) {
            timerCircle.style.stroke = '#ff5252';
            timerText.style.color = '#ff5252';
        }
    }, 1000);
    
    // Add button event listeners
    const acceptBtn = modalContainer.querySelector('#accept-match');
    const declineBtn = modalContainer.querySelector('#decline-match');
    
    acceptBtn.addEventListener('click', ()=> handleAccept(game_id));
    declineBtn.addEventListener('click', () => handleDecline(game_id));
    
};

const handleDecline = async (game_id) => {

}
const handleAccept = async (game_id) => {}


