import RoomGame from "./RoomGame.js";
import LocalGame from "./LocalGame.js";
import HomeGame from "./HomeGame.js";



export default () => {
    customElements.define("room-game", RoomGame);
    customElements.define("local-game", LocalGame);
    customElements.define("home-game", HomeGame);
}
