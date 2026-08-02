# MazeRunner 🏃

> Browser-based maze runner game with an animated warrior character and Node.js backend

[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)

## Overview

A browser-based maze runner game featuring an animated warrior character, custom game logic, a Node.js backend server, and unit tests for core game mechanics.

## Features

- 🗺️ Procedurally structured maze gameplay
- ⚔️ Animated warrior character with sprite assets
- 🖥️ Node.js backend server
- ✅ Unit tests for game logic (`tests/logic-check.mjs`)
- 📄 Documented game flow (`docs/GAME_FLOW.md`)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Game Engine | Vanilla JavaScript, HTML5 Canvas |
| Frontend | HTML, CSS |
| Backend | Node.js, Express |
| Testing | Node.js test runner |

## Project Structure

```
├── index.html         # Game entry point
├── game.js            # Core game logic
├── src/main.js        # Game initialisation
├── styles.css         # Game styles
├── backend/server.js  # Node.js backend
├── assets/warrior/    # Warrior sprite assets
├── tests/             # Game logic unit tests
└── docs/GAME_FLOW.md  # Game flow documentation
```

## Getting Started

```bash
npm install
npm start
# Open http://localhost:3000
```
