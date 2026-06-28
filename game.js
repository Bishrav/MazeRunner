const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const hud = document.getElementById("hud");
const menu = document.getElementById("menu");
const pauseMenu = document.getElementById("pauseMenu");
const summary = document.getElementById("summary");
const centerHint = document.getElementById("centerHint");
const levelGrid = document.getElementById("levelGrid");

const levelLabel = document.getElementById("levelLabel");
const themeLabel = document.getElementById("themeLabel");
const coinLabel = document.getElementById("coinLabel");
const timerLabel = document.getElementById("timerLabel");
const deathLabel = document.getElementById("deathLabel");
const objectiveLabel = document.getElementById("objectiveLabel");
const staminaFill = document.getElementById("staminaFill");
const statusFeed = document.getElementById("statusFeed");
const damageFlash = document.getElementById("damageFlash");
const summaryTitle = document.getElementById("summaryTitle");
const summaryText = document.getElementById("summaryText");
const starRating = document.getElementById("starRating");

const TWO_PI = Math.PI * 2;
const FOV = Math.PI / 3;
const MAX_DEPTH = 22;
const SAVE_KEY = "maze-runner-save-v1";
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const keys = new Set();
const pointer = { locked: false };

const levels = [
  {
    name: "Beginner Maze",
    theme: "Forest Maze",
    objective: "Collect coins and reach the green exit.",
    sky: "#8ecae6",
    floor: "#2d6a4f",
    wall: "#31572c",
    accent: "#90be6d",
    map: [
      "############",
      "#S..C.....E#",
      "#.####.#####",
      "#....#.....#",
      "####.#.###.#",
      "#C...#...C.#",
      "#.#####.##.#",
      "#..........#",
      "############",
    ],
    targetTime: 55,
  },
  {
    name: "Hidden Paths",
    theme: "Ancient Temple",
    objective: "Use the cracked walls as shortcuts.",
    sky: "#b8a17d",
    floor: "#766153",
    wall: "#6f5e46",
    accent: "#f2cc8f",
    map: [
      "###############",
      "#S..#....C...E#",
      "###.#.#######.#",
      "#...#F#..P..#.#",
      "#.###.#.###.#.#",
      "#C....#.#C#...#",
      "#####.#.#.#####",
      "#.....#.......#",
      "###############",
    ],
    targetTime: 75,
  },
  {
    name: "Moving Maze",
    theme: "Neon Maze",
    objective: "Watch for blue walls that shift open and closed.",
    sky: "#0b1028",
    floor: "#111827",
    wall: "#2834a8",
    accent: "#22d3ee",
    map: [
      "################",
      "#S...C.....#..E#",
      "#.####.###.#.###",
      "#......#M#.....#",
      "######.#.#.###.#",
      "#C.....#...#C..#",
      "#.###########.##",
      "#..............#",
      "################",
    ],
    targetTime: 85,
  },
  {
    name: "Timed Maze",
    theme: "Lava Maze",
    objective: "Slip through orange timed gates and avoid red traps.",
    sky: "#2b1209",
    floor: "#421a12",
    wall: "#6b2d1a",
    accent: "#f97316",
    map: [
      "#################",
      "#S..C.....T....E#",
      "#.#####.#####.###",
      "#.....#.....#...#",
      "###T#.###G#.###.#",
      "#...#...C.#...C.#",
      "#.#######.#####.#",
      "#...............#",
      "#################",
    ],
    targetTime: 95,
  },
  {
    name: "Chase Maze",
    theme: "Dungeon Maze",
    objective: "A hunter patrols the maze. Keep moving.",
    sky: "#1b1b1f",
    floor: "#262626",
    wall: "#3f3f46",
    accent: "#a78bfa",
    chaser: true,
    map: [
      "##################",
      "#S....#.....C...E#",
      "#.###.#.#######.##",
      "#...#.#.....#....#",
      "###.#.#####.#.##.#",
      "#C..#.....#.#..#.#",
      "#.#######.#.##.#.#",
      "#.....C...#......#",
      "##################",
    ],
    targetTime: 115,
  },
  {
    name: "Frozen Switchback",
    theme: "Ice Maze",
    objective: "Sprint carefully across long sightlines and use speed charms.",
    sky: "#bde0fe",
    floor: "#dbeafe",
    wall: "#60a5fa",
    accent: "#0f766e",
    map: [
      "###################",
      "#S....C....#.....E#",
      "#.#######..#.####.#",
      "#.#.....#..#....#.#",
      "#.#.###.#.####P.#.#",
      "#...#C#.#....#..#.#",
      "###.#.#.####.#.##.#",
      "#...#.....C..#....#",
      "###################",
    ],
    targetTime: 120,
  },
  {
    name: "Haunted Labyrinth",
    theme: "Haunted Maze",
    objective: "Hidden passages, traps, and the hunter combine in the final maze.",
    sky: "#171326",
    floor: "#22172f",
    wall: "#4c1d95",
    accent: "#f0abfc",
    chaser: true,
    map: [
      "####################",
      "#S....#..C.....#..E#",
      "#.###.#.######.#.###",
      "#...#.#....F#..#...#",
      "###.#.####G#.####T.#",
      "#C..#....#....#....#",
      "#.######.#.##.#.##.#",
      "#....P...#..C...#..#",
      "####################",
    ],
    targetTime: 140,
  },
];

const state = {
  mode: "menu",
  selectedLevel: 0,
  unlocked: Number(localStorage.getItem(SAVE_KEY) || 1),
  player: { x: 1.5, y: 1.5, angle: 0, deaths: 0 },
  level: null,
  map: [],
  coins: [],
  traps: [],
  exit: { x: 0, y: 0 },
  powerups: [],
  nature: [],
  playerAvatar: { stride: 0, bob: 0, moving: false },
  startTime: 0,
  elapsed: 0,
  lastTime: 0,
  gatePhase: 0,
  chaser: null,
  stamina: 1,
  speedBoostUntil: 0,
  showMinimap: true,
  statusMessage: "",
  statusUntil: 0,
};

function resize() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function renderLevelGrid() {
  levelGrid.innerHTML = "";
  levels.forEach((level, index) => {
    const button = document.createElement("button");
    button.className = "level-card";
    button.disabled = index + 1 > state.unlocked;
    button.style.setProperty("--card-accent", level.accent);
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
    localStorage.setItem(SAVE_KEY, String(state.unlocked));
  } catch {
    state.unlocked = Number(localStorage.getItem(SAVE_KEY) || 1);
  }
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
    // Static-server fallback: localStorage already persisted the unlock state.
  }
}

async function resetProgress() {
  state.unlocked = 1;
  localStorage.setItem(SAVE_KEY, "1");
  try {
    await fetch("/api/reset", { method: "POST" });
  } catch {
    // Static-server fallback.
  }
  renderLevelGrid();
}

function parseLevel(level) {
  const map = level.map.map((row) => row.split(""));
  const coins = [];
  const traps = [];
  const powerups = [];
  let start = { x: 1.5, y: 1.5 };
  let exit = { x: 1.5, y: 1.5 };

  for (let y = 0; y < map.length; y += 1) {
    for (let x = 0; x < map[y].length; x += 1) {
      const cell = map[y][x];
      if (cell === "S") start = { x: x + 0.5, y: y + 0.5 };
      if (cell === "E") exit = { x: x + 0.5, y: y + 0.5 };
      if (cell === "C") coins.push({ x: x + 0.5, y: y + 0.5, taken: false, bob: Math.random() * TWO_PI });
      if (cell === "T") traps.push({ x: x + 0.5, y: y + 0.5, phase: Math.random() * TWO_PI });
      if (cell === "P") powerups.push({ x: x + 0.5, y: y + 0.5, taken: false, bob: Math.random() * TWO_PI });
    }
  }

  return { map, coins, traps, powerups, start, exit };
}

function startLevel(index) {
  state.selectedLevel = index;
  state.level = levels[index];
  const parsed = parseLevel(state.level);
  state.map = parsed.map;
  state.coins = parsed.coins;
  state.traps = parsed.traps;
  state.powerups = parsed.powerups;
  state.exit = parsed.exit;
  state.nature = buildNatureProps(parsed.map, state.level);
  state.player = { x: parsed.start.x, y: parsed.start.y, angle: 0, deaths: 0 };
  state.startTime = performance.now();
  state.elapsed = 0;
  state.gatePhase = 0;
  state.stamina = 1;
  state.speedBoostUntil = 0;
  state.statusMessage = "";
  state.statusUntil = 0;
  state.chaser = state.level.chaser ? { x: parsed.start.x + 6, y: parsed.start.y + 2, pulse: 0 } : null;
  state.playerAvatar = { stride: 0, bob: 0, moving: false };
  state.mode = "playing";
  menu.classList.add("hidden");
  pauseMenu.classList.add("hidden");
  summary.classList.add("hidden");
  hud.classList.remove("hidden");
  centerHint.classList.remove("hidden");
  updateHud();
}

function cellAt(x, y) {
  const row = state.map[Math.floor(y)];
  if (!row) return "#";
  return row[Math.floor(x)] || "#";
}

function isBlocked(x, y) {
  const cell = cellAt(x, y);
  if (cell === "#") return true;
  if (cell === "F") return false;
  if (cell === "M") return Math.sin(state.elapsed * 0.003) > -0.25;
  if (cell === "G") return Math.sin(state.elapsed * 0.004) > 0;
  return false;
}

function buildNatureProps(map, level) {
  const props = [];
  const isNatural = level.theme.includes("Forest") || level.theme.includes("Ice") || level.theme.includes("Haunted");
  for (let y = 1; y < map.length - 1; y += 1) {
    for (let x = 1; x < map[y].length - 1; x += 1) {
      const cell = map[y][x];
      if (cell === "#" && isNatural && ((x * 13 + y * 7) % 5 === 0)) {
        props.push({ type: "tree", x: x + 0.5, y: y + 0.5, variant: (x + y) % 3, sway: Math.random() * TWO_PI });
      }
      if (cell === "." && isNatural && ((x * 17 + y * 11) % 13 === 0)) {
        props.push({ type: "fern", x: x + 0.5, y: y + 0.5, variant: (x * y) % 4, sway: Math.random() * TWO_PI });
      }
    }
  }
  return props;
}

function movePlayer(dx, dy) {
  const radius = 0.18;
  const nextX = state.player.x + dx;
  const nextY = state.player.y + dy;
  if (!isBlocked(nextX + Math.sign(dx) * radius, state.player.y)) state.player.x = nextX;
  if (!isBlocked(state.player.x, nextY + Math.sign(dy) * radius)) state.player.y = nextY;
}

function restartAfterDeath() {
  const parsed = parseLevel(state.level);
  state.player.x = parsed.start.x;
  state.player.y = parsed.start.y;
  state.player.angle = 0;
  state.player.deaths += 1;
  state.stamina = 1;
  state.speedBoostUntil = 0;
  showStatus("Checkpoint reset");
  damageFlash.classList.remove("hidden");
  window.setTimeout(() => damageFlash.classList.add("hidden"), 420);
}

function update(dt) {
  if (state.mode !== "playing") return;

  state.elapsed = performance.now() - state.startTime;
  const wantsSprint = keys.has("ShiftLeft") || keys.has("ShiftRight");
  const boosted = performance.now() < state.speedBoostUntil;
  const sprint = wantsSprint && (state.stamina > 0.08 || boosted);
  const baseSpeed = boosted ? 4.8 : 2.6;
  const speed = (sprint ? baseSpeed * 1.62 : baseSpeed) * dt;
  const turnSpeed = 2.4 * dt;

  if (keys.has("ArrowLeft") || keys.has("KeyQ")) state.player.angle -= turnSpeed;
  if (keys.has("ArrowRight") || keys.has("KeyE")) state.player.angle += turnSpeed;

  let forward = 0;
  let strafe = 0;
  if (keys.has("KeyW")) forward += 1;
  if (keys.has("KeyS")) forward -= 1;
  if (keys.has("KeyA")) strafe -= 1;
  if (keys.has("KeyD")) strafe += 1;

  if (forward || strafe) {
    const len = Math.hypot(forward, strafe);
    forward /= len;
    strafe /= len;
    const cos = Math.cos(state.player.angle);
    const sin = Math.sin(state.player.angle);
    movePlayer((cos * forward - sin * strafe) * speed, (sin * forward + cos * strafe) * speed);
  }

  state.playerAvatar.moving = Boolean(forward || strafe);
  if (state.playerAvatar.moving) {
    state.playerAvatar.stride += dt * (sprint ? 13.5 : 8.5);
    state.playerAvatar.bob = Math.sin(state.playerAvatar.stride) * (sprint ? 0.08 : 0.045);
  } else {
    state.playerAvatar.bob *= 0.82;
  }

  if (sprint && !boosted && (forward || strafe)) {
    state.stamina = clamp(state.stamina - dt * 0.32, 0, 1);
  } else {
    state.stamina = clamp(state.stamina + dt * 0.22, 0, 1);
  }

  state.coins.forEach((coin) => {
    if (!coin.taken && distance(state.player, coin) < 0.45) {
      coin.taken = true;
      showStatus("Coin collected");
    }
  });

  state.powerups.forEach((powerup) => {
    if (!powerup.taken && distance(state.player, powerup) < 0.45) {
      powerup.taken = true;
      state.speedBoostUntil = performance.now() + 8000;
      showStatus("Speed charm active");
    }
  });

  state.traps.forEach((trap) => {
    if (Math.sin(state.elapsed * 0.006 + trap.phase) > 0.15 && distance(state.player, trap) < 0.46) restartAfterDeath();
  });

  if (cellAt(state.player.x, state.player.y) === "F") {
    showStatus("Hidden passage found");
  }

  if (state.chaser) {
    const chaseSpeed = 0.9 * dt;
    const angle = Math.atan2(state.player.y - state.chaser.y, state.player.x - state.chaser.x);
    const nx = state.chaser.x + Math.cos(angle) * chaseSpeed;
    const ny = state.chaser.y + Math.sin(angle) * chaseSpeed;
    if (!isBlocked(nx, state.chaser.y)) state.chaser.x = nx;
    if (!isBlocked(state.chaser.x, ny)) state.chaser.y = ny;
    if (distance(state.player, state.chaser) < 0.56) restartAfterDeath();
  }

  if (distance(state.player, state.exit) < 0.62) completeLevel();
  updateHud();
}

function completeLevel() {
  state.mode = "summary";
  const collected = state.coins.filter((coin) => coin.taken).length;
  const total = state.coins.length;
  const seconds = Math.floor(state.elapsed / 1000);
  const nextUnlock = Math.min(levels.length, state.selectedLevel + 2);
  state.unlocked = Math.max(state.unlocked, nextUnlock);
  localStorage.setItem(SAVE_KEY, String(state.unlocked));

  const timeScore = seconds <= state.level.targetTime ? 1 : 0;
  const coinScore = collected === total ? 1 : 0;
  const deathScore = state.player.deaths === 0 ? 1 : 0;
  const stars = Math.max(1, timeScore + coinScore + deathScore);
  const timeBonus = Math.max(0, state.level.targetTime - seconds) * 12;
  const score = stars * 1000 + collected * 150 + timeBonus - state.player.deaths * 100;
  const rank = score >= 3300 ? "S Rank" : score >= 2400 ? "A Rank" : score >= 1500 ? "B Rank" : "C Rank";
  saveProgress({
    level: state.selectedLevel + 1,
    levelName: state.level.name,
    seconds,
    coins: collected,
    totalCoins: total,
    deaths: state.player.deaths,
    stars,
    score,
    rank,
  });

  summaryTitle.textContent = `Level ${state.selectedLevel + 1} Complete`;
  summaryText.textContent = `${rank} | Score ${score} | Time ${formatTime(seconds)} | Coins ${collected}/${total} | Deaths ${state.player.deaths}`;
  starRating.textContent = "*".repeat(stars);
  document.getElementById("nextLevel").disabled = state.selectedLevel + 1 >= levels.length;

  hud.classList.add("hidden");
  centerHint.classList.add("hidden");
  summary.classList.remove("hidden");
  renderLevelGrid();
}

function updateHud() {
  const collected = state.coins.filter((coin) => coin.taken).length;
  levelLabel.textContent = `Level ${state.selectedLevel + 1}: ${state.level.name}`;
  themeLabel.textContent = state.level.theme;
  coinLabel.textContent = `Coins ${collected}/${state.coins.length}`;
  timerLabel.textContent = formatTime(Math.floor(state.elapsed / 1000));
  deathLabel.textContent = `Deaths ${state.player.deaths}`;
  objectiveLabel.textContent = state.level.objective;
  staminaFill.style.width = `${Math.round(state.stamina * 100)}%`;
  statusFeed.textContent = performance.now() < state.statusUntil ? state.statusMessage : "";
}

function showStatus(message) {
  state.statusMessage = message;
  state.statusUntil = performance.now() + 1600;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function castRay(angle) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  let dist = 0;
  while (dist < MAX_DEPTH) {
    dist += 0.025;
    const x = state.player.x + cos * dist;
    const y = state.player.y + sin * dist;
    if (isBlocked(x, y)) {
      return { dist, cell: cellAt(x, y), x, y };
    }
  }
  return { dist: MAX_DEPTH, cell: ".", x: state.player.x + cos * MAX_DEPTH, y: state.player.y + sin * MAX_DEPTH };
}

function render() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const level = state.level || levels[0];

  const sky = ctx.createLinearGradient(0, 0, 0, height / 2);
  sky.addColorStop(0, lighten(level.sky, 0.28));
  sky.addColorStop(1, level.sky);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height / 2);
  drawNatureBackdrop(width, height, level);

  const floor = ctx.createLinearGradient(0, height / 2, 0, height);
  floor.addColorStop(0, darken(level.floor, 0.1));
  floor.addColorStop(1, darken(level.floor, 0.38));
  ctx.fillStyle = floor;
  ctx.fillRect(0, height / 2, width, height / 2);
  drawFloorTexture(width, height, level);

  if (state.mode === "menu") {
    drawBackdrop(width, height);
    drawFloatingLeaves(width, height, level, 0.7);
    return;
  }

  const columns = Math.max(160, Math.floor(width / 3));
  const columnWidth = width / columns;
  for (let i = 0; i < columns; i += 1) {
    const rayAngle = state.player.angle - FOV / 2 + (i / columns) * FOV;
    const hit = castRay(rayAngle);
    const corrected = hit.dist * Math.cos(rayAngle - state.player.angle);
    const wallHeight = Math.min(height, height / Math.max(0.001, corrected));
    const shade = Math.max(0.25, 1 - corrected / MAX_DEPTH);
    const x = i * columnWidth;
    const y = (height - wallHeight) / 2;
    drawWallSlice(x, y, columnWidth + 1, wallHeight, hit, shade);
  }

  drawSprites(width, height);
  drawFloatingLeaves(width, height, level, 0.35);
  drawPlayerCharacter(width, height);
  if (state.showMinimap) drawMinimap(width, height);
  drawCrosshair(width, height);
  drawVignette(width, height);
}

function wallColor(cell, shade) {
  const color = cell === "M" || cell === "G" ? state.level.accent : state.level.wall;
  const rgb = hexToRgb(color);
  return `rgb(${Math.floor(rgb.r * shade)}, ${Math.floor(rgb.g * shade)}, ${Math.floor(rgb.b * shade)})`;
}

function drawWallSlice(x, y, width, height, hit, shade) {
  const base = wallColor(hit.cell, shade);
  ctx.fillStyle = base;
  ctx.fillRect(x, y, width, height);

  const seam = Math.abs((hit.x + hit.y) % 1 - 0.5);
  const detail = clamp(1 - hit.dist / 12, 0, 1);
  if (seam > 0.46) {
    ctx.fillStyle = `rgba(255,255,255,${0.1 * detail})`;
    ctx.fillRect(x, y, width, height);
  }

  const block = Math.floor((hit.x * 7 + hit.y * 11) * 10) % 5;
  if (block === 0) {
    ctx.fillStyle = `rgba(0,0,0,${0.18 * detail})`;
    ctx.fillRect(x, y + height * 0.18, width, Math.max(1, height * 0.045));
  }

  if (hit.cell === "G") {
    ctx.fillStyle = `rgba(249,115,22,${0.22 + 0.18 * Math.sin(state.elapsed * 0.012)})`;
    ctx.fillRect(x, y, width, height);
  }
}

function drawFloorTexture(width, height, level) {
  const horizon = height / 2;
  ctx.strokeStyle = "rgba(255,255,255,0.045)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 18; i += 1) {
    const y = horizon + (i * i * height) / 520;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.strokeStyle = hexToRgba(level.accent, 0.055);
  for (let i = -8; i <= 8; i += 1) {
    const x = width / 2 + i * width * 0.08;
    ctx.beginPath();
    ctx.moveTo(width / 2, horizon);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  const natural = level.theme.includes("Forest") || level.theme.includes("Ice") || level.theme.includes("Haunted");
  if (natural) {
    ctx.strokeStyle = level.theme.includes("Ice") ? "rgba(14,116,144,0.16)" : "rgba(134,239,172,0.16)";
    for (let i = 0; i < 70; i += 1) {
      const x = (i * 83) % width;
      const y = horizon + ((i * 47) % Math.floor(height / 2));
      const blade = 4 + (i % 9);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.sin(i) * 5, y - blade);
      ctx.stroke();
    }
  }
}

function drawNatureBackdrop(width, height, level) {
  const natural = level.theme.includes("Forest") || level.theme.includes("Ice") || level.theme.includes("Haunted");
  if (!natural) return;

  const horizon = height * 0.48;
  const glow = ctx.createRadialGradient(width * 0.72, height * 0.18, 0, width * 0.72, height * 0.18, height * 0.42);
  glow.addColorStop(0, level.theme.includes("Haunted") ? "rgba(216,180,254,0.24)" : "rgba(255,244,214,0.36)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height * 0.7);

  ctx.fillStyle = level.theme.includes("Ice") ? "rgba(125,211,252,0.22)" : "rgba(21,83,45,0.2)";
  ctx.beginPath();
  ctx.moveTo(0, horizon + 42);
  for (let x = 0; x <= width; x += width / 8) {
    ctx.lineTo(x, horizon + 28 + Math.sin(x * 0.012) * 18);
  }
  ctx.lineTo(width, horizon + 80);
  ctx.lineTo(0, horizon + 80);
  ctx.closePath();
  ctx.fill();

  const layers = [
    { count: 18, base: horizon + 12, color: level.theme.includes("Ice") ? "#7dd3fc" : "#1f5d38", alpha: 0.28, scale: 0.9 },
    { count: 14, base: horizon + 34, color: level.theme.includes("Ice") ? "#0e7490" : "#164e2f", alpha: 0.36, scale: 1.18 },
  ];

  layers.forEach((layer, layerIndex) => {
    ctx.fillStyle = hexToRgba(layer.color, layer.alpha);
    for (let i = 0; i < layer.count; i += 1) {
      const x = ((i * 97 + layerIndex * 43) % (width + 160)) - 80;
      const trunkHeight = height * (0.09 + ((i * 19) % 23) / 300) * layer.scale;
      const crown = trunkHeight * 0.8;
      ctx.fillRect(x - 4, layer.base - trunkHeight * 0.3, 8, trunkHeight * 0.55);
      ctx.beginPath();
      ctx.moveTo(x, layer.base - trunkHeight);
      ctx.lineTo(x - crown * 0.45, layer.base);
      ctx.lineTo(x + crown * 0.45, layer.base);
      ctx.closePath();
      ctx.fill();
    }
  });
}

function drawFloatingLeaves(width, height, level, alpha) {
  const natural = level.theme.includes("Forest") || level.theme.includes("Haunted");
  if (!natural) return;

  const t = state.elapsed * 0.00008;
  for (let i = 0; i < 28; i += 1) {
    const drift = (t * (28 + i * 3) + i * 0.137) % 1;
    const x = ((i * 71) % width) + Math.sin(state.elapsed * 0.001 + i) * 18;
    const y = drift * height;
    const size = 3 + (i % 5);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(state.elapsed * 0.0015 + i);
    ctx.fillStyle = i % 3 === 0 ? `rgba(234,179,8,${alpha})` : `rgba(34,197,94,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.7, size, 0, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  }
}

function drawVignette(width, height) {
  const gradient = ctx.createRadialGradient(width / 2, height / 2, height * 0.18, width / 2, height / 2, height * 0.72);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawSprites(width, height) {
  const sprites = [
    ...state.nature,
    ...state.coins.filter((coin) => !coin.taken).map((coin) => ({ ...coin, type: "coin" })),
    ...state.powerups.filter((powerup) => !powerup.taken).map((powerup) => ({ ...powerup, type: "powerup" })),
    ...state.traps.map((trap) => ({ ...trap, type: "trap" })),
    { ...state.exit, type: "exit" },
  ];
  if (state.chaser) sprites.push({ ...state.chaser, type: "chaser" });

  sprites
    .map((sprite) => projectSprite(sprite, width, height))
    .filter(Boolean)
    .sort((a, b) => b.depth - a.depth)
    .forEach((sprite) => {
      ctx.save();
      ctx.globalAlpha = sprite.type === "trap" ? 0.85 : 1;
      ctx.fillStyle = spriteColor(sprite.type);
      if (sprite.type === "tree") {
        drawTreeSprite(sprite);
      } else if (sprite.type === "fern") {
        drawFernSprite(sprite);
      } else if (sprite.type === "exit") {
        ctx.fillRect(sprite.x - sprite.size * 0.35, sprite.y - sprite.size * 0.8, sprite.size * 0.7, sprite.size * 1.4);
      } else if (sprite.type === "trap") {
        const active = Math.sin(state.elapsed * 0.006 + sprite.phase) > 0.15;
        ctx.fillStyle = active ? "#ef4444" : "#7f1d1d";
        ctx.beginPath();
        ctx.moveTo(sprite.x, sprite.y - sprite.size * 0.5);
        ctx.lineTo(sprite.x + sprite.size * 0.42, sprite.y + sprite.size * 0.45);
        ctx.lineTo(sprite.x - sprite.size * 0.42, sprite.y + sprite.size * 0.45);
        ctx.closePath();
        ctx.fill();
      } else if (sprite.type === "powerup") {
        ctx.translate(sprite.x, sprite.y);
        ctx.rotate(Math.sin(state.elapsed * 0.006 + sprite.bob) * 0.22);
        ctx.fillRect(-sprite.size * 0.32, -sprite.size * 0.32, sprite.size * 0.64, sprite.size * 0.64);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(-sprite.size * 0.22, -sprite.size * 0.22, sprite.size * 0.44, sprite.size * 0.44);
      } else {
        ctx.beginPath();
        ctx.arc(sprite.x, sprite.y, sprite.size * 0.42, 0, TWO_PI);
        ctx.fill();
      }
      ctx.restore();
    });
}

function projectSprite(sprite, width, height) {
  const dx = sprite.x - state.player.x;
  const dy = sprite.y - state.player.y;
  const depth = Math.hypot(dx, dy);
  const angle = normalizeAngle(Math.atan2(dy, dx) - state.player.angle);
  if (Math.abs(angle) > FOV * 0.72 || depth < 0.1) return null;
  const ray = castRay(state.player.angle + angle);
  if (ray.dist < depth - 0.25) return null;
  const x = width / 2 + (angle / (FOV / 2)) * (width / 2);
  const scale = sprite.type === "tree" ? 0.95 : sprite.type === "fern" ? 0.36 : 0.42;
  const size = Math.min(height, height / depth) * scale;
  const bob = sprite.type === "coin" ? Math.sin(state.elapsed * 0.006 + sprite.bob) * 8 : 0;
  return { ...sprite, x, y: height / 2 + bob, size, depth };
}

function spriteColor(type) {
  if (type === "coin") return "#ffd166";
  if (type === "powerup") return "#38bdf8";
  if (type === "exit") return "#22c55e";
  if (type === "chaser") return "#c084fc";
  if (type === "tree") return "#14532d";
  if (type === "fern") return "#22c55e";
  return "#ef4444";
}

function drawPlayerCharacter(width, height) {
  if (state.mode !== "playing") return;

  const avatar = state.playerAvatar;
  const s = clamp(width * 0.14, 90, 150);
  const x = width * 0.5;
  const y = height - s * 0.64 + avatar.bob * s;
  const stride = avatar.stride || 0;
  const armSwing = avatar.moving ? Math.sin(stride) : 0;
  const legSwing = avatar.moving ? Math.sin(stride + Math.PI) : 0;

  ctx.save();
  ctx.globalAlpha = 0.96;

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(x, height - s * 0.1, s * 0.55, s * 0.12, 0, 0, TWO_PI);
  ctx.fill();

  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = Math.max(5, s * 0.055);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - s * 0.1, y + s * 0.16);
  ctx.lineTo(x - s * (0.22 + legSwing * 0.1), y + s * 0.58);
  ctx.moveTo(x + s * 0.1, y + s * 0.16);
  ctx.lineTo(x + s * (0.22 - legSwing * 0.1), y + s * 0.58);
  ctx.stroke();

  const jacket = ctx.createLinearGradient(x - s * 0.25, y - s * 0.42, x + s * 0.25, y + s * 0.2);
  jacket.addColorStop(0, "#60a5fa");
  jacket.addColorStop(0.48, "#2563eb");
  jacket.addColorStop(1, "#1e3a8a");
  ctx.fillStyle = jacket;
  roundedRect(x - s * 0.22, y - s * 0.42, s * 0.44, s * 0.62, s * 0.09);
  ctx.fill();

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = Math.max(4, s * 0.045);
  ctx.beginPath();
  ctx.moveTo(x - s * 0.19, y - s * 0.28);
  ctx.lineTo(x - s * (0.42 + armSwing * 0.09), y + s * 0.03);
  ctx.moveTo(x + s * 0.19, y - s * 0.28);
  ctx.lineTo(x + s * (0.42 - armSwing * 0.09), y + s * 0.03);
  ctx.stroke();

  ctx.fillStyle = "#f59e5b";
  ctx.beginPath();
  ctx.arc(x, y - s * 0.58, s * 0.18, 0, TWO_PI);
  ctx.fill();

  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.arc(x, y - s * 0.69, s * 0.18, Math.PI, TWO_PI);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(x - s * 0.08, y - s * 0.36, s * 0.035, s * 0.48);
  ctx.restore();
}

function drawTreeSprite(sprite) {
  const s = sprite.size;
  const sway = Math.sin(state.elapsed * 0.0016 + sprite.sway) * s * 0.025;
  const shade = clamp(1 - sprite.depth / MAX_DEPTH, 0.32, 0.95);

  ctx.fillStyle = `rgba(44, 28, 17, ${shade})`;
  roundedRect(sprite.x - s * 0.08 + sway * 0.25, sprite.y - s * 0.1, s * 0.16, s * 0.68, s * 0.04);
  ctx.fill();

  const colors = ["#166534", "#15803d", "#14532d"];
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = hexToRgba(colors[(sprite.variant + i) % colors.length], shade);
    ctx.beginPath();
    ctx.ellipse(
      sprite.x + sway + (i - 1.5) * s * 0.08,
      sprite.y - s * (0.36 + i * 0.09),
      s * (0.34 - i * 0.03),
      s * 0.2,
      0,
      0,
      TWO_PI
    );
    ctx.fill();
  }
}

function drawFernSprite(sprite) {
  const s = sprite.size;
  const shade = clamp(1 - sprite.depth / MAX_DEPTH, 0.35, 1);
  ctx.strokeStyle = hexToRgba("#22c55e", shade);
  ctx.lineWidth = Math.max(1, s * 0.05);
  ctx.lineCap = "round";
  for (let i = -2; i <= 2; i += 1) {
    const angle = -Math.PI / 2 + i * 0.35 + Math.sin(state.elapsed * 0.002 + sprite.sway) * 0.08;
    ctx.beginPath();
    ctx.moveTo(sprite.x, sprite.y + s * 0.22);
    ctx.lineTo(sprite.x + Math.cos(angle) * s * 0.55, sprite.y + Math.sin(angle) * s * 0.55);
    ctx.stroke();
  }
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= TWO_PI;
  while (angle < -Math.PI) angle += TWO_PI;
  return angle;
}

function drawMinimap(width) {
  const scale = 7;
  const pad = 14;
  const mapWidth = state.map[0].length * scale;
  const mapHeight = state.map.length * scale;
  const x0 = width - mapWidth - pad;
  const y0 = pad;
  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.fillRect(x0 - 5, y0 - 5, mapWidth + 10, mapHeight + 10);
  for (let y = 0; y < state.map.length; y += 1) {
    for (let x = 0; x < state.map[y].length; x += 1) {
      const cell = state.map[y][x];
      ctx.fillStyle = isBlocked(x + 0.5, y + 0.5) ? "#d7dde7" : "rgba(255,255,255,0.12)";
      if (cell === "E") ctx.fillStyle = "#22c55e";
      ctx.fillRect(x0 + x * scale, y0 + y * scale, scale - 1, scale - 1);
    }
  }
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(x0 + state.player.x * scale, y0 + state.player.y * scale, 3, 0, TWO_PI);
  ctx.fill();
}

function drawCrosshair(width, height) {
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 7, height / 2);
  ctx.lineTo(width / 2 + 7, height / 2);
  ctx.moveTo(width / 2, height / 2 - 7);
  ctx.lineTo(width / 2, height / 2 + 7);
  ctx.stroke();
}

function drawBackdrop(width, height) {
  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#31572c";
  for (let i = 0; i < 20; i += 1) {
    const x = ((i * 173) % width) - 60;
    const h = 80 + ((i * 47) % 180);
    ctx.fillRect(x, height - h, 80, h);
  }
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const value = parseInt(clean, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function hexToRgba(hex, alpha) {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

function lighten(hex, amount) {
  const rgb = hexToRgb(hex);
  return rgbToHex({
    r: Math.round(rgb.r + (255 - rgb.r) * amount),
    g: Math.round(rgb.g + (255 - rgb.g) * amount),
    b: Math.round(rgb.b + (255 - rgb.b) * amount),
  });
}

function darken(hex, amount) {
  const rgb = hexToRgb(hex);
  return rgbToHex({
    r: Math.round(rgb.r * (1 - amount)),
    g: Math.round(rgb.g * (1 - amount)),
    b: Math.round(rgb.b * (1 - amount)),
  });
}

function rgbToHex(rgb) {
  const parts = [rgb.r, rgb.g, rgb.b].map((part) => clamp(part, 0, 255).toString(16).padStart(2, "0"));
  return `#${parts.join("")}`;
}

function setPaused(paused) {
  if (paused && state.mode === "playing") {
    state.mode = "paused";
    pauseMenu.classList.remove("hidden");
    centerHint.classList.add("hidden");
    document.exitPointerLock?.();
  } else if (!paused && state.mode === "paused") {
    state.mode = "playing";
    pauseMenu.classList.add("hidden");
    centerHint.classList.remove("hidden");
    state.startTime = performance.now() - state.elapsed;
  }
}

function loop(now) {
  const dt = Math.min(0.05, (now - state.lastTime) / 1000 || 0);
  state.lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

window.addEventListener("resize", resize);
window.addEventListener("keydown", (event) => {
  if (event.code === "Escape") {
    if (state.mode === "playing") setPaused(true);
    return;
  }
  if (event.code === "KeyM" && !event.repeat) {
    state.showMinimap = !state.showMinimap;
    showStatus(state.showMinimap ? "Map enabled" : "Map hidden");
    return;
  }
  keys.add(event.code);
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement === canvas && state.mode === "playing") {
    state.player.angle += event.movementX * 0.0024;
  }
});
document.addEventListener("pointerlockchange", () => {
  pointer.locked = document.pointerLockElement === canvas;
  centerHint.classList.toggle("hidden", pointer.locked || state.mode !== "playing");
});
canvas.addEventListener("click", () => {
  if (state.mode === "playing") canvas.requestPointerLock?.();
});

document.getElementById("resumeGame").addEventListener("click", () => startLevel(0));
document.getElementById("continueGame").addEventListener("click", () => setPaused(false));
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
document.getElementById("resetSave").addEventListener("click", () => {
  resetProgress();
});

resize();
loadProgress().then(renderLevelGrid);
requestAnimationFrame(loop);
