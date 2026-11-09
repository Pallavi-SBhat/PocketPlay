# 🕹️ GameStack Arcade - Offline Game Store

**GameStack Arcade** is an offline gaming station and store web application built with **React 19, JavaScript (ES6+ / JSX), Tailwind CSS, and Web Audio API**. It lets you play arcade classics offline without requiring any internet connection.

---

## 🌟 Key Features

### 1. 🔐 Offline Player Accounts & Profiles
- **User Registration**: Create an account with a custom username, email/tag, and gamer avatar (🎮, 👾, 🚀, 🦊, ⚡, 🤖, etc.).
- **User Login**: Switch between locally registered accounts on your computer with a single click.
- **Guest Mode**: Play immediately without creating an account.
- **Local Persistence**: User profiles, high scores, personal stats, and game favorites are stored directly in `localStorage`.

### 2. 🐦 Flappy Bird Neon
- **Retro Arcade Experience**: Smooth 60fps canvas physics with gravity, flap impulses, and terminal velocity.
- **Parallax Background**: Atmospheric scrolling indigo sky, twinkling stars, and silhouette city skyline.
- **Dynamic Obstacles**: Scrolling neon pipes with accurate bounding-box collision detection.
- **Medal Milestones**: Unlock Bronze, Silver, Gold, and Platinum medals as your score climbs!
- **Celebration & Effects**: Feather/dust particle effects, crash bursts, and victory confetti on beating high scores.
- **Keyboard & Touch Controls**: Use `Space`, `Up Arrow`, or tap/click anywhere to jump; press `P` to pause, `R` to restart.

### 3. ❌⭕ XOX Neon Tactics (Tic-Tac-Toe)
- **Single Player vs Smart Bot**:
  - **Easy**: Casual random bot for relaxed play.
  - **Medium**: Smart bot that looks for immediate win lines and blocks your moves.
  - **Hard (Unbeatable Minimax)**: Uses classic Minimax game-tree search for the ultimate strategic challenge.
- **2-Player Local Pass & Play**: Challenge a friend or sibling on the same screen with turn indicators.
- **Win Streaks & Records**: Tracks consecutive win streaks, ties, and records your personal best streak.
- **Animated Winning Lines**: Visual neon lines highlight the winning 3-in-a-row combination with victory sound and confetti.

### 4. 🎲 Snake & Ladder Arcade (Multiplayer 2-4 Players)
- **Multiplayer Pass & Play**: Supports 2, 3, or 4 players on the same device.
- **Custom Player Profiles & Bots**: Select unique avatars (🦁, 🦊, 🚀, 🤖, etc.), custom names, and toggle any player between Human or Computer Bot.
- **Classic 100-Tile Serpentine Board**: Visual SVG overlay dynamically rendering dual-rail Ladders and glowing curvy Snakes.
- **3D Animated Interactive Dice**: Rattling dice roll animation with synthesized rolling and hopping audio.
- **Special Mechanics**: Roll a 6 for an extra turn, bounce-back rule when exceeding 100, and live event ticker log.
- **Victory Podium & Confetti**: Celebrates the match champion with sound effects and confetti!

### 5. 🔠 Word Finder 1000 (1,000 Levels Word Search)
- **1,000 Procedural Levels**: 100% offline procedural level generator across 12 distinct themes (Space, Cyber, Wildlife, Fantasy, Oceans, Crystals, Arcade, etc.).
- **Progressive Difficulty**: 5 difficulty tiers ranging from Apprentice (6×6 grid, 4 words) to Grandmaster (10×10 grid, 8 words with diagonal and reverse directions).
- **Smooth Touch & Mouse Controls**: Drag/swipe straight lines across the grid or use quick click-start then click-end letter selection.
- **Level Selector & Chapter Navigator**: Browse all 1,000 levels organized across 10 chapters, track star ratings (up to 3,000 stars!), and jump to any unlocked level.
- **Hint System & Bonus Tokens**: Reveals starting letter positions of unfound words, with bonus hints earned every 3 levels.

### 6. 🐍 Retro Neon Snake
- **Smooth 60fps Canvas Graphics**: Fluid snake slithering with rounded neon segments, animated eyes that track movement direction, and eat particle bursts.
- **Regular & Golden Bonus Food**: Munch on regular glowing apples (+10 pts) and catch rare timed Golden Stars (+50 pts) for big score surges!
- **3 Difficulty Speeds**: Casual (relaxed), Normal (classic arcade), and Hardcore (fast reflex test).
- **Deadly vs Portal Wrap Modes**: Choose between traditional fatal boundary collisions or smooth portal wrap-around screen edges.
- **Keyboard & Touch Controls**: Play with Arrow keys / WASD on desktop, or the on-screen responsive D-Pad on mobile and touch devices.

### 7. 🔊 Built-in Web Audio Synthesizer
- Generates all retro jumps, flap swooshes, coin dings, mark clicks, game over crashes, and victory fanfares directly via the browser's **Web Audio API**.
- **No external MP3/WAV files required** — eliminates broken audio issues when offline!
- Includes a global mute/unmute toggle.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)

### Installation & Launch

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the local arcade server**:
   ```bash
   npm run dev
   ```
   Open your browser to [http://localhost:3000](http://localhost:3000).

3. **Build production files**:
   ```bash
   npm run build
   ```

---

## 🛠️ How to Add More Games (Plug & Play)

The app is architected with a modular game registry so you can easily drop in new games over the next few days:

### Step 1: Create your game component
Create a new file in `src/games/<your-game>/<YourGame>.jsx`:
```jsx
import React from 'react';

export const YourGame = ({ onGameOver, onBack }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <button onClick={onBack}>Back to Store</button>
      <h2>Your Game Logic Here</h2>
    </div>
  );
};
```

### Step 2: Register it in `src/games/registry.js`
Add your game to the `GAMES_LIST` array:
```js
import { YourGame } from './your-game/YourGame';

export const GAMES_LIST = [
  // ... existing games
  {
    id: 'your-game',
    title: 'Your Game Title',
    tagline: 'Catchy one-liner',
    description: 'Detailed description of gameplay...',
    category: 'Arcade',
    tags: ['Retro', 'Offline'],
    thumbnail: 'https://...',
    accentColor: '#10b981',
    instructions: ['Rule 1', 'Rule 2'],
    controls: [{ key: 'Arrow Keys', action: 'Move' }],
    component: YourGame
  }
];
```

---

## 📁 Project Architecture

```
GameStack/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── src/
│   ├── main.jsx                # React entry point
│   ├── App.jsx                 # Arcade store catalog, navigation & state
│   ├── index.css               # Arcade styling, neon glows, retro font
│   ├── types/
│   │   └── index.js            # Category constants & metadata
│   ├── services/
│   │   ├── storage.js          # Offline local storage (Accounts, High scores, Favorites)
│   │   └── sound.js            # Web Audio API retro sound synthesizer
│   ├── components/
│   │   ├── Navbar.jsx          # Brand, sound toggle, offline indicator, profile
│   │   ├── AuthModal.jsx       # Player login, registration, and avatar selector
│   │   ├── ProfileModal.jsx    # Player stats, records, and avatar customization
│   │   ├── GameCard.jsx        # Store game card with preview, badge, high scores
│   │   ├── GameDetailModal.jsx # How to play, controls, offline leaderboard
│   │   └── AddGameGuideModal.jsx # Interactive guide for adding future games
│   └── games/
│       ├── registry.js         # Central game registry for modular expansion
│       ├── flappy-bird/
│       │   └── FlappyBirdGame.jsx # Canvas Flappy Bird with physics & sound
│       ├── xox/
│       │   └── XoxGame.jsx        # Tic-Tac-Toe with Bot AI & 2-Player mode
│       ├── snake-and-ladder/
│       │   └── SnakeAndLadderGame.jsx # Multiplayer 100-tile board game
│       ├── word-finder/
│       │   ├── wordData.js        # 1000-level procedural generator
│       │   └── WordFinderGame.jsx # Word Search with 1000 levels & hints
│       └── snake/
│           └── SnakeGame.jsx      # Canvas Retro Neon Snake game
```

