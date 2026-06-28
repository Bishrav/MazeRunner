import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

const canvas = document.getElementById("game3d");
const hud = document.getElementById("hud");
const menu = document.getElementById("menu");
const pauseMenu = document.getElementById("pauseMenu");
const summary = document.getElementById("summary");
const centerHint = document.getElementById("centerHint");
const levelGrid = document.getElementById("levelGrid");
const levelLabel = document.getElementById("levelLabel");
const themeLabel = document.getElementById("themeLabel");
const coinLabel = document.getElementById("coinLabel");
const scoreLabel = document.getElementById("scoreLabel");
const timerLabel = document.getElementById("timerLabel");
const deathLabel = document.getElementById("deathLabel");
const objectiveLabel = document.getElementById("objectiveLabel");
const staminaFill = document.getElementById("staminaFill");
const statusFeed = document.getElementById("statusFeed");
const summaryTitle = document.getElementById("summaryTitle");
const summaryText = document.getElementById("summaryText");
const starRating = document.getElementById("starRating");

const SAVE_KEY = "maze-runner-save-v2";
const clock = new THREE.Clock();
const keys = new Set();

const levels = [
  {
    name: "Emerald Trial",
    theme: "Realistic Forest Maze",
    objective: "Run through log barricades, collect coins, dodge mechanical sweepers, and reach the gate.",
    targetTime: 105,
    map: [
      "###################",
      "#S..C..R.#....C..E#",
      "#.###.##.#.####.###",
      "#...#....#....#...#",
      "###.#.######T.###.#",
      "#C..#....C#....#..#",
      "#.#####.#.####.#.##",
      "#.....#.#....#....#",
      "#.###.#.T##C.####.#",
      "#..R..C.........C.#",
      "###################",
    ],
  },
  {
    name: "AVIF Grove",
    theme: "Compressed Texture Forest",
    objective: "A denser performance-style grove with more grass, props, and coins.",
    targetTime: 125,
    map: [
      "#####################",
      "#S..C..R.#.....C...E#",
      "#.#####..#.#######.##",
      "#.....#..#....#.....#",
      "###.#.#.####C.#.###.#",
      "#C..#.#....#..#...#.#",
      "#.###.####.#.###T.#.#",
      "#.....C....#....#...#",
      "#.########.###C.###.#",
      "#C....R............C#",
      "#####################",
    ],
  },
  {
    name: "Warrior Chase",
    theme: "Ancient Woodland Arena",
    objective: "Use sprint, collect coins, avoid mechanical sweepers, and beat the timer.",
    targetTime: 145,
    map: [
      "#######################",
      "#S....#..R.C.....#...E#",
      "#.###.#.#######.###.#.#",
      "#...#.#.....#.....#.#.#",
      "###.#.#####.#.###.#.#.#",
      "#C..#...T.#.#..C#...#.#",
      "#.#######.#.#####.###.#",
      "#.....C...#.......#...#",
      "#.###.#####.#######T#.#",
      "#...#..R..C.....C....C#",
      "#######################",
    ],
  },
];

const state = {
  mode: "menu",
  selectedLevel: 0,
  unlocked: Number(localStorage.getItem(SAVE_KEY) || 1),
  map: [],
  cellSize: 4,
  startTime: 0,
  elapsed: 0,
  deaths: 0,
  coins: [],
  traps: [],
  relics: [],
  collected: 0,
  score: 0,
  stamina: 1,
  sprinting: false,
  player: {
    object: new THREE.Group(),
    velocity: new THREE.Vector3(),
    yaw: 0,
    moving: false,
  },
  mixer: null,
  actions: {},
  currentAction: "",
  walls: [],
  exit: new THREE.Vector3(),
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fc9df);
scene.fog = new THREE.FogExp2(0x8fbca2, 0.026);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 420);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const world = new THREE.Group();
const dynamic = new THREE.Group();
const environment = new THREE.Group();
scene.add(world, dynamic, environment);

const sun = new THREE.DirectionalLight(0xfff0cc, 3.8);
sun.position.set(-22, 34, 18);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 120;
sun.shadow.camera.left = -70;
sun.shadow.camera.right = 70;
sun.shadow.camera.top = 70;
sun.shadow.camera.bottom = -70;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xb8d9ff, 0x426a3b, 1.8));

const materials = {
  wall: new THREE.MeshStandardMaterial({ color: 0x6b5f43, roughness: 0.95, metalness: 0.02 }),
  moss: new THREE.MeshStandardMaterial({ color: 0x386641, roughness: 1 }),
  grass: new THREE.MeshStandardMaterial({ color: 0x3c7a3f, roughness: 1 }),
  bark: new THREE.MeshStandardMaterial({ color: 0x5a3825, roughness: 1 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x1f7a3d, roughness: 0.9 }),
  rope: new THREE.MeshStandardMaterial({ color: 0x8b6b3f, roughness: 0.95 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x7c7a68, roughness: 1 }),
  flower: new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.75 }),
  coin: new THREE.MeshStandardMaterial({ color: 0xf8c537, roughness: 0.34, metalness: 0.75, emissive: 0x4f3300 }),
  exit: new THREE.MeshStandardMaterial({ color: 0x28d17c, roughness: 0.28, metalness: 0.15, emissive: 0x0b4428 }),
  trap: new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.55, metalness: 0.35, emissive: 0x3b0505 }),
  relic: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.18, metalness: 0.45, emissive: 0x0e7490 }),
  hazardMetal: new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.42, metalness: 0.65 }),
  hazardStripe: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5, metalness: 0.25, emissive: 0x3a2100 }),
};

function gridToWorld(x, z) {
  return new THREE.Vector3((x - state.map[0].length / 2) * state.cellSize, 0, (z - state.map.length / 2) * state.cellSize);
}

function renderLevelGrid() {
  levelGrid.innerHTML = "";
  levels.forEach((level, index) => {
    const button = document.createElement("button");
    button.className = "level-card";
    button.disabled = index + 1 > state.unlocked;
    button.style.setProperty("--card-accent", "#3c7a3f");
    button.innerHTML = `<strong>Level ${index + 1}: ${level.name}</strong><span>${level.theme}</span><span>${button.disabled ? "Locked" : level.objective}</span>`;
    button.addEventListener("click", () => startLevel(index));
    levelGrid.appendChild(button);
  });
}

async function loadProgress() {
  try {
    const response = await fetch("/api/progress", { cache: "no-store" });
    if (!response.ok) throw new Error("Progress API unavailable");
    const progress = await response.json();
    state.unlocked = Math.max(1, Number(progress.unlocked || 1));
  } catch {
    state.unlocked = Number(localStorage.getItem(SAVE_KEY) || 1);
  }
  localStorage.setItem(SAVE_KEY, String(state.unlocked));
}

async function saveProgress(completion) {
  localStorage.setItem(SAVE_KEY, String(state.unlocked));
  try {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unlocked: state.unlocked, completion }),
    });
  } catch {
    status("Saved locally");
  }
}

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children.pop();
    child.traverse?.((node) => {
      if (node.geometry) node.geometry.dispose();
    });
  }
}

function startLevel(index) {
  state.mode = "playing";
  state.selectedLevel = index;
  state.map = levels[index].map.map((row) => row.split(""));
  state.startTime = performance.now();
  state.elapsed = 0;
  state.deaths = 0;
  state.collected = 0;
  state.coins = [];
  state.traps = [];
  state.relics = [];
  state.walls = [];
  state.stamina = 1;
  state.sprinting = false;
  state.score = 0;

  clearGroup(world);
  clearGroup(dynamic);
  clearGroup(environment);
  dynamic.add(state.player.object);
  buildLevel();

  menu.classList.add("hidden");
  summary.classList.add("hidden");
  pauseMenu.classList.add("hidden");
  hud.classList.remove("hidden");
  centerHint.classList.remove("hidden");
  updateHud();
}

function buildLevel() {
  const level = levels[state.selectedLevel];
  const width = state.map[0].length;
  const depth = state.map.length;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(width * state.cellSize + 70, depth * state.cellSize + 70, 80, 80),
    materials.grass
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  world.add(ground);

  addTerrainDetail(width, depth);
  addForestBackdrop(width, depth, level.theme.includes("AVIF") ? 165 : 115);
  addAtmosphere(width, depth);

  for (let z = 0; z < state.map.length; z += 1) {
    for (let x = 0; x < state.map[z].length; x += 1) {
      const cell = state.map[z][x];
      const pos = gridToWorld(x + 0.5, z + 0.5);
      if (cell === "#") addWall(pos, x, z);
      if (cell === "S") placePlayer(pos);
      if (cell === "E") addExit(pos);
      if (cell === "C") addCoin(pos);
      if (cell === "R") addRelic(pos);
      if (cell === "T") addTrap(pos);
    }
  }
}

function addTerrainDetail(width, depth) {
  const areaW = width * state.cellSize + 58;
  const areaD = depth * state.cellSize + 58;
  const grassMesh = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.045, 0.62, 4),
    new THREE.MeshStandardMaterial({ color: 0x4f9f45, roughness: 1 }),
    900
  );
  grassMesh.castShadow = false;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 900; i += 1) {
    dummy.position.set((Math.random() - 0.5) * areaW, 0.31, (Math.random() - 0.5) * areaD);
    dummy.rotation.set(Math.random() * 0.2, Math.random() * Math.PI, (Math.random() - 0.5) * 0.22);
    const scale = 0.55 + Math.random() * 0.8;
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    grassMesh.setMatrixAt(i, dummy.matrix);
  }
  environment.add(grassMesh);

  for (let i = 0; i < 90; i += 1) {
    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.08 + Math.random() * 0.05, 8, 6),
      new THREE.MeshStandardMaterial({ color: [0xf472b6, 0xfacc15, 0xa7f3d0][i % 3], roughness: 0.8 })
    );
    flower.position.set((Math.random() - 0.5) * areaW, 0.12, (Math.random() - 0.5) * areaD);
    environment.add(flower);
  }

  for (let i = 0; i < 34; i += 1) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35 + Math.random() * 0.55, 0), materials.stone);
    rock.position.set((Math.random() - 0.5) * areaW, 0.18, (Math.random() - 0.5) * areaD);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.scale.y = 0.35 + Math.random() * 0.35;
    rock.castShadow = true;
    rock.receiveShadow = true;
    environment.add(rock);
  }
}

function addForestBackdrop(width, depth, count) {
  const radiusX = width * state.cellSize * 0.7 + 28;
  const radiusZ = depth * state.cellSize * 0.7 + 28;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const jitter = 0.8 + Math.random() * 0.42;
    const x = Math.cos(angle) * radiusX * jitter;
    const z = Math.sin(angle) * radiusZ * jitter;
    addTree(x, z, 0.8 + Math.random() * 1.8);
  }
}

function addAtmosphere(width, depth) {
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42, depthWrite: false });
  for (let i = 0; i < 18; i += 1) {
    const cloud = new THREE.Group();
    for (let j = 0; j < 4; j += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(1.2 + Math.random() * 1.4, 12, 8), cloudMat);
      puff.scale.y = 0.28;
      puff.position.set(j * 1.2, Math.random() * 0.3, Math.random() * 0.8);
      cloud.add(puff);
    }
    cloud.position.set(
      (Math.random() - 0.5) * (width * state.cellSize + 80),
      18 + Math.random() * 14,
      (Math.random() - 0.5) * (depth * state.cellSize + 80)
    );
    environment.add(cloud);
  }

  const fireflyMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.78 });
  for (let i = 0; i < 45; i += 1) {
    const firefly = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), fireflyMat);
    firefly.position.set(
      (Math.random() - 0.5) * (width * state.cellSize + 28),
      0.8 + Math.random() * 2.8,
      (Math.random() - 0.5) * (depth * state.cellSize + 28)
    );
    firefly.userData.baseY = firefly.position.y;
    firefly.userData.phase = Math.random() * Math.PI * 2;
    environment.add(firefly);
  }
}

function addTree(x, z, scale = 1) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.28 * scale, 2.7 * scale, 7), materials.bark);
  trunk.position.y = 1.35 * scale;
  trunk.castShadow = true;
  tree.add(trunk);

  const leafColors = [0x1f7a3d, 0x2f8f46, 0x175f31];
  for (let i = 0; i < 3; i += 1) {
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry((1.15 - i * 0.18) * scale, 2.2 * scale, 9),
      new THREE.MeshStandardMaterial({ color: leafColors[i], roughness: 0.9 })
    );
    leaf.position.y = (2.5 + i * 0.85) * scale;
    leaf.castShadow = true;
    tree.add(leaf);
  }

  tree.position.set(x, 0, z);
  tree.rotation.y = Math.random() * Math.PI;
  environment.add(tree);
}

function addWall(pos, x, z) {
  const barrier = new THREE.Group();
  const style = (x * 3 + z * 5) % 3;
  addBarrierFootprint(barrier);

  if (style === 0) {
    addLogFence(barrier, true);
    addLogFence(barrier, false);
  } else if (style === 1) {
    addRuinStones(barrier);
  } else {
    addFallenLogPile(barrier);
  }

  barrier.position.copy(pos);
  world.add(barrier);
  state.walls.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(pos.x, 1.15, pos.z), new THREE.Vector3(state.cellSize * 0.92, 2.3, state.cellSize * 0.92)));
}

function addBarrierFootprint(group) {
  const mound = new THREE.Mesh(new THREE.BoxGeometry(state.cellSize * 0.86, 0.42, state.cellSize * 0.86), materials.moss);
  mound.position.y = 0.21;
  mound.castShadow = true;
  mound.receiveShadow = true;
  group.add(mound);

  const capGeo = new THREE.CylinderGeometry(0.2, 0.24, state.cellSize * 0.88, 10);
  [0, Math.PI / 2].forEach((rotation, index) => {
    [-1.72, 1.72].forEach((offset) => {
      const rail = new THREE.Mesh(capGeo, materials.bark);
      rail.position.set(index === 0 ? 0 : offset, 0.58, index === 0 ? offset : 0);
      rail.rotation.z = index === 0 ? Math.PI / 2 : 0;
      rail.rotation.x = index === 0 ? 0 : Math.PI / 2;
      rail.castShadow = true;
      group.add(rail);
    });
  });
}

function addLogFence(group, horizontal) {
  const postGeo = new THREE.CylinderGeometry(0.16, 0.22, 2.35, 8);
  const railGeo = new THREE.CylinderGeometry(0.16, 0.16, state.cellSize * 0.88, 10);
  const offsets = [-1.45, 1.45];
  offsets.forEach((offset) => {
    const post = new THREE.Mesh(postGeo, materials.bark);
    post.position.set(horizontal ? offset : 0, 1.12, horizontal ? 0 : offset);
    post.castShadow = true;
    group.add(post);
  });
  [0.85, 1.55].forEach((height) => {
    const rail = new THREE.Mesh(railGeo, materials.bark);
    rail.position.y = height;
    rail.rotation.z = horizontal ? Math.PI / 2 : 0;
    rail.rotation.x = horizontal ? 0 : Math.PI / 2;
    rail.castShadow = true;
    group.add(rail);
  });
}

function addRuinStones(group) {
  for (let i = 0; i < 12; i += 1) {
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42 + Math.random() * 0.34, 0), materials.stone);
    stone.position.set((Math.random() - 0.5) * 2.6, 0.35 + Math.random() * 0.85, (Math.random() - 0.5) * 2.6);
    stone.scale.y = 0.55 + Math.random() * 0.9;
    stone.rotation.set(Math.random(), Math.random(), Math.random());
    stone.castShadow = true;
    stone.receiveShadow = true;
    group.add(stone);
  }
}

function addFallenLogPile(group) {
  const logGeo = new THREE.CylinderGeometry(0.22, 0.28, state.cellSize * 0.92, 12);
  for (let i = 0; i < 4; i += 1) {
    const log = new THREE.Mesh(logGeo, materials.bark);
    log.position.set(0, 0.78 + i * 0.34, (i - 1.5) * 0.34);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = (i % 2 ? 1 : -1) * 0.08;
    log.castShadow = true;
    group.add(log);
  }
  addLogFence(group, false);
}

function placePlayer(pos) {
  state.player.object.position.set(pos.x, 0, pos.z);
  state.player.yaw = 0;
  state.player.velocity.set(0, 0, 0);
  state.sprinting = false;
}

function addExit(pos) {
  const gate = new THREE.Group();
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.6, 0.28), materials.exit);
  const right = left.clone();
  left.position.set(-1.1, 1.8, 0);
  right.position.set(1.1, 1.8, 0);
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.32, 0.32), materials.exit);
  top.position.set(0, 3.45, 0);
  gate.add(left, right, top);
  gate.position.set(pos.x, 0, pos.z);
  gate.traverse((node) => {
    node.castShadow = true;
  });
  dynamic.add(gate);
  state.exit.copy(pos);
}

function addCoin(pos) {
  const coin = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.13, 12, 28), materials.coin);
  coin.position.set(pos.x, 1.45, pos.z);
  coin.castShadow = true;
  dynamic.add(coin);
  state.coins.push({ mesh: coin, collected: false });
}

function addRelic(pos) {
  const relic = new THREE.Group();
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 0), materials.relic);
  gem.castShadow = true;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.035, 8, 28), materials.relic);
  ring.rotation.x = Math.PI / 2;
  relic.add(gem, ring);
  relic.position.set(pos.x, 1.5, pos.z);
  dynamic.add(relic);
  state.relics.push({ mesh: relic, collected: false });
}

function addTrap(pos) {
  const trap = new THREE.Group();
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 0.18, 28), materials.hazardStripe);
  platform.position.y = 0.09;
  platform.receiveShadow = true;

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.46, 1.15, 18), materials.hazardMetal);
  base.position.y = 0.66;
  base.castShadow = true;

  const pivot = new THREE.Group();
  pivot.position.y = 1.32;

  const arm = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.22, 0.28), materials.trap);
  arm.position.x = 1.7;
  arm.castShadow = true;
  arm.userData.length = 3.4;

  const counter = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.48, 0.48), materials.hazardMetal);
  counter.position.x = -0.55;
  counter.castShadow = true;

  pivot.add(arm, counter);
  trap.add(platform, base, pivot);
  trap.position.set(pos.x, 0, pos.z);
  dynamic.add(trap);
  state.traps.push({ group: trap, pivot, arm, phase: Math.random() * Math.PI * 2, radius: 2.05 });
}

async function loadCharacter() {
  const root = state.player.object;
  root.clear();

  try {
    const gltf = await loadFirstGltf([
      "assets/warrior/warrior.glb",
      "assets/warrior/Warrior.glb",
      "assets/warrior/character.glb",
      "https://threejs.org/examples/models/gltf/Soldier.glb",
    ]);
    const model = gltf.scene;
    model.scale.setScalar(1.45);
    model.rotation.y = Math.PI;
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    root.add(model);
    state.mixer = new THREE.AnimationMixer(model);
    gltf.animations.forEach((clip) => {
      state.actions[clip.name.toLowerCase()] = state.mixer.clipAction(clip);
    });
    playAction("idle");
    status("Loaded animated warrior model");
  } catch {
    try {
      const fbx = await loadFirstFbx([
        "assets/warrior/warrior.fbx",
        "assets/warrior/Warrior.fbx",
        "https://threejs.org/examples/models/fbx/Samba%20Dancing.fbx",
      ]);
      fbx.scale.setScalar(0.012);
      fbx.traverse((node) => {
        if (node.isMesh) node.castShadow = true;
      });
      root.add(fbx);
      state.mixer = new THREE.AnimationMixer(fbx);
      if (fbx.animations[0]) {
        state.actions.run = state.mixer.clipAction(fbx.animations[0]);
      }
      status("Loaded FBX character fallback");
    } catch {
      buildCartoonWarrior(root);
      status("Using procedural warrior fallback");
    }
  }
}

async function loadFirstGltf(paths) {
  const loader = new GLTFLoader();
  let lastError;
  for (const assetPath of paths) {
    try {
      return await loader.loadAsync(assetPath);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function loadFirstFbx(paths) {
  const loader = new FBXLoader();
  let lastError;
  for (const assetPath of paths) {
    try {
      return await loader.loadAsync(assetPath);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function buildCartoonWarrior(root) {
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.55 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf2a56b, roughness: 0.6 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.85, 5, 10), bodyMat);
  body.position.y = 1.2;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 18), skinMat);
  head.position.y = 2.05;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.29, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), darkMat);
  hair.position.y = 2.17;
  root.add(body, head, hair);
  ["leftArm", "rightArm", "leftLeg", "rightLeg"].forEach((name, index) => {
    const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, index < 2 ? 0.58 : 0.78, 4, 8), index < 2 ? skinMat : darkMat);
    limb.name = name;
    limb.position.set(index % 2 ? 0.42 : -0.42, index < 2 ? 1.26 : 0.48, 0);
    root.add(limb);
  });
}

function playAction(name) {
  const found = Object.keys(state.actions).find((key) => key.includes(name)) || Object.keys(state.actions)[0];
  if (!found || state.currentAction === found) return;
  const next = state.actions[found];
  const previous = state.actions[state.currentAction];
  previous?.fadeOut(0.18);
  next.reset().fadeIn(0.18).play();
  state.currentAction = found;
}

function updatePlayer(dt) {
  const forward = Number(keys.has("KeyW")) - Number(keys.has("KeyS"));
  const strafe = Number(keys.has("KeyA")) - Number(keys.has("KeyD"));
  const turning = Number(keys.has("ArrowLeft") || keys.has("KeyQ")) - Number(keys.has("ArrowRight") || keys.has("KeyE"));
  state.player.yaw += turning * dt * 2.3;

  const wantsSprint = keys.has("ShiftLeft") || keys.has("ShiftRight");
  const moving = Boolean(forward || strafe);
  const direction = new THREE.Vector3(strafe, 0, forward);
  if (!wantsSprint || !moving || state.stamina <= 0.02) {
    state.sprinting = false;
  } else if (state.stamina > 0.18) {
    state.sprinting = true;
  }

  const targetSpeed = state.sprinting ? 6.8 : 4.4;
  const acceleration = state.sprinting ? 12 : 16;

  if (moving) {
    direction.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), state.player.yaw);
    const targetVelocity = direction.clone().multiplyScalar(targetSpeed);
    state.player.velocity.lerp(targetVelocity, Math.min(1, acceleration * dt));
    movePlayerStepped(state.player.velocity, dt);
    state.player.object.rotation.y = Math.atan2(direction.x, direction.z);
    playAction(state.sprinting ? "run" : "walk");
    animateFallbackLimbs(dt, state.sprinting);
  } else {
    state.player.velocity.lerp(new THREE.Vector3(0, 0, 0), Math.min(1, 18 * dt));
    movePlayerStepped(state.player.velocity, dt);
    playAction("idle");
    animateFallbackLimbs(dt, false);
  }

  state.stamina = state.sprinting ? Math.max(0, state.stamina - dt * 0.28) : Math.min(1, state.stamina + dt * 0.32);
  state.mixer?.update(dt);
}

function movePlayerStepped(velocity, dt) {
  const distance = velocity.length() * dt;
  if (distance < 0.0001) return;
  const direction = velocity.clone().normalize();
  const steps = Math.max(1, Math.ceil(distance / 0.1));
  const step = distance / steps;
  for (let i = 0; i < steps; i += 1) {
    const current = state.player.object.position;
    const full = current.clone().addScaledVector(direction, step);
    if (!collides(full)) {
      current.copy(full);
      continue;
    }

    const slideX = current.clone().add(new THREE.Vector3(direction.x * step, 0, 0));
    if (!collides(slideX)) {
      current.copy(slideX);
      state.player.velocity.z = 0;
      continue;
    }

    const slideZ = current.clone().add(new THREE.Vector3(0, 0, direction.z * step));
    if (!collides(slideZ)) {
      current.copy(slideZ);
      state.player.velocity.x = 0;
    } else {
      state.player.velocity.set(0, 0, 0);
    }
  }
}

function animateFallbackLimbs(dt, moving) {
  const root = state.player.object;
  const phase = performance.now() * 0.01;
  const swing = moving ? Math.sin(phase) * 0.85 : 0;
  const leftArm = root.getObjectByName("leftArm");
  const rightArm = root.getObjectByName("rightArm");
  const leftLeg = root.getObjectByName("leftLeg");
  const rightLeg = root.getObjectByName("rightLeg");
  if (!leftArm) return;
  leftArm.rotation.x = swing;
  rightArm.rotation.x = -swing;
  leftLeg.rotation.x = -swing;
  rightLeg.rotation.x = swing;
}

function collides(next) {
  const playerBox = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(next.x, 1.0, next.z),
    new THREE.Vector3(1.0, 2.0, 1.0)
  );
  return state.walls.some((wall) => wall.intersectsBox(playerBox));
}

function updateCamera(dt) {
  const target = state.player.object.position;
  const offset = new THREE.Vector3(0, 6.2, -8.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.player.yaw);
  const desired = target.clone().add(offset);
  camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
  camera.lookAt(target.x, target.y + 1.45, target.z);
}

function updateCollectibles() {
  state.coins.forEach((coin) => {
    coin.mesh.rotation.y += 0.04;
    coin.mesh.position.y = 1.45 + Math.sin(performance.now() * 0.004 + coin.mesh.position.x) * 0.16;
    if (!coin.collected && horizontalDistance(coin.mesh.position, state.player.object.position) < 1.55) {
      coin.collected = true;
      coin.mesh.visible = false;
      state.collected += 1;
      state.score += 150;
      status("Coin collected");
    }
  });

  state.relics.forEach((relic) => {
    relic.mesh.rotation.y += 0.025;
    relic.mesh.rotation.x = Math.sin(performance.now() * 0.002) * 0.22;
    relic.mesh.position.y = 1.55 + Math.sin(performance.now() * 0.003 + relic.mesh.position.z) * 0.18;
    if (!relic.collected && horizontalDistance(relic.mesh.position, state.player.object.position) < 1.65) {
      relic.collected = true;
      relic.mesh.visible = false;
      state.score += 650;
      status("Ancient relic found");
    }
  });

  state.traps.forEach((trap) => {
    const angle = Math.sin(performance.now() * 0.0026 + trap.phase) * 1.25;
    trap.pivot.rotation.y = angle;
    trap.group.rotation.y += 0.003;
    if (sweeperHitsPlayer(trap)) {
      resetPlayer();
    }
  });

  if (horizontalDistance(state.player.object.position, state.exit) < 1.65) completeLevel();
}

function horizontalDistance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function sweeperHitsPlayer(trap) {
  const player = state.player.object.position;
  const center = trap.group.position;
  const local = player.clone().sub(center).applyAxisAngle(new THREE.Vector3(0, 1, 0), -trap.group.rotation.y);
  const armAngle = trap.pivot.rotation.y;
  const armDirection = new THREE.Vector3(Math.cos(armAngle), 0, Math.sin(armAngle));
  const projection = local.dot(armDirection);
  const lateral = local.clone().sub(armDirection.multiplyScalar(projection)).length();
  return projection > -0.35 && projection < trap.radius && lateral < 0.45 && Math.abs(local.y) < 2.2;
}

function updateEnvironment() {
  const time = performance.now() * 0.001;
  environment.children.forEach((child, index) => {
    if (child.userData.phase !== undefined) {
      child.position.y = child.userData.baseY + Math.sin(time * 2.4 + child.userData.phase) * 0.22;
      child.material.opacity = 0.45 + Math.sin(time * 3 + child.userData.phase) * 0.25;
    } else if (child.type === "Group" && child.children.some((node) => node.material?.transparent)) {
      child.position.x += Math.sin(time * 0.18 + index) * 0.002;
    }
  });
}

function resetPlayer() {
  for (let z = 0; z < state.map.length; z += 1) {
    for (let x = 0; x < state.map[z].length; x += 1) {
      if (state.map[z][x] === "S") {
        placePlayer(gridToWorld(x + 0.5, z + 0.5));
      }
    }
  }
  state.deaths += 1;
  status("Checkpoint reset");
}

function completeLevel() {
  if (state.mode !== "playing") return;
  state.mode = "summary";
  const seconds = Math.floor((performance.now() - state.startTime) / 1000);
  const level = levels[state.selectedLevel];
  const stars = Math.max(1, Number(seconds <= level.targetTime) + Number(state.collected === state.coins.length) + Number(state.deaths === 0));
  const score = stars * 1000 + state.score + Math.max(0, level.targetTime - seconds) * 12 - state.deaths * 100;
  const rank = score >= 3300 ? "S Rank" : score >= 2400 ? "A Rank" : score >= 1500 ? "B Rank" : "C Rank";
  state.unlocked = Math.max(state.unlocked, Math.min(levels.length, state.selectedLevel + 2));
  saveProgress({ level: state.selectedLevel + 1, levelName: level.name, seconds, coins: state.collected, totalCoins: state.coins.length, deaths: state.deaths, stars, score, rank });

  hud.classList.add("hidden");
  centerHint.classList.add("hidden");
  summary.classList.remove("hidden");
  summaryTitle.textContent = `Level ${state.selectedLevel + 1} Complete`;
  summaryText.textContent = `${rank} | Score ${score} | Time ${formatTime(seconds)} | Coins ${state.collected}/${state.coins.length} | Deaths ${state.deaths}`;
  starRating.textContent = "*".repeat(stars);
  document.getElementById("nextLevel").disabled = state.selectedLevel + 1 >= levels.length;
  renderLevelGrid();
}

function updateHud() {
  const level = levels[state.selectedLevel];
  state.elapsed = performance.now() - state.startTime;
  levelLabel.textContent = `Level ${state.selectedLevel + 1}: ${level.name}`;
  themeLabel.textContent = level.theme;
  coinLabel.textContent = `Coins ${state.collected}/${state.coins.length}`;
  scoreLabel.textContent = `Score ${state.score}`;
  timerLabel.textContent = formatTime(Math.floor(state.elapsed / 1000));
  deathLabel.textContent = `Deaths ${state.deaths}`;
  objectiveLabel.textContent = level.objective;
  staminaFill.style.width = `${Math.round(state.stamina * 100)}%`;
  statusFeed.textContent = performance.now() < statusFeed.until ? statusFeed.message : "";
}

function status(message) {
  statusFeed.message = message;
  statusFeed.until = performance.now() + 1800;
}

function formatTime(seconds) {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}

function pause() {
  if (state.mode !== "playing") return;
  state.mode = "paused";
  pauseMenu.classList.remove("hidden");
  centerHint.classList.add("hidden");
}

function resume() {
  if (state.mode !== "paused") return;
  state.mode = "playing";
  pauseMenu.classList.add("hidden");
  centerHint.classList.remove("hidden");
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (state.mode === "playing") {
    updatePlayer(dt);
    updateCamera(dt);
    updateCollectibles();
    updateEnvironment();
    updateHud();
  }
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Escape") {
    if (state.mode === "playing") pause();
    return;
  }
  keys.add(event.code);
});
window.addEventListener("keyup", (event) => keys.delete(event.code));

canvas.addEventListener("click", () => canvas.requestPointerLock?.());
window.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement === canvas && state.mode === "playing") {
    state.player.yaw -= event.movementX * 0.0024;
  }
});
document.addEventListener("pointerlockchange", () => {
  centerHint.classList.toggle("hidden", document.pointerLockElement === canvas || state.mode !== "playing");
});

document.getElementById("resumeGame").addEventListener("click", () => startLevel(0));
document.getElementById("continueGame").addEventListener("click", resume);
document.getElementById("restartLevel").addEventListener("click", () => startLevel(state.selectedLevel));
document.getElementById("backToMenu").addEventListener("click", () => {
  state.mode = "menu";
  pauseMenu.classList.add("hidden");
  hud.classList.add("hidden");
  menu.classList.remove("hidden");
});
document.getElementById("summaryMenu").addEventListener("click", () => {
  state.mode = "menu";
  summary.classList.add("hidden");
  menu.classList.remove("hidden");
});
document.getElementById("nextLevel").addEventListener("click", () => startLevel(Math.min(levels.length - 1, state.selectedLevel + 1)));
document.getElementById("resetSave").addEventListener("click", async () => {
  state.unlocked = 1;
  localStorage.setItem(SAVE_KEY, "1");
  try {
    await fetch("/api/reset", { method: "POST" });
  } catch {
    status("Progress reset locally");
  }
  renderLevelGrid();
});

await loadProgress();
renderLevelGrid();
await loadCharacter();
animate();
