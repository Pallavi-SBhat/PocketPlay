import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, RotateCcw, Volume2, VolumeX, Trophy, Pause, Play, 
  HelpCircle, Heart, Zap, Shield, Flame, Clock, Award, Sparkles,
  ArrowLeft as ArrowL, ArrowRight as ArrowR, Crosshair
} from 'lucide-react';
import { sounds } from '../../services/sound';
import { storage } from '../../services/storage';

// Canvas standard dimensions
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;

// Brick Colors and Themes
const BRICK_COLORS = {
  cyan: { fill: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)', text: '#cffafe' },
  emerald: { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', text: '#d1fae5' },
  amber: { fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', text: '#fef3c7' },
  rose: { fill: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)', text: '#ffe4e6' },
  purple: { fill: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)', text: '#f3e8ff' },
  blue: { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)', text: '#dbeafe' },
  silver: { fill: '#94a3b8', glow: 'rgba(148, 163, 184, 0.4)', text: '#f8fafc' }, // Armored
  bomb: { fill: '#ef4444', glow: 'rgba(239, 68, 68, 0.7)', text: '#fee2e2' }    // Explosive
};

// 5 Handcrafted Level Layouts
// 0: empty, 1: cyan, 2: emerald, 3: amber, 4: rose, 5: purple, 6: blue, 7: armored (2-hits), 8: bomb
const LEVELS = [
  {
    name: 'Stage 1: Neon Horizon',
    rows: 5,
    cols: 8,
    layout: [
      [4, 4, 4, 4, 4, 4, 4, 4],
      [3, 3, 3, 3, 3, 3, 3, 3],
      [2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [6, 6, 6, 6, 6, 6, 6, 6]
    ]
  },
  {
    name: 'Stage 2: Cyber Invader',
    rows: 6,
    cols: 8,
    layout: [
      [0, 5, 0, 0, 0, 0, 5, 0],
      [0, 0, 5, 5, 5, 5, 0, 0],
      [0, 5, 7, 5, 5, 7, 5, 0],
      [5, 5, 5, 5, 5, 5, 5, 5],
      [5, 0, 5, 0, 0, 5, 0, 5],
      [0, 5, 0, 5, 5, 0, 5, 0]
    ]
  },
  {
    name: 'Stage 3: Cyber Fortress',
    rows: 6,
    cols: 8,
    layout: [
      [7, 7, 7, 7, 7, 7, 7, 7],
      [7, 4, 4, 8, 8, 4, 4, 7],
      [7, 3, 1, 1, 1, 1, 3, 7],
      [7, 3, 1, 8, 8, 1, 3, 7],
      [7, 2, 2, 2, 2, 2, 2, 7],
      [7, 7, 7, 7, 7, 7, 7, 7]
    ]
  },
  {
    name: 'Stage 4: Diamond Vault',
    rows: 7,
    cols: 8,
    layout: [
      [0, 0, 0, 8, 8, 0, 0, 0],
      [0, 0, 3, 7, 7, 3, 0, 0],
      [0, 4, 7, 1, 1, 7, 4, 0],
      [6, 7, 1, 8, 8, 1, 7, 6],
      [0, 4, 7, 1, 1, 7, 4, 0],
      [0, 0, 3, 7, 7, 3, 0, 0],
      [0, 0, 0, 8, 8, 0, 0, 0]
    ]
  },
  {
    name: 'Stage 5: Prism Overdrive',
    rows: 7,
    cols: 8,
    layout: [
      [4, 8, 4, 8, 8, 4, 8, 4],
      [7, 3, 7, 3, 3, 7, 3, 7],
      [2, 7, 2, 7, 7, 2, 7, 2],
      [8, 1, 8, 1, 1, 8, 1, 8],
      [5, 7, 5, 7, 7, 5, 7, 5],
      [6, 8, 6, 8, 8, 6, 8, 6],
      [7, 7, 7, 7, 7, 7, 7, 7]
    ]
  }
];

const POWERUP_TYPES = [
  { type: 'multi-ball', label: '+2 Balls', icon: '⚡', color: '#38bdf8' },
  { type: 'wide-paddle', label: 'Wide Paddle', icon: '🛡️', color: '#34d399' },
  { type: 'laser', label: 'Laser Cannon', icon: '🔫', color: '#f43f5e' },
  { type: 'fireball', label: 'Fireball', icon: '🔥', color: '#fb923c' },
  { type: 'slow-mo', label: 'Slow-Mo', icon: '⏱️', color: '#a855f7' },
  { type: 'extra-life', label: '+1 Life', icon: '❤️', color: '#ec4899' }
];

export const BrickBreakerGame = ({ onGameOver, onBack }) => {
  const canvasRef = useRef(null);

  // React Display States
  const [gameState, setGameState] = useState('ready'); // ready, playing, paused, level_clear, game_over, victory
  const [score, setScore] = useState(0);
  const [levelIdx, setLevelIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [highScore, setHighScore] = useState(() => storage.getHighScore('brick-breaker'));
  const [isMuted, setIsMuted] = useState(() => sounds.getMuted());
  const [showHelp, setShowHelp] = useState(false);
  const [activePowers, setActivePowers] = useState([]); // [{ type, timeLeft }]

  // Mutable Game Loop State
  const stateRef = useRef({
    gameState: 'ready',
    score: 0,
    levelIdx: 0,
    lives: 3,
    combo: 0,
    maxCombo: 0,
    paddle: {
      x: CANVAS_WIDTH / 2 - 50,
      y: CANVAS_HEIGHT - 28,
      width: 100,
      height: 12,
      baseWidth: 100,
      speed: 8,
      dx: 0
    },
    balls: [],
    bricks: [],
    powerups: [],
    lasers: [],
    particles: [],
    floatingTexts: [],
    activeEffects: {
      widePaddleTimer: 0,
      laserTimer: 0,
      fireballTimer: 0,
      slowMoTimer: 0
    },
    lastLaserShot: 0
  });

  const toggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Build Bricks for Level
  const initLevel = useCallback((lvlIdx) => {
    const levelData = LEVELS[lvlIdx % LEVELS.length];
    const brickMarginTop = 50;
    const brickMarginLeft = 32;
    const totalWidth = CANVAS_WIDTH - brickMarginLeft * 2;
    const brickPadding = 6;
    const brickWidth = (totalWidth - (levelData.cols - 1) * brickPadding) / levelData.cols;
    const brickHeight = 18;

    const bricks = [];
    for (let r = 0; r < levelData.rows; r++) {
      for (let c = 0; c < levelData.cols; c++) {
        const val = levelData.layout[r][c];
        if (val === 0) continue;

        let type = 'normal';
        let health = 1;
        let colorKey = 'cyan';

        if (val === 1) colorKey = 'cyan';
        else if (val === 2) colorKey = 'emerald';
        else if (val === 3) colorKey = 'amber';
        else if (val === 4) colorKey = 'rose';
        else if (val === 5) colorKey = 'purple';
        else if (val === 6) colorKey = 'blue';
        else if (val === 7) {
          type = 'armored';
          health = 2;
          colorKey = 'silver';
        } else if (val === 8) {
          type = 'bomb';
          health = 1;
          colorKey = 'bomb';
        }

        bricks.push({
          id: `${r}-${c}`,
          r,
          c,
          x: brickMarginLeft + c * (brickWidth + brickPadding),
          y: brickMarginTop + r * (brickHeight + brickPadding),
          width: brickWidth,
          height: brickHeight,
          type,
          health,
          maxHealth: health,
          colorKey,
          alive: true
        });
      }
    }

    return bricks;
  }, []);

  // Reset ball on paddle
  const resetBall = useCallback(() => {
    const s = stateRef.current;
    s.balls = [
      {
        x: s.paddle.x + s.paddle.width / 2,
        y: s.paddle.y - 9,
        vx: (Math.random() > 0.5 ? 1 : -1) * 3.5,
        vy: -5,
        radius: 6,
        isFireball: false
      }
    ];
    s.lasers = [];
    s.combo = 0;
    setCombo(0);
  }, []);

  // Spawn shrapnel particles
  const spawnParticles = (x, y, color, count = 12) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      s.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 2,
        color,
        alpha: 1,
        life: 1
      });
    }
  };

  // Add floating text (e.g. +100, COMBO x3)
  const addFloatingText = (text, x, y, color = '#38bdf8') => {
    stateRef.current.floatingTexts.push({
      text,
      x,
      y,
      vy: -1.2,
      alpha: 1,
      color
    });
  };

  // Spawn powerup capsule
  const maybeSpawnPowerup = (x, y) => {
    // 24% drop chance
    if (Math.random() < 0.24) {
      const power = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      stateRef.current.powerups.push({
        ...power,
        x,
        y,
        width: 32,
        height: 16,
        vy: 2.2
      });
    }
  };

  // Trigger Area Bomb Explosion
  const triggerBombExplosion = (bombBrick) => {
    const s = stateRef.current;
    sounds.playExplosion();
    spawnParticles(bombBrick.x + bombBrick.width / 2, bombBrick.y + bombBrick.height / 2, '#ef4444', 28);
    addFloatingText('BOOM! 💥', bombBrick.x, bombBrick.y, '#f87171');

    // Shatter all neighboring bricks (row +-1, col +-1)
    s.bricks.forEach(b => {
      if (b.alive && Math.abs(b.r - bombBrick.r) <= 1 && Math.abs(b.c - bombBrick.c) <= 1) {
        b.alive = false;
        s.score += 150;
        spawnParticles(b.x + b.width / 2, b.y + b.height / 2, BRICK_COLORS[b.colorKey].fill, 8);
        maybeSpawnPowerup(b.x + b.width / 2, b.y);
      }
    });
  };

  // Start / Resume Game
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

  // Advance to Next Level
  const advanceLevel = () => {
    sounds.playClick();
    const s = stateRef.current;
    const nextIdx = s.levelIdx + 1;
    if (nextIdx >= LEVELS.length) {
      // Game Complete!
      s.gameState = 'victory';
      setGameState('victory');
      sounds.playVictory();
      confetti({ particleCount: 150, spread: 80 });
      storage.recordScore('brick-breaker', s.score, { level: 5, maxCombo: s.maxCombo });
      return;
    }

    s.levelIdx = nextIdx;
    s.bricks = initLevel(nextIdx);
    s.powerups = [];
    s.lasers = [];
    s.particles = [];
    s.floatingTexts = [];
    s.activeEffects = { widePaddleTimer: 0, laserTimer: 0, fireballTimer: 0, slowMoTimer: 0 };
    s.paddle.width = s.paddle.baseWidth;
    resetBall();
    s.gameState = 'ready';
    setLevelIdx(nextIdx);
    setGameState('ready');
  };

  // Restart Entire Game
  const restartGame = () => {
    sounds.playClick();
    const s = stateRef.current;
    s.score = 0;
    s.levelIdx = 0;
    s.lives = 3;
    s.combo = 0;
    s.maxCombo = 0;
    s.paddle.x = CANVAS_WIDTH / 2 - 50;
    s.paddle.width = s.paddle.baseWidth;
    s.bricks = initLevel(0);
    s.powerups = [];
    s.lasers = [];
    s.particles = [];
    s.floatingTexts = [];
    s.activeEffects = { widePaddleTimer: 0, laserTimer: 0, fireballTimer: 0, slowMoTimer: 0 };
    resetBall();
    s.gameState = 'ready';

    setScore(0);
    setLevelIdx(0);
    setLives(3);
    setCombo(0);
    setGameState('ready');
  };

  // Shoot Lasers
  const fireLasers = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState !== 'playing' || s.activeEffects.laserTimer <= 0) return;
    const now = Date.now();
    if (now - s.lastLaserShot < 200) return; // Cooldown
    s.lastLaserShot = now;

    sounds.playLaserShot();
    const leftGunX = s.paddle.x + 6;
    const rightGunX = s.paddle.x + s.paddle.width - 6;
    const gunY = s.paddle.y;

    s.lasers.push(
      { x: leftGunX, y: gunY, vy: -9, width: 4, height: 12 },
      { x: rightGunX, y: gunY, vy: -9, width: 4, height: 12 }
    );
  }, []);

  // Initialize Game on Mount
  useEffect(() => {
    const s = stateRef.current;
    s.bricks = initLevel(0);
    resetBall();
  }, [initLevel, resetBall]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      const s = stateRef.current;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        s.paddle.dx = -s.paddle.speed;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        s.paddle.dx = s.paddle.speed;
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (s.gameState === 'ready') {
          startGame();
        } else if (s.gameState === 'playing' && s.activeEffects.laserTimer > 0) {
          fireLasers();
        }
      } else if (e.key === 'p' || e.key === 'P') {
        pauseGame();
      } else if (e.key === 'r' || e.key === 'R') {
        restartGame();
      }
    };

    const handleKeyUp = (e) => {
      const s = stateRef.current;
      if (['ArrowLeft', 'a', 'A', 'ArrowRight', 'd', 'D'].includes(e.key)) {
        s.paddle.dx = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [fireLasers]);

  // Mouse / Touch paddle tracking
  const handlePointerMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const canvasX = (clientX - rect.left) * scaleX;

    const s = stateRef.current;
    s.paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - s.paddle.width, canvasX - s.paddle.width / 2));
  };

  const handleCanvasClick = () => {
    const s = stateRef.current;
    if (s.gameState === 'ready') {
      startGame();
    } else if (s.gameState === 'playing' && s.activeEffects.laserTimer > 0) {
      fireLasers();
    }
  };

  // Main 60fps Game Loop
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateAndRender = () => {
      const s = stateRef.current;

      // --- LOGIC UPDATE (Only when playing) ---
      if (s.gameState === 'playing') {
        // Move paddle via keyboard velocity
        if (s.paddle.dx !== 0) {
          s.paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - s.paddle.width, s.paddle.x + s.paddle.dx));
        }

        // Active Powerups Timers
        const activeList = [];
        if (s.activeEffects.widePaddleTimer > 0) {
          s.activeEffects.widePaddleTimer -= 1 / 60;
          activeList.push({ type: 'wide-paddle', label: 'Wide Paddle', icon: '🛡️', timeLeft: Math.ceil(s.activeEffects.widePaddleTimer) });
          if (s.activeEffects.widePaddleTimer <= 0) s.paddle.width = s.paddle.baseWidth;
        }
        if (s.activeEffects.laserTimer > 0) {
          s.activeEffects.laserTimer -= 1 / 60;
          activeList.push({ type: 'laser', label: 'Laser Cannon', icon: '🔫', timeLeft: Math.ceil(s.activeEffects.laserTimer) });
        }
        if (s.activeEffects.fireballTimer > 0) {
          s.activeEffects.fireballTimer -= 1 / 60;
          activeList.push({ type: 'fireball', label: 'Fireball', icon: '🔥', timeLeft: Math.ceil(s.activeEffects.fireballTimer) });
        }
        if (s.activeEffects.slowMoTimer > 0) {
          s.activeEffects.slowMoTimer -= 1 / 60;
          activeList.push({ type: 'slow-mo', label: 'Slow-Mo', icon: '⏱️', timeLeft: Math.ceil(s.activeEffects.slowMoTimer) });
        }
        setActivePowers(activeList);

        // --- UPDATE BALLS ---
        const speedScale = s.activeEffects.slowMoTimer > 0 ? 0.65 : 1.0;
        const remainingBalls = [];

        for (let ball of s.balls) {
          ball.x += ball.vx * speedScale;
          ball.y += ball.vy * speedScale;

          // Wall Collisions
          if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
            ball.vx = Math.abs(ball.vx);
            sounds.playPaddleHit();
          } else if (ball.x + ball.radius >= CANVAS_WIDTH) {
            ball.x = CANVAS_WIDTH - ball.radius;
            ball.vx = -Math.abs(ball.vx);
            sounds.playPaddleHit();
          }

          if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.vy = Math.abs(ball.vy);
            sounds.playPaddleHit();
          }

          // Paddle Collision
          if (
            ball.y + ball.radius >= s.paddle.y &&
            ball.y - ball.radius <= s.paddle.y + s.paddle.height &&
            ball.x + ball.radius >= s.paddle.x &&
            ball.x - ball.radius <= s.paddle.x + s.paddle.width &&
            ball.vy > 0
          ) {
            sounds.playPaddleHit();
            // Reset combo on paddle touch
            s.combo = 0;
            setCombo(0);

            // Variable deflection angle based on where ball hits paddle
            const hitPos = (ball.x - (s.paddle.x + s.paddle.width / 2)) / (s.paddle.width / 2);
            const maxAngle = Math.PI * 0.38; // ~68 degrees
            const angle = hitPos * maxAngle;
            const currentSpeed = Math.hypot(ball.vx, ball.vy);
            const targetSpeed = Math.min(8.5, currentSpeed + 0.05);

            ball.vx = targetSpeed * Math.sin(angle);
            ball.vy = -targetSpeed * Math.cos(angle);
            ball.y = s.paddle.y - ball.radius; // Prevent sticking
          }

          // Brick Collisions
          const isFireballActive = s.activeEffects.fireballTimer > 0;
          for (let brick of s.bricks) {
            if (!brick.alive) continue;

            if (
              ball.x + ball.radius >= brick.x &&
              ball.x - ball.radius <= brick.x + brick.width &&
              ball.y + ball.radius >= brick.y &&
              ball.y - ball.radius <= brick.y + brick.height
            ) {
              // Brick Hit!
              s.combo += 1;
              if (s.combo > s.maxCombo) s.maxCombo = s.combo;
              setCombo(s.combo);

              brick.health -= isFireballActive ? 2 : 1;

              if (brick.health <= 0) {
                brick.alive = false;
                const baseScore = brick.type === 'armored' ? 200 : (brick.type === 'bomb' ? 300 : 100);
                const scoreAward = baseScore + (s.combo - 1) * 25;
                s.score += scoreAward;
                setScore(s.score);
                if (s.score > highScore) {
                  setHighScore(s.score);
                  storage.recordScore('brick-breaker', s.score, { level: s.levelIdx + 1 });
                }

                addFloatingText(`+${scoreAward}`, brick.x + brick.width / 2, brick.y, BRICK_COLORS[brick.colorKey].fill);
                sounds.playBrickHit(s.combo, true);
                spawnParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, BRICK_COLORS[brick.colorKey].fill, 12);

                if (brick.type === 'bomb') {
                  triggerBombExplosion(brick);
                } else {
                  maybeSpawnPowerup(brick.x + brick.width / 2, brick.y + brick.height / 2);
                }
              } else {
                // Armored 1st hit
                sounds.playBrickHit(s.combo, false);
                spawnParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, '#94a3b8', 5);
              }

              // Fireball doesn't deflect!
              if (!isFireballActive) {
                // Determine collision side (left/right vs top/bottom)
                const prevX = ball.x - ball.vx;
                const prevY = ball.y - ball.vy;

                if (prevX + ball.radius <= brick.x || prevX - ball.radius >= brick.x + brick.width) {
                  ball.vx = -ball.vx;
                } else {
                  ball.vy = -ball.vy;
                }
                break; // Only hit 1 brick per frame if not fireball
              }
            }
          }

          // Check if ball fell below screen
          if (ball.y - ball.radius <= CANVAS_HEIGHT) {
            remainingBalls.push(ball);
          }
        }

        s.balls = remainingBalls;

        // If all balls lost: lose 1 life
        if (s.balls.length === 0) {
          s.lives -= 1;
          setLives(s.lives);
          sounds.playLifeLost();

          if (s.lives <= 0) {
            s.gameState = 'game_over';
            setGameState('game_over');
            storage.recordScore('brick-breaker', s.score, { level: s.levelIdx + 1, maxCombo: s.maxCombo });
            if (onGameOver) onGameOver(s.score);
          } else {
            // Reset ball onto paddle
            s.activeEffects = { widePaddleTimer: 0, laserTimer: 0, fireballTimer: 0, slowMoTimer: 0 };
            s.paddle.width = s.paddle.baseWidth;
            resetBall();
            s.gameState = 'ready';
            setGameState('ready');
          }
        }

        // --- UPDATE LASERS ---
        const remainingLasers = [];
        for (let laser of s.lasers) {
          laser.y += laser.vy;
          let laserHit = false;

          for (let brick of s.bricks) {
            if (!brick.alive) continue;
            if (
              laser.x >= brick.x &&
              laser.x <= brick.x + brick.width &&
              laser.y >= brick.y &&
              laser.y <= brick.y + brick.height
            ) {
              laserHit = true;
              brick.health -= 1;
              if (brick.health <= 0) {
                brick.alive = false;
                s.score += 100;
                setScore(s.score);
                sounds.playBrickHit(1, true);
                spawnParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, BRICK_COLORS[brick.colorKey].fill, 8);
                if (brick.type === 'bomb') triggerBombExplosion(brick);
                else maybeSpawnPowerup(brick.x + brick.width / 2, brick.y + brick.height / 2);
              } else {
                sounds.playBrickHit(1, false);
              }
              break;
            }
          }

          if (!laserHit && laser.y > 0) {
            remainingLasers.push(laser);
          }
        }
        s.lasers = remainingLasers;

        // --- UPDATE POWERUPS ---
        const remainingPowerups = [];
        for (let p of s.powerups) {
          p.y += p.vy;

          // Check paddle collision
          if (
            p.y + p.height >= s.paddle.y &&
            p.y <= s.paddle.y + s.paddle.height &&
            p.x + p.width >= s.paddle.x &&
            p.x <= s.paddle.x + s.paddle.width
          ) {
            sounds.playPowerup();
            addFloatingText(`${p.label}!`, p.x, p.y, p.color);

            // Apply Powerup Effect
            if (p.type === 'multi-ball') {
              if (s.balls.length > 0) {
                const b = s.balls[0];
                s.balls.push(
                  { x: b.x, y: b.y, vx: -b.vx - 1, vy: b.vy, radius: 6 },
                  { x: b.x, y: b.y, vx: b.vx + 1, vy: -Math.abs(b.vy), radius: 6 }
                );
              }
            } else if (p.type === 'wide-paddle') {
              s.activeEffects.widePaddleTimer = 12;
              s.paddle.width = 140;
            } else if (p.type === 'laser') {
              s.activeEffects.laserTimer = 10;
            } else if (p.type === 'fireball') {
              s.activeEffects.fireballTimer = 8;
            } else if (p.type === 'slow-mo') {
              s.activeEffects.slowMoTimer = 10;
            } else if (p.type === 'extra-life') {
              if (s.lives < 5) {
                s.lives += 1;
                setLives(s.lives);
              }
            }
          } else if (p.y < CANVAS_HEIGHT) {
            remainingPowerups.push(p);
          }
        }
        s.powerups = remainingPowerups;

        // Check Level Clear condition
        const activeBricksLeft = s.bricks.filter(b => b.alive).length;
        if (activeBricksLeft === 0) {
          s.gameState = 'level_clear';
          setGameState('level_clear');
          sounds.playVictory();
          confetti({ particleCount: 100, spread: 70 });
        }
      }

      // --- PARTICLES & FLOATING TEXT UPDATE ---
      s.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;
      });
      s.particles = s.particles.filter(p => p.alpha > 0);

      s.floatingTexts.forEach(ft => {
        ft.y += ft.vy;
        ft.alpha -= 0.02;
      });
      s.floatingTexts = s.floatingTexts.filter(ft => ft.alpha > 0);

      // --- RENDERING ---
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background subtle grid
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Draw Bricks
      s.bricks.forEach(brick => {
        if (!brick.alive) return;
        const color = BRICK_COLORS[brick.colorKey];

        // Glow
        ctx.shadowColor = color.glow;
        ctx.shadowBlur = 10;

        // Fill
        ctx.fillStyle = color.fill;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Highlight border
        ctx.strokeStyle = color.text;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Armored 2nd hit cracked detail
        if (brick.type === 'armored' && brick.health === 1) {
          ctx.strokeStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(brick.x + 8, brick.y + 4);
          ctx.lineTo(brick.x + brick.width / 2, brick.y + brick.height - 4);
          ctx.lineTo(brick.x + brick.width - 8, brick.y + 6);
          ctx.stroke();
        }

        // Bomb icon
        if (brick.type === 'bomb') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💣', brick.x + brick.width / 2, brick.y + brick.height / 2);
        }
      });

      // Draw Paddle
      const isLaserActive = s.activeEffects.laserTimer > 0;
      ctx.shadowColor = isLaserActive ? '#f43f5e' : '#06b6d4';
      ctx.shadowBlur = 15;

      const paddleGrad = ctx.createLinearGradient(s.paddle.x, s.paddle.y, s.paddle.x, s.paddle.y + s.paddle.height);
      paddleGrad.addColorStop(0, isLaserActive ? '#fb7185' : '#38bdf8');
      paddleGrad.addColorStop(1, isLaserActive ? '#e11d48' : '#0284c7');

      ctx.fillStyle = paddleGrad;
      ctx.beginPath();
      ctx.roundRect(s.paddle.x, s.paddle.y, s.paddle.width, s.paddle.height, 6);
      ctx.fill();

      ctx.shadowBlur = 0;

      // Laser Gun Cannons on Paddle Ends
      if (isLaserActive) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(s.paddle.x + 4, s.paddle.y - 4, 4, 6);
        ctx.fillRect(s.paddle.x + s.paddle.width - 8, s.paddle.y - 4, 4, 6);
      }

      // Draw Lasers
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffe4e6';
      s.lasers.forEach(laser => {
        ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
      });
      ctx.shadowBlur = 0;

      // Draw Powerups
      s.powerups.forEach(p => {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.width, p.height, 8);
        ctx.fill();

        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = p.color;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.icon, p.x + p.width / 2, p.y + p.height / 2);
      });

      // Draw Balls
      const isFireball = s.activeEffects.fireballTimer > 0;
      s.balls.forEach(ball => {
        ctx.shadowColor = isFireball ? '#fb923c' : '#38bdf8';
        ctx.shadowBlur = isFireball ? 20 : 12;

        ctx.fillStyle = isFireball ? '#f97316' : '#ffffff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        if (isFireball) {
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.shadowBlur = 0;

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

      // Draw Floating Texts
      s.floatingTexts.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      animId = requestAnimationFrame(updateAndRender);
    };

    animId = requestAnimationFrame(updateAndRender);
    return () => cancelAnimationFrame(animId);
  }, [highScore, onGameOver]);

  const levelInfo = LEVELS[levelIdx % LEVELS.length];

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
                <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-rose-400 bg-clip-text text-transparent">
                  Neon Breakout
                </span>
                <span className="text-xs uppercase tracking-widest px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Arcade
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {levelInfo.name}
            </p>
          </div>
        </div>

        {/* STATS: Score, Best, Lives, Combo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Lives Indicator */}
          <div className="px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700/80 text-center flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                size={14}
                className={i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700'}
              />
            ))}
          </div>

          {/* Current Score */}
          <div className="px-3 sm:px-4 py-2 rounded-xl bg-slate-800/90 border border-slate-700/80 text-center min-w-[70px]">
            <div className="text-[10px] uppercase font-bold text-slate-400">Score</div>
            <div className="text-sm sm:text-base font-black text-white">{score}</div>
          </div>

          {/* Best Score */}
          <div className="hidden sm:block px-3 sm:px-4 py-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-center min-w-[70px]">
            <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center justify-center gap-1">
              <Trophy size={10} />
              <span>Best</span>
            </div>
            <div className="text-sm sm:text-base font-black text-amber-300">{highScore}</div>
          </div>

          {/* Combo Badge */}
          {combo > 1 && (
            <div className="px-2.5 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-center animate-bounce">
              <div className="text-[9px] uppercase font-bold text-cyan-400">Combo</div>
              <div className="text-xs font-black text-cyan-300">{combo}x</div>
            </div>
          )}

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

      {/* ACTIVE POWER-UPS BAR */}
      {activePowers.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {activePowers.map(p => (
            <div
              key={p.type}
              className="px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-xs text-indigo-200 flex items-center gap-2 shadow-sm"
            >
              <span>{p.icon}</span>
              <span className="font-bold">{p.label}</span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-900/80 text-[10px] font-mono text-indigo-300">
                {p.timeLeft}s
              </span>
            </div>
          ))}
        </div>
      )}

      {/* HELP DRAWER */}
      {showHelp && (
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-indigo-500/30 text-xs text-slate-300 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Sparkles size={16} />
            <span>How to Play Neon Breakout</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li><strong>Paddle Move:</strong> Move your mouse or drag your finger across the canvas, or use <span className="text-white font-mono">A / D</span> or <span className="text-white font-mono">Arrow Keys</span>.</li>
            <li><strong>Launch Ball / Fire Lasers:</strong> Tap screen or press <span className="text-white font-mono">Spacebar</span>.</li>
            <li><strong>Power-Ups:</strong> Catch falling capsules for ⚡ Multi-ball, 🛡️ Wide paddle, 🔫 Laser cannon, 🔥 Fireball, ⏱️ Slow-Mo, and ❤️ Extra Life!</li>
            <li><strong>Bomb Bricks (💣):</strong> Hitting a bomb brick shatters all adjacent bricks in a fiery blast!</li>
            <li><strong>Combos:</strong> Break multiple bricks in a single ball launch to unlock huge multiplier score bonuses.</li>
          </ul>
        </div>
      )}

      {/* CANVAS CONTAINER */}
      <div className="relative flex flex-col items-center">
        <div className="relative w-full max-w-[640px] aspect-[4/3] rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl shadow-indigo-950/50 bg-[#060814]">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseMove={handlePointerMove}
            onTouchMove={handlePointerMove}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-none block"
          />

          {/* READY OVERLAY */}
          {gameState === 'ready' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 mb-3 animate-pulse">
                <Play size={28} />
              </div>
              <h3 className="text-2xl font-black text-white mb-1">
                {levelInfo.name}
              </h3>
              <p className="text-xs text-slate-300 mb-5 max-w-xs">
                Press Spacebar or Click/Tap anywhere to launch the ball!
              </p>
              <button
                onClick={startGame}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/30 transition-all flex items-center gap-2"
              >
                <Play size={14} />
                <span>Launch Ball</span>
              </button>
            </div>
          )}

          {/* PAUSED OVERLAY */}
          {gameState === 'paused' && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 mb-3">
                <Pause size={28} />
              </div>
              <h3 className="text-2xl font-black text-white mb-4">Game Paused</h3>
              <button
                onClick={pauseGame}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                <Play size={14} />
                <span>Resume Game</span>
              </button>
            </div>
          )}

          {/* LEVEL CLEAR OVERLAY */}
          {gameState === 'level_clear' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mb-3 animate-bounce">
                <Award size={32} />
              </div>
              <h3 className="text-2xl font-black text-emerald-300 mb-1">
                Stage Complete!
              </h3>
              <p className="text-xs text-slate-300 mb-4">
                Score: <span className="font-bold text-white">{score}</span> | Max Combo: <span className="font-bold text-cyan-400">{stateRef.current.maxCombo}x</span>
              </p>
              <button
                onClick={advanceLevel}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
              >
                <span>Next Stage →</span>
              </button>
            </div>
          )}

          {/* GAME OVER OVERLAY */}
          {gameState === 'game_over' && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 mb-3">
                <Flame size={32} />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-1">
                Game Over!
              </h3>
              <p className="text-xs text-slate-400 mb-4">You ran out of lives.</p>

              <div className="grid grid-cols-2 gap-3 w-full max-w-[240px] mb-5">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Score</div>
                  <div className="text-base font-black text-white">{score}</div>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Max Combo</div>
                  <div className="text-base font-black text-cyan-400">{stateRef.current.maxCombo}x</div>
                </div>
              </div>

              <button
                onClick={restartGame}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-bold text-xs shadow-lg shadow-rose-500/30 transition-all flex items-center gap-2"
              >
                <RotateCcw size={14} />
                <span>Play Again</span>
              </button>
            </div>
          )}

          {/* ALL LEVELS VICTORY OVERLAY */}
          {gameState === 'victory' && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mb-3 animate-bounce">
                <Award size={36} />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-300 mb-1">
                Arcade Champion!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mb-5 max-w-xs">
                You shattered every brick across all 5 stages with a grand score of <span className="font-bold text-white">{score}</span>!
              </p>
              <button
                onClick={restartGame}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition-all flex items-center gap-2"
              >
                <RotateCcw size={14} />
                <span>Play from Stage 1</span>
              </button>
            </div>
          )}
        </div>

        {/* ON-SCREEN DIRECTIONAL CONTROLS (For mobile / touch players) */}
        <div className="flex sm:hidden items-center justify-center gap-4 mt-4 w-full">
          <button
            onTouchStart={() => { stateRef.current.paddle.dx = -stateRef.current.paddle.speed; }}
            onTouchEnd={() => { stateRef.current.paddle.dx = 0; }}
            onMouseDown={() => { stateRef.current.paddle.dx = -stateRef.current.paddle.speed; }}
            onMouseUp={() => { stateRef.current.paddle.dx = 0; }}
            className="flex-1 py-3 bg-slate-800 active:bg-cyan-600 rounded-2xl border border-slate-700 flex items-center justify-center text-slate-300 active:text-white"
          >
            <ArrowL size={22} />
          </button>

          {stateRef.current.activeEffects.laserTimer > 0 && (
            <button
              onClick={fireLasers}
              className="px-6 py-3 bg-rose-600 active:bg-rose-500 rounded-2xl border border-rose-400 flex items-center justify-center text-white font-bold text-xs"
            >
              <Crosshair size={20} />
            </button>
          )}

          <button
            onTouchStart={() => { stateRef.current.paddle.dx = stateRef.current.paddle.speed; }}
            onTouchEnd={() => { stateRef.current.paddle.dx = 0; }}
            onMouseDown={() => { stateRef.current.paddle.dx = stateRef.current.paddle.speed; }}
            onMouseUp={() => { stateRef.current.paddle.dx = 0; }}
            className="flex-1 py-3 bg-slate-800 active:bg-cyan-600 rounded-2xl border border-slate-700 flex items-center justify-center text-slate-300 active:text-white"
          >
            <ArrowR size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

