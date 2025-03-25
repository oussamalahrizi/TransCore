export default class RoomGame extends HTMLElement {
  
  constructor() {
    super();

    /*Declare Element*/
    this.frame = document.createElement("div");
    this.error_indice = document.createElement("div");
    this.manageTurn = document.createElement("div");
    this.text_turn = document.createElement("span");

    /*Class Name*/
    this.frame.className = "framee";
    this.error_indice.className = "error-indice";
    this.manageTurn.className = "manage-turn";
    this.text_turn.className = "text-turn";
  }


  connectedCallback() {
    this.turn = false;

    /*Append Element*/
    this.appendChild(this.frame);

    const ROOM_ID = this.getAttribute(""); // Get room id from query string

    this.gameSocket = new WebSocket(
      'ws://' + window.location.host + '/api/game/tictac/ws/room/' + ROOM_ID
    );
    this.gameSocket.onerror = (error) => {
      console.log("Failed to establish connection with the server", error);
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
          img.src = "assets/images/icon-x-outline.svg";
        }
        else {
          img = document.createElement("img");
          img.src = "assets/images/icon-o-outline.svg";
        }
        cell.innerHTML = "";
        cell.appendChild(img);

      }

      if (message.action === "game_over") {
        this.text_turn.textContent = message.winner ? "🎉 You win 🎉" : "😢 You lose 😢";
        this.text_turn.classList.add("winning-text");
        for (let i = 0; message.position && i < message.position.length; i++) {
          let n = message.position[i];
          document.getElementById(`cell-${n}`).classList.add("winning-cell");
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
    this.frame.appendChild(board);
    this.frame.appendChild(this.error_indice);
    this.frame.appendChild(this.manageTurn);
    this.manageTurn.appendChild(this.text_turn);
  }

};

customElements.define("room-game", RoomGame);


