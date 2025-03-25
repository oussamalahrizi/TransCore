export default class LocalGame extends HTMLElement {


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

    this.gameSocket = new WebSocket(
      'ws://' + window.location.host + '/api/game/tictac/ws/local'
    );
    // console.log("Error connecting to server");
    this.gameSocket.onerror = (error) => {
      console.log("Error connecting to server", error);
    }
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
        this.text_turn.textContent = message.winner ? "🎉 X win 🎉" : "🎉 O win 🎉";
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
        // let img = document.createElement("img");
        // img.src = "assets/images/icon-x-outline.svg";

        // cell.innerHTML = "";
        // cell.appendChild(img);
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

customElements.define("local-game", LocalGame);


