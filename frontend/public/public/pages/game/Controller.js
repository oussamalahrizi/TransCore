import * as THREE from 'three';
import { EffectComposer, FontLoader, GLTFLoader, OrbitControls, RenderPass, TextGeometry, UnrealBloomPass } from 'three/addons';
// import game from '.';


class BuildTerrain{
    constructor(Scene)
    {

      // Walls

      this.wallgeo = new THREE.BoxGeometry(14, 0.4, 0.4, 32, 32, 32);
      this.wallmaterial = new THREE.MeshStandardMaterial({
        color: 0x8f8d8d,
        roughness: 0.3,
        metalness: 0.1
      });
      this.wallmesh = new THREE.Mesh(this.wallgeo, this.wallmaterial);
      this.wallmesh1 = new THREE.Mesh(this.wallgeo, this.wallmaterial);


      this.wallmesh.position.set(0, 0, -4.3);
      this.wallmesh1.position.set(0, 0, 4.3);

      this.wallmesh.visible = false;
      this.wallmesh1.visible = false;

      // Paddles

      this.paddlegeo = new THREE.CapsuleGeometry(0.13, 1.45, 32, 32);
      this.paddlematerial = new THREE.MeshStandardMaterial({
        color: 0x00cf2b,
        emissive: 0x00cf2b,
        emissiveIntensity: 0.9,
        roughness: 0.3
      });

      this.paddlemesh = new THREE.Mesh(this.paddlegeo, this.paddlematerial);
      this.paddlemesh1 = new THREE.Mesh(this.paddlegeo, this.paddlematerial);

      this.paddlemesh.rotateX(Math.PI / 2);
      this.paddlemesh1.rotateX(Math.PI / 2);

      this.paddlemesh.position.set(-6.35, 0, 0);
      this.paddlemesh1.position.set(6.35, 0, 0);


      this.paddlemesh.castShadow = true;
      this.paddlemesh1.castShadow = true;

      this.paddlemesh.receiveShadow = true;
      this.paddlemesh1.receiveShadow = true;

      // Ball

      this.ballgeo = new THREE.SphereGeometry(0.075, 64, 64);
      this.ballmaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        emissive: 0xFFFFFF,
        emissiveIntensity: 3,
        roughness: 0.2,
        metalness: 0.1
      });

      this.ballmesh = new THREE.Mesh(this.ballgeo, this.ballmaterial);

      this.ballmesh.position.set(0, 0, 0);

        // Loaders

        this.loader = new GLTFLoader();

        this.loader.load(
                '/public/pages/game/models/Game Play.gltf',
                 (gltf) => {
                    // Model loaded successfully

                    const model = gltf.scene;
                    
                    const ballmodel = model.getObjectByName('Ball');
                    const paddle1model = model.getObjectByName('Player');
                    const paddle2model = model.getObjectByName('PlayerTwo');
                    const arena = model.getObjectByName('ArenaModel');
                    
                    // Paddles Models

                    paddle1model.position.copy(this.paddlemesh.position);
                    paddle1model.rotateY(Math.PI / 2);
                    paddle1model.scale.set(0.35 , 0.35 , 0.35 );

                    paddle2model.position.copy(this.paddlemesh1.position);
                    paddle2model.rotateY(Math.PI / 2);
                    paddle2model.scale.set(0.35, 0.35, 0.35);

                    // Arena model

                    arena.rotateX(Math.PI / 2);
                    arena.position.set(0, -0.25, 0);
                    arena.scale.set(0.005, 0.005, 0.005);

                    // Ball Model
              
                    ballmodel.position.copy(this.ballmesh.position);
                    ballmodel.scale.set(0.0033, 0.0033, 0.0033);

                    // Replace the existing meshes

                    this.paddlemesh.parent.remove(this.paddlemesh);
                    this.paddlemesh = paddle1model;

                    this.paddlemesh1.parent.remove(this.paddlemesh1);
                    this.paddlemesh1 = paddle2model;

                    this.ballmesh.parent.remove(this.ballmesh);
                    this.ballmesh = ballmodel;

                    // Adding the new Meshes to the scene

                    Scene.add(this.ballmesh);
                    Scene.add(this.paddlemesh);
                    Scene.add(this.paddlemesh1);
                    Scene.add(arena);

                },
                function (xhr) {
                    // Loading progress
                    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                },
                function (error) {
                    // Error occurred
                    console.error('An error occurred loading the model:', error);
                }
            );


      // Adding Objects to the Scene

      this.paddlemesh.visible = false;
      this.paddlemesh1.visible = false;
      this.ballmesh.visible = false;


      Scene.add(this.wallmesh);
      Scene.add(this.wallmesh1);
      Scene.add(this.paddlemesh);
      Scene.add(this.paddlemesh1);
      Scene.add(this.ballmesh);


      // Setting the scene background

       this.cubeloader = new THREE.CubeTextureLoader();

       this.background = this.cubeloader.load([
          'map/0/px.png',
          'map/0/nx.png',
          'map/0/py.png',
          'map/0/ny.png',
          'map/0/pz.png',
          'map/0/nz.png',
       ])

       Scene.background = this.background;  

    }
}




function createScore(Scene, gameInfo)
{
  const fontLoader = new FontLoader();
  fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
    // Create text geometry configuration
      gameInfo.textOptions = {
        font: font,
        size: 1,
        depth: 0.1,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 5
    };


  const textMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x56EEFB,
    metalness: 0.3,
    roughness: 0.4,
    // emissive: 0x56EEFB,
    emissiveIntensity: 0
  });

  const scoreGeometry = new TextGeometry('0', gameInfo.textOptions);

  gameInfo.p1ScoreMesh = new THREE.Mesh(scoreGeometry, textMaterial);
  gameInfo.p2ScoreMesh = new THREE.Mesh(scoreGeometry, textMaterial);

  gameInfo.p1ScoreMesh.position.set(-1.5, 1.55, -3.8);
  gameInfo.p1ScoreMesh.rotateX(-1.1);
  gameInfo.p2ScoreMesh.position.set(0.75, 1.55, -3.8);
  gameInfo.p2ScoreMesh.rotateX(-1.1);
  Scene.add(gameInfo.p1ScoreMesh);
  Scene.add(gameInfo.p2ScoreMesh);

  });
}

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

function restartGame(Terrain)
{
  // Return the ball and the paddles to their starting positions
  // Ball : 0, 0, 0
  // P1 : -6.35, 0, 0
  // P2 : 6.35, 0, 0
  Terrain.ballmesh.position.set(0, 0, 0);
  Terrain.paddlemesh.position.set(-6.35, 0, 0);
  Terrain.paddlemesh1.position.set(6.35, 0, 0);

}

const updateScore = (player, gameInfo)=>
{
  const { textOptions, gamePaused, scene} = gameInfo
    if (player === 1)
    gameInfo.p1Score++;
  else
    gameInfo.p2Score++;
  if (gameInfo.p1Score === 5 || gameInfo.p2Score === 5)
  {
      dispatchEvent(new CustomEvent('game-result', {detail : {winner : gameInfo.p1Score > gameInfo.p2Score ? "Player 1" : 'Player 2'}}))
      gameInfo.gamePaused = true;
      gameInfo.p1Score = 0;
      gameInfo.p2Score = 0;
  }
  if (gameInfo.p1ScoreMesh && gameInfo.p2ScoreMesh)
  {
    scene.remove(gameInfo.p1ScoreMesh);
    scene.remove(gameInfo.p2ScoreMesh);

      const textMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x56EEFB,
        metalness: 0.3,
        roughness: 0.4,
        // emissive: 0x56EEFB,
        emissiveIntensity: 0
      });

      const p1Geometry = new TextGeometry(gameInfo.p1Score.toString(), textOptions);
      const p2Geometry = new TextGeometry(gameInfo.p2Score.toString(), textOptions);

      gameInfo.p1ScoreMesh = new THREE.Mesh(p1Geometry, textMaterial);
      gameInfo.p2ScoreMesh = new THREE.Mesh(p2Geometry, textMaterial);

      gameInfo.p1ScoreMesh.position.set(-1.5, 1.55, -3.8);
      gameInfo.p1ScoreMesh.rotateX(-1.1);
      gameInfo.p2ScoreMesh.position.set(0.75, 1.55, -3.8);
      gameInfo.p2ScoreMesh.rotateX(-1.1);
      scene.add(gameInfo.p1ScoreMesh);
      scene.add(gameInfo.p2ScoreMesh);

    };
}

/**
 * 
 * @param {*} gameInfo 
 */
function updateBall(gameInfo) {
    // Update ball position
    const {ballVelocity, Terrain, ballSpeed, scene} = gameInfo

    const ball = Terrain.ballmesh;
    const paddles = [Terrain.paddlemesh, Terrain.paddlemesh1];
    
    ball.position.add(gameInfo.ballVelocity);

    // Wall collisions
    if (ball.position.z <= Terrain.wallmesh.position.z + 0.5 || 
        ball.position.z >= Terrain.wallmesh1.position.z - 0.5) {
        ballVelocity.z *= -1; // Reverse Z direction
    }

    // Check for scoring
    if (ball.position.x <= -7.5 || ball.position.x >= 7.5) {
      if (ball.position.x < 0)
        updateScore(2, gameInfo);
      else
      updateScore(1, gameInfo);
      // Reset ball position
      ball.position.set(0, 0.13, 0);
      gameInfo.ballVelocity = new THREE.Vector3(ballSpeed * (Math.random() > 0.5 ? 1 : -1), 0, ballSpeed * (Math.random() > 0.5 ? 1 : -1));
    }

    // Paddle collision detection
    paddles.forEach(paddle => {
        // Calculate the bounds of the paddle
        const paddleLeft = paddle.position.x - 0.150; // Half of paddle depth
        const paddleRight = paddle.position.x + 0.150;
        const paddleTop = paddle.position.z - 0.95; // Half of paddle height
        const paddleBottom = paddle.position.z + 0.95;

        // ball.rotation.x += gameInfo.ballVelocity.x;
        ball.rotation.y += ballVelocity.x;

        // Check if ball is within paddle bounds
        if (ball.position.x >= paddleLeft && 
            ball.position.x <= paddleRight && 
            ball.position.z >= paddleTop && 
            ball.position.z <= paddleBottom) {
            
            // Calculate where on the paddle the ball hit
            const hitPosition = (ball.position.z - paddle.position.z) / 0.75; // Normalized hit position (-1 to 1)
            
            // Reverse X direction
            ballVelocity.x *= -1;

            
            // Apply different angles based on where the ball hits the paddle
            if (hitPosition < -0.33) {
                // Top third of paddle - bounce upward
                ballVelocity.z = -Math.abs(ballVelocity.z) * 1.5;
            } else if (hitPosition > 0.33) {
                // Bottom third of paddle - bounce downward
                ballVelocity.z = Math.abs(ballVelocity.z) * 1.5;
            } else {
                // Middle third of paddle - straight bounce
                ballVelocity.z *= 0.5; // Reduce vertical movement
            }

            // Ensure the ball doesn't get stuck in the paddle
            if (paddle.position.x < 0) {
                ball.position.x = paddleRight + 0.1;
            } else {
                ball.position.x = paddleLeft - 0.1;
            }
            
            // Slightly increase ball speed with each hit
            const currentSpeed = ballVelocity.length(); 
            ballVelocity.normalize().multiplyScalar(Math.min(currentSpeed * 1.2, 0.2));
        }
    });
}


function Playermovements(Terrain, gameInfo)
{

  const paddle1 = Terrain.paddlemesh;
  const paddle2 = Terrain.paddlemesh1;
  const ball = Terrain.ballmesh;
  const wall = Terrain.wallmesh;
  const wall1 = Terrain.wallmesh1;

  
  if (!gameInfo.singlePlayer)
  {
    if (gameInfo.keyState['ArrowUp'] && paddle2.position.z - 1.25 > wall.position.z) {
      paddle2.position.z -= gameInfo.speed;
    }
    if (gameInfo.keyState['ArrowDown'] && paddle2.position.z + 1.25 < wall1.position.z) {
      paddle2.position.z += gameInfo.speed;
    }
  }
  else
  {
    if ((ball.position.z > 0 && paddle2.position.z <= ball.position.z) && paddle2.position.z + 1.25 < wall1.position.z)
    {
        paddle2.position.z += gameInfo.speed;
    }
    else if ((ball.position.z < 0 && paddle2.position.z >= ball.position.z) && paddle2.position.z - 1.25 > wall.position.z)
    {
      paddle2.position.z -= gameInfo.speed;
    }
  }
  if (gameInfo.keyState['KeyW'] && paddle1.position.z - 1.25  > wall.position.z){
    paddle1.position.z -= gameInfo.speed; 
  }
  if (gameInfo.keyState['KeyS'] && paddle1.position.z + 1.25 < wall1.position.z) {
    paddle1.position.z += gameInfo.speed;
  }
}


function singlePlayerMode(gameInfo)
{
  gameInfo.singlePlayer = !gameInfo.singlePlayer;
}


/**
 * 
 * @param {HTMLElement} gameContainer 
 */

const SetupScene = (gameContainer, gameInfo) =>
  {
    gameInfo.scene = new THREE.Scene();
    gameInfo.renderer = new THREE.WebGLRenderer({
      antialias: true, // Enables anti-aliasing
      powerPreference: "high-performance", // Optimizes rendering performance
    });
    gameContainer.appendChild(gameInfo.renderer.domElement);
    gameInfo.renderer.domElement.setAttribute('tabindex', '0');
    gameInfo.renderer.domElement.focus();
    gameInfo.renderer.setSize(window.innerWidth, window.innerHeight);
    gameInfo.renderer.setPixelRatio(window.devicePixelRatio); // Matches screen resolution
    gameInfo.renderer.shadowMap.enabled = true;
    gameInfo.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
    gameInfo.controls = new OrbitControls(gameInfo.camera, gameInfo.renderer.domElement);

    gameInfo.camera.position.set(0, 8.5, 6);
    gameInfo.camera.lookAt(0, 0, 0);
    gameInfo.scene.add(gameInfo.camera);

    gameInfo.light1 = new THREE.AmbientLight(0xffffff, 2);
    gameInfo.light = new THREE.DirectionalLight(0xffffff, 1);
    gameInfo.lightHelper = new THREE.DirectionalLightHelper(gameInfo.light, 2, 0xfffffff);
    gameInfo.scene.add(gameInfo.lightHelper);

    gameInfo.light.position.set(0, 5, 0);
    gameInfo.light.castShadow = true;
    gameInfo.scene.add(gameInfo.light);
    gameInfo.scene.add(gameInfo.light1);

    gameInfo.Terrain = new BuildTerrain(gameInfo.scene);
    createScore(gameInfo.scene, gameInfo);
    gameInfo.composer = new EffectComposer(gameInfo.renderer);
    gameInfo.renderPass = new RenderPass(gameInfo.scene, gameInfo.camera);

    gameInfo.composer.addPass(gameInfo.renderPass);
    gameInfo.BloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth / window.innerHeight),  1, 0.5, 0.84);
    gameInfo.composer.addPass(gameInfo.BloomPass);

  }

const animate = async() => {
  console.log(app.gameInfo);
  const gameInfo = app.gameInfo
  if (gameInfo.gamePaused)
  {
    await sleep(2)
    document.querySelector('#winner').remove()
    restartGame(gameInfo.Terrain);
    gameInfo.gamePaused = false;
  }
  requestAnimationFrame(animate);
  if (gameInfo.useComposer)
    gameInfo.composer.render();
  else
    gameInfo.renderer.render(gameInfo.scene, gameInfo.camera);

  if (gameInfo.gamestart)
  {
    Playermovements(gameInfo.Terrain, gameInfo);
    updateBall(gameInfo);
  }
}

export default () => {
  app.gameInfo = {
    singlePlayer : false,
    gamestart : true,
    gamePaused : false,
    useComposer : false,
    ballSpeed : 0.07,
    speed : 0.09,
    ballVelocity : null,
    scene : null,
    renderer : null,
    camera : null,
    controls : null,
    light1 : null,
    light : null,
    lightHelper : null,
    Terrain : null,
    composer : null,
    renderPass : null,
    BloomPass : null,
    p1Score : 0,
    p2Score : 0,
    p1ScoreMesh : null,
    p2ScoreMesh: null,
    textOptions : null,
    keyState : {},
  }

  const gameInfo = app.gameInfo
  // setup scene and run animate loop
  // app.utils.showToast("game page", 'green')
  const gameContainer = document.getElementById("game")

  SetupScene(gameContainer, gameInfo);
  // console.log(gameInfo.renderer);
  gameInfo.ballVelocity = new THREE.Vector3(gameInfo.ballSpeed, 0, gameInfo.ballSpeed);
  // console.log(gameInfo);
  


  gameInfo.renderer.domElement.addEventListener('keydown', (event) => {
    if (event.code === 'Numpad0')
        singlePlayerMode(app.gameInfo);
    if (event.code === 'ShiftRight')
        gameInfo.useComposer = !gameInfo.useComposer;
    if (event.code === 'Enter')
    {
        gameInfo.gamestart = !gameInfo.gamestart;
        dispatchEvent(new CustomEvent('game-pause'))
        return ;
    }
    gameInfo.keyState[event.code] = true;
  });
  
  gameInfo.renderer.domElement.addEventListener('keyup', (event) => {
    gameInfo.keyState[event.code] = false;
  });


  addEventListener("game-result", async (e) => {
    const { winner } = e.detail
    const view = document.createElement('div')
    view.id = 'winner'
    view.className = 'absolute w-full min-h-screen top-0 left-0 z-50 flex justify-center items-center text-white text-2xl bg-black/40'
    view.textContent = winner
    gameContainer.appendChild(view)
  })

  addEventListener("game-pause", async () => {
    if (gameInfo.gamestart)
    {
      document.getElementById("pause").remove()
      return
    }
    const view = document.createElement('div')
    view.id = 'pause'
    view.className = 'absolute w-full min-h-screen top-0 left-0 z-50 flex justify-center items-center text-white text-2xl bg-black/40'
    view.textContent = 'Paused'
    document.body.appendChild(view)
  })

  animate();
}







