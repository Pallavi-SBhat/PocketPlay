import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, RotateCcw, Volume2, VolumeX, Trophy, Pause, Play, 
  HelpCircle, Sparkles, Award, Flame, Zap, ArrowDown, ArrowUp,
  ArrowLeft as ArrowL, ArrowRight as ArrowR, RefreshCw
} from 'lucide-react';
import { sounds } from '../../services/sound';
import { storage } from '../../services/storage';

// Grid Dimensions
const COLS = 10;
const ROWS = 20;

// Tetromino Definitions
const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.4)',
    border: '#67e8f9'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.4)',
    border: '#93c5fd'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#f97316',
    glow: 'rgba(249, 115, 22, 0.4)',
    border: '#fdba74'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#eab308',
    glow: 'rgba(234, 179, 8, 0.4)',
    border: '#fde047'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
    border: '#6ee7b7'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.4)',
    border: '#d8b4fe'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.4)',
    border: '#fca5a5'
  }
};

const PIECE_KEYS = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

// Helper to generate a shuffled 7-bag
const create7Bag = () => {
  const bag = [...PIECE_KEYS];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
};

// Create empty 10x20 board
const createEmptyGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

// Rotate NxN matrix clockwise
const rotateMatrix = (matrix) => {
  return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
};

export const CyberBlocksGame = ({ onGameOver, onBack }) => {
  const canvasRef = useRef(null);

  // React Display States
  const [gameState, setGameState] = useState('ready'); // ready, playing, paused, game_over
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [highScore, setHighScore] = useState(() => storage.getHighScore('cyber-blocks'));
  const [holdPiece, setHoldPiece] = useState(null);
  const [nextPieces, setNextPieces] = useState([]);
  const [isMuted, setIsMuted] = useState(() => sounds.getMuted());
  const [showHelp, setShowHelp] = useState(false);
  const [lastActionText, setLastActionText] = useState('');

  // Mutable Game Loop State
  const stateRef = useRef({
    gameState: 'ready',
    grid: createEmptyGrid(),
    score: 0,
    level: 1,
    lines: 0,
    bag: create7Bag(),
    currentPiece: null,
    holdPiece: null,
    canHold: true,
    nextQueue: [],
    lastDropTime: 0,
    dropInterval: 800,
    particles: [],
    clearingRows: [],
    clearAnimationTimer: 0
  });

  const toggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Pull next piece from 7-bag queue
  const getNextPieceFromBag = () => {
    const s = stateRef.current;
    if (s.bag.length === 0) {
      s.bag = create7Bag();
    }
    const type = s.bag.pop();
    const data = TETROMINOES[type];
    return {
      type,
      shape: data.shape.map(r => [...r]),
      color: data.color,
      glow: data.glow,
      border: data.border,
      x: Math.floor((COLS - data.shape[0].length) / 2),
      y: 0
    };
  };

  // Check collision between a piece and the board
  const checkCollision = (piece, grid, offsetX = 0, offsetY = 0, customShape = null) => {
    const shape = customShape || piece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const newX = piece.x + c + offsetX;
          const newY = piece.y + r + offsetY;

          // Out of bounds horizontally or bottom
          if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return true;
          }
          // Board already occupied
          if (newY >= 0 && grid[newY][newX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Compute Ghost Piece Y position
  const getGhostY = (piece, grid) => {
    let ghostY = piece.y;
    while (!checkCollision(piece, grid, 0, ghostY - piece.y + 1)) {
      ghostY++;
    }
    return ghostY;
  };

  // Spawn shrapnel particles
  const spawnParticles = (x, y, color, count = 12) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1;
      s.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 2,
        color,
        alpha: 1
      });
    }
  };

  // Spawn new piece or trigger Game Over
  const spawnNextPiece = useCallback(() => {
    const s = stateRef.current;
    // Top up next queue
    while (s.nextQueue.length < 3) {
      s.nextQueue.push(getNextPieceFromBag());
    }

    const next = s.nextQueue.shift();
    s.nextQueue.push(getNextPieceFromBag());
    setNextPieces(s.nextQueue.map(p => p.type));

    // Check if new piece collides immediately -> Game Over
    if (checkCollision(next, s.grid, 0, 0)) {
      s.gameState = 'game_over';
      setGameState('game_over');
      sounds.playLifeLost();
      storage.recordScore('cyber-blocks', s.score, { level: s.level, lines: s.lines });
      if (onGameOver) onGameOver(s.score);
      return;
    }

    s.currentPiece = next;
    s.canHold = true;
  }, [onGameOver]);

  // Lock current piece into the board and check lines
  const lockPiece = useCallback(() => {
    const s = stateRef.current;
    const piece = s.currentPiece;
    if (!piece) return;

    sounds.playBlockDrop();

    // Lock blocks into grid
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c] !== 0) {
          const gx = piece.x + c;
          const gy = piece.y + r;
          if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
            s.grid[gy][gx] = {
              color: piece.color,
              glow: piece.glow,
              border: piece.border
            };
          }
        }
      }
    }

    // Check full lines
    const fullRows = [];
    for (let r = 0; r < ROWS; r++) {
      if (s.grid[r].every(cell => cell !== 0)) {
        fullRows.push(r);
      }
    }

    if (fullRows.length > 0) {
      s.clearingRows = fullRows;
      s.clearAnimationTimer = 12; // 12 frames flash animation

      // Score calculation
      const lineCount = fullRows.length;
      let linePoints = 0;
      let label = '';

      if (lineCount === 1) {
        linePoints = 100 * s.level;
        label = 'SINGLE +100';
        sounds.playLineClear(1);
      } else if (lineCount === 2) {
        linePoints = 300 * s.level;
        label = 'DOUBLE +300!';
        sounds.playLineClear(2);
      } else if (lineCount === 3) {
        linePoints = 500 * s.level;
        label = 'TRIPLE +500!!';
        sounds.playLineClear(3);
      } else if (lineCount >= 4) {
        linePoints = 800 * s.level;
        label = 'TETRIS +800!!! 🔥';
        sounds.playTetrisFanfare();
        confetti({ particleCount: 100, spread: 70 });
      }

      s.score += linePoints;
      s.lines += lineCount;
      s.level = Math.floor(s.lines / 10) + 1;
      s.dropInterval = Math.max(90, 800 - (s.level - 1) * 65);

      setScore(s.score);
      setLines(s.lines);
      setLevel(s.level);
      setLastActionText(label);
      setTimeout(() => setLastActionText(''), 1500);

      // Spawn particles along cleared lines
      fullRows.forEach(r => {
        for (let c = 0; c < COLS; c++) {
          spawnParticles(c * 24 + 12, r * 24 + 12, '#ffffff', 3);
        }
      });

      // High Score update
      if (s.score > storage.getHighScore('cyber-blocks')) {
        setHighScore(s.score);
        storage.recordScore('cyber-blocks', s.score, { level: s.level, lines: s.lines });
      }
    } else {
      spawnNextPiece();
    }
  }, [spawnNextPiece]);

  // Movement & Rotation Controls
  const moveHorizontal = useCallback((dir) => {
    const s = stateRef.current;
    if (s.gameState !== 'playing' || !s.currentPiece) return;
    if (!checkCollision(s.currentPiece, s.grid, dir, 0)) {
      s.currentPiece.x += dir;
      sounds.playBlockMove();
    }
  }, []);

  const rotatePiece = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState !== 'playing' || !s.currentPiece) return;

    const rotatedShape = rotateMatrix(s.currentPiece.shape);
    // Wall kick offsets to test: 0, -1, +1, -2, +2
    const kicks = [0, -1, 1, -2, 2];
    for (let kick of kicks) {
      if (!checkCollision(s.currentPiece, s.grid, kick, 0, rotatedShape)) {
        s.currentPiece.shape = rotatedShape;
        s.currentPiece.x += kick;
        sounds.playBlockRotate();
        return;
      }
    }
  }, []);

  const softDrop = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState !== 'playing' || !s.currentPiece) return;
    if (!checkCollision(s.currentPiece, s.grid, 0, 1)) {
      s.currentPiece.y += 1;
      s.score += 1;
      setScore(s.score);
      sounds.playBlockMove();
    } else {
      lockPiece();
    }
  }, [lockPiece]);

  const hardDrop = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState !== 'playing' || !s.currentPiece) return;
    const ghostY = getGhostY(s.currentPiece, s.grid);
    const dropDistance = ghostY - s.currentPiece.y;
    s.currentPiece.y = ghostY;
    s.score += dropDistance * 2;
    setScore(s.score);
    lockPiece();
  }, [lockPiece]);

  const handleHold = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState !== 'playing' || !s.currentPiece || !s.canHold) return;

    sounds.playBlockRotate();
    const currentType = s.currentPiece.type;

    if (!s.holdPiece) {
      s.holdPiece = currentType;
      setHoldPiece(currentType);
      spawnNextPiece();
    } else {
      const temp = s.holdPiece;
      s.holdPiece = currentType;
      setHoldPiece(currentType);

      const data = TETROMINOES[temp];
      s.currentPiece = {
        type: temp,
        shape: data.shape.map(r => [...r]),
        color: data.color,
        glow: data.glow,
        border: data.border,
        x: Math.floor((COLS - data.shape[0].length) / 2),
        y: 0
      };
    }
    s.canHold = false;
  }, [spawnNextPiece]);

  // Start / Pause / Restart
  const startGame = () => {
    sounds.playClick();
    const s = stateRef.current;
    s.gameState = 'playing';
    setGameState('playing');
  };

  const pauseGame = () => {
    sounds.playClick();
    const s = stateRef.current;
    if (s.gameState === 'playing') {
      s.gameState = 'paused';
      setGameState('paused');
    } else if (s.gameState === 'paused') {
      s.gameState = 'playing';
      setGameState('playing');
    }
  };

  const restartGame = () => {
    sounds.playClick();
    const s = stateRef.current;
    s.grid = createEmptyGrid();
    s.score = 0;
    s.level = 1;
    s.lines = 0;
    s.bag = create7Bag();
    s.holdPiece = null;
    s.canHold = true;
    s.nextQueue = [];
    s.dropInterval = 800;
    s.particles = [];
    s.clearingRows = [];
    s.clearAnimationTimer = 0;

    setScore(0);
    setLevel(1);
    setLines(0);
    setHoldPiece(null);
    setGameState('ready');

    spawnNextPiece();
  };

  // Initialize Game on Mount
  useEffect(() => {
    const s = stateRef.current;
    s.grid = createEmptyGrid();
    s.nextQueue = [getNextPieceFromBag(), getNextPieceFromBag(), getNextPieceFromBag()];
    setNextPieces(s.nextQueue.map(p => p.type));
    s.currentPiece = getNextPieceFromBag();
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        moveHorizontal(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        moveHorizontal(1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        rotatePiece();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        softDrop();
      } else if (e.key === ' ') {
        if (stateRef.current.gameState === 'ready') startGame();
        else hardDrop();
      } else if (e.key === 'c' || e.key === 'C' || e.key === 'Shift') {
        handleHold();
      } else if (e.key === 'p' || e.key === 'P') {
        pauseGame();
      } else if (e.key === 'r' || e.key === 'R') {
        restartGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveHorizontal, rotatePiece, softDrop, hardDrop, handleHold]);

  // Main 60fps Loop
  useEffect(() => {
    let animId;
    let lastTick = performance.now();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateAndRender = (now) => {
      const dt = now - lastTick;
      lastTick = now;
      const s = stateRef.current;

      // --- LOGIC UPDATE ---
      if (s.gameState === 'playing') {
        // Line clear animation handling
        if (s.clearAnimationTimer > 0) {
          s.clearAnimationTimer -= 1;
          if (s.clearAnimationTimer === 0) {
            // Remove rows and collapse
            s.clearingRows.forEach(rowIdx => {
              s.grid.splice(rowIdx, 1);
              s.grid.unshift(Array(COLS).fill(0));
            });
            s.clearingRows = [];
            spawnNextPiece();
          }
        } else {
          // Standard Gravity Drop
          s.lastDropTime += dt;
          if (s.lastDropTime >= s.dropInterval) {
            s.lastDropTime = 0;
            if (s.currentPiece) {
              if (!checkCollision(s.currentPiece, s.grid, 0, 1)) {
                s.currentPiece.y += 1;
              } else {
                lockPiece();
              }
            }
          }
        }
      }

      // Particles update
      s.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;
      });
      s.particles = s.particles.filter(p => p.alpha > 0);

      // --- RENDERING ---
      const blockSize = 24; // 240px wide x 480px high
      ctx.clearRect(0, 0, COLS * blockSize, ROWS * blockSize);

      // Dark cyber background
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, COLS * blockSize, ROWS * blockSize);

      // Grid line guidelines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 0.5;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * blockSize, 0);
        ctx.lineTo(c * blockSize, ROWS * blockSize);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * blockSize);
        ctx.lineTo(COLS * blockSize, r * blockSize);
        ctx.stroke();
      }

      // Draw Settled Grid Blocks
      for (let r = 0; r < ROWS; r++) {
        const isClearing = s.clearingRows.includes(r);
        for (let c = 0; c < COLS; c++) {
          const cell = s.grid[r][c];
          if (cell !== 0) {
            const bx = c * blockSize;
            const by = r * blockSize;

            if (isClearing) {
              // Flash white during line clear
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(bx + 1, by + 1, blockSize - 2, blockSize - 2);
            } else {
              ctx.shadowColor = cell.glow;
              ctx.shadowBlur = 8;
              ctx.fillStyle = cell.color;
              ctx.beginPath();
              ctx.roundRect(bx + 1, by + 1, blockSize - 2, blockSize - 2, 3);
              ctx.fill();

              ctx.shadowBlur = 0;
              ctx.strokeStyle = cell.border;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
      }

      // Draw Ghost Piece
      if (s.gameState === 'playing' && s.currentPiece && s.clearAnimationTimer === 0) {
        const ghostY = getGhostY(s.currentPiece, s.grid);
        const shape = s.currentPiece.shape;

        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] !== 0) {
              const gx = (s.currentPiece.x + c) * blockSize;
              const gy = (ghostY + r) * blockSize;

              ctx.strokeStyle = s.currentPiece.border;
              ctx.lineWidth = 1;
              ctx.setLineDash([3, 3]);
              ctx.strokeRect(gx + 2, gy + 2, blockSize - 4, blockSize - 4);
              ctx.setLineDash([]);
            }
          }
        }
      }

      // Draw Active Falling Piece
      if (s.currentPiece && s.clearAnimationTimer === 0) {
        const shape = s.currentPiece.shape;
        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] !== 0) {
              const bx = (s.currentPiece.x + c) * blockSize;
              const by = (s.currentPiece.y + r) * blockSize;

              ctx.shadowColor = s.currentPiece.glow;
              ctx.shadowBlur = 12;
              ctx.fillStyle = s.currentPiece.color;
              ctx.beginPath();
              ctx.roundRect(bx + 1, by + 1, blockSize - 2, blockSize - 2, 4);
              ctx.fill();

              ctx.shadowBlur = 0;
              ctx.strokeStyle = s.currentPiece.border;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
      }

      // Draw Particles
      s.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(updateAndRender);
    };

    animId = requestAnimationFrame(updateAndRender);
    return () => cancelAnimationFrame(animId);
  }, [lockPiece, spawnNextPiece]);

  // Mini Preview Render Helper for Hold & Next Queue
  const renderMiniPiece = (type) => {
    if (!type || !TETROMINOES[type]) return <div className="w-16 h-12" />;
    const data = TETROMINOES[type];
    const shape = data.shape;

    return (
      <div className="flex flex-col items-center justify-center p-2">
        {shape.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => (
              <div
                key={c}
                className="w-3.5 h-3.5 m-[1px] rounded-xs"
                style={{
                  backgroundColor: cell ? data.color : 'transparent',
                  boxShadow: cell ? `0 0 6px ${data.glow}` : 'none',
                  border: cell ? `1px solid ${data.border}` : 'none'
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* HEADER CONTROLS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft size={16} />
            <span>Hub</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider flex items-center gap-2">
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Cyber Blocks
                </span>
                <span className="text-xs uppercase tracking-widest px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Tetris Arcade
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Rotate, stack, clear lines & trigger Tetris combos!
            </p>
          </div>
        </div>

        {/* STATS: Score, Level, Lines, Best */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Level */}
          <div className="px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700/80 text-center min-w-[65px]">
            <div className="text-[10px] uppercase font-bold text-slate-400">Level</div>
            <div className="text-sm sm:text-base font-black text-cyan-400">{level}</div>
          </div>

          {/* Lines */}
          <div className="px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700/80 text-center min-w-[65px]">
            <div className="text-[10px] uppercase font-bold text-slate-400">Lines</div>
            <div className="text-sm sm:text-base font-black text-purple-400">{lines}</div>
          </div>

          {/* Score */}
          <div className="px-3 sm:px-4 py-2 rounded-xl bg-slate-800/90 border border-slate-700/80 text-center min-w-[75px]">
            <div className="text-[10px] uppercase font-bold text-slate-400">Score</div>
            <div className="text-sm sm:text-base font-black text-white">{score}</div>
          </div>

          {/* Best Score */}
          <div className="hidden sm:block px-3 sm:px-4 py-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-center min-w-[75px]">
            <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center justify-center gap-1">
              <Trophy size={10} />
              <span>Best</span>
            </div>
            <div className="text-sm sm:text-base font-black text-amber-300">{highScore}</div>
          </div>

          {/* Controls: Pause, Restart, Audio, Help */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
            <button
              onClick={pauseGame}
              disabled={gameState !== 'playing' && gameState !== 'paused'}
              title="Pause (P)"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all disabled:opacity-40"
            >
              {gameState === 'paused' ? <Play size={16} className="text-emerald-400" /> : <Pause size={16} />}
            </button>

            <button
              onClick={restartGame}
              title="Restart (R)"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
            >
              <RotateCcw size={16} />
            </button>

            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
            >
              {isMuted ? <VolumeX size={16} className="text-rose-400" /> : <Volume2 size={16} className="text-emerald-400" />}
            </button>

            <button
              onClick={() => setShowHelp(prev => !prev)}
              title="Instructions"
              className={`p-2.5 rounded-xl border transition-all ${
                showHelp
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              <HelpCircle size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* HELP DRAWER */}
      {showHelp && (
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-indigo-500/30 text-xs text-slate-300 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Sparkles size={16} />
            <span>How to Play Cyber Blocks</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li><strong>Move:</strong> <span className="text-white font-mono">Arrow Left / Right</span> or <span className="text-white font-mono">A / D</span>.</li>
            <li><strong>Rotate:</strong> <span className="text-white font-mono">Arrow Up</span> or <span className="text-white font-mono">W</span>.</li>
            <li><strong>Soft Drop:</strong> Hold <span className="text-white font-mono">Arrow Down</span> or <span className="text-white font-mono">S</span> for fast descent.</li>
            <li><strong>Hard Drop:</strong> Press <span className="text-white font-mono">Spacebar</span> to instantly slam the piece into place.</li>
            <li><strong>Hold Piece:</strong> Press <span className="text-white font-mono">C</span> or <span className="text-white font-mono">Shift</span> to save piece for later.</li>
            <li><strong>TETRIS:</strong> Clear 4 lines at once for a massive 800-point multiplier!</li>
          </ul>
        </div>
      )}

      {/* MAIN PLAYFIELD: Hold Box + Canvas Grid + Next Queue */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6">
        {/* LEFT PANEL: Hold Box */}
        <div className="flex md:flex-col items-center gap-4">
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 w-28 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Hold (C)</div>
            <div className="h-16 flex items-center justify-center bg-slate-950/60 rounded-xl border border-slate-800/80">
              {renderMiniPiece(holdPiece)}
            </div>
            <button
              onClick={handleHold}
              disabled={!stateRef.current.canHold}
              className="mt-2 w-full py-1.5 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg transition-all"
            >
              Swap
            </button>
          </div>

          {/* Action Combo Toast */}
          {lastActionText && (
            <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 text-cyan-300 font-black text-xs text-center animate-bounce">
              {lastActionText}
            </div>
          )}
        </div>

        {/* CENTER: 10x20 CANVAS BOARD */}
        <div className="relative">
          <div className="relative w-[240px] h-[480px] rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl shadow-indigo-950/60 bg-[#060814]">
            <canvas
              ref={canvasRef}
              width={COLS * 24}
              height={ROWS * 24}
              className="w-full h-full block"
            />

            {/* READY OVERLAY */}
            {gameState === 'ready' && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-150">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 mb-3 animate-pulse">
                  <Play size={24} />
                </div>
                <h3 className="text-xl font-black text-white mb-1">Cyber Blocks</h3>
                <p className="text-xs text-slate-300 mb-4 max-w-[180px]">
                  Press Spacebar or Click to Start!
                </p>
                <button
                  onClick={startGame}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/30 transition-all flex items-center gap-1.5"
                >
                  <Play size={14} />
                  <span>Start Game</span>
                </button>
              </div>
            )}

            {/* PAUSED OVERLAY */}
            {gameState === 'paused' && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-150">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 mb-3">
                  <Pause size={24} />
                </div>
                <h3 className="text-xl font-black text-white mb-3">Paused</h3>
                <button
                  onClick={pauseGame}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                >
                  <Play size={14} />
                  <span>Resume</span>
                </button>
              </div>
            )}

            {/* GAME OVER OVERLAY */}
            {gameState === 'game_over' && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 mb-2">
                  <Flame size={28} />
                </div>
                <h3 className="text-xl font-black text-white mb-1">Game Over</h3>
                <p className="text-xs text-slate-400 mb-3">Stack topped out!</p>

                <div className="grid grid-cols-2 gap-2 w-full max-w-[190px] mb-4 text-center">
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-[9px] uppercase font-bold text-slate-500">Score</div>
                    <div className="text-sm font-black text-white">{score}</div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-[9px] uppercase font-bold text-slate-500">Lines</div>
                    <div className="text-sm font-black text-purple-400">{lines}</div>
                  </div>
                </div>

                <button
                  onClick={restartGame}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-bold text-xs shadow-lg shadow-rose-500/30 transition-all flex items-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>Play Again</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Next Pieces Queue */}
        <div className="flex md:flex-col items-center gap-4">
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 w-28 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Next</div>
            <div className="space-y-2">
              {nextPieces.slice(0, 3).map((type, i) => (
                <div
                  key={i}
                  className="h-14 flex items-center justify-center bg-slate-950/60 rounded-xl border border-slate-800/80"
                >
                  {renderMiniPiece(type)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ON-SCREEN CONTROLS (Mobile / Tablet D-Pad) */}
      <div className="flex flex-col items-center gap-2 pt-2 sm:hidden">
        <div className="grid grid-cols-3 gap-2 w-64">
          <button
            onClick={() => moveHorizontal(-1)}
            className="py-3 bg-slate-800 active:bg-cyan-600 rounded-xl border border-slate-700 flex items-center justify-center text-slate-300 active:text-white"
          >
            <ArrowL size={20} />
          </button>
          <button
            onClick={rotatePiece}
            className="py-3 bg-slate-800 active:bg-purple-600 rounded-xl border border-slate-700 flex items-center justify-center text-slate-300 active:text-white"
          >
            <ArrowUp size={20} />
          </button>
          <button
            onClick={() => moveHorizontal(1)}
            className="py-3 bg-slate-800 active:bg-cyan-600 rounded-xl border border-slate-700 flex items-center justify-center text-slate-300 active:text-white"
          >
            <ArrowR size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 w-64">
          <button
            onClick={handleHold}
            className="py-2.5 bg-slate-800 active:bg-indigo-600 rounded-xl border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 active:text-white"
          >
            HOLD
          </button>
          <button
            onClick={softDrop}
            className="py-2.5 bg-slate-800 active:bg-emerald-600 rounded-xl border border-slate-700 flex items-center justify-center text-slate-300 active:text-white"
          >
            <ArrowDown size={18} />
          </button>
          <button
            onClick={hardDrop}
            className="py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 active:from-cyan-500 active:to-blue-500 rounded-xl border border-cyan-400 flex items-center justify-center text-xs font-black text-white shadow-md shadow-cyan-600/30"
          >
            SLAM
          </button>
        </div>
      </div>
    </div>
  );
};
