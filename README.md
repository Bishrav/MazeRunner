# The Maze Runner

A Three.js browser prototype of a 3D maze adventure game.

## Features

- Real Three.js perspective rendering
- Three unlockable forest/adventure levels
- Distinct maze themes
- Coin collection
- Ancient relic collection
- Mechanical sweeper hazards inspired by the Three.js Collada kinematics example
- Moving walls and timed gates
- Chase level with a pursuing enemy
- Speed charm pickups
- Sprint stamina
- Minimap toggle
- Procedural wall, sky, and floor texture detail
- Animated 3D warrior-style player model that runs only when the player moves
- Real 3D grass, trees, flowers, rocks, clouds, fireflies, log fences, ruin barricades, mechanical obstacles, shadows, and fog
- Level select, pause menu, completion summary, deaths, timer, and star rating
- Score, rank, star rewards, and unlock progression
- Backend progress persistence with `localStorage` fallback

## Controls

- `W / A / S / D` - Move
- Mouse - Look around after clicking the game
- `Q / E` or arrow keys - Turn without mouse capture
- `Shift` - Sprint
- `M` - Toggle minimap
- `Esc` - Pause

## Run

Use the Node backend for the complete version with progress persistence:

```powershell
npm start
```

Then open:

```text
http://localhost:8001
```

The static fallback still works without the backend:

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Files

- `index.html` - Game shell and UI
- `styles.css` - HUD, menus, and responsive layout
- `src/main.js` - Three.js renderer, gameplay loop, model loading, levels, collision, traps, coins, and save state
- `game.js` - Legacy canvas prototype kept for reference
- `backend/server.js` - Static server and progress API
- `docs/GAME_FLOW.md` - Runtime, backend, and progression flow
- `assets/warrior/` - Drop-in folder for your local warrior character model

## Technical Structure

```text
MazeRunner/
|
|-- index.html
|   |-- Three.js canvas surface
|   |-- HUD
|   |-- Level select
|   |-- Pause and completion screens
|
|-- styles.css
|   |-- Responsive menus
|   |-- HUD, stamina, and feedback states
|   |-- Level cards and control hints
|
|-- src/
|   |-- main.js
|       |-- Three.js scene, camera, renderer, lights, shadows, fog
|       |-- GLTF/FBX model loading
|       |-- Warrior/player animation switching
|       |-- Grass, tree, terrain, log/fence, ruin, coin, relic, mechanical sweeper, and exit generation
|       |-- Movement, collision, camera follow, scoring, and API persistence
|
|-- game.js
|   |-- Legacy canvas prototype
|
|-- backend/
|   |-- server.js
|   |   |-- Static file hosting
|   |   |-- Progress API
|   |   |-- Completion history persistence
|   |
|   |-- data/
|       |-- progress.json  (created automatically)
|
|-- docs/
|   |-- GAME_FLOW.md
|
|-- assets/
|   |-- warrior/
|       |-- warrior.glb / warrior.fbx can be placed here
|
|-- package.json
|   |-- npm scripts
|
|-- README.md
    |-- Project overview, controls, run instructions, and architecture
```

## Level Mechanics

- `#` - Solid wall
- `S` - Player spawn
- `E` - Exit gate
- `C` - Coin
- `R` - Ancient relic
- `T` - Mechanical sweeper hazard
- `M` - Moving wall
- `G` - Timed gate
- `F` - Hidden passage
- `P` - Speed charm

## Visual Systems

- The main game uses Three.js with real perspective camera, shadows, fog, and 3D meshes.
- The player model first checks `assets/warrior/` for a local warrior `.glb` or `.fbx`.
- If no local warrior is available, it tries the official Three.js `Soldier.glb` animated character.
- If unavailable, it tries the official FBX loader example Mixamo model.
- If remote assets fail, a procedural cartoon warrior fallback is generated locally.
- Character movement and leg animation are controlled by `W/A/S/D`; the character does not auto-run.
- Forest levels use instanced grass, generated trees, flowers, rocks, clouds, fireflies, log fences, ruin barricades, lighting, and atmospheric fog.
- Hazard cells are large mechanical sweepers with moving arm collision, not small triangle markers.
- Completion screens show rank and score to make runs more rewarding.

## External Three.js References

- FBX loader pattern: `https://threejs.org/examples/#webgl_loader_fbx`
- GLTF/AVIF inspiration: `https://threejs.org/examples/#webgl_loader_gltf_avif`
- Performance inspiration: `https://threejs.org/examples/#webgl_performance`

## UX Notes

- The first screen is the playable level select, not a marketing page.
- Locked levels communicate progression clearly.
- HUD information is limited to level, theme, coins, timer, deaths, objective, stamina, and short feedback.
- The minimap can be hidden with `M` for a more immersive run.
- Level completion summarizes time, coins, deaths, and star rating.
