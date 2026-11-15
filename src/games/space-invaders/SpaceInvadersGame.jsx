import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, RotateCcw, Volume2, VolumeX, Trophy, Pause, Play, 
  HelpCircle, Shield, Zap, Sparkles, Award, Flame,
  ArrowLeft as ArrowL, ArrowRight as ArrowR, Crosshair
} from 'lucide-react';
import { sounds } from '../../services/sound';
import { storage } from '../../services/storage';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;

// Invader Types Configuration
const INVADER_TYPES = {
  squid: { points: 30, color: '#ec4899', glow: 'rgba(236, 72, 153, 0.5)' },
  crab: { points: 20, color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.5)' },
  octopus: { points: 10, color: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' }
};

// Powerup Types
const POWERUP_TYPES = [
  { type: 'triple', label: 'Triple Plasma', icon: '⚡', color: '#38bdf8' },
  { type: 'rapid', label: 'Rapid Fire', icon: '🔥', color: '#f59e0b' },
  { type: 'shield', label: 'Energy Shield', icon: '🛡️', color: '#10b981' },
  { type: 'emp', label: 'EMP Detonator', icon: '💣', color: '#a855f7' }
];

export const SpaceInvadersGame = ({ onGameOver, onBack }) => {
  const canvasRef = useRef(null);

  // React Display States
  const [gameState, setGameState] = useState('ready'); // ready, playing, paused, wave_clear, game_over
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(() => storage.getHighScore('space-invaders'));
  const [isMuted, setIsMuted] = useState(() => sounds.getMuted());
  const [showHelp, setShowHelp] = useState(false);
  const [activePower, setActivePower] = useState(null); // { type, timeLeft }

  // Mutable Game Loop State
  const stateRef = useRef({
    gameState: 'ready',
    score: 0,
    wave: 1,
    lives: 3,
    highScore: 0,
    player: {
      x: CANVAS_WIDTH / 2 - 18,
      y: CANVAS_HEIGHT - 38,
      width: 36,
      height: 18,
      speed: 6.5,
      dx: 0,
      shieldHp: 0
    },
    invaders: [],
    invaderDirection: 1, // 1: right, -1: left
    invaderStepTimer: 0,
    invaderStepInterval: 800, // ms between steps (accelerates as invaders die)
    invaderFrame: 0, // 0 or 1 for sprite animation
    marchStep: 0,
    lasers: [],
    alienBombs: [],
    bunkers: [],
    particles: [],
    floatingTexts: [],
    powerups: [],
    stars: [],
    ufo: null,
    ufoTimer: 1200, // frames until next UFO
    lastPlayerShot: 0,
    activePowerup: {
      type: null,
      timer: 0
    }
  });

  const toggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Build Destructible Bunkers
  const initBunkers = useCallback(() => {
    const bunkers = [];
    const bunkerCount = 4;
    const bunkerWidth = 48;
    const bunkerHeight = 32;
    const spacing = (CANVAS_WIDTH - bunkerCount * bunkerWidth) / (bunkerCount + 1);

    for (let b = 0; b < bunkerCount; b++) {
      const startX = spacing + b * (bunkerWidth + spacing);
      const startY = CANVAS_HEIGHT - 100;
      const blocks = [];
      const rows = 4;
      const cols = 6;
      const blockW = bunkerWidth / cols;
      const blockH = bunkerHeight / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Carve out center archway at bottom of bunker
          if (r >= 2 && (c === 2 || c === 3)) continue;
          // Soften top corners
          if (r === 0 && (c === 0 || c === cols - 1)) continue;

          blocks.push({
            x: startX + c * blockW,
            y: startY + r * blockH,
            w: blockW,
            h: blockH,
            hp: 3 // Max 3 hits
          });
        }
      }

      bunkers.push({ id: b, blocks });
    }
    return bunkers;
  }, []);

  // Build Invaders Formation
  const initInvaders = useCallback((waveNum = 1) => {
    const rows = 5;
    const cols = 10;
    const invWidth = 26;
    const invHeight = 18;
    const paddingX = 16;
    const paddingY = 14;
    const startX = 60;
    const startY = 65 + Math.min(80, (waveNum - 1) * 12); // Waves start progressively lower

    const invaders = [];
    for (let r = 0; r < rows; r++) {
      let type = 'octopus';
      if (r === 0) type = 'squid';
      else if (r === 1 || r === 2) type = 'crab';

      for (let c = 0; c < cols; c++) {
        invaders.push({
          id: `${r}-${c}`,
          r,
          c,
          type,
          x: startX + c * (invWidth + paddingX),
          y: startY + r * (invHeight + paddingY),
          width: invWidth,
          height: invHeight,
          alive: true
        });
      }
    }
    return invaders;
  }, []);

  // Initialize Stars
  const initStars = useCallback(() => {
    const stars = [];
    for (let i = 0; i < 65; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 1.8 + 0.6,
        speed: Math.random() * 0.4 + 0.1,
        alpha: Math.random() * 0.7 + 0.3
      });
    }
    return stars;
  }, []);

  // Particles & Text Helpers
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
        size: Math.random() * 2.5 + 1.5,
        color,
        alpha: 1
      });
    }
  };

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

  // Player Fire Laser
  const firePlayerLaser = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState !== 'playing') return;

    const now = Date.now();
    const isRapid = s.activePowerup.type === 'rapid' && s.activePowerup.timer > 0;
    const cooldown = isRapid ? 130 : 280;

    if (now - s.lastPlayerShot < cooldown) return;
    s.lastPlayerShot = now;

    sounds.playLaserShot();
    const gunX = s.player.x + s.player.width / 2;
    const gunY = s.player.y;

    if (s.activePowerup.type === 'triple' && s.activePowerup.timer > 0) {
      // 3 beams (center, left slant, right slant)
      s.lasers.push(
        { x: gunX, y: gunY, vx: 0, vy: -8, width: 3, height: 12, isEmp: false },
        { x: gunX - 8, y: gunY + 4, vx: -1.5, vy: -7.5, width: 3, height: 12, isEmp: false },
        { x: gunX + 8, y: gunY + 4, vx: 1.5, vy: -7.5, width: 3, height: 12, isEmp: false }
      );
    } else if (s.activePowerup.type === 'emp' && s.activePowerup.timer > 0) {
      s.lasers.push({
        x: gunX,
        y: gunY,
        vx: 0,
        vy: -7,
        width: 6,
        height: 14,
        isEmp: true
      });
    } else {
      s.lasers.push({
        x: gunX,
        y: gunY,
        vx: 0,
        vy: -8,
        width: 3,
        height: 12,
        isEmp: false
      });
    }
  }, []);

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

  // Advance to Next Wave
  const advanceWave = () => {
    sounds.playClick();
    const s = stateRef.current;
    const nextWave = s.wave + 1;
    s.wave = nextWave;
    s.invaders = initInvaders(nextWave);
    s.bunkers = initBunkers();
    s.lasers = [];
    s.alienBombs = [];
    s.powerups = [];
    s.ufo = null;
    s.invaderDirection = 1;
    s.invaderStepInterval = Math.max(350, 800 - (nextWave - 1) * 70);
    s.gameState = 'ready';

    setWave(nextWave);
    setGameState('ready');
  };

  // Restart Entire Game
  const restartGame = () => {
    sounds.playClick();
    const s = stateRef.current;
    s.score = 0;
    s.wave = 1;
    s.lives = 3;
    s.player.x = CANVAS_WIDTH / 2 - 18;
    s.player.shieldHp = 0;
    s.invaders = initInvaders(1);
    s.bunkers = initBunkers();
    s.lasers = [];
    s.alienBombs = [];
    s.powerups = [];
    s.particles = [];
    s.floatingTexts = [];
    s.ufo = null;
    s.activePowerup = { type: null, timer: 0 };
    s.invaderDirection = 1;
    s.invaderStepInterval = 800;
    s.gameState = 'ready';

    setScore(0);
    setWave(1);
    setLives(3);
    setActivePower(null);
    setGameState('ready');
  };

  // Setup Initial State on Mount
  useEffect(() => {
    const s = stateRef.current;
    s.invaders = initInvaders(1);
    s.bunkers = initBunkers();
    s.stars = initStars();
    s.highScore = storage.getHighScore('space-invaders');
  }, [initInvaders, initBunkers, initStars]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      const s = stateRef.current;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        s.player.dx = -s.player.speed;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        s.player.dx = s.player.speed;
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (s.gameState === 'ready') {
          startGame();
        } else if (s.gameState === 'playing') {
          firePlayerLaser();
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
        s.player.dx = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [firePlayerLaser]);

  // Mouse / Touch Tracking
  const handlePointerMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const canvasX = (clientX - rect.left) * scaleX;

    const s = stateRef.current;
    s.player.x = Math.max(10, Math.min(CANVAS_WIDTH - s.player.width - 10, canvasX - s.player.width / 2));
  };

  const handleCanvasClick = () => {
    const s = stateRef.current;
    if (s.gameState === 'ready') {
      startGame();
    } else if (s.gameState === 'playing') {
      firePlayerLaser();
    }
  };

  // Main 60fps Game Loop
  useEffect(() => {
    let animId;
    let lastTime = performance.now();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateAndRender = (now) => {
      const dt = now - lastTime;
      lastTime = now;
      const s = stateRef.current;

      // Update background stars
      s.stars.forEach(st => {
        st.y += st.speed;
        if (st.y > CANVAS_HEIGHT) {
          st.y = 0;
          st.x = Math.random() * CANVAS_WIDTH;
        }
      });

      // --- GAMEPLAY UPDATE (When playing) ---
      if (s.gameState === 'playing') {
        // Player Movement via Keys
        if (s.player.dx !== 0) {
          s.player.x = Math.max(10, Math.min(CANVAS_WIDTH - s.player.width - 10, s.player.x + s.player.dx));
        }

        // Active Powerup Countdown
        if (s.activePowerup.timer > 0) {
          s.activePowerup.timer -= 1 / 60;
          if (s.activePowerup.timer <= 0) {
            s.activePowerup.type = null;
            setActivePower(null);
          } else {
            setActivePower({
              type: s.activePowerup.type,
              timeLeft: Math.ceil(s.activePowerup.timer)
            });
          }
        }

        // --- INVADER MARCHING RHYTHM ---
        s.invaderStepTimer += dt;
        const aliveInvaders = s.invaders.filter(inv => inv.alive);
        const aliveCount = aliveInvaders.length;

        // Dynamic accelerating step cadence
        const baseInterval = Math.max(70, (aliveCount / 50) * s.invaderStepInterval);

        if (s.invaderStepTimer >= baseInterval && aliveCount > 0) {
          s.invaderStepTimer = 0;
          s.invaderFrame = s.invaderFrame === 0 ? 1 : 0;
          s.marchStep = (s.marchStep + 1) % 4;
          sounds.playInvaderStep(s.marchStep);

          // Check if any alive invader touches boundaries
          let shouldDropAndReverse = false;
          for (let inv of aliveInvaders) {
            if (s.invaderDirection === 1 && inv.x + inv.width >= CANVAS_WIDTH - 20) {
              shouldDropAndReverse = true;
              break;
            } else if (s.invaderDirection === -1 && inv.x <= 20) {
              shouldDropAndReverse = true;
              break;
            }
          }

          if (shouldDropAndReverse) {
            s.invaderDirection *= -1;
            aliveInvaders.forEach(inv => {
              inv.y += 16;
            });
          } else {
            const stepDx = 11 * s.invaderDirection;
            aliveInvaders.forEach(inv => {
              inv.x += stepDx;
            });
          }

          // Check if invaders breached the player baseline
          for (let inv of aliveInvaders) {
            if (inv.y + inv.height >= s.player.y) {
              // Direct invasion!
              s.gameState = 'game_over';
              setGameState('game_over');
              sounds.playExplosion();
              storage.recordScore('space-invaders', s.score, { wave: s.wave });
              if (onGameOver) onGameOver(s.score);
              break;
            }
          }
        }

        // --- INVADER BOMB DROPS ---
        // Frequency scales with wave
        const bombChance = 0.022 + Math.min(0.04, (s.wave - 1) * 0.006);
        if (Math.random() < bombChance && aliveCount > 0 && s.alienBombs.length < 5) {
          // Pick bottom-most alive invader from random column
          const colsWithAlive = {};
          aliveInvaders.forEach(inv => {
            if (!colsWithAlive[inv.c] || inv.r > colsWithAlive[inv.c].r) {
              colsWithAlive[inv.c] = inv;
            }
          });
          const shootCandidates = Object.values(colsWithAlive);
          if (shootCandidates.length > 0) {
            const shooter = shootCandidates[Math.floor(Math.random() * shootCandidates.length)];
            s.alienBombs.push({
              x: shooter.x + shooter.width / 2,
              y: shooter.y + shooter.height,
              vy: 4.2 + (s.wave - 1) * 0.3,
              width: 3,
              height: 10
            });
            sounds.playInvaderShoot();
          }
        }

        // --- UFO FLYING SAUCER LOGIC ---
        s.ufoTimer -= 1;
        if (s.ufoTimer <= 0 && !s.ufo) {
          const fromLeft = Math.random() > 0.5;
          s.ufo = {
            x: fromLeft ? -45 : CANVAS_WIDTH + 10,
            y: 35,
            vx: fromLeft ? 2.5 : -2.5,
            width: 40,
            height: 18,
            points: [50, 100, 150, 300][Math.floor(Math.random() * 4)]
          };
          s.ufoTimer = 1100 + Math.random() * 800;
          sounds.playUfoSound();
        }

        if (s.ufo) {
          s.ufo.x += s.ufo.vx;
          if (Math.random() < 0.04) sounds.playUfoSound();
          if (s.ufo.vx > 0 && s.ufo.x > CANVAS_WIDTH + 50) s.ufo = null;
          else if (s.ufo.vx < 0 && s.ufo.x < -60) s.ufo = null;
        }

        // --- UPDATE PLAYER LASERS ---
        const remainingLasers = [];
        for (let laser of s.lasers) {
          laser.x += laser.vx || 0;
          laser.y += laser.vy;
          let laserConsumed = false;

          // Check UFO collision
          if (
            s.ufo &&
            laser.x >= s.ufo.x &&
            laser.x <= s.ufo.x + s.ufo.width &&
            laser.y >= s.ufo.y &&
            laser.y <= s.ufo.y + s.ufo.height
          ) {
            laserConsumed = true;
            s.score += s.ufo.points;
            setScore(s.score);
            sounds.playUfoHit();
            spawnParticles(s.ufo.x + s.ufo.width / 2, s.ufo.y + s.ufo.height / 2, '#f59e0b', 24);
            addFloatingText(`+${s.ufo.points} UFO!`, s.ufo.x, s.ufo.y, '#fbbf24');
            s.ufo = null;
          }

          // Check Bunker collision
          if (!laserConsumed) {
            for (let bunker of s.bunkers) {
              for (let block of bunker.blocks) {
                if (
                  block.hp > 0 &&
                  laser.x >= block.x &&
                  laser.x <= block.x + block.w &&
                  laser.y >= block.y &&
                  laser.y <= block.y + block.h
                ) {
                  block.hp -= 1;
                  laserConsumed = true;
                  spawnParticles(laser.x, laser.y, '#10b981', 4);
                  break;
                }
              }
              if (laserConsumed) break;
            }
          }

          // Check Invader collision
          if (!laserConsumed) {
            for (let inv of s.invaders) {
              if (!inv.alive) continue;
              if (
                laser.x >= inv.x &&
                laser.x <= inv.x + inv.width &&
                laser.y >= inv.y &&
                laser.y <= inv.y + inv.height
              ) {
                laserConsumed = true;
                inv.alive = false;
                const pts = INVADER_TYPES[inv.type].points * s.wave;
                s.score += pts;
                setScore(s.score);
                sounds.playInvaderExplode();
                spawnParticles(inv.x + inv.width / 2, inv.y + inv.height / 2, INVADER_TYPES[inv.type].color, 14);
                addFloatingText(`+${pts}`, inv.x, inv.y, INVADER_TYPES[inv.type].color);

                // EMP Detonator Explosion
                if (laser.isEmp) {
                  sounds.playExplosion();
                  spawnParticles(inv.x + inv.width / 2, inv.y + inv.height / 2, '#c084fc', 30);
                  s.invaders.forEach(otherInv => {
                    if (otherInv.alive && Math.hypot(otherInv.x - inv.x, otherInv.y - inv.y) < 65) {
                      otherInv.alive = false;
                      s.score += 20 * s.wave;
                      spawnParticles(otherInv.x + otherInv.width / 2, otherInv.y + otherInv.height / 2, INVADER_TYPES[otherInv.type].color, 8);
                    }
                  });
                }

                // Random Powerup Drop (~12% chance)
                if (Math.random() < 0.12) {
                  const pType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
                  s.powerups.push({
                    ...pType,
                    x: inv.x + inv.width / 2 - 14,
                    y: inv.y,
                    vy: 2.2,
                    width: 28,
                    height: 16
                  });
                }

                // High score update
                if (s.score > s.highScore) {
                  s.highScore = s.score;
                  setHighScore(s.score);
                  storage.recordScore('space-invaders', s.score, { wave: s.wave });
                }
                break;
              }
            }
          }

          if (!laserConsumed && laser.y > 0) {
            remainingLasers.push(laser);
          }
        }
        s.lasers = remainingLasers;

        // --- UPDATE ALIEN BOMBS ---
        const remainingBombs = [];
        for (let bomb of s.alienBombs) {
          bomb.y += bomb.vy;
          let bombConsumed = false;

          // Check Bunker collision
          for (let bunker of s.bunkers) {
            for (let block of bunker.blocks) {
              if (
                block.hp > 0 &&
                bomb.x >= block.x &&
                bomb.x <= block.x + block.w &&
                bomb.y >= block.y &&
                bomb.y <= block.y + block.h
              ) {
                block.hp -= 1;
                bombConsumed = true;
                spawnParticles(bomb.x, bomb.y, '#ef4444', 4);
                break;
              }
            }
            if (bombConsumed) break;
          }

          // Check Player Ship collision
          if (!bombConsumed) {
            if (
              bomb.x >= s.player.x &&
              bomb.x <= s.player.x + s.player.width &&
              bomb.y >= s.player.y &&
              bomb.y <= s.player.y + s.player.height
            ) {
              bombConsumed = true;

              if (s.player.shieldHp > 0) {
                // Shield absorbs hit
                s.player.shieldHp -= 1;
                sounds.playPaddleHit();
                spawnParticles(bomb.x, bomb.y, '#38bdf8', 12);
                addFloatingText('SHIELD BLOCKED!', s.player.x, s.player.y - 12, '#38bdf8');
              } else {
                // Direct Ship Hit
                sounds.playLifeLost();
                spawnParticles(s.player.x + s.player.width / 2, s.player.y + s.player.height / 2, '#ef4444', 24);
                s.lives -= 1;
                setLives(s.lives);

                if (s.lives <= 0) {
                  s.gameState = 'game_over';
                  setGameState('game_over');
                  storage.recordScore('space-invaders', s.score, { wave: s.wave });
                  if (onGameOver) onGameOver(s.score);
                } else {
                  // Brief invulnerability / reset position
                  s.player.x = CANVAS_WIDTH / 2 - 18;
                }
              }
            }
          }

          if (!bombConsumed && bomb.y < CANVAS_HEIGHT) {
            remainingBombs.push(bomb);
          }
        }
        s.alienBombs = remainingBombs;

        // --- UPDATE POWERUPS ---
        const remainingPowerups = [];
        for (let p of s.powerups) {
          p.y += p.vy;

          if (
            p.y + p.height >= s.player.y &&
            p.y <= s.player.y + s.player.height &&
            p.x + p.width >= s.player.x &&
            p.x <= s.player.x + s.player.width
          ) {
            sounds.playPowerup();
            addFloatingText(`${p.label}!`, p.x, p.y, p.color);

            if (p.type === 'shield') {
              s.player.shieldHp = 2;
            } else {
              s.activePowerup = {
                type: p.type,
                timer: 10
              };
            }
          } else if (p.y < CANVAS_HEIGHT) {
            remainingPowerups.push(p);
          }
        }
        s.powerups = remainingPowerups;

        // Check Wave Clear (All 50 invaders destroyed)
        if (aliveCount === 0) {
          s.gameState = 'wave_clear';
          setGameState('wave_clear');
          sounds.playVictory();
          confetti({ particleCount: 120, spread: 75 });
          const waveBonus = 1000 * s.wave;
          s.score += waveBonus;
          setScore(s.score);
        }
      }

      // --- PARTICLES & FLOATING TEXTS ---
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

      // Deep space black background
      ctx.fillStyle = '#050711';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Twinkling Stars
      s.stars.forEach(st => {
        ctx.fillStyle = `rgba(255, 255, 255, ${st.alpha})`;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ground Defense Barrier Line
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT - 12);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 12);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Bunkers
      s.bunkers.forEach(bunker => {
        bunker.blocks.forEach(block => {
          if (block.hp <= 0) return;
          const alpha = block.hp === 3 ? 0.9 : (block.hp === 2 ? 0.6 : 0.3);
          ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
          ctx.fillRect(block.x, block.y, block.w, block.h);
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(block.x, block.y, block.w, block.h);
        });
      });

      // Draw Invaders with Animated Sprites
      const frame = s.invaderFrame;
      s.invaders.forEach(inv => {
        if (!inv.alive) return;
        const info = INVADER_TYPES[inv.type];
        ctx.shadowColor = info.glow;
        ctx.shadowBlur = 8;
        ctx.fillStyle = info.color;

        const ix = inv.x;
        const iy = inv.y;
        const iw = inv.width;
        const ih = inv.height;

        // Custom Pixel-Style Retro Silhouette
        if (inv.type === 'squid') {
          // Top Squid
          ctx.fillRect(ix + 8, iy, iw - 16, ih - 6);
          ctx.fillRect(ix + 4, iy + 4, iw - 8, ih - 8);
          // Eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(ix + 7, iy + 6, 3, 3);
          ctx.fillRect(ix + iw - 10, iy + 6, 3, 3);
          // Animated Tentacles
          ctx.fillStyle = info.color;
          if (frame === 0) {
            ctx.fillRect(ix + 2, iy + ih - 4, 4, 4);
            ctx.fillRect(ix + iw - 6, iy + ih - 4, 4, 4);
            ctx.fillRect(ix + 10, iy + ih - 4, iw - 20, 4);
          } else {
            ctx.fillRect(ix + 6, iy + ih - 4, 4, 4);
            ctx.fillRect(ix + iw - 10, iy + ih - 4, 4, 4);
          }
        } else if (inv.type === 'crab') {
          // Middle Crab
          ctx.fillRect(ix + 4, iy + 2, iw - 8, ih - 6);
          ctx.fillRect(ix + 2, iy + 6, iw - 4, ih - 10);
          // Eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(ix + 6, iy + 4, 3, 3);
          ctx.fillRect(ix + iw - 9, iy + 4, 3, 3);
          // Legs
          ctx.fillStyle = info.color;
          if (frame === 0) {
            ctx.fillRect(ix, iy + ih - 4, 4, 4);
            ctx.fillRect(ix + iw - 4, iy + ih - 4, 4, 4);
            ctx.fillRect(ix + 8, iy + ih - 2, 4, 2);
            ctx.fillRect(ix + iw - 12, iy + ih - 2, 4, 2);
          } else {
            ctx.fillRect(ix + 2, iy + ih - 4, 4, 4);
            ctx.fillRect(ix + iw - 6, iy + ih - 4, 4, 4);
          }
        } else {
          // Bottom Octopus
          ctx.fillRect(ix + 4, iy + 2, iw - 8, ih - 4);
          ctx.fillRect(ix + 2, iy + 4, iw - 4, ih - 8);
          // Eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(ix + 6, iy + 5, 3, 3);
          ctx.fillRect(ix + iw - 9, iy + 5, 3, 3);
          // Tentacles
          ctx.fillStyle = info.color;
          if (frame === 0) {
            ctx.fillRect(ix + 2, iy + ih - 3, 3, 3);
            ctx.fillRect(ix + 8, iy + ih - 3, 3, 3);
            ctx.fillRect(ix + 15, iy + ih - 3, 3, 3);
            ctx.fillRect(ix + iw - 5, iy + ih - 3, 3, 3);
          } else {
            ctx.fillRect(ix + 4, iy + ih - 3, 4, 3);
            ctx.fillRect(ix + iw - 8, iy + ih - 3, 4, 3);
          }
        }
      });
      ctx.shadowBlur = 0;

      // Draw UFO Saucer
      if (s.ufo) {
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 15;
        // Saucer dome
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(s.ufo.x + s.ufo.width / 2, s.ufo.y + 4, 8, Math.PI, 0);
        ctx.fill();
        // Saucer rim
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.roundRect(s.ufo.x, s.ufo.y + 4, s.ufo.width, 10, 5);
        ctx.fill();
        // Flashing lights
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(s.ufo.x + 6, s.ufo.y + 8, 4, 2);
        ctx.fillRect(s.ufo.x + s.ufo.width / 2 - 2, s.ufo.y + 8, 4, 2);
        ctx.fillRect(s.ufo.x + s.ufo.width - 10, s.ufo.y + 8, 4, 2);
        ctx.shadowBlur = 0;
      }

      // Draw Powerups
      s.powerups.forEach(p => {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
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

      // Draw Player Cannon
      const px = s.player.x;
      const py = s.player.y;
      const pw = s.player.width;
      const ph = s.player.height;

      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;

      // Cyber Cannon Hull
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.roundRect(px, py + 8, pw, ph - 8, 4);
      ctx.fill();

      // Gun Turret
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + pw / 2 - 3, py, 6, 10);
      ctx.fillRect(px + 4, py + 5, 4, 6);
      ctx.fillRect(px + pw - 8, py + 5, 4, 6);

      // Shield Bubble Indicator
      if (s.player.shieldHp > 0) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px + pw / 2, py + ph / 2, pw * 0.75, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // Draw Player Lasers
      s.lasers.forEach(laser => {
        ctx.shadowColor = laser.isEmp ? '#c084fc' : '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.fillStyle = laser.isEmp ? '#e9d5ff' : '#bae6fd';
        ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
      });
      ctx.shadowBlur = 0;

      // Draw Alien Bombs
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#fca5a5';
      s.alienBombs.forEach(b => {
        ctx.fillRect(b.x - 1, b.y, b.width, b.height);
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
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      animId = requestAnimationFrame(updateAndRender);
    };

    animId = requestAnimationFrame(updateAndRender);
    return () => cancelAnimationFrame(animId);
  }, [onGameOver]);

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
                <span className="bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Space Invaders Neon
                </span>
                <span className="text-xs uppercase tracking-widest px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  Wave {wave}
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Defend Earth from the incoming cyber fleet!
            </p>
          </div>
        </div>

        {/* STATS: Score, Best, Lives */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Lives Indicator */}
          <div className="px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700/80 text-center flex items-center gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={`text-sm ${i < lives ? 'text-cyan-400' : 'text-slate-700 opacity-40'}`}
              >
                🚀
              </span>
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

      {/* ACTIVE POWERUP BADGE */}
      {activePower && (
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-xs text-purple-200 flex items-center gap-2 shadow-sm animate-pulse">
            <Zap size={14} className="text-amber-400" />
            <span className="font-bold">{activePower.type.toUpperCase()} ACTIVE</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-900/80 text-[10px] font-mono text-purple-300">
              {activePower.timeLeft}s
            </span>
          </div>
        </div>
      )}

      {/* HELP DRAWER */}
      {showHelp && (
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-indigo-500/30 text-xs text-slate-300 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Sparkles size={16} />
            <span>How to Play Space Invaders Neon</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li><strong>Steer Cannon:</strong> Use <span className="text-white font-mono">Arrow Left / Right</span> or <span className="text-white font-mono">A / D</span>, or drag with mouse/touch.</li>
            <li><strong>Fire Laser:</strong> Press <span className="text-white font-mono">Spacebar</span> or tap the canvas.</li>
            <li><strong>Defense Bunkers:</strong> Take cover behind green energy shields. Beware: lasers and alien bombs will erode them over time!</li>
            <li><strong>Mystery UFO (🛸):</strong> Snipe the bonus flying saucer when it sweeps across the top for up to <span className="text-amber-400 font-bold">+300 bonus points</span>.</li>
            <li><strong>Speed Acceleration:</strong> The fewer invaders left standing, the faster their marching cadence becomes!</li>
          </ul>
        </div>
      )}

      {/* CANVAS CONTAINER */}
      <div className="relative flex flex-col items-center">
        <div className="relative w-full max-w-[640px] aspect-[4/3] rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl shadow-indigo-950/50 bg-[#050711]">
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
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-400 mb-3 animate-pulse">
                <Play size={28} />
              </div>
              <h3 className="text-2xl font-black text-white mb-1">
                Wave {wave} Ready
              </h3>
              <p className="text-xs text-slate-300 mb-5 max-w-xs">
                Press Spacebar or Click/Tap anywhere to begin the defense!
              </p>
              <button
                onClick={startGame}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-500/30 transition-all flex items-center gap-2"
              >
                <Play size={14} />
                <span>Start Defense</span>
              </button>
            </div>
          )}

          {/* PAUSED OVERLAY */}
          {gameState === 'paused' && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 mb-3">
                <Pause size={28} />
              </div>
              <h3 className="text-2xl font-black text-white mb-4">Defense Paused</h3>
              <button
                onClick={pauseGame}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                <Play size={14} />
                <span>Resume</span>
              </button>
            </div>
          )}

          {/* WAVE CLEAR OVERLAY */}
          {gameState === 'wave_clear' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mb-3 animate-bounce">
                <Award size={32} />
              </div>
              <h3 className="text-2xl font-black text-emerald-300 mb-1">
                Wave {wave} Neutralized!
              </h3>
              <p className="text-xs text-slate-300 mb-4">
                Fleet annihilated! Wave Clearance Bonus: <span className="font-bold text-white">+{1000 * wave} pts</span>
              </p>
              <button
                onClick={advanceWave}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
              >
                <span>Advance to Wave {wave + 1} →</span>
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
                Earth Overrun!
              </h3>
              <p className="text-xs text-slate-400 mb-4">Your defense cannon was destroyed.</p>

              <div className="grid grid-cols-2 gap-3 w-full max-w-[240px] mb-5">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Final Score</div>
                  <div className="text-base font-black text-white">{score}</div>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Wave Reached</div>
                  <div className="text-base font-black text-purple-400">{wave}</div>
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
        </div>

        {/* ON-SCREEN DIRECTIONAL CONTROLS (For mobile / tablet users) */}
        <div className="flex sm:hidden items-center justify-center gap-3 mt-4 w-full">
          <button
            onTouchStart={() => { stateRef.current.player.dx = -stateRef.current.player.speed; }}
            onTouchEnd={() => { stateRef.current.player.dx = 0; }}
            onMouseDown={() => { stateRef.current.player.dx = -stateRef.current.player.speed; }}
            onMouseUp={() => { stateRef.current.player.dx = 0; }}
            className="flex-1 py-3 bg-slate-800 active:bg-cyan-600 rounded-2xl border border-slate-700 flex items-center justify-center text-slate-300 active:text-white"
          >
            <ArrowL size={22} />
          </button>

          <button
            onClick={firePlayerLaser}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 active:from-purple-500 active:to-pink-500 rounded-2xl border border-purple-400 flex items-center justify-center text-white font-bold text-xs gap-1.5 shadow-lg shadow-purple-600/30"
          >
            <Crosshair size={18} />
            <span>FIRE</span>
          </button>

          <button
            onTouchStart={() => { stateRef.current.player.dx = stateRef.current.player.speed; }}
            onTouchEnd={() => { stateRef.current.player.dx = 0; }}
            onMouseDown={() => { stateRef.current.player.dx = stateRef.current.player.speed; }}
            onMouseUp={() => { stateRef.current.player.dx = 0; }}
            className="flex-1 py-3 bg-slate-800 active:bg-cyan-600 rounded-2xl border border-slate-700 flex items-center justify-center text-slate-300 active:text-white"
          >
            <ArrowR size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

