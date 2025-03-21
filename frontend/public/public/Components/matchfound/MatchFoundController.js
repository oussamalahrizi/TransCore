import matchFoundTemplate from './matchfound.js';
import { showModalWithAnimation, hideModalWithAnimation } from '../../modalAnimations.js';

/**
 * Controller for the Match Found modal
 * @param {Object} matchData - Data about the match/game invitation
 * @param {Function} onAccept - Callback function when user accepts the match
 * @param {Function} onDecline - Callback function when user declines the match
 * @param {number} timeoutSeconds - Seconds before auto-declining (default: 15)
 * @returns {Object} - Control methods for the modal
 */
const showMatchFoundModal = (matchData, onAccept, onDecline, timeoutSeconds = 15) => {
    // Create modal container if it doesn't exist
    let modalContainer = document.getElementById('match-found-modal');
    
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'match-found-modal';
        document.body.appendChild(modalContainer);
    }
    
    // Set modal content
    modalContainer.innerHTML = matchFoundTemplate();
    
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
    showModalWithAnimation(modalContainer.querySelector('.matchfound-modal-container'));
    // Setup countdown timer
    const countdownInterval = setInterval(() => {
        remainingTime--;
        timerText.textContent = remainingTime;
        
        // Update circle progress
        const offset = circumference * (1 - remainingTime / timeoutSeconds);
        timerCircle.style.strokeDashoffset = offset;
        
        // Auto-decline when timer reaches 0
        if (remainingTime <= 0) {
            clearInterval(countdownInterval);
            handleDecline();
        }
        
        // Change color to red when time is running out (last 5 seconds)
        if (remainingTime <= 5) {
            timerCircle.style.stroke = '#ff5252';
            timerText.style.color = '#ff5252';
        }
    }, 1000);
    
    // Add button event listeners
    const acceptBtn = modalContainer.querySelector('.accept-btn');
    const declineBtn = modalContainer.querySelector('.decline-btn');
    
    acceptBtn.addEventListener('click', handleAccept);
    declineBtn.addEventListener('click', handleDecline);
    
    // Accept match handler
    function handleAccept() {
        clearInterval(countdownInterval);
        hideModalWithAnimation(modalContainer.querySelector('.matchfound-modal-container'));
        
        if (typeof onAccept === 'function') {
            onAccept(matchData);
        }
    }
    
    // Decline match handler
    function handleDecline() {
        clearInterval(countdownInterval);
        hideModalWithAnimation(modalContainer.querySelector('.matchfound-modal-container'));
        
        if (typeof onDecline === 'function') {
            onDecline(matchData);
        }
    }
    
    // Return controller methods for external control
    return {
        accept: handleAccept,
        decline: handleDecline,
        close: () => {
            clearInterval(countdownInterval);
            hideModalWithAnimation(modalContainer.querySelector('.matchfound-modal-container'));
        }
    };
};

export default {
    showMatchFoundModal
}; 