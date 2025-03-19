
export default class HomeGame extends HTMLElement {


  constructor() {
    super();

    /*Declare Element*/
    this.frame = document.createElement("div");
    this.text_and_supporting = document.createElement("div");
    this.logo_container = document.createElement("div");
    this.xoxo_logo = document.createElement("img");
    this.suportong_text = document.createElement("div");
    this.button_row_local = document.createElement("div");
    this.button_row_remote = document.createElement("div");
    this.localGameButton = document.createElement("button");
    this.RemotGameButton = document.createElement("button");
    this.button_text_local = document.createElement("span");
    this.button_text_remote = document.createElement("span");

    /*Class Name*/
    this.frame.className = "frame";
    this.text_and_supporting.className = "text-and-supporting";
    this.logo_container.className = "logo-container";
    this.xoxo_logo.className = "xoxo-logo";
    this.suportong_text.className = "supporting-text";
    this.button_row_local.className = "button-row";
    this.button_row_remote.className = "button-row";
    this.localGameButton.className = this.RemotGameButton.className = "action-button";
    this.button_text_local.className = "button-text";
    this.button_text_remote.className = "button-text";

    /*Set Element*/
    this.xoxo_logo.src = "./assets/images/image.png";
    this.suportong_text.textContent = "First to align three marks wins! choose to play.";
    this.button_text_local.textContent = "Local Game";
    this.button_text_remote.textContent = "Remote Game";
  }


  connectedCallback() {

    /*Append Element*/
    //1
    this.appendChild(this.frame);
    this.frame.appendChild(this.text_and_supporting);
    this.text_and_supporting.appendChild(this.logo_container);
    this.logo_container.appendChild(this.xoxo_logo);
    this.text_and_supporting.appendChild(this.suportong_text);
    //2
    this.frame.appendChild(this.button_row_local);
    this.button_row_local.appendChild(this.localGameButton);
    this.localGameButton.appendChild(this.button_text_local);
    //3
    this.frame.appendChild(this.button_row_remote);
    this.button_row_remote.appendChild(this.RemotGameButton);
    this.RemotGameButton.appendChild(this.button_text_remote);

    /*Event Listener*/
    this.localGameButton.onclick = () => {
      const localGame = document.createElement("local-game");

      const root = document.getElementById("root");
      root.innerHTML = "";
      root.appendChild(localGame);
    }
    this.RemotGameButton.onclick = () => {
      const roomGame = document.createElement("room-game");
      const root = document.getElementById("root");
      root.innerHTML = "";
      root.appendChild(roomGame);
    }
  }

  disconnectedCallback() {
    console.log("Custom element removed from page.");

    this.innerHTML = "";

    /*Clear Event Listener*/
    this.localGameButton.onclick = null;
    this.RemotGameButton.onclick = null;
  }
};

customElements.define("home-game", HomeGame);
