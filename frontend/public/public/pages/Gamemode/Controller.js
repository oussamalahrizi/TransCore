import { fetchStatus } from "../../main.js";


const findmatch = async () => {
  try {
    const {error, data} = await app.utils.fetchWithAuth("/api/match/findmatch/pong/")
    if (error)
    {
      app.utils.showToast(error)
      return
    }
    console.log("data find match : ", data);
    app.utils.showToast(data.detail, "green")
    
  
  } catch (error) {
    if (error instanceof app.utils.AuthError)
      return
    console.log("error in find match: ", error);
    
  }
}


const findMatchSingle = async () => {
  try {
    const {error, data} = await app.utils.fetchWithAuth("/api/match/single/pong/")
    if (error)
    {
      app.utils.showToast(error)
      return
    }
    console.log("data find match : ", data);
    app.utils.showToast(data.detail, "green")
    await app.Router.navigate(`/game?game_id=${data.game_id}`)
  
  } catch (error) {
    if (error instanceof app.utils.AuthError)
      return
    console.log("error in find match: ", error);
    
  }
}


const findMatchTic = async () => {
  try {
    const {error, data} = await app.utils.fetchWithAuth("/api/match/findmatch/tic/")
    if (error)
    {
      app.utils.showToast(error)
      return
    }
    console.log("data find match : ", data);
    app.utils.showToast(data.detail, "green")
  
  } catch (error) {
    if (error instanceof app.utils.AuthError)
      return
    console.log("error in find match: ", error);
    
  }
}

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
  async function handleCardClick(cardNumber) {
    // First, reset all modes
    resetModes();

    // Set the appropriate variable to true based on the card clicked
    // and prepare redirection
    

    switch (cardNumber) {
      case 1:
        app.gameInfo.Singleplayer = true;
        const data = await fetchStatus()
        if (!data)
          break
        if (data.status !== "online")
        {
          app.utils.showToast(`Error: you are ${data.status}`)
          break
        }
        await findMatchSingle();
        console.log("Singleplayer mode selected");
        break;
      case 2:
        const selected = document.querySelector("#multiplayer-card")
        selected.classList.add("selected")
        app.gameInfo.Multiplayer = true;
        await findmatch()
        // Add transition delay when removing selected class
        setTimeout(() => {
          selected.classList.remove("selected");
        }, 50);
        break;
      case 3:
        await app.Router.navigate("/tictac/local")
        break;
      case 4:
        await findMatchTic();
        break;
    }

    // Add visual feedback before redirecting
    // app.Router.navigate(redirectURL);
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
