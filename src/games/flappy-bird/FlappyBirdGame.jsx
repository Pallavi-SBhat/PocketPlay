import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Volume2, VolumeX, Trophy, ArrowLeft, Pause, Award } from 'lucide-react';
import { sounds } from '../../services/sound';
import { storage } from '../../services/storage';

export const FlappyBirdGame = ({ onGameOver, onBack }) => {
  const canvasRef = useRef(null);
  
  // Game states: 'idle' | 'playing' | 'gameover' | 'paused'
  const [gameState, setGameState] = useState('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => storage.getHighScore('flappy-bird'));
  const [isMuted, setIsMuted] = useState(() => sounds.getMuted());
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Constants
  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 600;
  const GRAVITY = 0.38;
  const JUMP_FORCE = -7.2;
  const PIPE_SPEED = 2.4;
  const PIPE_SPAWN_INTERVAL = 110; // frames
  const PIPE_GAP = 145;
  const PIPE_WIDTH = 64;
  const GROUND_HEIGHT = 80;

  // Mutable game simulation refs
  const stateRef = useRef({
    gameState: 'idle',
    score: 0,
    birdY: CANVAS_HEIGHT / 2 - 50,
    birdVelocity: 0,
    birdRotation: 0,
    birdFrame: 0,
    pipes: [],
    particles: [],
    frameCount: 0,
    groundOffset: 0,
    skyOffset: 0,
    lastScore: 0,
  });

  const toggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const createParticles = (x, y, count, colors) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
        life: 0,
        maxLife: 25 + Math.random() * 20,
      });
    }
  };

  const restartGame = useCallback(() => {
    const s = stateRef.current;
    s.gameState = 'idle';
    s.score = 0;
    s.birdY = CANVAS_HEIGHT / 2 - 50;
    s.birdVelocity = 0;
    s.birdRotation = 0;
    s.birdFrame = 0;
    s.pipes = [];
    s.particles = [];
    s.frameCount = 0;
    s.groundOffset = 0;
    s.skyOffset = 0;
    s.lastScore = 0;

    setScore(0);
    setGameState('idle');
    setIsNewRecord(false);
  }, []);

  const handleJump = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState === 'idle') {
      s.gameState = 'playing';
      setGameState('playing');
      s.birdVelocity = JUMP_FORCE;
      sounds.playFlap();
      createParticles(70, s.birdY, 6, ['#fbbf24', '#fef08a', '#ffffff']);
      return;
    }

    if (s.gameState === 'playing') {
      s.birdVelocity = JUMP_FORCE;
      sounds.playFlap();
      createParticles(70, s.birdY, 6, ['#fbbf24', '#fef08a', '#ffffff']);
    } else if (s.gameState === 'gameover') {
      restartGame();
    }
  }, [restartGame]);

  const triggerGameOver = useCallback(() => {
    const s = stateRef.current;
    s.gameState = 'gameover';
    setGameState('gameover');
    sounds.playCrash();

    createParticles(70, s.birdY, 35, ['#ef4444', '#f97316', '#fbbf24', '#ffffff']);

    const finalScore = s.score;
    storage.recordScore('flappy-bird', finalScore);

    const prevUserHigh = storage.getUserHighScore('flappy-bird');
    if (finalScore > prevUserHigh || finalScore > highScore) {
      setIsNewRecord(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      sounds.playVictory();
    } else {
      setIsNewRecord(false);
    }

    setHighScore(storage.getHighScore('flappy-bird'));

    if (onGameOver) {
      onGameOver(finalScore);
    }
  }, [highScore, onGameOver]);

  // Listen to keyboard (Space, ArrowUp)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      } else if (e.code === 'KeyP') {
        if (stateRef.current.gameState === 'playing') {
          stateRef.current.gameState = 'paused';
          setGameState('paused');
        } else if (stateRef.current.gameState === 'paused') {
          stateRef.current.gameState = 'playing';
          setGameState('playing');
        }
      } else if (e.code === 'KeyR') {
        restartGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump, restartGame]);

  const birdYMin = (radius, y) => y - radius;
  const birdYMax = (radius, y) => y + radius;

  // Render Pipe with neon styling & highlight
  const drawPipe = (ctx, x, y, width, height, isTop) => {
    if (height <= 0) return;
    
    // Pipe body gradient
    const pipeGrad = ctx.createLinearGradient(x, 0, x + width, 0);
    pipeGrad.addColorStop(0, '#15803d');
    pipeGrad.addColorStop(0.3, '#22c55e');
    pipeGrad.addColorStop(0.7, '#4ade80');
    pipeGrad.addColorStop(1, '#166534');

    ctx.fillStyle = pipeGrad;
    ctx.fillRect(x, y, width, height);

    // Border
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, width, height);

    // Pipe Cap
    const capHeight = 24;
    const capExtra = 6;
    const capX = x - capExtra / 2;
    const capY = isTop ? y + height - capHeight : y;

    const capGrad = ctx.createLinearGradient(capX, 0, capX + width + capExtra, 0);
    capGrad.addColorStop(0, '#15803d');
    capGrad.addColorStop(0.3, '#22c55e');
    capGrad.addColorStop(0.7, '#4ade80');
    capGrad.addColorStop(1, '#166534');

    ctx.fillStyle = capGrad;
    ctx.fillRect(capX, capY, width + capExtra, capHeight);
    ctx.strokeRect(capX, capY, width + capExtra, capHeight);

    // Pipe Cap Highlight Line
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(capX + 8, capY + 3, 5, capHeight - 6);
  };

  // Render ground with animated scrolling pattern
  const drawGround = (ctx, w, h, gh, offset) => {
    const gy = h - gh;

    // Top grass strip
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, gy, w, 14);

    // Dirt base
    const dirtGrad = ctx.createLinearGradient(0, gy + 14, 0, h);
    dirtGrad.addColorStop(0, '#78350f');
    dirtGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = dirtGrad;
    ctx.fillRect(0, gy + 14, w, gh - 14);

    // Ground line
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();

    // Checker pattern stripes moving
    ctx.fillStyle = '#16a34a';
    const stripeW = 16;
    for (let x = -stripeW; x < w + stripeW; x += stripeW) {
      const sx = x - offset;
      ctx.beginPath();
      ctx.moveTo(sx, gy);
      ctx.lineTo(sx + 8, gy + 14);
      ctx.lineTo(sx + 4, gy + 14);
      ctx.lineTo(sx - 4, gy);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Render Cute Bird with Wing Flap & Tilt
  const drawBird = (ctx, x, y, rotation, frame) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Bird Body (Golden Yellow)
    const bodyGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, 16);
    bodyGrad.addColorStop(0, '#fef08a');
    bodyGrad.addColorStop(0.6, '#facc15');
    bodyGrad.addColorStop(1, '#ca8a04');

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Wing (animated with frame 0, 1, 2)
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    const wingY = frame === 1 ? -4 : frame === 2 ? 3 : 0;
    ctx.ellipse(-6, wingY, 7, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Big Cartoon Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(6, -5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pupil
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(8, -5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Beak / Mouth (Orange)
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(10, 1);
    ctx.lineTo(20, 5);
    ctx.lineTo(10, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cheek Blush
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.beginPath();
    ctx.arc(3, 3, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Main Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId;

    const render = () => {
      const s = stateRef.current;

      // 1. UPDATE GAME STATE
      if (s.gameState === 'playing') {
        s.frameCount++;
        s.groundOffset = (s.groundOffset + PIPE_SPEED) % 24;
        s.skyOffset = (s.skyOffset + 0.5) % CANVAS_WIDTH;

        // Bird physics
        s.birdVelocity += GRAVITY;
        s.birdY += s.birdVelocity;
        s.birdRotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 5, (s.birdVelocity * 4) * (Math.PI / 180)));
        s.birdFrame = Math.floor(s.frameCount / 6) % 3;

        // Spawn Pipes
        if (s.frameCount % PIPE_SPAWN_INTERVAL === 0) {
          const minTop = 60;
          const maxTop = CANVAS_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 60;
          const topHeight = Math.floor(minTop + Math.random() * (maxTop - minTop));
          const bottomY = topHeight + PIPE_GAP;

          s.pipes.push({
            x: CANVAS_WIDTH,
            topHeight,
            bottomY,
            width: PIPE_WIDTH,
            passed: false,
          });
        }

        // Move Pipes & Check Collision
        const birdRadius = 14;
        const birdX = 70;

        for (let i = s.pipes.length - 1; i >= 0; i--) {
          const p = s.pipes[i];
          p.x -= PIPE_SPEED;

          // Score check
          if (!p.passed && p.x + p.width < birdX) {
            p.passed = true;
            s.score += 1;
            setScore(s.score);
            sounds.playScore();
          }

          // Pipe Collision
          const inHorizontal = birdX + birdRadius > p.x && birdX - birdRadius < p.x + p.width;
          const hitTopPipe = inHorizontal && birdYMin(birdRadius, s.birdY) < p.topHeight;
          const hitBottomPipe = inHorizontal && birdYMax(birdRadius, s.birdY) > p.bottomY;

          if (hitTopPipe || hitBottomPipe) {
            triggerGameOver();
            break;
          }

          // Remove offscreen pipes
          if (p.x + p.width < -10) {
            s.pipes.splice(i, 1);
          }
        }

        // Ground / Ceiling Collision
        if (s.birdY + birdRadius >= CANVAS_HEIGHT - GROUND_HEIGHT) {
          s.birdY = CANVAS_HEIGHT - GROUND_HEIGHT - birdRadius;
          triggerGameOver();
        } else if (s.birdY - birdRadius <= 0) {
          s.birdY = birdRadius;
          s.birdVelocity = 0;
        }
      } else if (s.gameState === 'idle') {
        s.frameCount++;
        s.birdY = CANVAS_HEIGHT / 2 - 50 + Math.sin(s.frameCount * 0.08) * 6;
        s.birdRotation = 0;
        s.groundOffset = (s.groundOffset + 1) % 24;
      }

      // Update Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const pt = s.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life++;
        if (pt.life >= pt.maxLife) {
          s.particles.splice(i, 1);
        }
      }

      // 2. DRAWING / RENDERING
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Sky Background gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT);
      skyGrad.addColorStop(0, '#1e1b4b');
      skyGrad.addColorStop(0.6, '#312e81');
      skyGrad.addColorStop(1, '#4338ca');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);

      // Stars in sky
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (let st = 0; st < 20; st++) {
        const sx = ((st * 47) + s.frameCount * 0.1) % CANVAS_WIDTH;
        const sy = (st * 23) % (CANVAS_HEIGHT - GROUND_HEIGHT - 100);
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Distant Retro Cityline Silhouette
      ctx.fillStyle = '#1e1e38';
      const cityOffsets = [40, 70, 50, 90, 60, 110, 80, 50, 85, 65];
      const cityWidth = 45;
      for (let c = 0; c < 12; c++) {
        const h = cityOffsets[c % cityOffsets.length];
        const cx = (c * cityWidth - (s.skyOffset * 0.3) % cityWidth);
        ctx.fillRect(cx, CANVAS_HEIGHT - GROUND_HEIGHT - h, cityWidth - 4, h);
      }

      // Draw Pipes
      s.pipes.forEach(p => {
        drawPipe(ctx, p.x, 0, p.width, p.topHeight, true);
        drawPipe(ctx, p.x, p.bottomY, p.width, CANVAS_HEIGHT - GROUND_HEIGHT - p.bottomY, false);
      });

      // Draw Ground
      drawGround(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT, s.groundOffset);

      // Draw Particles
      s.particles.forEach(pt => {
        const alpha = 1 - pt.life / pt.maxLife;
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * (1 - pt.life / pt.maxLife), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // Draw Bird
      drawBird(ctx, 70, s.birdY, s.birdRotation, s.birdFrame);

      // Draw Score (In Game)
      if (s.gameState === 'playing' || s.gameState === 'paused') {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 38px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(s.score), CANVAS_WIDTH / 2, 80);
        ctx.restore();
      }

      // Idle Prompt
      if (s.gameState === 'idle') {
        ctx.save();
        ctx.fillStyle = '#fbbf24';
        ctx.font = '700 20px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PRESS SPACE OR TAP TO FLY', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '400 14px Outfit, sans-serif';
        ctx.fillText('Avoid the neon pipes & set records!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [triggerGameOver]);

  const getMedal = (s) => {
    if (s >= 40) return { title: 'Platinum Medal', color: 'from-cyan-400 to-blue-500', icon: '🏆' };
    if (s >= 25) return { title: 'Gold Medal', color: 'from-amber-300 to-yellow-600', icon: '🥇' };
    if (s >= 10) return { title: 'Silver Medal', color: 'from-slate-300 to-slate-500', icon: '🥈' };
    if (s >= 3) return { title: 'Bronze Medal', color: 'from-amber-700 to-amber-900', icon: '🥉' };
    return null;
  };

  const medal = getMedal(score);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] py-4 select-none">
      {/* Game Header Bar */}
      <div className="w-full max-w-[420px] mb-3 flex items-center justify-between px-2 text-sm">
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
            <span className="font-semibold text-xs">High: {Math.max(highScore, score)}</span>
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

      {/* Game Canvas Container */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-indigo-500/40 bg-indigo-950/40">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleJump}
          className="cursor-pointer block max-w-full touch-none"
        />

        {/* OVERLAY: GAME OVER DIALOG */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full max-w-[300px] bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-2xl font-black text-rose-500 tracking-wider mb-2 font-arcade">
                GAME OVER
              </h2>

              {isNewRecord && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold mb-3 animate-pulse">
                  <Award size={14} /> NEW RECORD!
                </div>
              )}

              {/* Score board */}
              <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 my-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Score</span>
                  <span className="text-2xl font-black text-white">{score}</span>
                </div>
                <div className="h-px bg-slate-700/60" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Best Score</span>
                  <span className="text-lg font-bold text-amber-400">{highScore}</span>
                </div>

                {medal && (
                  <div className="pt-2 flex items-center justify-center gap-2 text-sm font-semibold text-slate-200">
                    <span className="text-xl">{medal.icon}</span>
                    <span>{medal.title}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={restartGame}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 font-bold text-white shadow-lg transition-transform active:scale-95"
                >
                  <RotateCcw size={18} />
                  <span>Play Again</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OVERLAY: PAUSED */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="text-center p-6 bg-slate-900/90 border border-slate-700 rounded-2xl">
              <Pause size={40} className="mx-auto text-amber-400 mb-2" />
              <h3 className="text-xl font-bold text-white mb-2">Game Paused</h3>
              <p className="text-xs text-slate-400 mb-4">Press 'P' or click below to continue</p>
              <button
                onClick={() => {
                  stateRef.current.gameState = 'playing';
                  setGameState('playing');
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white text-sm"
              >
                Resume
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Control hints */}
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Space</kbd> / Tap to Jump
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">P</kbd> Pause
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">R</kbd> Restart
        </span>
      </div>
    </div>
  );
};

