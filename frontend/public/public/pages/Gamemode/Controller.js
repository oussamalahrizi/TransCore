export default () => {
  // Game mode variables - all initially set to false;
  app.gameInfo = {
    Singleplayer: false,
    Multiplayer: false,
    Tournament: false,
  };

  // URLs for each game mode
  const SINGLEPLAYER_URL = "/game?game_id=123"; // Replace with your actual URL
  const MULTIPLAYER_URL = "/"; // Replace with your actual URL
  const TOURNAMENT_URL = "/game?game_id=123"; // Replace with your actual URL

  // Function to reset all mode variables
  function resetModes() {
    app.gameInfo.Singleplayer = false;
    app.gameInfo.Multiplayer = false;
    app.gameInfo.Tournament = false;

    // Remove 'selected' class from all cards
    document.querySelectorAll(".card").forEach((card) => {
      card.classList.remove("selected");
    });
  }

  // Function to handle card clicks
  function handleCardClick(cardNumber) {
    // First, reset all modes
    resetModes();

    // Set the appropriate variable to true based on the card clicked
    // and prepare redirection
    let redirectURL = "";

    switch (cardNumber) {
      case 1:
        app.gameInfo.Singleplayer = true;
        redirectURL = SINGLEPLAYER_URL;
        console.log("Singleplayer mode selected");
        break;
      case 2:
        app.gameInfo.Multiplayer = true;
        redirectURL = MULTIPLAYER_URL;
        app.utils.showToast("You are now in queue", "orange");
        console.log("Multiplayer mode selected");
        break;
      case 3:
        app.gameInfo.Tournament = true;
        redirectURL = TOURNAMENT_URL;
        console.log("Tournament mode selected");
        break;
    }

    // Add 'selected' class to the clicked card
    const selectedCard = document.querySelector(
      `.card:nth-child(${cardNumber})`
    );
    selectedCard.classList.add("selected");

    // Add visual feedback before redirecting
    app.Router.navigate(redirectURL);
  }

  // Wait for the DOM to be fully loaded before adding event listeners
  // Get all cards
  const cards = document.querySelectorAll(".card");
  console.log(cards);

  // Add click event listeners to each card
  cards.forEach((card, index) => {
    card.addEventListener("click", function () {
      // Call the handling function with the card number (index + 1)
      handleCardClick(index + 1);
    });
  });
};
