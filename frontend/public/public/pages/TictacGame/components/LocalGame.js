export default class LocalGame extends HTMLElement {

  constructor() {
    super();

    /*Declare Element*/
    
    this.frame = document.createElement("div");
    this.error_indice = document.createElement("div");
    this.manageTurn = document.createElement("div");
    this.text_turn = document.createElement("span");
    this.back = document.createElement("button");

    /*Class Name*/
    this.frame.className = "frame";
    this.error_indice.className = "error-indice";
    this.manageTurn.className = "manage-turn";
    this.text_turn.className = "text-turn";
    this.back.className = "back";
  }

  connectedCallback() {
    this.turn = false;

    /*Append Element*/
    this.appendChild(this.frame);
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

    const token = app.utils.getCookie("access_token"); // Assuming you store JWT in localStorage
    
    if (!token) {
      console.error("No authentication token found");
      app.utils.showToast("Please log in to play");
      return null;
    }

    const wsUrl = `${protocol}//${window.location.host}/api/game/tictac/ws/local?token=${token}`;

    
    this.gameSocket = new WebSocket(
      wsUrl
    );
    // console.log("Error connecting to server");
    this.gameSocket.onerror = (error) => {
      console.log("Error connecting to server", error);
    }

    this.gameSocket.onclose = (event) => {
      console.log("Disconnected from game server:", event.reason);
      if (event.code == 4001) app.utils.showToast(event.reason);
    };

    this.gameSocket.onmessage = this.messageHandler.bind(this);

    // this.createBoard();
  }

  messageHandler(event) {
    try {
      const message = JSON.parse(event.data);


      if (message.action === "start_game") {
        this.turn = message.turn;

        if (this.turn)
          this.text_turn.textContent = "X Turn";
        else
          this.text_turn.textContent = "O Turn";

        this.createBoard();
      }

      if (message.action === "game_move") {
        this.turn = message.turn;

        if (this.turn)
          this.text_turn.textContent = "X Turn";
        else
          this.text_turn.textContent = "O Turn";

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
        this.text_turn.textContent = message.winner ? "🎉 X win 🎉" : "🎉 O win 🎉";
        this.text_turn.classList.add("winning-text");
        for (let i = 0; message.position && i < message.position.length; i++) {
          let n = message.position[i];
          document.getElementById(`cell-${n}`).classList.add("winning-cell");
        }
        this.back.textContent = "Back to Home";
        this.back.onclick = () => {
          console.log("back home.");
          app.Router.navigate("/");
        }
      }
      if (message.action === "error"){
        this.error_indice.textContent = message.message;
      }
    }
    catch (error) {
      console.log("Error parsing message", error);
    }
  }

  disconnectedCallback() {
    if (this.gameSocket) {
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
    this.frame.appendChild(board);
    this.frame.appendChild(this.error_indice);
    this.frame.appendChild(this.manageTurn);
    this.manageTurn.appendChild(this.text_turn);
    this.frame.appendChild(this.back);
  }

};



