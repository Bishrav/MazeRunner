import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { MD2Character } from "three/addons/misc/MD2Character.js";

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
const comboLabel = document.getElementById("comboLabel");
const objectiveLabel = document.getElementById("objectiveLabel");
const staminaFill = document.getElementById("staminaFill");
const statusFeed = document.getElementById("statusFeed");
const summaryTitle = document.getElementById("summaryTitle");
const summaryText = document.getElementById("summaryText");
const starRating = document.getElementById("starRating");
const builderPanel = document.getElementById("builderPanel");
const builderPalette = document.getElementById("builderPalette");
const builderBoard = document.getElementById("builderBoard");

const SAVE_KEY = "maze-runner-save-v2";
const clock = new THREE.Clock();
const keys = new Set();
const audio = {
  context: null,
  lastFootstep: 0,
};
let progressiveLoaderPromise = null;

const levels = [
  {
    name: "Emerald Trial",
    theme: "Realistic Forest Maze",
    objective: "Run through log barricades, collect coins, dodge flying Flamingos, and reach the finish arch.",
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
    objective: "A denser performance-style grove with more grass, coins, and a drifting LOD airship obstacle.",
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
    objective: "Use sprint, collect coins, avoid flying Flamingos, and beat the timer.",
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
  {
    name: "Mobile Home Rally",
    theme: "Progressive LOD Showcase",
    objective: "Race through the mobile-home carnival, chain coins, dodge airship sentries, and claim the trophy arch.",
    targetTime: 165,
    map: [
      "#########################",
      "#S..C....R....C....T..E.#",
      "#.###.####.###.####.###.#",
      "#...C....#...#....C.....#",
      "###.###..#.T.#..###.###.#",
      "#...#....#...#....#...#.#",
      "#C..#.######.######.#.C.#",
      "#...#....C...R...C..#...#",
      "#.#####.###...###.#####.#",
      "#.....C....T....C.......#",
      "#########################",
    ],
  },
  {
    name: "Sky Machine Gauntlet",
    theme: "Floating Home Fortress",
    objective: "Climb ladders, launch over pits, land on high floors, and escape MD2 defenders guarding the machine.",
    targetTime: 190,
    map: [
      "###########################",
      "#S..C...P....D....C.X..E..#",
      "#.###.#####.###.#####.##..#",
      "#...#.....C...#.....D.....#",
      "###.#.###.###.#.###.###...#",
      "#C..#...D.X.#...T...#.....#",
      "#.#####.###P###.#####.#...#",
      "#.....C...#X..#...C...#...#",
      "#.###.###.#.D.#.###.###...#",
      "#...D.....#R..#.....C.....#",
      "#.#######.###.#######.#...#",
      "#C....T.X..P....D....R....#",
      "###########################",
    ],
  },
  {
    name: "Three Floor Home Parkour",
    theme: "House Tower Obby",
    objective: "Clear each house floor, climb to the next base, dodge defenders, and launch over dug pits.",
    targetTime: 230,
    map: [
      "#############################",
      "#S..P..C....D....X....C...E.#",
      "#.####.#####.###.#####.###..#",
      "#...C....X...#...P....D.....#",
      "###.###.###.###.###.###.##..#",
      "#R..#...D...C...X...#....C..#",
      "#.#####.###P###.#####.###...#",
      "#.....C...#...#...C...X.....#",
      "#.###.###.#.D.#.###.###.#...#",
      "#...D.....#R..#.....P...C...#",
      "#.#######.###.#######.#.#...#",
      "#C....X....P....D....R......#",
      "#############################",
    ],
  },
  {
    name: "House Tower Ascent",
    theme: "Three-Floor Home Challenge",
    objective: "Use visible ladders, cross raised floors, dodge defenders, and finish the stacked house parkour.",
    targetTime: 260,
    map: [
      "###############################",
      "#S..C...P....D....X....C...E..#",
      "#.###.#####.###.#####.###.###.#",
      "#...#...X...#...P...#...D...#.#",
      "###.#.###.###.###.###.###.#.#.#",
      "#C..#...D...C...X...#...C...#.#",
      "#.#####.###P###.#####.###.###.#",
      "#.....C...#...#...C...X...#...#",
      "#.###.###.#.D.#.###.###.###.#.#",
      "#...D.....#R..#.....P...C...#.#",
      "#.#######.###.#######.#.#.###.#",
      "#C....X....P....D....R......E.#",
      "###############################",
    ],
  },
];

const builderLevel = {
  name: "Builder Sandbox",
  theme: "Custom Parkour Kit",
  objective: "Test a creator-style kit with walls, pits, pads, ladders, defenders, coins, relics, and a finish.",
  targetTime: 999,
  map: [
    "#####################",
    "#S..C..P....D....E..#",
    "#.###.###.###.###...#",
    "#...X....C....X.....#",
    "###.###.###.###.#####",
    "#R....P....D....C...#",
    "#.#####.###.#####...#",
    "#.....C...X...P.....#",
    "#.###.###.###.###...#",
    "#C....D....R....C...#",
    "#####################",
  ],
};

const builderTools = [
  { symbol: ".", label: "Empty", note: "Erase a tile" },
  { symbol: "#", label: "Wall", note: "Solid barrier" },
  { symbol: "B", label: "Block", note: "Raised block" },
  { symbol: "P", label: "Pad", note: "Launch pad" },
  { symbol: "X", label: "Pit", note: "Dug hole" },
  { symbol: "D", label: "Enemy", note: "Defender" },
  { symbol: "T", label: "Trap", note: "Flying hazard" },
  { symbol: "C", label: "Coin", note: "Score pickup" },
  { symbol: "R", label: "Relic", note: "Bonus pickup" },
  { symbol: "S", label: "Start", note: "Player spawn" },
  { symbol: "E", label: "Finish", note: "Goal gate" },
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
  defenders: [],
  parkourPads: [],
  pits: [],
  relics: [],
  collected: 0,
  score: 0,
  combo: 1,
  lastCoinAt: 0,
  stamina: 1,
  sprinting: false,
  player: {
    object: new THREE.Group(),
    velocity: new THREE.Vector3(),
    verticalVelocity: 0,
    parkourStarted: false,
    climbing: null,
    yaw: 0,
    moving: false,
  },
  respawning: false,
  mixer: null,
  actions: {},
  currentAction: "",
  walls: [],
  platforms: [],
  ladders: [],
  exit: new THREE.Vector3(),
  exitGroup: null,
  flyingObstacle: {
    prototype: null,
    animations: [],
  },
  lodObstacle: {
    prototype: null,
    animations: [],
  },
  mobileHomeWorld: {
    prototype: null,
    animations: [],
  },
  stageMixers: [],
  builderActive: false,
  builder: {
    grid: builderLevel.map.map((row) => row.split("")),
    tool: "#",
  },
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
  finishGold: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.28, metalness: 0.55, emissive: 0x3d2a00 }),
  finishBlue: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.35, metalness: 0.2, emissive: 0x083344 }),
  finishWhite: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 }),
  finishBlack: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 }),
  trap: new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.55, metalness: 0.35, emissive: 0x3b0505 }),
  relic: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.18, metalness: 0.45, emissive: 0x0e7490 }),
  hazardMetal: new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.42, metalness: 0.65 }),
  hazardStripe: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5, metalness: 0.25, emissive: 0x3a2100 }),
  rabbit: new THREE.MeshStandardMaterial({ color: 0xd8d0c2, roughness: 0.85 }),
  animalDark: new THREE.MeshStandardMaterial({ color: 0x4b3526, roughness: 0.9 }),
  flamingoPink: new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.58, metalness: 0.05 }),
  flamingoWing: new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.62 }),
  flamingoBeak: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.42 }),
  carnivalRed: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5, metalness: 0.05, emissive: 0x240202 }),
  carnivalBlue: new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.45, metalness: 0.08, emissive: 0x020617 }),
  sign: new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.55, metalness: 0.1, emissive: 0x301000 }),
  defenderArmor: new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.44, metalness: 0.55, emissive: 0x220303 }),
  defenderGlow: new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.25, metalness: 0.25, emissive: 0x7f1d1d }),
  parkourPad: new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.28, metalness: 0.32, emissive: 0x075985 }),
  pit: new THREE.MeshStandardMaterial({ color: 0x030712, roughness: 0.9, metalness: 0.02 }),
  pitGlow: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35, metalness: 0.2, emissive: 0x7f1d1d }),
  ladder: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.74, metalness: 0.1 }),
  highFloor: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.82, metalness: 0.12 }),
};

function gridToWorld(x, z) {
  return new THREE.Vector3((x - state.map[0].length / 2) * state.cellSize, 0, (z - state.map.length / 2) * state.cellSize);
}

function currentLevel() {
  return levels[state.selectedLevel] || builderLevel;
}

function openBuilderSandbox() {
  state.mode = "builder";
  menu.classList.add("hidden");
  summary.classList.add("hidden");
  pauseMenu.classList.add("hidden");
  hud.classList.add("hidden");
  builderPanel.classList.remove("hidden");
  renderBuilderSandbox();
}

function closeBuilderSandbox() {
  if (state.mode !== "builder") return;
  state.mode = "menu";
  builderPanel.classList.add("hidden");
  menu.classList.remove("hidden");
}

function cloneBuilderGrid() {
  return state.builder.grid.map((row) => row.slice());
}

function normalizeBuilderGrid() {
  const width = state.builder.grid[0].length;
  const height = state.builder.grid.length;
  state.builder.grid = state.builder.grid.map((row, rowIndex) => row.map((cell, colIndex) => {
    if (rowIndex === 0 || rowIndex === height - 1 || colIndex === 0 || colIndex === width - 1) {
      return cell === "S" || cell === "E" ? cell : "#";
    }
    return cell;
  }));
}

function ensureBuilderEndpoints() {
  let hasStart = false;
  let hasFinish = false;
  state.builder.grid.forEach((row) => {
    row.forEach((cell) => {
      if (cell === "S") hasStart = true;
      if (cell === "E") hasFinish = true;
    });
  });
  if (!hasStart) state.builder.grid[1][1] = "S";
  if (!hasFinish) {
    const lastRow = state.builder.grid.length - 2;
    const lastCol = state.builder.grid[0].length - 2;
    state.builder.grid[lastRow][lastCol] = "E";
  }
}

function setBuilderCell(x, z, tool) {
  if (tool === "S" || tool === "E") {
    state.builder.grid = state.builder.grid.map((row) => row.map((cell) => (cell === tool ? "." : cell)));
  }
  state.builder.grid[z][x] = tool;
  normalizeBuilderGrid();
  renderBuilderBoard();
}

function renderBuilderSandbox() {
  renderBuilderPalette();
  renderBuilderBoard();
}

function renderBuilderPalette() {
  builderPalette.innerHTML = "";
  builderTools.forEach((tool) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "builder-piece";
    item.draggable = true;
    item.dataset.tool = tool.symbol;
    item.innerHTML = `<span class="piece-key">${tool.symbol}</span>${tool.label}<br>${tool.note}`;
    item.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", tool.symbol);
    });
    item.addEventListener("click", () => {
      state.builder.tool = tool.symbol;
      status(`Brush set to ${tool.label}`);
    });
    builderPalette.appendChild(item);
  });
}

function renderBuilderBoard() {
  const grid = state.builder.grid;
  const width = grid[0].length;
  const height = grid.length;
  builderBoard.style.gridTemplateColumns = `repeat(${width}, 34px)`;
  builderBoard.style.gridTemplateRows = `repeat(${height}, 34px)`;
  builderBoard.innerHTML = "";
  grid.forEach((row, z) => {
    row.forEach((cell, x) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "builder-cell";
      tile.dataset.cell = cell;
      tile.textContent = cell === "." ? "" : cell;
      tile.draggable = true;
      tile.addEventListener("dragover", (event) => event.preventDefault());
      tile.addEventListener("drop", (event) => {
        event.preventDefault();
        const tool = event.dataTransfer.getData("text/plain") || state.builder.tool;
        setBuilderCell(x, z, tool);
      });
      tile.addEventListener("click", () => setBuilderCell(x, z, state.builder.tool));
      tile.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        setBuilderCell(x, z, ".");
      });
      if (cell !== ".") tile.classList.add("active");
      builderBoard.appendChild(tile);
    });
  });
}

function playBuilderLevel() {
  normalizeBuilderGrid();
  ensureBuilderEndpoints();
  builderLevel.map = cloneBuilderGrid().map((row) => row.join(""));
  state.builderActive = true;
  startLevel(levels.length);
}

function clearBuilderBoard() {
  state.builder.grid = state.builder.grid.map((row, rowIndex) => row.map((_, colIndex) => {
    if (rowIndex === 0 || rowIndex === state.builder.grid.length - 1 || colIndex === 0 || colIndex === row.length - 1) {
      return "#";
    }
    return ".";
  }));
  const startRow = Math.floor(state.builder.grid.length / 2);
  const startCol = 1;
  const finishCol = state.builder.grid[0].length - 2;
  state.builder.grid[startRow][startCol] = "S";
  state.builder.grid[startRow][finishCol] = "E";
  renderBuilderBoard();
}

function renderLevelGrid() {
  levelGrid.innerHTML = "";
  levels.forEach((level, index) => {
    const button = document.createElement("button");
    button.className = "level-card";
    button.disabled = index + 1 > state.unlocked;
    button.style.setProperty("--card-accent", ["#3c7a3f", "#0ea5e9", "#a855f7", "#f59e0b"][index % 4]);
    button.innerHTML = `
      <span class="stage-badge">Stage ${index + 1} / ${levels.length}</span>
      <strong>Level ${index + 1}: ${level.name}</strong>
      <span>${level.theme}</span>
      <span>${button.disabled ? "Locked" : level.objective}</span>
      <span class="reward-line">${button.disabled ? "Unlock by clearing prior stage" : `Target ${formatTime(level.targetTime)} | Bonus streak x3`}</span>
    `;
    button.addEventListener("click", () => startLevel(index));
    levelGrid.appendChild(button);
  });
}

async function loadProgress() {
  try {
    const response = await fetch("/api/progress", { cache: "no-store" });
    if (!response.ok) throw new Error("Progress API unavailable");
    const progress = await response.json();
    const completedLevel = Array.isArray(progress.completions)
      ? Math.max(0, ...progress.completions.map((completion) => Number(completion.level || 0)))
      : 0;
    state.unlocked = Math.min(levels.length, Math.max(1, Number(progress.unlocked || 1), completedLevel + 1));
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
  const level = levels[index] || builderLevel;
  state.builderActive = index === levels.length;
  state.map = level.map.map((row) => row.split(""));
  state.startTime = performance.now();
  state.elapsed = 0;
  state.deaths = 0;
  state.collected = 0;
  state.coins = [];
  state.traps = [];
  state.defenders = [];
  state.parkourPads = [];
  state.pits = [];
  state.relics = [];
  state.walls = [];
  state.platforms = [];
  state.ladders = [];
  state.stamina = 1;
  state.sprinting = false;
  state.respawning = false;
  state.score = 0;
  state.combo = 1;
  state.lastCoinAt = 0;
  state.exitGroup = null;
  state.stageMixers = [];

  clearGroup(world);
  clearGroup(dynamic);
  clearGroup(environment);
  dynamic.add(state.player.object);
  buildLevel();

  menu.classList.add("hidden");
  builderPanel.classList.add("hidden");
  summary.classList.add("hidden");
  pauseMenu.classList.add("hidden");
  hud.classList.remove("hidden");
  centerHint.classList.remove("hidden");
  updateHud();
}

function buildLevel() {
  const level = currentLevel();
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
  addBackgroundAnimals(width, depth);
  addAtmosphere(width, depth);
  if (!state.builderActive) {
    if (state.selectedLevel >= 3) addMobileHomeStage(width, depth);
    if (state.selectedLevel === 4) addSkyMachineParkour(width, depth);
    if (state.selectedLevel === 5) addHomeParkourStage(width, depth);
    if (state.selectedLevel === 6) addTowerHomeParkour(width, depth);
  }

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
      if (cell === "D") addDefender(pos);
      if (cell === "P") addParkourPad(pos);
      if (cell === "X") addPit(pos);
      if (cell === "B") addBuilderBlock(pos);
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

function addMobileHomeStage(width, depth) {
  const showcase = state.mobileHomeWorld.prototype ? state.mobileHomeWorld.prototype.clone(true) : createFallbackMobileHomeWorld();
  showcase.position.set(0, 0.02, -5.5);
  showcase.rotation.y = Math.PI;
  showcase.scale.setScalar(state.mobileHomeWorld.prototype ? 0.075 : 1);
  showcase.userData.kind = "mobile-home-world";
  showcase.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });

  if (state.mobileHomeWorld.animations.length) {
    const mixer = new THREE.AnimationMixer(showcase);
    state.mobileHomeWorld.animations.forEach((clip) => mixer.clipAction(clip).play());
    state.stageMixers.push(mixer);
  }

  environment.add(showcase);
  addRallyDecor(width, depth);
}

function createFallbackMobileHomeWorld() {
  const worldModel = new THREE.Group();
  const home = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(7.6, 2.2, 3.2), materials.finishWhite);
  base.position.y = 1.25;
  base.castShadow = true;
  base.receiveShadow = true;

  const roof = new THREE.Mesh(new THREE.BoxGeometry(8.1, 0.42, 3.55), materials.carnivalBlue);
  roof.position.y = 2.55;
  roof.castShadow = true;

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.28, 0.08), materials.bark);
  door.position.set(-2.65, 0.95, -1.65);

  [-1.35, 0.25, 1.85].forEach((xOffset) => {
    const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.62, 0.08), materials.finishBlue);
    windowMesh.position.set(xOffset, 1.45, -1.67);
    home.add(windowMesh);
  });

  [-3.1, 3.1].forEach((xOffset) => {
    [-1.1, 1.1].forEach((zOffset) => {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.12, 12, 24), materials.finishBlack);
      wheel.position.set(xOffset, 0.36, zOffset);
      wheel.rotation.y = Math.PI / 2;
      home.add(wheel);
    });
  });

  home.add(base, roof, door);
  home.position.set(0, 0, -3);
  worldModel.add(home);

  const balloon = new THREE.Group();
  const envelope = new THREE.Mesh(new THREE.SphereGeometry(1.45, 24, 16), materials.carnivalRed);
  envelope.scale.set(1, 1.2, 1);
  envelope.position.y = 5.2;
  const basket = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.65, 0.9), materials.rope);
  basket.position.y = 3.45;
  balloon.add(envelope, basket);
  balloon.position.set(4.7, 0, 1.5);
  balloon.userData.phase = Math.random() * Math.PI * 2;
  worldModel.add(balloon);

  return worldModel;
}

function addRallyDecor(width, depth) {
  const areaW = width * state.cellSize;
  const areaD = depth * state.cellSize;
  const archPositions = [
    new THREE.Vector3(-areaW * 0.3, 0, -areaD * 0.22),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(areaW * 0.3, 0, areaD * 0.2),
  ];

  archPositions.forEach((position, index) => {
    const arch = createRallyCheckpoint(index + 1);
    arch.position.copy(position);
    arch.rotation.y = index % 2 ? Math.PI / 2 : 0;
    environment.add(arch);
  });

  for (let i = 0; i < 20; i += 1) {
    const marker = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.72, 8), i % 2 ? materials.carnivalRed : materials.carnivalBlue);
    marker.position.set((Math.random() - 0.5) * areaW * 0.75, 0.36, (Math.random() - 0.5) * areaD * 0.75);
    marker.castShadow = true;
    environment.add(marker);
  }

  for (let i = 0; i < 9; i += 1) {
    const sign = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.2, 8), materials.rope);
    post.position.y = 0.6;
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.42, 0.08), materials.sign);
    board.position.y = 1.28;
    sign.add(post, board);
    sign.position.set((Math.random() - 0.5) * areaW * 0.7, 0, (Math.random() - 0.5) * areaD * 0.7);
    sign.rotation.y = Math.random() * Math.PI;
    environment.add(sign);
  }
}

function addSkyMachineParkour(width, depth) {
  const course = new THREE.Group();
  const platformPositions = [
    [-24, 1.0, -17, 6.2, 3.0],
    [-16, 1.55, -10, 5.4, 2.8],
    [-7, 2.1, -3, 6.0, 3.0],
    [3, 2.7, 4, 5.6, 2.7],
    [14, 3.35, 11, 6.1, 2.8],
    [25, 4.05, 16, 5.4, 2.6],
  ];

  platformPositions.forEach(([x, y, z, w, d], index) => {
    addParkourPlatform(course, { x, y, z, w, d, index });
  });

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(width * 1.45, 0.16, 0.7), materials.rope);
  bridge.position.set(0, 1.6, 0);
  bridge.rotation.y = -0.18;
  bridge.castShadow = true;
  course.add(bridge);
  state.platforms.push({ x: 0, z: 0, width: width * 1.45, depth: 0.95, y: 1.72, rotationY: -0.18 });

  for (let i = 0; i < 8; i += 1) {
    const step = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.92, 0.22, 8), i % 2 ? materials.carnivalBlue : materials.parkourPad);
    step.position.set(-28 + i * 8, 0.42 + i * 0.18, -3 + Math.sin(i) * 5);
    step.rotation.y = Math.PI / 8;
    step.castShadow = true;
    step.receiveShadow = true;
    course.add(step);
    state.platforms.push({ x: step.position.x, z: step.position.z, width: 1.55, depth: 1.55, y: step.position.y + 0.14 });
  }

  environment.add(course);
}

function addHomeParkourStage(width, depth) {
  const home = new THREE.Group();
  const floorData = [
    { x: -18, y: 1.05, z: -13, w: 11, d: 7 },
    { x: 0, y: 2.45, z: -1, w: 12, d: 7 },
    { x: 18, y: 3.95, z: 11, w: 11, d: 7 },
  ];

  floorData.forEach((floor, index) => {
    addParkourPlatform(home, { ...floor, index, rail: true });
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(floor.w, 2.4, 0.22), materials.wall);
    wallBack.position.set(floor.x, floor.y + 1.1, floor.z + floor.d / 2);
    wallBack.castShadow = true;
    home.add(wallBack);

    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.4, floor.d), materials.wall);
    sideWall.position.set(floor.x - floor.w / 2, floor.y + 1.1, floor.z);
    sideWall.castShadow = true;
    home.add(sideWall);

    for (let i = 0; i < 4; i += 1) {
      const obstacle = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.24, 1.2), i % 2 ? materials.pitGlow : materials.parkourPad);
      obstacle.position.set(floor.x - floor.w / 2 + 2 + i * 2.2, floor.y + 0.32 + i * 0.18, floor.z - 1.8 + (i % 2) * 3.6);
      obstacle.castShadow = true;
      obstacle.receiveShadow = true;
      home.add(obstacle);
      state.platforms.push({ x: obstacle.position.x, z: obstacle.position.z, width: 1.25, depth: 1.25, y: obstacle.position.y + 0.14 });
    }
  });

  const roof = new THREE.Mesh(new THREE.BoxGeometry(13, 0.32, 8), materials.carnivalRed);
  roof.position.set(18, 5.65, 11);
  roof.rotation.z = 0.08;
  roof.castShadow = true;
  home.add(roof);
  state.platforms.push({ x: 18, z: 11, width: 12.2, depth: 7.2, y: 5.86 });

  environment.add(home);
}

function addTowerHomeParkour(width, depth) {
  const tower = new THREE.Group();
  const houseFloors = [
    { x: -18, y: 1.1, z: -12, w: 12, d: 7.5 },
    { x: 0, y: 3.0, z: 0, w: 13, d: 8 },
    { x: 19, y: 4.95, z: 13, w: 12, d: 7.5 },
  ];

  houseFloors.forEach((floor, index) => {
    const shell = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(floor.w, 0.42, floor.d), materials.highFloor);
    base.position.y = floor.y;
    base.castShadow = true;
    base.receiveShadow = true;

    const front = new THREE.Mesh(new THREE.BoxGeometry(floor.w, 2.3, 0.22), materials.wall);
    front.position.set(floor.x, floor.y + 1.08, floor.z - floor.d / 2);
    const back = front.clone();
    back.position.z = floor.z + floor.d / 2;

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.3, floor.d), materials.wall);
    leftWall.position.set(floor.x - floor.w / 2, floor.y + 1.08, floor.z);
    const rightWall = leftWall.clone();
    rightWall.position.x = floor.x + floor.w / 2;

    const roof = new THREE.Mesh(new THREE.BoxGeometry(floor.w + 1.2, 0.28, floor.d + 0.8), index % 2 ? materials.carnivalBlue : materials.carnivalRed);
    roof.position.set(floor.x, floor.y + 2.38, floor.z);
    roof.rotation.z = index % 2 ? 0.03 : -0.02;
    roof.castShadow = true;

    shell.add(base, front, back, leftWall, rightWall, roof);

    for (let i = 0; i < 5; i += 1) {
      const block = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.26, 1.28), i % 2 ? materials.pitGlow : materials.parkourPad);
      block.position.set(floor.x - floor.w / 2 + 2.1 + i * 2.0, floor.y + 0.35 + i * 0.18, floor.z - 1.5 + (i % 2) * 3.0);
      block.castShadow = true;
      block.receiveShadow = true;
      shell.add(block);
      state.platforms.push({ x: block.position.x, z: block.position.z, width: 1.28, depth: 1.28, y: block.position.y + 0.13 });
    }

    const pitPositions = [
      new THREE.Vector3(floor.x - floor.w * 0.18, 0, floor.z + 0.75),
      new THREE.Vector3(floor.x + floor.w * 0.18, 0, floor.z - 0.75),
    ];
    pitPositions.forEach((pitPos, pitIndex) => {
      addPit(pitPos);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 2.4), pitIndex % 2 ? materials.finishGold : materials.rope);
      bridge.position.set(pitPos.x, floor.y + 0.35, pitPos.z + (pitIndex ? -1.2 : 1.2));
      bridge.rotation.z = pitIndex ? 0.14 : -0.12;
      bridge.castShadow = true;
      shell.add(bridge);
      state.platforms.push({ x: bridge.position.x, z: bridge.position.z, width: 0.92, depth: 2.4, y: bridge.position.y + 0.08, rotationY: bridge.rotation.y });
    });

    const buildBlock = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.72, 2.2), materials.highFloor);
    buildBlock.position.set(floor.x + floor.w * 0.22, floor.y + 0.42, floor.z + floor.d * 0.22);
    buildBlock.castShadow = true;
    buildBlock.receiveShadow = true;
    shell.add(buildBlock);
    state.platforms.push({ x: buildBlock.position.x, z: buildBlock.position.z, width: 2.2, depth: 2.2, y: buildBlock.position.y + 0.36 });

    const ladder = createLadder(floor.y + 1.55);
    ladder.position.set(floor.x - floor.w / 2 - 0.9, 0.02, floor.z + floor.d / 2 - 0.12);
    ladder.rotation.y = Math.PI / 2;
    shell.add(ladder);
    state.ladders.push({
      x: ladder.position.x + 0.1,
      z: ladder.position.z + 0.2,
      climbX: ladder.position.x + 0.1,
      climbZ: ladder.position.z + 0.2,
      width: 1.45,
      depth: 1.5,
      targetY: floor.y + 0.3,
      exitX: floor.x - floor.w / 2 + 1.1,
      exitZ: floor.z + floor.d / 2 - 1.05,
    });

    const railing = new THREE.Mesh(new THREE.BoxGeometry(floor.w - 0.8, 0.2, 0.16), materials.finishGold);
    railing.position.set(floor.x, floor.y + 0.52, floor.z - floor.d / 2);
    railing.castShadow = true;
    shell.add(railing);

    tower.add(shell);
  });

  const walkway = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.2, 0.75), materials.rope);
  walkway.position.set(0, 2.0, 0);
  walkway.rotation.y = 0.16;
  walkway.castShadow = true;
  tower.add(walkway);
  state.platforms.push({ x: 0, z: 0, width: 9.6, depth: 0.95, y: 2.1, rotationY: 0.16 });

  const railRun = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.15, 0.16), materials.carnivalRed);
  railRun.position.set(0, 2.35, -0.35);
  railRun.rotation.y = 0.16;
  tower.add(railRun);

  for (let i = 0; i < 10; i += 1) {
    const stepping = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.88, 0.24, 8), i % 2 ? materials.carnivalBlue : materials.parkourPad);
    stepping.position.set(-25 + i * 5.4, 0.55 + i * 0.16, -5 + Math.sin(i * 1.2) * 5);
    stepping.rotation.y = Math.PI / 7;
    stepping.castShadow = true;
    tower.add(stepping);
    state.platforms.push({ x: stepping.position.x, z: stepping.position.z, width: 1.45, depth: 1.45, y: stepping.position.y + 0.12 });
  }

  environment.add(tower);
}

function addParkourPlatform(group, { x, y, z, w, d, index = 0 }) {
  const platform = new THREE.Mesh(new THREE.BoxGeometry(w, 0.34, d), materials.highFloor);
  platform.position.set(x, y, z);
  platform.castShadow = true;
  platform.receiveShadow = true;
  group.add(platform);

  const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, 0.16), index % 2 ? materials.carnivalRed : materials.finishGold);
  rail.position.set(x, y + 0.42, z - d / 2);
  rail.castShadow = true;
  group.add(rail);

  const ladder = createLadder(y + 1.05);
  ladder.position.set(x - w / 2 - 0.95, 0.02, z + d / 2 - 0.05);
  ladder.rotation.y = Math.PI / 2;
  group.add(ladder);

  const support = new THREE.Mesh(new THREE.BoxGeometry(0.32, y + 1.2, 0.38), materials.bark);
  support.position.set(x - w / 2 - 0.95, (y + 1.2) / 2, z + d / 2 - 0.4);
  support.castShadow = true;
  group.add(support);

  state.platforms.push({ x, z, width: w, depth: d, y: y + 0.22 });
  state.ladders.push({
    x: ladder.position.x + 0.12,
    z: ladder.position.z + 0.22,
    climbX: ladder.position.x + 0.12,
    climbZ: ladder.position.z + 0.22,
    width: 1.45,
    depth: 1.55,
    targetY: y + 0.22,
    exitX: x - w / 2 + 1.12,
    exitZ: z + d / 2 - 1.1,
  });
}

function createLadder(height) {
  const ladder = new THREE.Group();
  const railGeo = new THREE.CylinderGeometry(0.045, 0.055, height, 8);
  [-0.32, 0.32].forEach((xOffset) => {
    const rail = new THREE.Mesh(railGeo, materials.ladder);
    rail.position.set(xOffset, height / 2, 0);
    rail.castShadow = true;
    ladder.add(rail);
  });

  const rungGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.72, 8);
  for (let y = 0.28; y < height; y += 0.34) {
    const rung = new THREE.Mesh(rungGeo, materials.ladder);
    rung.position.y = y;
    rung.rotation.z = Math.PI / 2;
    rung.castShadow = true;
    ladder.add(rung);
  }

  const backboard = new THREE.Mesh(new THREE.BoxGeometry(0.88, height, 0.12), materials.wall);
  backboard.material = materials.wall.clone();
  backboard.position.set(0, height / 2, -0.03);
  backboard.material.transparent = true;
  backboard.material.opacity = 0.18;
  ladder.add(backboard);
  return ladder;
}

function createRallyCheckpoint(number) {
  const checkpoint = new THREE.Group();
  const left = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.4, 10), materials.finishGold);
  const right = left.clone();
  left.position.set(-1.15, 1.2, 0);
  right.position.set(1.15, 1.2, 0);
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.18, 0.16), number % 2 ? materials.carnivalRed : materials.carnivalBlue);
  top.position.y = 2.35;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.045, 8, 32), materials.finishGold);
  ring.position.y = 1.45;
  ring.rotation.x = Math.PI / 2;
  ring.userData.phase = number;
  checkpoint.add(left, right, top, ring);
  checkpoint.userData.kind = "checkpoint";
  return checkpoint;
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

function addBackgroundAnimals(width, depth) {
  const radiusX = width * state.cellSize * 0.62 + 18;
  const radiusZ = depth * state.cellSize * 0.62 + 18;
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2 + 0.2;
    const animal = i % 3 === 0 ? createDeer(0.9 + Math.random() * 0.18) : createRabbit(0.72 + Math.random() * 0.22);
    animal.position.set(Math.cos(angle) * radiusX * (0.9 + Math.random() * 0.18), 0, Math.sin(angle) * radiusZ * (0.9 + Math.random() * 0.18));
    animal.rotation.y = -angle + Math.PI / 2 + (Math.random() - 0.5) * 0.7;
    animal.userData.kind = "animal";
    animal.userData.baseX = animal.position.x;
    animal.userData.baseZ = animal.position.z;
    animal.userData.phase = Math.random() * Math.PI * 2;
    animal.userData.hop = animal.children.filter((child) => child.userData.hops);
    environment.add(animal);
  }
}

function createRabbit(scale = 1) {
  const rabbit = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32 * scale, 0.52 * scale, 5, 10), materials.rabbit);
  body.position.y = 0.42 * scale;
  body.rotation.z = Math.PI / 2;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.23 * scale, 14, 10), materials.rabbit);
  head.position.set(0.46 * scale, 0.62 * scale, 0);
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.13 * scale, 10, 8), materials.finishWhite);
  tail.position.set(-0.42 * scale, 0.5 * scale, 0);
  rabbit.add(body, head, tail);

  [-0.08, 0.08].forEach((zOffset) => {
    const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.045 * scale, 0.42 * scale, 4, 8), materials.rabbit);
    ear.position.set(0.5 * scale, 0.98 * scale, zOffset * scale);
    ear.rotation.z = -0.22;
    rabbit.add(ear);
  });

  [-0.18, 0.2].forEach((xOffset) => {
    [-0.16, 0.16].forEach((zOffset) => {
      const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.045 * scale, 0.2 * scale, 4, 8), materials.animalDark);
      foot.position.set(xOffset * scale, 0.14 * scale, zOffset * scale);
      foot.rotation.z = Math.PI / 2;
      foot.userData.hops = true;
      rabbit.add(foot);
    });
  });

  return rabbit;
}

function createDeer(scale = 1) {
  const deer = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.26 * scale, 0.95 * scale, 5, 10), materials.animalDark);
  body.position.y = 0.78 * scale;
  body.rotation.z = Math.PI / 2;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * scale, 0.13 * scale, 0.58 * scale, 8), materials.animalDark);
  neck.position.set(0.48 * scale, 1.12 * scale, 0);
  neck.rotation.z = -0.35;
  const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.12 * scale, 0.28 * scale, 5, 8), materials.animalDark);
  head.position.set(0.72 * scale, 1.28 * scale, 0);
  head.rotation.z = Math.PI / 2;
  deer.add(body, neck, head);

  [-0.22, 0.22].forEach((xOffset) => {
    [-0.16, 0.16].forEach((zOffset) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * scale, 0.045 * scale, 0.72 * scale, 6), materials.animalDark);
      leg.position.set(xOffset * scale, 0.35 * scale, zOffset * scale);
      leg.userData.hops = true;
      deer.add(leg);
    });
  });

  [-0.08, 0.08].forEach((zOffset) => {
    const antler = new THREE.Mesh(new THREE.CylinderGeometry(0.012 * scale, 0.018 * scale, 0.34 * scale, 5), materials.rope);
    antler.position.set(0.83 * scale, 1.58 * scale, zOffset * scale);
    antler.rotation.z = zOffset > 0 ? -0.55 : -0.35;
    deer.add(antler);
  });

  return deer;
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
  state.player.verticalVelocity = 0;
  state.player.parkourStarted = false;
  state.player.climbing = null;
  state.sprinting = false;
}

function addExit(pos) {
  const gate = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.14, 14, 64, Math.PI), materials.finishGold);
  ring.position.y = 2.1;
  ring.rotation.z = Math.PI;

  const left = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 2.7, 12), materials.finishGold);
  const right = left.clone();
  left.position.set(-1.65, 1.25, 0);
  right.position.set(1.65, 1.25, 0);

  const baseGeo = new THREE.CylinderGeometry(0.46, 0.58, 0.24, 18);
  const leftBase = new THREE.Mesh(baseGeo, materials.stone);
  const rightBase = leftBase.clone();
  leftBase.position.set(-1.65, 0.12, 0);
  rightBase.position.set(1.65, 0.12, 0);

  const banner = new THREE.Group();
  const tileGeo = new THREE.BoxGeometry(0.38, 0.28, 0.08);
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const tile = new THREE.Mesh(tileGeo, (row + col) % 2 ? materials.finishBlack : materials.finishWhite);
      tile.position.set(-1.33 + col * 0.38, 2.9 - row * 0.28, 0);
      banner.add(tile);
    }
  }

  const trophy = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 0.42, 20), materials.finishGold);
  cup.position.y = 0.42;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.36, 12), materials.finishGold);
  stem.position.y = 0.04;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.12, 18), materials.finishGold);
  foot.position.y = -0.2;
  trophy.add(cup, stem, foot);
  trophy.position.set(0, 1.35, 0);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.025, 8, 72), materials.finishBlue);
  halo.position.y = 1.35;
  halo.rotation.x = Math.PI / 2;

  for (let i = 0; i < 18; i += 1) {
    const sparkle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), materials.finishBlue);
    const angle = (i / 18) * Math.PI * 2;
    sparkle.position.set(Math.cos(angle) * 2.05, 1.1 + Math.sin(i) * 0.6, Math.sin(angle) * 0.22);
    sparkle.userData.baseY = sparkle.position.y;
    sparkle.userData.phase = i * 0.45;
    gate.add(sparkle);
  }

  gate.add(ring, left, right, leftBase, rightBase, banner, trophy, halo);
  gate.position.set(pos.x, 0, pos.z);
  gate.userData.kind = "finish";
  gate.userData.trophy = trophy;
  gate.userData.halo = halo;
  gate.traverse((node) => {
    node.castShadow = true;
  });
  dynamic.add(gate);
  state.exit.copy(pos);
  state.exitGroup = gate;
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

function addParkourPad(pos) {
  const pad = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 0.22, 6), materials.parkourPad);
  base.position.y = 0.12;
  base.rotation.y = Math.PI / 6;
  base.castShadow = true;
  base.receiveShadow = true;

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.045, 8, 36), materials.finishGold);
  ring.position.y = 0.34;
  ring.rotation.x = Math.PI / 2;
  ring.userData.phase = Math.random() * Math.PI * 2;

  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.78, 3), materials.finishWhite);
  arrow.position.y = 0.5;
  arrow.rotation.x = Math.PI / 2;
  arrow.rotation.z = Math.PI / 2;
  pad.add(base, ring, arrow);
  pad.position.set(pos.x, 0, pos.z);
  dynamic.add(pad);
  state.parkourPads.push({ group: pad, usedAt: 0 });
}

function addBuilderBlock(pos) {
  const block = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.18, 2.8), materials.highFloor);
  base.position.y = 0.59;
  base.castShadow = true;
  base.receiveShadow = true;

  const cap = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.16, 3.0), materials.finishGold);
  cap.position.y = 1.14;
  cap.castShadow = true;

  const brace = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.2, 0.16), materials.bark);
  brace.position.set(-1.18, 0.6, -1.18);

  const ladder = createLadder(1.25);
  ladder.position.set(-1.7, 0.02, 0.72);
  ladder.rotation.y = Math.PI / 2;

  block.add(base, cap, brace, ladder);
  block.position.set(pos.x, 0, pos.z);
  dynamic.add(block);
  state.platforms.push({ x: pos.x, z: pos.z, width: 2.7, depth: 2.7, y: 1.18 });
}

function addPit(pos) {
  const pit = new THREE.Group();
  const crater = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.38, 30, 1, false), materials.pit);
  crater.position.y = -0.12;
  crater.receiveShadow = true;

  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.11, 8, 42), new THREE.MeshStandardMaterial({
    color: 0x7c4a12,
    roughness: 0.98,
    metalness: 0.02,
  }));
  rim.position.y = 0.11;
  rim.rotation.x = Math.PI / 2;

  const soil = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.2, 0.16, 26), materials.stone);
  soil.position.set(0, -0.28, 0);
  soil.scale.y = 0.35;

  const shadowCore = new THREE.Mesh(new THREE.CircleGeometry(0.88, 24), materials.pitGlow);
  shadowCore.rotation.x = -Math.PI / 2;
  shadowCore.position.y = -0.31;
  shadowCore.scale.set(1.15, 1, 1);

  const shovel = createShovel();
  shovel.position.set(1.3, 0.02, -0.8);
  shovel.rotation.z = -0.58;

  pit.add(crater, rim, soil, shadowCore, shovel);
  pit.position.set(pos.x, 0, pos.z);
  dynamic.add(pit);
  state.pits.push({ group: pit, radius: 1.08 });
}

function createShovel() {
  const shovel = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 1.15, 8), materials.bark);
  handle.position.y = 0.58;
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.38, 0.08), materials.hazardMetal);
  blade.position.set(0.06, 0.1, 0);
  blade.rotation.z = 0.18;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.18, 6), materials.hazardMetal);
  neck.position.set(0.02, 0.28, 0);
  neck.rotation.z = -0.3;
  shovel.add(handle, neck, blade);
  return shovel;
}

function addDefender(pos) {
  const defender = new THREE.Group();
  const fallback = createFallbackDefender();
  defender.add(fallback);
  defender.position.set(pos.x, 0, pos.z);
  defender.userData.base = pos.clone();
  defender.userData.phase = Math.random() * Math.PI * 2;

  const warning = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.035, 8, 72), materials.defenderGlow);
  warning.position.set(pos.x, 0.045, pos.z);
  warning.rotation.x = Math.PI / 2;
  warning.userData.phase = defender.userData.phase;
  dynamic.add(warning);

  dynamic.add(defender);
  const record = {
    group: defender,
    warning,
    character: null,
    fallback,
    radius: 1.18,
    aggroRadius: 8.2,
    leashRadius: 11.5,
    chaseSpeed: 2.15,
    patrolRadius: 0.85,
    phase: defender.userData.phase,
  };
  state.defenders.push(record);
  loadMd2Defender(record);
}

function createFallbackDefender() {
  const enemy = new THREE.Group();
  const ghostMat = materials.defenderArmor.clone();
  ghostMat.transparent = true;
  ghostMat.opacity = 0.38;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.92, 6, 12), ghostMat);
  body.position.y = 1.05;
  body.castShadow = true;
  enemy.add(body);
  return enemy;
}

function loadMd2Defender(record) {
  const character = new MD2Character();
  character.scale = 0.038;
  character.onLoadComplete = () => {
    record.fallback.visible = false;
    character.root.rotation.y = Math.PI;
    character.setSkin(Math.floor(Math.random() * Math.max(1, character.skinsBody.length)));
    if (character.weapons.length) character.setWeapon(Math.floor(Math.random() * character.weapons.length));
    const animations = character.meshBody?.geometry?.animations || [];
    const attack = animations.find((clip) => /attack|stand|run/i.test(clip.name)) || animations[0];
    if (attack) character.setAnimation(attack.name);
  };
  character.loadParts({
    baseUrl: "https://threejs.org/examples/models/md2/ratamahatta/",
    body: "ratamahatta.md2",
    skins: ["skins/ratamahatta.png", "skins/ctf_b.png", "skins/ctf_r.png", "skins/dead.png", "skins/gearwhore.png"],
    weapons: [
      ["weapon.md2", "skins/weapon.png"],
      ["w_blaster.md2", "skins/w_blaster.png"],
      ["w_chaingun.md2", "skins/w_chaingun.png"],
      ["w_machinegun.md2", "skins/w_machinegun.png"],
      ["w_railgun.md2", "skins/w_railgun.png"],
      ["w_rlauncher.md2", "skins/w_rlauncher.png"],
    ],
  });
  record.character = character;
  record.group.add(character.root);
}

function addTrap(pos) {
  const trap = new THREE.Group();
  const usesLodObstacle = state.selectedLevel === 1 || state.selectedLevel === 3;
  const obstacle = usesLodObstacle ? createLodObstacleMesh() : createFlyingObstacleMesh();
  trap.add(obstacle);
  trap.position.set(pos.x, usesLodObstacle ? 3.25 : 2.25, pos.z);
  dynamic.add(trap);
  state.traps.push({
    group: trap,
    origin: pos.clone(),
    phase: Math.random() * Math.PI * 2,
    radius: usesLodObstacle ? 4.4 : 3.2,
    height: usesLodObstacle ? 2.15 + Math.random() * 0.75 : 1.15 + Math.random() * 0.55,
    speed: usesLodObstacle ? 0.45 + Math.random() * 0.18 : 0.75 + Math.random() * 0.25,
    hitRadius: usesLodObstacle ? 2.2 : 1.35,
    hitHeight: usesLodObstacle ? 2.35 : 1.7,
    mixer: obstacle.userData.mixer || null,
    wingRoot: obstacle.userData.wingRoot || null,
    obstacleType: usesLodObstacle ? "lod-airship" : "flamingo",
  });
}

function createLodObstacleMesh() {
  if (state.lodObstacle.prototype) {
    const model = state.lodObstacle.prototype.clone(true);
    model.scale.setScalar(0.0005);
    model.rotation.set(0, Math.PI * 1.4, 0);
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    if (state.lodObstacle.animations.length) {
      const mixer = new THREE.AnimationMixer(model);
      state.lodObstacle.animations.forEach((clip) => mixer.clipAction(clip).play());
      model.userData.mixer = mixer;
    }

    return model;
  }

  return createFallbackAirship();
}

function createFallbackAirship() {
  const airship = new THREE.Group();
  const balloon = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 14), materials.finishGold);
  balloon.scale.set(1.45, 0.58, 0.72);
  balloon.position.y = 0.72;
  balloon.castShadow = true;

  const gondola = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.36, 0.48), materials.bark);
  gondola.position.y = -0.15;
  gondola.castShadow = true;

  const stripeGeo = new THREE.BoxGeometry(0.08, 0.74, 1.1);
  [-0.52, 0, 0.52].forEach((xOffset) => {
    const stripe = new THREE.Mesh(stripeGeo, materials.finishBlue);
    stripe.position.set(xOffset, 0.74, 0);
    stripe.castShadow = true;
    airship.add(stripe);
  });

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.55, 18), materials.finishGold);
  nose.position.set(1.32, 0.72, 0);
  nose.rotation.z = -Math.PI / 2;

  const propeller = new THREE.Group();
  const bladeGeo = new THREE.BoxGeometry(0.08, 0.72, 0.04);
  [0, Math.PI / 2].forEach((rotation) => {
    const blade = new THREE.Mesh(bladeGeo, materials.finishWhite);
    blade.rotation.x = rotation;
    propeller.add(blade);
  });
  propeller.position.set(-1.42, 0.72, 0);
  propeller.userData.hops = true;

  airship.add(balloon, gondola, nose, propeller);
  airship.userData.wingRoot = propeller;
  return airship;
}

function createFlyingObstacleMesh() {
  if (state.flyingObstacle.prototype) {
    const model = state.flyingObstacle.prototype.clone(true);
    model.scale.setScalar(0.038);
    model.rotation.set(0, -1, 0);
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    if (state.flyingObstacle.animations.length) {
      const mixer = new THREE.AnimationMixer(model);
      const action = mixer.clipAction(state.flyingObstacle.animations[0]);
      action.setDuration(1);
      action.play();
      model.userData.mixer = mixer;
    }

    return model;
  }

  return createFallbackFlyingBird();
}

function createFallbackFlyingBird() {
  const bird = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.78, 5, 12), materials.flamingoPink);
  body.rotation.z = Math.PI / 2;
  body.castShadow = true;

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 0.72, 8), materials.flamingoPink);
  neck.position.set(0.48, 0.38, 0);
  neck.rotation.z = -0.55;
  neck.castShadow = true;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), materials.flamingoPink);
  head.position.set(0.72, 0.72, 0);
  head.castShadow = true;

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 8), materials.flamingoBeak);
  beak.position.set(0.84, 0.72, 0);
  beak.rotation.z = -Math.PI / 2;

  const wingRoot = new THREE.Group();
  [-1, 1].forEach((side) => {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.045, 0.22), materials.flamingoWing);
    wing.position.set(-0.05, 0.02, side * 0.22);
    wing.rotation.y = side * 0.38;
    wing.castShadow = true;
    wingRoot.add(wing);
  });

  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.58, 6), materials.flamingoPink);
  leg.position.set(-0.22, -0.42, 0);
  leg.castShadow = true;

  bird.add(body, neck, head, beak, wingRoot, leg);
  bird.userData.wingRoot = wingRoot;
  return bird;
}

async function loadFlyingObstacleModel() {
  try {
    const gltf = await loadFirstGltf([
      "https://threejs.org/examples/models/gltf/Flamingo.glb",
      "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Flamingo.glb",
    ]);
    state.flyingObstacle.prototype = gltf.scene.children[0] || gltf.scene;
    state.flyingObstacle.animations = gltf.animations;
    status("Loaded official Three.js Flamingo obstacle");
  } catch {
    status("Using procedural flying obstacle");
  }
}

async function loadLodObstacleModel() {
  try {
    const gltf = await loadFirstGltf(["https://cloud.needle.tools/-/assets/Z23hmXBZnlceI-ZnlceI-world/file"]);
    state.lodObstacle.prototype = gltf.scene;
    state.lodObstacle.animations = gltf.animations;
    status("Loaded progressive LOD airship obstacle");
  } catch {
    status("Using procedural airship obstacle");
  }
}

async function loadMobileHomeWorldModel() {
  try {
    const gltf = await loadFirstGltf(["https://cloud.needle.tools/-/assets/Z23hmXBZ2sPRdk-world/file"]);
    state.mobileHomeWorld.prototype = gltf.scene;
    state.mobileHomeWorld.animations = gltf.animations;
    status("Loaded mobile-home showcase world");
  } catch {
    status("Using procedural mobile-home world");
  }
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
  await applyProgressiveLoading(loader);
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

async function applyProgressiveLoading(loader) {
  if (!progressiveLoaderPromise) {
    progressiveLoaderPromise = import("@needle-tools/gltf-progressive")
      .then((module) => module.useNeedleProgressive)
      .catch(() => null);
  }

  const useNeedleProgressive = await progressiveLoaderPromise;
  if (!useNeedleProgressive) return;

  try {
    useNeedleProgressive(loader, renderer);
  } catch {
    // Progressive LOD is an enhancement; the base GLTF load should still run.
  }
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

function getAudioContext() {
  if (!audio.context) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    audio.context = new AudioContext();
  }
  if (audio.context.state === "suspended") audio.context.resume();
  return audio.context;
}

function playFootstep() {
  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(92 + Math.random() * 18, now);
  oscillator.frequency.exponentialRampToValueAtTime(48, now + 0.08);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.12);
}

function playDeathSound() {
  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(260, now);
  oscillator.frequency.exponentialRampToValueAtTime(55, now + 0.42);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.5);
}

function playCoinSound() {
  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.14, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

  [880, 1320].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.055);
    oscillator.connect(gain);
    oscillator.start(now + index * 0.055);
    oscillator.stop(now + 0.18 + index * 0.055);
  });

  gain.connect(context.destination);
}

function updateFootstepAudio(moving) {
  if (!moving || state.respawning) return;
  const now = performance.now();
  const interval = state.sprinting ? 210 : 320;
  if (now - audio.lastFootstep < interval) return;
  audio.lastFootstep = now;
  playFootstep();
}

function updatePlayer(dt) {
  if (state.respawning) {
    state.player.velocity.set(0, 0, 0);
    playAction("idle");
    animateFallbackLimbs(dt, false);
    state.mixer?.update(dt);
    return;
  }

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
    updateFootstepAudio(true);
  } else {
    state.player.velocity.lerp(new THREE.Vector3(0, 0, 0), Math.min(1, 18 * dt));
    movePlayerStepped(state.player.velocity, dt);
    playAction("idle");
    animateFallbackLimbs(dt, false);
  }

  state.stamina = state.sprinting ? Math.max(0, state.stamina - dt * 0.28) : Math.min(1, state.stamina + dt * 0.32);
  updateVerticalMovement(dt, moving);
  state.mixer?.update(dt);
}

function updateVerticalMovement(dt, moving) {
  const position = state.player.object.position;
  const ladder = getActiveLadder(position);
  if (ladder || state.player.climbing) {
    const activeLadder = state.player.climbing || ladder;
    state.player.climbing = activeLadder;
    state.player.velocity.multiplyScalar(0.82);
    position.x = THREE.MathUtils.lerp(position.x, activeLadder.climbX ?? activeLadder.x, Math.min(1, dt * 1.8));
    position.z = THREE.MathUtils.lerp(position.z, activeLadder.climbZ ?? activeLadder.z, Math.min(1, dt * 1.8));
    position.y = Math.min(activeLadder.targetY, position.y + dt * 1.18);
    state.player.verticalVelocity = 0;
    state.player.parkourStarted = true;
    state.stamina = Math.min(1, state.stamina + dt * 0.5);
    status("Climbing ladder");
    if (position.y >= activeLadder.targetY - 0.03) {
      position.y = activeLadder.targetY;
      position.x = THREE.MathUtils.lerp(position.x, activeLadder.exitX, Math.min(1, dt * 2.8));
      position.z = THREE.MathUtils.lerp(position.z, activeLadder.exitZ, Math.min(1, dt * 2.8));
      if (Math.hypot(position.x - activeLadder.exitX, position.z - activeLadder.exitZ) < 0.12) {
        state.player.climbing = null;
        status("Reached upper floor");
      }
    }
    return;
  }

  const floorY = getFloorHeight(position);
  if (position.y > floorY + 0.04 || state.player.verticalVelocity > 0) {
    state.player.verticalVelocity -= 13.5 * dt;
    position.y += state.player.verticalVelocity * dt;
    if (position.y <= floorY) {
      position.y = floorY;
      state.player.verticalVelocity = 0;
      if (floorY > 0.2) {
        state.player.parkourStarted = true;
        status("Platform landed");
      }
    }
  } else {
    position.y = floorY;
    state.player.verticalVelocity = 0;
  }

  if (state.selectedLevel >= 4 && state.player.parkourStarted && floorY === 0 && position.y <= 0.05 && !getActiveLadder(position)) {
    killPlayer("Fell off the parkour floor");
  }

  if (position.y < -2.2) killPlayer("Missed the parkour jump");
}

function getActiveLadder(position) {
  return state.ladders.find((ladder) => Math.abs(position.x - ladder.x) < ladder.width && Math.abs(position.z - ladder.z) < ladder.depth);
}

function getFloorHeight(position) {
  let floor = 0;
  state.platforms.forEach((platform) => {
    const local = position.clone().sub(new THREE.Vector3(platform.x, 0, platform.z));
    if (platform.rotationY) local.applyAxisAngle(new THREE.Vector3(0, 1, 0), -platform.rotationY);
    if (Math.abs(local.x) <= platform.width / 2 && Math.abs(local.z) <= platform.depth / 2 && position.y >= platform.y - 1.2) {
      floor = Math.max(floor, platform.y);
    }
  });
  return floor;
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
  const offset = new THREE.Vector3(0, 6.2 + target.y * 0.35, -8.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.player.yaw);
  const desired = target.clone().add(offset);
  camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
  camera.lookAt(target.x, target.y + 1.45, target.z);
}

function updateCollectibles(dt) {
  state.coins.forEach((coin) => {
    coin.mesh.rotation.y += 0.04;
    coin.mesh.position.y = 1.45 + Math.sin(performance.now() * 0.004 + coin.mesh.position.x) * 0.16;
    if (!coin.collected && horizontalDistance(coin.mesh.position, state.player.object.position) < 1.55) {
      coin.collected = true;
      coin.mesh.visible = false;
      const now = performance.now();
      state.combo = now - state.lastCoinAt < 5200 ? Math.min(5, state.combo + 1) : 1;
      state.lastCoinAt = now;
      state.collected += 1;
      state.score += 150 * state.combo;
      playCoinSound();
      status(state.combo > 1 ? `Coin streak x${state.combo}` : "Coin collected");
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
    updateFlyingObstacle(trap, dt);
    if (!state.respawning && flyingObstacleHitsPlayer(trap)) {
      killPlayer();
    }
  });

  state.defenders.forEach((defender) => {
    updateDefender(defender, dt);
    if (!state.respawning && defenderHitsPlayer(defender)) {
      killPlayer();
    }
  });

  state.parkourPads.forEach((pad) => {
    updateParkourPad(pad);
    if (!state.respawning && performance.now() - pad.usedAt > 1200 && horizontalDistance(pad.group.position, state.player.object.position) < 1.35) {
      triggerParkourPad(pad);
    }
  });

  state.pits.forEach((pit) => {
    updatePit(pit);
    if (!state.respawning && state.player.object.position.y < 0.65 && horizontalDistance(pit.group.position, state.player.object.position) < pit.radius) {
      killPlayer("Fell into the pit");
    }
  });

  if (!state.respawning && horizontalDistance(state.player.object.position, state.exit) < 1.65) completeLevel();
}

function horizontalDistance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function updateFlyingObstacle(trap, dt) {
  const time = performance.now() * 0.001;
  const angle = time * trap.speed + trap.phase;
  const nextX = trap.origin.x + Math.cos(angle) * trap.radius;
  const nextZ = trap.origin.z + Math.sin(angle * 0.82) * trap.radius * 0.72;
  const nextY = 1.25 + Math.sin(angle * 1.7) * 0.42 + trap.height;
  const previous = trap.group.position.clone();

  trap.group.position.set(nextX, nextY, nextZ);
  const movement = trap.group.position.clone().sub(previous);
  if (movement.lengthSq() > 0.0001) {
    trap.group.rotation.y = Math.atan2(movement.x, movement.z) + Math.PI / 2;
  }
  trap.group.rotation.z = Math.sin(angle * 2.1) * 0.16;
  trap.mixer?.update(dt);
  if (trap.obstacleType === "lod-airship") {
    trap.group.rotation.x = Math.sin(angle * 1.2) * 0.05;
    if (trap.wingRoot) trap.wingRoot.rotation.x += 0.28;
  } else if (trap.wingRoot) {
    trap.wingRoot.children.forEach((wing, index) => {
      wing.rotation.x = Math.sin(time * 12 + trap.phase + index) * 0.65;
    });
  }
}

function flyingObstacleHitsPlayer(trap) {
  const playerCenter = state.player.object.position.clone().add(new THREE.Vector3(0, 1.15, 0));
  const birdCenter = trap.group.position;
  const horizontal = horizontalDistance(playerCenter, birdCenter);
  const vertical = Math.abs(playerCenter.y - birdCenter.y);
  return horizontal < trap.hitRadius && vertical < trap.hitHeight;
}

function updateDefender(defender, dt) {
  const time = performance.now() * 0.001;
  const base = defender.group.userData.base;
  const player = state.player.object.position;
  const distanceToPlayer = horizontalDistance(defender.group.position, player);
  const distanceFromBase = horizontalDistance(defender.group.position, base);
  const target = new THREE.Vector3();

  if (distanceToPlayer < defender.aggroRadius && distanceFromBase < defender.leashRadius) {
    target.copy(player);
  } else {
    target.set(
      base.x + Math.sin(time * 1.4 + defender.phase) * defender.patrolRadius,
      0,
      base.z + Math.cos(time * 1.2 + defender.phase) * defender.patrolRadius * 0.6
    );
  }

  const delta = target.clone().sub(defender.group.position);
  delta.y = 0;
  if (delta.length() > 0.08) {
    delta.normalize();
    const speed = distanceToPlayer < defender.aggroRadius ? defender.chaseSpeed : 1.1;
    defender.group.position.addScaledVector(delta, speed * dt);
  }

  defender.group.lookAt(state.player.object.position.x, defender.group.position.y, state.player.object.position.z);
  defender.warning.position.x = defender.group.position.x;
  defender.warning.position.z = defender.group.position.z;
  defender.warning.rotation.z += 0.035;
  defender.warning.scale.setScalar(distanceToPlayer < defender.aggroRadius ? 1.08 : 0.86);
  defender.fallback.rotation.y += 0.012;
  defender.character?.update(dt);
}

function defenderHitsPlayer(defender) {
  const horizontal = horizontalDistance(defender.group.position, state.player.object.position);
  return horizontal < defender.radius;
}

function updateParkourPad(pad) {
  const time = performance.now() * 0.001;
  pad.group.children.forEach((child) => {
    if (child.userData.phase !== undefined) {
      child.rotation.z += 0.055;
      child.position.y = 0.34 + Math.sin(time * 5 + child.userData.phase) * 0.08;
    }
  });
}

function triggerParkourPad(pad) {
  pad.usedAt = performance.now();
  state.stamina = 1;
  const forward = new THREE.Vector3(Math.sin(state.player.yaw), 0, Math.cos(state.player.yaw));
  state.player.velocity.addScaledVector(forward, 8.4);
  state.player.verticalVelocity = Math.max(state.player.verticalVelocity, 6.8);
  state.player.parkourStarted = true;
  state.score += 140;
  status("Parkour launch");
}

function updatePit(pit) {
  const time = performance.now() * 0.001;
  pit.group.children.forEach((child) => {
    if (child.userData.phase !== undefined) {
      child.rotation.z += 0.025;
      child.scale.setScalar(0.94 + Math.sin(time * 5 + child.userData.phase) * 0.05);
    }
  });
}

function updateEnvironment(dt) {
  const time = performance.now() * 0.001;
  state.stageMixers.forEach((mixer) => mixer.update(dt));
  environment.children.forEach((child, index) => {
    if (child.userData.kind === "animal") {
      const bob = Math.max(0, Math.sin(time * 1.8 + child.userData.phase)) * 0.16;
      child.position.x = child.userData.baseX + Math.sin(time * 0.35 + child.userData.phase) * 0.32;
      child.position.z = child.userData.baseZ + Math.cos(time * 0.28 + child.userData.phase) * 0.22;
      child.position.y = bob;
      child.userData.hop?.forEach((leg, legIndex) => {
        leg.rotation.x = Math.sin(time * 2.6 + child.userData.phase + legIndex) * 0.25;
      });
    } else if (child.userData.phase !== undefined) {
      child.position.y = child.userData.baseY + Math.sin(time * 2.4 + child.userData.phase) * 0.22;
      child.material.opacity = 0.45 + Math.sin(time * 3 + child.userData.phase) * 0.25;
    } else if (child.userData.kind === "checkpoint") {
      child.children.forEach((node) => {
        if (node.userData.phase !== undefined) {
          node.rotation.z += 0.03;
          node.scale.setScalar(1 + Math.sin(time * 4 + node.userData.phase) * 0.08);
        }
      });
    } else if (child.userData.kind === "mobile-home-world") {
      child.position.y = 0.02 + Math.sin(time * 0.8) * 0.04;
    } else if (child.type === "Group" && child.children.some((node) => node.material?.transparent)) {
      child.position.x += Math.sin(time * 0.18 + index) * 0.002;
    }
  });

  if (state.exitGroup) {
    state.exitGroup.userData.trophy.rotation.y += 0.025;
    state.exitGroup.userData.halo.rotation.z += 0.018;
    state.exitGroup.children.forEach((child) => {
      if (child.userData.phase !== undefined) {
        child.position.y = child.userData.baseY + Math.sin(time * 4 + child.userData.phase) * 0.22;
        child.scale.setScalar(0.8 + Math.sin(time * 5 + child.userData.phase) * 0.28);
      }
    });
  }
}

function resetPlayerToStart() {
  for (let z = 0; z < state.map.length; z += 1) {
    for (let x = 0; x < state.map[z].length; x += 1) {
      if (state.map[z][x] === "S") {
        placePlayer(gridToWorld(x + 0.5, z + 0.5));
      }
    }
  }
}

function killPlayer(message = "Obstacle hit - respawning") {
  if (state.respawning || state.mode !== "playing") return;
  const levelAtDeath = state.selectedLevel;
  state.respawning = true;
  state.deaths += 1;
  state.combo = 1;
  state.player.velocity.set(0, 0, 0);
  state.player.object.visible = false;
  playDeathSound();
  status(message);
  setTimeout(() => {
    if (state.mode !== "playing" || state.selectedLevel !== levelAtDeath) return;
    resetPlayerToStart();
    state.player.object.visible = true;
    state.respawning = false;
    status("Checkpoint reset");
  }, 650);
}

function completeLevel() {
  if (state.mode !== "playing") return;
  state.mode = "summary";
  const seconds = Math.floor((performance.now() - state.startTime) / 1000);
  const level = currentLevel();
  const stars = Math.max(1, Number(seconds <= level.targetTime) + Number(state.collected === state.coins.length) + Number(state.deaths === 0));
  const flawlessBonus = state.deaths === 0 ? 650 : 0;
  const collectorBonus = state.collected === state.coins.length ? 500 : 0;
  const score = stars * 1000 + state.score + Math.max(0, level.targetTime - seconds) * 12 + flawlessBonus + collectorBonus - state.deaths * 100;
  const rank = score >= 3300 ? "S Rank" : score >= 2400 ? "A Rank" : score >= 1500 ? "B Rank" : "C Rank";
  if (!state.builderActive) {
    state.unlocked = Math.max(state.unlocked, Math.min(levels.length, state.selectedLevel + 2));
    saveProgress({ level: state.selectedLevel + 1, levelName: level.name, seconds, coins: state.collected, totalCoins: state.coins.length, deaths: state.deaths, stars, score, rank });
  }

  hud.classList.add("hidden");
  centerHint.classList.add("hidden");
  summary.classList.remove("hidden");
  summaryTitle.textContent = `Level ${state.selectedLevel + 1} Complete`;
  summaryText.textContent = `${rank} | Score ${score} | Time ${formatTime(seconds)} | Coins ${state.collected}/${state.coins.length} | Deaths ${state.deaths} | Bonuses ${flawlessBonus + collectorBonus}`;
  starRating.textContent = "*".repeat(stars) + " ".repeat(3 - stars);
  document.getElementById("nextLevel").disabled = state.builderActive || state.selectedLevel + 1 >= levels.length;
  renderLevelGrid();
}

function updateHud() {
  const level = currentLevel();
  state.elapsed = performance.now() - state.startTime;
  if (state.combo > 1 && performance.now() - state.lastCoinAt > 5200) state.combo = 1;
  levelLabel.textContent = `Level ${state.selectedLevel + 1}: ${level.name}`;
  themeLabel.textContent = level.theme;
  coinLabel.textContent = `Coins ${state.collected}/${state.coins.length}`;
  comboLabel.textContent = `Combo x${state.combo}`;
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
    updateCollectibles(dt);
    updateEnvironment(dt);
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
  getAudioContext();
  if (event.code === "Escape") {
    if (state.mode === "playing") pause();
    return;
  }
  keys.add(event.code);
});
window.addEventListener("keyup", (event) => keys.delete(event.code));

canvas.addEventListener("click", () => {
  getAudioContext();
  canvas.requestPointerLock?.();
});
window.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement === canvas && state.mode === "playing") {
    state.player.yaw -= event.movementX * 0.0024;
  }
});
document.addEventListener("pointerlockchange", () => {
  centerHint.classList.toggle("hidden", document.pointerLockElement === canvas || state.mode !== "playing");
});

document.getElementById("resumeGame").addEventListener("click", () => startLevel(0));
document.getElementById("builderMode").addEventListener("click", () => openBuilderSandbox());
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
document.getElementById("builderClose").addEventListener("click", () => closeBuilderSandbox());
document.getElementById("builderClear").addEventListener("click", () => clearBuilderBoard());
document.getElementById("builderPlay").addEventListener("click", () => playBuilderLevel());
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
normalizeBuilderGrid();
renderBuilderSandbox();
await loadFlyingObstacleModel();
await loadLodObstacleModel();
await loadMobileHomeWorldModel();
await loadCharacter();
animate();
