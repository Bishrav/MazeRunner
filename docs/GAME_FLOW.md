# Game Flow

## Runtime Flow

1. The player opens the game from the Node server.
2. The frontend requests `/api/progress`.
3. The level select shows unlocked levels.
4. The player starts a level.
5. The game loop handles input, movement, collisions, collectibles, traps, enemy movement, rendering, and HUD updates.
6. The Three.js player model animation is driven by player movement input.
7. Reaching the exit calculates stars, score, rank, time, coins, and deaths.
8. The frontend posts completion data to `/api/progress`.
9. The backend saves progress to `backend/data/progress.json`.

## Frontend Systems

- Input: keyboard and mouse controls.
- Player: third-person warrior movement, camera follow, and run/walk/idle animation switching.
- World: Three.js meshes, shadows, fog, generated grass, trees, flowers, rocks, log fences, ruin barricades, coins, relics, and mechanical sweepers.
- Level logic: coins, relics, mechanical sweepers, log/fence collision, stamina, scoring, and unlocks.
- UX: level select, HUD, stamina, feedback messages, pause, completion summary.

## Backend Systems

- Static file server for the game.
- `GET /api/progress` returns unlocked level and completion history.
- `POST /api/progress` saves unlocked level and run completion data.
- `POST /api/reset` resets progress.
- If the backend is unavailable, the frontend falls back to `localStorage`.

## Asset Flow

1. Load Three.js modules from the import map.
2. Try loading `assets/warrior/warrior.glb`, `Warrior.glb`, or `character.glb` through `GLTFLoader`.
3. If local GLB loading fails, try the official Three.js `Soldier.glb`.
4. If GLTF loading fails, try local warrior FBX files and then the official FBX example character through `FBXLoader`.
5. If remote model loading fails, create a procedural cartoon warrior locally.
6. Use animation clips when present; otherwise animate fallback limbs manually.

## Hazard Flow

1. `T` cells spawn large mechanical sweepers inspired by the Three.js Collada kinematics example.
2. Each sweeper has a base, pivot, counterweight, and animated arm.
3. Collision is tested against the moving arm path, not just the center marker.
4. Contact resets the player to the checkpoint and increments deaths.

## Progression Loop

```text
Select Level -> Explore -> Collect -> Avoid Hazards -> Reach Exit
-> Score + Rank -> Unlock Next Level -> Save Progress -> Return / Continue
```

## Gamification

- Star rating rewards speed, full coin collection, and no-death runs.
- Score combines stars, coins, relics, time bonus, and death penalty.
- Rank communicates run quality immediately.
- Unlocking levels gives a clear long-term target.
