import * as THREE from "three";
import {
  EffectComposer,
  FontLoader,
  GLTFLoader,
  OrbitControls,
  RenderPass,
  TextGeometry,
  UnrealBloomPass,
} from "three/addons";

// import { rendergame } from "./Controller.js";

// const seupremote

export const setupWebSocket = (url) => {
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

  const wsUrl = `${protocol}//${window.location.host}${url}?game_id=${gameId}&token=${token}`;

  console.log("socket url", wsUrl);

  const ws = new WebSocket(wsUrl);
  // console.log(ws);
  ws.onopen = () => {
    console.log("Connected to game server");
  };

  ws.onclose = async (event) => {
    console.log("Disconnected from game server:", event.reason);
    if (event.code !== 4001 && event.code !== 4003)
      app.utils.showToast(event.reason, "green");
    else
      app.utils.showToast(event.reason);
    if (location.pathname === "/game")
    {
      await sleep(2);
      app.Router.navigate("/")
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
  ws.onmessage = onmessage;
  return ws;
};

export function rendergame(gameInfo) {
  if (gameInfo.useComposer) {
    gameInfo.composer.render();
  } else {
    gameInfo.renderer.render(gameInfo.scene, gameInfo.camera);
  }
}

function updateGameState(state) {
  // Update ball position
  // console.log("state :", state);
  if (app.gameInfo.Terrain.ballmesh) {
    app.gameInfo.Terrain.ballmesh.position.set(
      state.ballPosition.x,
      state.ballPosition.y,
      state.ballPosition.z
    );
  }

  // Update paddle positions
  if (app.gameInfo.Terrain.paddlemesh) {
    app.gameInfo.Terrain.paddlemesh.position.set(
      state.paddle1Position.x,
      state.paddle1Position.y,
      state.paddle1Position.z
    );
  }

  if (app.gameInfo.Terrain.paddlemesh1) {
    app.gameInfo.Terrain.paddlemesh1.position.set(
      state.paddle2Position.x,
      state.paddle2Position.y,
      state.paddle2Position.z
    );
  }

  // Update scores if changed
  if (
    app.gameInfo.p1Score !== state.p1Score ||
    app.gameInfo.p2Score !== state.p2Score
  ) {
    app.gameInfo.p1Score = state.p1Score;
    app.gameInfo.p2Score = state.p2Score;
    updateScoreDisplay();
  }
  // rendergame(app.gameInfo);
}

async function handleGameEnd(winner) {
  const view = document.createElement("div");
  const gameContainer = document.getElementById("game");
  view.id = "winner";
  view.className =
    "absolute w-full min-h-screen top-0 left-0 z-50 flex justify-center items-center text-white text-2xl bg-black/40";
  view.textContent = `${winner}`;
  gameContainer.appendChild(view);
  await sleep(2)
  view.remove();
  gameContainer.dispatchEvent(new CustomEvent('end'))
}

function updateScoreDisplay() {
  if (app.gameInfo.scene && app.gameInfo.textOptions) {
    // Remove existing score meshes
    if (app.gameInfo.p1ScoreMesh)
      app.gameInfo.scene.remove(app.gameInfo.p1ScoreMesh);
    if (app.gameInfo.p2ScoreMesh)
      app.gameInfo.scene.remove(app.gameInfo.p2ScoreMesh);

    // Create new score meshes
    const textMaterial = new THREE.MeshStandardMaterial({
      color: 0x56eefb,
      metalness: 0.3,
      roughness: 0.4,
      emissiveIntensity: 0,
    });

    const p1Geometry = new TextGeometry(
      app.gameInfo.p1Score.toString(),
      app.gameInfo.textOptions
    );
    const p2Geometry = new TextGeometry(
      app.gameInfo.p2Score.toString(),
      app.gameInfo.textOptions
    );

    app.gameInfo.p1ScoreMesh = new THREE.Mesh(p1Geometry, textMaterial);
    app.gameInfo.p2ScoreMesh = new THREE.Mesh(p2Geometry, textMaterial);

    app.gameInfo.p1ScoreMesh.position.set(-1.5, 1.55, -3.8);
    app.gameInfo.p1ScoreMesh.rotateX(-1.1);
    app.gameInfo.p2ScoreMesh.position.set(0.75, 1.55, -3.8);
    app.gameInfo.p2ScoreMesh.rotateX(-1.1);

    app.gameInfo.scene.add(app.gameInfo.p1ScoreMesh);
    app.gameInfo.scene.add(app.gameInfo.p2ScoreMesh);
  }
}

let gameContainer = null

const startGame = () => {
  app.gameInfo.ws.send(
    JSON.stringify({
      type: "init_game",
    })
  );
  document.getElementById("waiting")?.remove();
  app.gameInfo.renderer.domElement.setAttribute("tabindex", "0");
  app.gameInfo.renderer.domElement.focus();
};

/**
 *
 * @param {MessageEvent} event
 */
export const onmessage = (event) => {
  const data = JSON.parse(event.data);

  const { type, state, winner, message } = data;

  switch (type) {
    case "waiting":
      const view = document.createElement("div");
      gameContainer = document.getElementById("game");
      view.id = "waiting";
      view.className =
        "absolute w-full min-h-screen top-0 left-0 z-50 flex justify-center items-center text-white text-2xl bg-black/40";
      gameContainer.appendChild(view);
      if (app.gameInfo.Singleplayer) {
        view.textContent = "Press Space bar to start the game";
        view.addEventListener("keydown", (e) => {
          if (e.code == "Space") startGame();
        });
        view.setAttribute("tabindex", "0");
        view.focus();
      } else view.textContent = "waiting for other player to join";
      break;

    case "gameStart":
      console.log("game has started");
      document.getElementById("waiting")?.remove();
      console.log("popup msg removed");
      gameContainer = document.getElementById("game")
      gameContainer.dispatchEvent(new CustomEvent("start"))
      break;

    case "gameState":
      updateGameState(JSON.parse(state));
      break;

    case "gameEnd":
      handleGameEnd(winner);  
      break;

    case "send_init_data":
      app.gameInfo.player_id = data.user_id;
      break;
    case "error":
      console.error("Game error:", message);
      break;
  }
};

export function sleep(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
