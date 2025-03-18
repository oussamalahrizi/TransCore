
/**
 * @param {HTMLElement} modal
 */
export function showModalWithAnimation(modal) {
  if (!modal) return;
  
  modal.style.display = "block";
  
  void modal.offsetWidth;
  
  modal.classList.add("show");
}

/**
 * @param {HTMLElement} modal
 * @param {Function} callback 
 */

export function hideModalWithAnimation(modal, callback) {
  if (!modal) return;
  
  modal.classList.remove("show");
  
  setTimeout(() => {
    modal.style.display = "none";
    if (typeof callback === 'function') {
      callback();
    }
  }, 300);
} 