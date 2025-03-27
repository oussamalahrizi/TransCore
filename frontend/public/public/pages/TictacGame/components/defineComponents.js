import RoomGame from "./RoomGame.js";
import LocalGame from "./LocalGame.js";



export default () => {
    customElements.define("room-game", RoomGame);
    customElements.define("local-game", LocalGame);
}
