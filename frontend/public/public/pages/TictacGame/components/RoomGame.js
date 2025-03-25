export default class RoomGame extends HTMLElement {
  
  constructor() {
    super();

    /*Declare Element*/
    this.frame = document.createElement("div");
    this.header = document.createElement("header");
    this.meImg = document.createElement("img");
    this.vsIcon = document.createElement("img");
    this.oppImg = document.createElement("img");
    this.error_indice = document.createElement("div");
    this.manageTurn = document.createElement("div");
    this.text_turn = document.createElement("span");
    this.back = document.createElement("button");

    /*Class Name*/
    this.frame.className = "framee";
    this.header.className = "header";
    this.meImg.className = this.oppImg.className = "players-img";
    this.vsIcon.className = "vs-icon";
    this.error_indice.className = "error-indice";
    this.manageTurn.className = "manage-turn";
    this.text_turn.className = "text-turn";
    this.back.className = "back";

    /*ID Name*/
    this.meImg.id = "me-img";
    this.oppImg.id = "opp-img";
  }


  connectedCallback() {
    this.turn = false;

    /*Append Element*/
    this.appendChild(this.frame);
    this.vsIcon.src = "/public/pages/TictacGame/assets/images/vs.png";
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    console.log(protocol);
    const gameId = new URLSearchParams(window.location.search).get("game_id");
    console.log(gameId);
  
    if (!gameId) {
      console.error("No game ID provided");
      app.utils.showToast("No game ID provided");
      return null;
    }
  
    const token = app.utils.getCookie("access_token"); // Assuming you store JWT in localStorage
    if (!token) {
      console.error("No authentication token found");
      app.utils.showToast("Please log in to play");
      return null;
    }
  
    const wsUrl = `${protocol}//${window.location.host}/api/game/tictac/ws/remote?game_id=${gameId}&token=${token}`;

    this.gameSocket = new WebSocket(wsUrl);

    this.gameSocket.onclose = (event) => {
      console.log("Disconnected from game server:", event.reason);
      if (event.code == 4001) app.utils.showToast(event.reason);
    };
  
    this.gameSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      app.utils.showToast(error?.message || "An error occurred");
      app.Router.navigate("/");
    };
    this.gameSocket.onmessage = this.messageHandler.bind(this);
  }

  
    

  messageHandler(event) {
    try {
      const message = JSON.parse(event.data);
      
      if (message.action === "start_game") {
        this.turn = message.turn;
        
        if (this.turn)
          this.text_turn.textContent = "Your Turn";
        else
        this.text_turn.textContent = "Opponent's Turn";
        
        console.log("Player ID:", message.id);
        this.fetchPlayerImage();
        console.log("Opponent ID:", message.opp_id);
        this.fetchOpponentImage(message.opp_id);

        this.createBoard();
      }

      if (message.action === "game_move") {
        this.turn = message.turn;

        if (this.turn)
          this.text_turn.textContent = "Your Turn";
        else
          this.text_turn.textContent = "Opponent's Turn";


        let color = "green";

        if (!message.me)
          color = "red";

        const cell = document.getElementById(`cell-${message.position}`);

        let img = null;

        if (message.me) {
          img = document.createElement("img");
          img.src = "/public/pages/TictacGame/assets/images/icon-x-outline.svg";
        }
        else {
          img = document.createElement("img");
          img.src = "/public/pages/TictacGame/assets/images/icon-o-outline.svg";
        }
        cell.innerHTML = "";
        cell.appendChild(img);

      }

      if (message.action === "game_over") {
        this.text_turn.textContent = message.winner ? "🎉 You win 🎉" : "😢 You lose 😢";
        this.text_turn.classList.add("winning-text");
        if (message.winner)
          this.meImg.classList.add("winning-img");
        else
          this.oppImg.classList.add("winning-img");
        for (let i = 0; message.position && i < message.position.length; i++) {
          let n = message.position[i];
          document.getElementById(`cell-${n}`).classList.add("winning-cell");
        }
        this.back.textContent = "Back to Home";
        this.back.onclick = () => {
          console.log("back home.");
          app.Router.navigate("/");
        }

        app.utils.showToast(message.winner ? "Congratulation, You win." : "You lose.");
      }

      this.error_indice.textContent = "";
      if (message.action === "error"){
        this.error_indice.textContent = message.message;
      }

    }
    catch (error) {
      console.log("Error parsing message", error);
    }
  }

  async fetchPlayerImage() {
    try {
      const url = '/api/main/user/me/';
      const { data, error } = await app.utils.fetchWithAuth(url);
    
      if (error) {
        app.utils.showToast(error);
        return;
      }
    
      console.log("User data:", data);
      this.meImg.src = data.auth.icon_url || "/public/assets/icon-placeholder.svg";
      if (!this.meImg.src.startsWith('https'))
        this.meImg.src += `?nocache=${Date.now()}`
      this.meImg.alt = data.auth.username || "Me";
      this.meImg.title = data.auth.username || "Me";
    }
    catch (error) {
      if (error instanceof app.utils.AuthError) {
        return;
      }
      console.error("Error in fetch:", error);
    }
  }

  async fetchOpponentImage(opponentId) {
    try {
      const url = '/api/main/user/' + opponentId + '/';
      const { data, error } = await app.utils.fetchWithAuth(url);
    
      if (error) {
        app.utils.showToast(error);
        return;
      }
    
      this.oppImg.src = data.auth.icon_url || "/public/assets/icon-placeholder.svg";
      if (!this.meImg.src.startsWith('https'))
        this.meImg.src += `?nocache=${Date.now()}`
      this.oppImg.alt = data.auth.username || "Opponent";
      this.oppImg.title = data.auth.username || "Opponent";
    }
    catch (error) {
      if (error instanceof app.utils.AuthError) {
        return;
      }
      console.error("Error in fetch:", error);
    }
  }

  disconnectedCallback() {
    if (this.gameSocket?.readyState === WebSocket.OPEN) {
      this.gameSocket.close();
    }

    console.log("Custom element removed from page.");
  }

  createBoard() {
    const board = document.createElement("div");
    board.classList.add("board");

    for (let i = 1; i <= 9; i++) {
      let cell = document.createElement("div");
      cell.classList.add("cell");
      cell.setAttribute("id", `cell-${i}`);
      cell.onclick = () => {
        console.log("Cell clicked", i);
        if (this.gameSocket.readyState === WebSocket.OPEN) {
          console.log("send pos", i);
          this.gameSocket.send(JSON.stringify({
            position: i
          }));
        }
      }
      board.appendChild(cell);
    }

    this.innerHTML = "";
    this.appendChild(this.frame);
    this.frame.innerHTML = "";
    this.frame.appendChild(this.header);
    this.header.appendChild(this.meImg);
    this.header.appendChild(this.vsIcon);
    this.header.appendChild(this.oppImg);
    this.frame.appendChild(board);
    this.frame.appendChild(this.error_indice);
    this.frame.appendChild(this.manageTurn);
    this.manageTurn.appendChild(this.text_turn);
    this.frame.appendChild(this.back);
  }
};



