import { FlappyBirdGame } from './flappy-bird/FlappyBirdGame';
import { XoxGame } from './xox/XoxGame';
import { SnakeAndLadderGame } from './snake-and-ladder/SnakeAndLadderGame';
import { WordFinderGame } from './word-finder/WordFinderGame';
import { SnakeGame } from './snake/SnakeGame';
import { Game2048 } from './game-2048/Game2048';

export const GAMES_LIST = [
  {
    id: 'flappy-bird',
    title: 'Flappy Bird Neon',
    tagline: 'Tap to flap and soar through the neon pipes!',
    description: 'The legendary arcade phenomenon rebuilt with smooth physics, parallax night skyline, dynamic difficulty, audio synthesizer, and high score medals. Test your reflexes and set the offline record!',
    category: 'Arcade',
    tags: ['Retro', 'Reflex', 'Endless', 'Offline'],
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    badge: 'Popular',
    accentColor: '#eab308',
    instructions: [
      'Tap or press Spacebar / Up Arrow to make the bird flap upwards.',
      'Gravity continuously pulls the bird downwards.',
      'Navigate safely through the gaps between top and bottom pipes.',
      'Each cleared pipe scores 1 point. Collect Bronze, Silver, Gold, or Platinum medals!'
    ],
    controls: [
      { key: 'Space / Up Arrow / Click', action: 'Flap wings & rise' },
      { key: 'P', action: 'Pause / Resume game' },
      { key: 'R', action: 'Restart immediately' }
    ],
    component: FlappyBirdGame
  },
  {
    id: 'xox',
    title: 'XOX Neon Tactics',
    tagline: 'Classic Tic-Tac-Toe with smart Bot AI & 2-Player Pass mode',
    description: 'Challenge your brain in this sleek neon rendition of Tic-Tac-Toe. Choose between casual play or the unbeatable Minimax master AI, or play with a friend locally on the same screen.',
    category: 'Strategy',
    tags: ['Puzzle', '2-Player', 'AI Bot', 'Classic'],
    thumbnail: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=600&q=80',
    badge: 'AI Powered',
    accentColor: '#06b6d4',
    instructions: [
      'Take turns placing X and O on the 3x3 grid.',
      'First player to connect 3 marks horizontally, vertically, or diagonally wins!',
      'Choose between 3 Bot AI difficulties or Pass & Play with a friend.',
      'Build up your consecutive win streak and claim the title.'
    ],
    controls: [
      { key: 'Mouse Click / Tap', action: 'Place your mark on the board' }
    ],
    component: XoxGame
  },
  {
    id: 'snake-ladder',
    title: 'Snake & Ladder Arcade',
    tagline: 'Multiplayer 100-tile race with 3D dice, animated snakes & ladders',
    description: 'Race to square 100 in this thrilling multiplayer classic! Supports 2 to 4 players on the same screen with customizable avatars and optional Computer Bots. Beware of slippery snakes, climb towering ladders, and roll a 6 for bonus turns!',
    category: 'Classic',
    tags: ['Multiplayer', '2-4 Players', 'Board Game', 'Bots'],
    thumbnail: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80',
    badge: 'Multiplayer',
    accentColor: '#10b981',
    instructions: [
      'Choose 2, 3, or 4 players with custom tokens, names, or Computer Bots.',
      'Take turns rolling the animated 3D dice to advance across the 100 tiles.',
      'Landing on the bottom of a ladder rushes you upwards to safety!',
      'Landing on a snake head slides your token all the way down its tail.',
      'Roll a 6 to earn an immediate extra turn! First player to tile 100 wins.'
    ],
    controls: [
      { key: 'Roll Dice Button / Click', action: 'Roll the 3D dice on your turn' }
    ],
    component: SnakeAndLadderGame
  },
  {
    id: 'word-finder',
    title: 'Word Finder 1000',
    tagline: 'Search & uncover hidden words across 1,000 procedural levels!',
    description: 'The ultimate offline word search challenge! Journey through 1,000 distinct handcrafted and procedurally generated levels across 12 vibrant themes (Space, Cyber, Wildlife, Magic, Food, Ocean, and more). Drag across letters, uncover secret vocabulary, collect up to 3,000 stars, and use hints when stuck!',
    category: 'Puzzle',
    tags: ['1000 Levels', 'Word Search', 'Brain', 'Offline'],
    thumbnail: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&w=600&q=80',
    badge: '1000 Levels',
    accentColor: '#8b5cf6',
    instructions: [
      'Look at the list of hidden target words at the side.',
      'Drag across letters in the grid (Horizontal, Vertical, or Diagonal) to highlight words.',
      'Or click the first letter and then click the last letter to select a line.',
      'Find all hidden words to clear the level and unlock the next challenge.',
      'Collect up to 3 stars per level and earn free hint tokens every 3 levels!'
    ],
    controls: [
      { key: 'Mouse Drag / Touch Swipe', action: 'Select a line of letters' },
      { key: 'Click Start then Click End', action: 'Quick click-to-select mode' },
      { key: 'Hint Button (💡)', action: 'Reveal starting square of an unfound word' }
    ],
    component: WordFinderGame
  },
  {
    id: 'retro-snake',
    title: 'Retro Neon Snake',
    tagline: 'Classic arcade snake with juicy neon graphics, golden food & portal wraps!',
    description: 'The definitive offline arcade snake experience! Slither through a sleek neon cyber grid, munch on delicious glowing apples, grab golden bonus stars, and test your speed across 3 difficulty tiers. Switch between classic deadly borders or portal wrap-around mode!',
    category: 'Arcade',
    tags: ['Retro', 'Snake', 'Classic', 'Reflex'],
    thumbnail: 'https://images.unsplash.com/photo-1628277613967-6abca504d0ac?auto=format&fit=crop&w=600&q=80',
    badge: 'Arcade Classic',
    accentColor: '#10b981',
    instructions: [
      'Use Arrow keys or WASD (or on-screen touch buttons) to direct your snake.',
      'Eat red glowing apples to grow longer and score +10 points.',
      'Catch rare Golden Stars before the timer expires for a massive +50 point bonus!',
      'Avoid running into your own tail or crashing into borders (in Deadly Walls mode).',
      'Toggle Portal mode to smoothly wrap around from one side of the screen to the other!'
    ],
    controls: [
      { key: 'Arrow Keys / WASD', action: 'Steer snake direction' },
      { key: 'Space / P', action: 'Pause / Resume game' },
      { key: 'R', action: 'Quick restart' }
    ],
    component: SnakeGame
  },
  {
    id: 'game-2048',
    title: '2048 Neon Pulse',
    tagline: 'Slide, combine numbers, and forge the legendary 2048 tile!',
    description: 'The addictive sliding tile math puzzle transformed with vibrant glowing neon colors, rich synthesized chimes, and smooth responsive controls. Plan moves, slide numbers, trigger merges, utilize 1-step undo, and chase the ultimate 2048 and 4096 trophies offline!',
    category: 'Puzzle',
    tags: ['2048', 'Puzzle', 'Math', 'Offline', 'Brain'],
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
    badge: 'Popular Puzzle',
    accentColor: '#f59e0b',
    instructions: [
      'Use Arrow keys, WASD, touch swipe, or the on-screen D-Pad to slide all tiles in one direction.',
      'When two tiles with the same number collide during a slide, they merge into one with double value!',
      'Each merge scores points matching the value of the newly created tile.',
      'Keep matching until you create the glorious 2048 tile (or keep going for 4096+)!',
      'If the 4x4 grid fills up with no available adjacent merges, the game is over.',
      'Made a misstep? Click the Undo (U) button to reverse your last move.'
    ],
    controls: [
      { key: 'Arrow Keys / WASD / Swipe', action: 'Slide tiles Up, Down, Left, or Right' },
      { key: 'U / Z', action: 'Undo last move (1 step)' },
      { key: 'R', action: 'Restart new game' }
    ],
    component: Game2048
  }
];

export function getGameById(id) {
  return GAMES_LIST.find(game => game.id === id);
}

