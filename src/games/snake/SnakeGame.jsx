import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, RotateCcw, Volume2, VolumeX, Trophy, Pause, 
  Award, Compass, ArrowUp, ArrowDown, ArrowLeft as ArrowL, ArrowRight
} from 'lucide-react';
import { sounds } from '../../services/sound';
import { storage } from '../../services/storage';

const SPEEDS = {
  casual: 135,
  normal: 95,
  hardcore: 65
};

const SKINS = [
  { name: 'Neon Emerald', head: '#10b981', body: '#059669', tail: '#06b6d4', glow: 'rgba(16, 185, 129, 0.4)' },
  { name: 'Cyber Pink', head: '#ec4899', body: '#db2777', tail: '#8b5cf6', glow: 'rgba(236, 72, 153, 0.4)' },
  { name: 'Electric Blue', head: '#06b6d4', body: '#0284c7', tail: '#3b82f6', glow: 'rgba(6, 182, 212, 0.4)' },
  { name: 'Solar Gold', head: '#f59e0b', body: '#d97706', tail: '#ef4444', glow: 'rgba(245, 158, 11, 0.4)' }
];

export const SnakeGame = ({ onGameOver, onBack }) => {
  const canvasRef = useRef(null);

  // Board settings
  const GRID_SIZE = 22; // 22x22 cells
  const CANVAS_SIZE = 440; // 440x440 px
  const CELL_SIZE = CANVAS_SIZE / GRID_SIZE; // 20px per cell

  // Game States
  const [gameState, setGameState] = useState('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => storage.getHighScore('retro-snake'));
  const [difficulty, setDifficulty] = useState('normal');
  const [wallMode, setWallMode] = useState('deadly');
  const [selectedSkinIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(() => sounds.getMuted());
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [foodCount, setFoodCount] = useState(0);

  // Mutable Game Loop State
  const stateRef = useRef({
    snake: [
      { x: 10, y: 11 },
      { x: 10, y: 12 },
      { x: 10, y: 13 }
    ],
    direction: 'UP',
    nextDirection: 'UP',
    food: { x: 10, y: 6 },
    goldenFood: null,
    particles: [],
    applesEaten: 0,
    score: 0,
    gameState: 'idle',
    lastTick: 0
  });

  const toggleMute = () => {
    const next = sounds.toggleMute();
    setIsMuted(next);
  };

  const getRandomPosition = (exclude) => {
    let pos;
    let collision;
    do {
      pos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      collision = exclude.some(p => p.x === pos.x && p.y === pos.y);
    } while (collision);
    return pos;
  };

  const spawnParticles = (x, y, colors, count = 16) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.5;
      stateRef.current.particles.push({
        x: x * CELL_SIZE + CELL_SIZE / 2,
        y: y * CELL_SIZE + CELL_SIZE / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2.5 + Math.random() * 3.5,
        life: 0,
        maxLife: 20 + Math.random() * 15
      });
    }
  };

  const startGame = () => {
    sounds.playClick();
    const initialSnake = [
      { x: 10, y: 11 },
      { x: 10, y: 12 },
      { x: 10, y: 13 }
    ];
    const initialFood = getRandomPosition(initialSnake);

    stateRef.current.snake = initialSnake;
    stateRef.current.direction = 'UP';
    stateRef.current.nextDirection = 'UP';
    stateRef.current.food = initialFood;
    stateRef.current.goldenFood = null;
    stateRef.current.particles = [];
    stateRef.current.applesEaten = 0;
    stateRef.current.score = 0;
    stateRef.current.gameState = 'playing';
    stateRef.current.lastTick = performance.now();

    setScore(0);
    setFoodCount(0);
    setIsNewRecord(false);
    setGameState('playing');
  };

  const triggerGameOver = useCallback(() => {
    stateRef.current.gameState = 'gameover';
    setGameState('gameover');
    sounds.playCrash();

    const head = stateRef.current.snake[0];
    if (head) {
      spawnParticles(head.x, head.y, ['#ef4444', '#f97316', '#fbbf24', '#ffffff'], 35);
    }

    const finalScore = stateRef.current.score;
    storage.recordScore('retro-snake', finalScore);

    const prevHigh = storage.getHighScore('retro-snake');
    if (finalScore > prevHigh) {
      setIsNewRecord(true);
      sounds.playVictory();
      confetti({
        particleCount: 85,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    setHighScore(storage.getHighScore('retro-snake'));
    if (onGameOver) onGameOver(finalScore);
  }, [onGameOver]);

  const changeDirection = useCallback((newDir) => {
    const s = stateRef.current;
    if (s.gameState === 'idle') {
      startGame();
      return;
    }
    if (s.gameState !== 'playing') return;

    const currentDir = s.direction;
    const isOpposite =
      (newDir === 'UP' && currentDir === 'DOWN') ||
      (newDir === 'DOWN' && currentDir === 'UP') ||
      (newDir === 'LEFT' && currentDir === 'RIGHT') ||
      (newDir === 'RIGHT' && currentDir === 'LEFT');

    if (!isOpposite && newDir !== s.nextDirection) {
      s.nextDirection = newDir;
      sounds.playSnakeTurn();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          changeDirection('UP');
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          changeDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          changeDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          changeDirection('RIGHT');
          break;
        case 'Space':
        case 'KeyP':
          e.preventDefault();
          if (stateRef.current.gameState === 'playing') {
            stateRef.current.gameState = 'paused';
            setGameState('paused');
          } else if (stateRef.current.gameState === 'paused') {
            stateRef.current.gameState = 'playing';
            setGameState('playing');
          } else if (stateRef.current.gameState === 'idle' || stateRef.current.gameState === 'gameover') {
            startGame();
          }
          break;
        case 'KeyR':
          startGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;

    const updatePhysics = () => {
      const s = stateRef.current;
      s.direction = s.nextDirection;

      const head = { ...s.snake[0] };
      switch (s.direction) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      if (wallMode === 'portal') {
        head.x = (head.x + GRID_SIZE) % GRID_SIZE;
        head.y = (head.y + GRID_SIZE) % GRID_SIZE;
      } else {
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          triggerGameOver();
          return;
        }
      }

      if (s.snake.some((seg, idx) => idx > 0 && seg.x === head.x && seg.y === head.y)) {
        triggerGameOver();
        return;
      }

      const newSnake = [head, ...s.snake];

      if (head.x === s.food.x && head.y === s.food.y) {
        sounds.playSnakeEat();
        s.applesEaten++;
        s.score += 10;
        setScore(s.score);
        setFoodCount(s.applesEaten);
        spawnParticles(head.x, head.y, ['#ef4444', '#f87171', '#fecaca']);

        s.food = getRandomPosition(newSnake);

        if (s.applesEaten % 5 === 0 && !s.goldenFood) {
          const goldPos = getRandomPosition([...newSnake, s.food]);
          s.goldenFood = {
            x: goldPos.x,
            y: goldPos.y,
            timer: 75,
            maxTimer: 75
          };
        }
      } else if (s.goldenFood && head.x === s.goldenFood.x && head.y === s.goldenFood.y) {
        sounds.playGoldenEat();
        s.score += 50;
        setScore(s.score);
        spawnParticles(head.x, head.y, ['#facc15', '#fef08a', '#fbbf24', '#ffffff'], 24);
        s.goldenFood = null;
      } else {
        newSnake.pop();
      }

      if (s.goldenFood) {
        s.goldenFood.timer--;
        if (s.goldenFood.timer <= 0) {
          s.goldenFood = null;
        }
      }

      s.snake = newSnake;
    };

    const render = (time) => {
      const s = stateRef.current;
      const speedDelay = SPEEDS[difficulty];

      if (s.gameState === 'playing') {
        if (time - s.lastTick >= speedDelay) {
          s.lastTick = time;
          updatePhysics();
        }
      }

      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.life >= p.maxLife) {
          s.particles.splice(i, 1);
        }
      }

      // Draw canvas
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      ctx.fillStyle = '#0a0d18';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
        ctx.stroke();
      }

      // Golden Food
      if (s.goldenFood) {
        const gx = s.goldenFood.x * CELL_SIZE + CELL_SIZE / 2;
        const gy = s.goldenFood.y * CELL_SIZE + CELL_SIZE / 2;
        const pulse = Math.sin(time * 0.01) * 2;

        ctx.save();
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(gx, gy, CELL_SIZE * 0.42 + pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', gx, gy);
        ctx.restore();
      }

      // Regular Food
      const fx = s.food.x * CELL_SIZE + CELL_SIZE / 2;
      const fy = s.food.y * CELL_SIZE + CELL_SIZE / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(239, 68, 68, 0.7)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(fx, fy + 1, CELL_SIZE * 0.38, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(fx + 2, fy - 6, 3, 2, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Snake
      const skin = SKINS[selectedSkinIdx];
      s.snake.forEach((seg, idx) => {
        const sx = seg.x * CELL_SIZE;
        const sy = seg.y * CELL_SIZE;
        const isHead = idx === 0;

        ctx.save();
        if (isHead) {
          ctx.shadowColor = skin.glow;
          ctx.shadowBlur = 12;
          ctx.fillStyle = skin.head;
        } else {
          ctx.fillStyle = idx === s.snake.length - 1 ? skin.tail : skin.body;
        }

        const radius = isHead ? 6 : 4;
        ctx.beginPath();
        ctx.roundRect(sx + 1, sy + 1, CELL_SIZE - 2, CELL_SIZE - 2, radius);
        ctx.fill();

        if (isHead) {
          ctx.fillStyle = '#ffffff';
          let e1x = sx + 5, e1y = sy + 5, e2x = sx + 14, e2y = sy + 5;
          let p1x = sx + 5, p1y = sy + 4, p2x = sx + 14, p2y = sy + 4;

          if (s.direction === 'DOWN') {
            e1x = sx + 5; e1y = sy + 13; e2x = sx + 14; e2y = sy + 13;
            p1x = sx + 5; p1y = sy + 14; p2x = sx + 14; p2y = sy + 14;
          } else if (s.direction === 'LEFT') {
            e1x = sx + 5; e1y = sy + 5; e2x = sx + 5; e2y = sy + 14;
            p1x = sx + 4; p1y = sy + 5; p2x = sx + 4; p2y = sy + 14;
          } else if (s.direction === 'RIGHT') {
            e1x = sx + 13; e1y = sy + 5; e2x = sx + 13; e2y = sy + 14;
            p1x = sx + 14; p1y = sy + 5; p2x = sx + 14; p2y = sy + 14;
          }

          ctx.beginPath();
          ctx.arc(e1x, e1y, 2.5, 0, Math.PI * 2);
          ctx.arc(e2x, e2y, 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(p1x, p1y, 1.3, 0, Math.PI * 2);
          ctx.arc(p2x, p2y, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // Particles
      s.particles.forEach(p => {
        const alpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      if (s.gameState === 'idle') {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 13, 24, 0.75)';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        ctx.fillStyle = '#10b981';
        ctx.font = '900 24px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PRESS SPACE TO PLAY', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 10);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 13px Outfit, sans-serif';
        ctx.fillText('Use Arrow Keys or WASD to Slither', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 20);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [difficulty, wallMode, selectedSkinIdx, triggerGameOver]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] py-4 select-none">
      <div className="w-full max-w-[460px] mb-3 flex items-center justify-between px-2 text-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Arcade Store</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-lg">
            <Trophy size={14} />
            <span className="font-semibold text-xs">Best: {Math.max(highScore, score)}</span>
          </div>

          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} className="text-emerald-400" />}
          </button>
        </div>
      </div>

      <div className="w-full max-w-[460px] mb-3 flex items-center justify-between gap-2 px-1 text-xs">
        <div className="flex bg-slate-900/90 rounded-xl p-1 border border-slate-800">
          {['casual', 'normal', 'hardcore'].map(d => (
            <button
              key={d}
              onClick={() => {
                sounds.playClick();
                setDifficulty(d);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                difficulty === d
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            setWallMode(prev => prev === 'deadly' ? 'portal' : 'deadly');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all ${
            wallMode === 'portal'
              ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
              : 'bg-rose-600/20 border-rose-500/40 text-rose-300'
          }`}
          title="Toggle walls: Deadly collision or Portal wrap-around"
        >
          <Compass size={13} />
          <span>{wallMode === 'portal' ? 'Portal Wraps' : 'Deadly Walls'}</span>
        </button>
      </div>

      <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-500/30 bg-slate-950">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onClick={() => {
            if (gameState === 'idle') startGame();
          }}
          className="cursor-pointer block max-w-full touch-none"
        />

        <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-xs font-bold text-white">
            <span>🍎 {foodCount}</span>
          </div>

          <div className="px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1 text-sm font-black text-emerald-400 font-mono">
            <span>{score} PTS</span>
          </div>
        </div>

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full max-w-[300px] bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl">
              <h2 className="text-2xl font-black text-rose-500 tracking-wider mb-1 font-arcade">
                GAME OVER
              </h2>

              {isNewRecord && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold my-2 animate-pulse">
                  <Award size={14} /> NEW RECORD!
                </div>
              )}

              <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 my-3 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Score</span>
                  <span className="text-2xl font-black text-white">{score}</span>
                </div>
                <div className="h-px bg-slate-700/60" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Apples Eaten</span>
                  <span className="text-sm font-bold text-slate-200">🍎 {foodCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Best Score</span>
                  <span className="text-sm font-bold text-amber-400">{highScore}</span>
                </div>
              </div>

              <button
                onClick={startGame}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                <span>Play Again</span>
              </button>
            </div>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="text-center p-6 bg-slate-900 border border-slate-700 rounded-3xl shadow-xl">
              <Pause size={36} className="mx-auto text-amber-400 mb-2" />
              <h3 className="text-lg font-bold text-white mb-1">Game Paused</h3>
              <p className="text-xs text-slate-400 mb-4">Press 'P' or click below to continue</p>
              <button
                onClick={() => {
                  stateRef.current.gameState = 'playing';
                  setGameState('playing');
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-xs"
              >
                Resume
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Touch Virtual D-Pad */}
      <div className="mt-4 flex flex-col items-center gap-1 sm:hidden">
        <button
          onClick={() => changeDirection('UP')}
          className="w-12 h-12 rounded-xl bg-slate-800/90 active:bg-emerald-600 text-white flex items-center justify-center border border-slate-700 shadow-md"
        >
          <ArrowUp size={20} />
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => changeDirection('LEFT')}
            className="w-12 h-12 rounded-xl bg-slate-800/90 active:bg-emerald-600 text-white flex items-center justify-center border border-slate-700 shadow-md"
          >
            <ArrowL size={20} />
          </button>
          <button
            onClick={() => changeDirection('DOWN')}
            className="w-12 h-12 rounded-xl bg-slate-800/90 active:bg-emerald-600 text-white flex items-center justify-center border border-slate-700 shadow-md"
          >
            <ArrowDown size={20} />
          </button>
          <button
            onClick={() => changeDirection('RIGHT')}
            className="w-12 h-12 rounded-xl bg-slate-800/90 active:bg-emerald-600 text-white flex items-center justify-center border border-slate-700 shadow-md"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* Keyboard Controls Hint */}
      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Arrow Keys / WASD</kbd> Slither
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Space / P</kbd> Pause
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">R</kbd> Restart
        </span>
      </div>
    </div>
  );
};

