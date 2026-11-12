import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, RotateCcw, Volume2, VolumeX, Trophy, Sparkles,
  ArrowUp, ArrowDown, ArrowLeft as ArrowL, ArrowRight, HelpCircle,
  Undo2, Flame, Award, Play
} from 'lucide-react';
import { sounds } from '../../services/sound';
import { storage } from '../../services/storage';

// Color themes & styling per tile value
const TILE_STYLES = {
  0: 'bg-slate-900/60 border border-slate-800/80',
  2: 'bg-slate-800/90 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]',
  4: 'bg-slate-800/90 text-sky-300 border border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.25)]',
  8: 'bg-amber-950/80 text-amber-300 border border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
  16: 'bg-orange-950/80 text-orange-300 border border-orange-500/60 shadow-[0_0_20px_rgba(249,115,22,0.35)]',
  32: 'bg-rose-950/80 text-rose-300 border border-rose-500/70 shadow-[0_0_22px_rgba(244,63,94,0.4)]',
  64: 'bg-red-950/90 text-red-200 border border-red-500/70 shadow-[0_0_25px_rgba(239,68,68,0.45)]',
  128: 'bg-purple-950/90 text-purple-200 border border-purple-500/70 shadow-[0_0_25px_rgba(168,85,247,0.5)]',
  256: 'bg-indigo-950/90 text-indigo-200 border border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.55)]',
  512: 'bg-emerald-950/90 text-emerald-200 border border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.6)]',
  1024: 'bg-teal-950/95 text-teal-200 border border-teal-300 shadow-[0_0_35px_rgba(20,184,166,0.7)]',
  2048: 'bg-gradient-to-br from-yellow-400 to-amber-600 text-slate-950 font-black border-2 border-yellow-200 shadow-[0_0_40px_rgba(234,179,8,0.85)] ring-2 ring-yellow-400/50 animate-pulse',
  4096: 'bg-gradient-to-br from-fuchsia-600 to-cyan-500 text-white font-black border-2 border-white shadow-[0_0_45px_rgba(217,70,239,0.9)] animate-pulse'
};

const getTileStyle = (val) => {
  if (TILE_STYLES[val]) return TILE_STYLES[val];
  return 'bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600 text-white font-black border-2 border-pink-300 shadow-[0_0_45px_rgba(236,72,153,0.9)] animate-pulse';
};

const getTileFontSize = (val) => {
  if (val >= 10000) return 'text-lg sm:text-xl';
  if (val >= 1024) return 'text-xl sm:text-2xl';
  if (val >= 128) return 'text-2xl sm:text-3xl';
  return 'text-3xl sm:text-4xl';
};

// Pure utility functions for 4x4 2048 mechanics
const createEmptyBoard = () => [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]
];

const cloneBoard = (board) => board.map(row => [...row]);

// Add a random 2 (90%) or 4 (10%) into an empty spot
const addRandomTile = (board) => {
  const emptyCoords = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) {
        emptyCoords.push({ r, c });
      }
    }
  }

  if (emptyCoords.length === 0) return board;

  const chosen = emptyCoords[Math.floor(Math.random() * emptyCoords.length)];
  const newBoard = cloneBoard(board);
  newBoard[chosen.r][chosen.c] = Math.random() < 0.9 ? 2 : 4;
  return newBoard;
};

// Slide and merge a single 1D row to the left
const slideLeftRow = (row) => {
  const filtered = row.filter(val => val !== 0);
  const result = [];
  let scoreGain = 0;
  let maxMergedVal = 0;

  for (let i = 0; i < filtered.length; i++) {
    if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
      const mergedVal = filtered[i] * 2;
      result.push(mergedVal);
      scoreGain += mergedVal;
      if (mergedVal > maxMergedVal) maxMergedVal = mergedVal;
      i++; // Skip the next tile because it merged
    } else {
      result.push(filtered[i]);
    }
  }

  while (result.length < 4) {
    result.push(0);
  }

  return { row: result, scoreGain, maxMergedVal };
};

// Check if two boards are identical
const boardsEqual = (b1, b2) => {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (b1[r][c] !== b2[r][c]) return false;
    }
  }
  return true;
};

// Check if any valid moves remain
const hasValidMoves = (board) => {
  // Check for any empty cells
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) return true;
    }
  }

  // Check for horizontal adjacent equals
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[r][c] === board[r][c + 1]) return true;
    }
  }

  // Check for vertical adjacent equals
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 3; r++) {
      if (board[r][c] === board[r + 1][c]) return true;
    }
  }

  return false;
};

// Find the maximum tile currently on the board
const getMaxTile = (board) => {
  let max = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] > max) max = board[r][c];
    }
  }
  return max;
};

export const Game2048 = ({ onGameOver, onBack }) => {
  const [board, setBoard] = useState(() => {
    let b = createEmptyBoard();
    b = addRandomTile(b);
    b = addRandomTile(b);
    return b;
  });

  const [score, setScore] = useState(0);
  const [scorePopup, setScorePopup] = useState(0);
  const [highScore, setHighScore] = useState(() => storage.getHighScore('game-2048'));
  const [history, setHistory] = useState(null); // { board, score } for 1-step undo
  const [movesCount, setMovesCount] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [keepPlayingAfterWin, setKeepPlayingAfterWin] = useState(false);
  const [isMuted, setIsMuted] = useState(() => sounds.getMuted());
  const [showHelp, setShowHelp] = useState(false);

  // Touch gesture tracking
  const touchStartRef = useRef({ x: 0, y: 0 });
  const boardContainerRef = useRef(null);

  const toggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Perform slide in 4 directions
  const move = useCallback((direction) => {
    if (isGameOver) return;

    let newBoard = cloneBoard(board);
    let totalScoreGain = 0;
    let highestMerged = 0;

    if (direction === 'LEFT') {
      for (let r = 0; r < 4; r++) {
        const { row, scoreGain, maxMergedVal } = slideLeftRow(newBoard[r]);
        newBoard[r] = row;
        totalScoreGain += scoreGain;
        if (maxMergedVal > highestMerged) highestMerged = maxMergedVal;
      }
    } else if (direction === 'RIGHT') {
      for (let r = 0; r < 4; r++) {
        const reversed = [...newBoard[r]].reverse();
        const { row, scoreGain, maxMergedVal } = slideLeftRow(reversed);
        newBoard[r] = row.reverse();
        totalScoreGain += scoreGain;
        if (maxMergedVal > highestMerged) highestMerged = maxMergedVal;
      }
    } else if (direction === 'UP') {
      for (let c = 0; c < 4; c++) {
        const col = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]];
        const { row, scoreGain, maxMergedVal } = slideLeftRow(col);
        for (let r = 0; r < 4; r++) {
          newBoard[r][c] = row[r];
        }
        totalScoreGain += scoreGain;
        if (maxMergedVal > highestMerged) highestMerged = maxMergedVal;
      }
    } else if (direction === 'DOWN') {
      for (let c = 0; c < 4; c++) {
        const col = [newBoard[3][c], newBoard[2][c], newBoard[1][c], newBoard[0][c]];
        const { row, scoreGain, maxMergedVal } = slideLeftRow(col);
        const reversed = row.reverse();
        for (let r = 0; r < 4; r++) {
          newBoard[r][c] = reversed[r];
        }
        totalScoreGain += scoreGain;
        if (maxMergedVal > highestMerged) highestMerged = maxMergedVal;
      }
    }

    // Check if the board actually moved
    if (!boardsEqual(board, newBoard)) {
      // Save undo history
      setHistory({
        board: cloneBoard(board),
        score: score
      });

      // Play audio feedback
      if (highestMerged > 0) {
        sounds.playMerge(highestMerged);
      } else {
        sounds.playSlide();
      }

      // Add a random tile
      const boardWithNewTile = addRandomTile(newBoard);
      const newScore = score + totalScoreGain;

      setBoard(boardWithNewTile);
      setScore(newScore);
      setMovesCount(prev => prev + 1);

      if (totalScoreGain > 0) {
        setScorePopup(totalScoreGain);
        setTimeout(() => setScorePopup(0), 700);
      }

      // Update high score
      if (newScore > highScore) {
        setHighScore(newScore);
        storage.recordScore('game-2048', newScore, { maxTile: getMaxTile(boardWithNewTile) });
      }

      // Check 2048 victory condition
      const currentMax = getMaxTile(boardWithNewTile);
      if (currentMax >= 2048 && !hasWon && !keepPlayingAfterWin) {
        setHasWon(true);
        sounds.playVictory();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      // Check game over
      if (!hasValidMoves(boardWithNewTile)) {
        setIsGameOver(true);
        sounds.playCrash();
        storage.recordScore('game-2048', newScore, { maxTile: currentMax });
        if (onGameOver) onGameOver(newScore);
      }
    }
  }, [board, score, highScore, hasWon, keepPlayingAfterWin, isGameOver, onGameOver]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          move('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          move('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          move('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          move('RIGHT');
          break;
        case 'u':
        case 'U':
        case 'z':
        case 'Z':
          handleUndo();
          break;
        case 'r':
        case 'R':
          handleRestart();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch Swipe Handlers
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // Minimum swipe threshold
    if (Math.max(absX, absY) > 30) {
      if (absX > absY) {
        // Horizontal swipe
        if (dx > 0) move('RIGHT');
        else move('LEFT');
      } else {
        // Vertical swipe
        if (dy > 0) move('DOWN');
        else move('UP');
      }
    }
  };

  // 1-Step Undo
  const handleUndo = () => {
    if (!history) return;
    sounds.playClick();
    setBoard(history.board);
    setScore(history.score);
    setHistory(null);
    setIsGameOver(false);
  };

  // Restart Game
  const handleRestart = () => {
    sounds.playClick();
    let b = createEmptyBoard();
    b = addRandomTile(b);
    b = addRandomTile(b);
    setBoard(b);
    setScore(0);
    setHistory(null);
    setMovesCount(0);
    setIsGameOver(false);
    setHasWon(false);
    setKeepPlayingAfterWin(false);
  };

  const maxTile = getMaxTile(board);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
                <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                  2048
                </span>
                <span className="text-xs uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Neon Pulse
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Slide tiles, match numbers & conquer 2048!
            </p>
          </div>
        </div>

        {/* STATS: Score, Best, Highest Tile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Current Score */}
          <div className="relative px-3 sm:px-4 py-2 rounded-xl bg-slate-800/90 border border-slate-700/80 text-center min-w-[70px] sm:min-w-[85px]">
            <div className="text-[10px] uppercase font-bold text-slate-400">Score</div>
            <div className="text-sm sm:text-base font-black text-white">{score}</div>
            {scorePopup > 0 && (
              <span className="absolute -top-3 right-2 text-xs font-black text-emerald-400 animate-bounce">
                +{scorePopup}
              </span>
            )}
          </div>

          {/* Best Score */}
          <div className="px-3 sm:px-4 py-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-center min-w-[70px] sm:min-w-[85px]">
            <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center justify-center gap-1">
              <Trophy size={10} />
              <span>Best</span>
            </div>
            <div className="text-sm sm:text-base font-black text-amber-300">{highScore}</div>
          </div>

          {/* Highest Tile Badge */}
          <div className="hidden sm:block px-3 py-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-center min-w-[75px]">
            <div className="text-[10px] uppercase font-bold text-indigo-400 flex items-center justify-center gap-1">
              <Flame size={10} />
              <span>Max</span>
            </div>
            <div className="text-sm sm:text-base font-black text-indigo-300">{maxTile}</div>
          </div>

          {/* Action Buttons: Undo, Restart, Sound, Help */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
            <button
              onClick={handleUndo}
              disabled={!history}
              title="Undo Move (U)"
              className={`p-2.5 rounded-xl border transition-all ${
                history
                  ? 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-indigo-500/40 hover:text-white'
                  : 'bg-slate-900/50 text-slate-600 border-slate-800/50 cursor-not-allowed'
              }`}
            >
              <Undo2 size={16} />
            </button>

            <button
              onClick={handleRestart}
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

      {/* COLLAPSIBLE HELP PANEL */}
      {showHelp && (
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-indigo-500/30 text-xs text-slate-300 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Sparkles size={16} />
            <span>How to Play 2048 Neon Pulse</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li><strong>Desktop:</strong> Use Arrow Keys or WASD to slide tiles in all four directions.</li>
            <li><strong>Touch / Tablet:</strong> Swipe across the board with your finger, or tap the directional D-Pad below.</li>
            <li>When two identical tiles collide, they <strong>merge into one</strong> with double the value!</li>
            <li>Score points whenever tiles merge. Keep sliding until you assemble the legendary <strong>2048</strong> tile!</li>
            <li>Made a mistake? Hit the <strong>Undo (U)</strong> button to backtrack 1 move.</li>
          </ul>
        </div>
      )}

      {/* MAIN PLAY AREA */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
        {/* 2048 4x4 BOARD */}
        <div className="relative">
          <div
            ref={boardContainerRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] bg-slate-950/90 p-3 sm:p-4 rounded-3xl border-2 border-slate-800 shadow-2xl shadow-indigo-950/40 select-none touch-none"
          >
            {/* The 4x4 Grid */}
            <div className="grid grid-cols-4 grid-rows-4 gap-2.5 sm:gap-3 w-full h-full">
              {board.map((row, r) =>
                row.map((val, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={`flex items-center justify-center rounded-2xl font-black transition-all duration-150 select-none ${getTileStyle(val)}`}
                  >
                    {val > 0 && (
                      <span className={`tracking-tight ${getTileFontSize(val)}`}>
                        {val}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* VICTORY OVERLAY (When 2048 is reached) */}
            {hasWon && !keepPlayingAfterWin && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200 z-20">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mb-3 animate-bounce">
                  <Award size={36} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-amber-300 mb-1">
                  You Reached 2048!
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xs mb-5">
                  Magnificent strategy! You built the legendary 2048 tile with a score of <span className="font-bold text-white">{score}</span>.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setKeepPlayingAfterWin(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all"
                  >
                    Keep Playing (4096+)
                  </button>
                  <button
                    onClick={handleRestart}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition-all"
                  >
                    New Game
                  </button>
                </div>
              </div>
            )}

            {/* GAME OVER OVERLAY (When board is full and no valid moves exist) */}
            {isGameOver && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200 z-20">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 mb-3">
                  <Flame size={32} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
                  Game Over!
                </h2>
                <p className="text-xs text-slate-400 mb-4">No more moves possible on the board.</p>

                <div className="grid grid-cols-2 gap-3 w-full max-w-[240px] mb-5">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Score</div>
                    <div className="text-base font-black text-white">{score}</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Max Tile</div>
                    <div className="text-base font-black text-indigo-400">{maxTile}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {history && (
                    <button
                      onClick={handleUndo}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Undo2 size={14} />
                      <span>Undo Last Move</span>
                    </button>
                  )}
                  <button
                    onClick={handleRestart}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw size={14} />
                    <span>Try Again</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SIDE CONTROLS & D-PAD */}
        <div className="flex flex-col items-center gap-5 w-full max-w-[280px]">
          {/* On-screen Directional Touch D-Pad */}
          <div className="p-4 bg-slate-900/60 rounded-3xl border border-slate-800/80 w-full flex flex-col items-center">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-3 text-center">
              Directional Pad / Controls
            </div>

            <div className="grid grid-cols-3 gap-2 w-48">
              <div />
              <button
                onClick={() => move('UP')}
                className="w-14 h-14 rounded-2xl bg-slate-800/90 hover:bg-indigo-600/80 active:scale-95 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-md shadow-slate-950"
              >
                <ArrowUp size={20} />
              </button>
              <div />

              <button
                onClick={() => move('LEFT')}
                className="w-14 h-14 rounded-2xl bg-slate-800/90 hover:bg-indigo-600/80 active:scale-95 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-md shadow-slate-950"
              >
                <ArrowL size={20} />
              </button>
              <button
                onClick={() => move('DOWN')}
                className="w-14 h-14 rounded-2xl bg-slate-800/90 hover:bg-indigo-600/80 active:scale-95 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-md shadow-slate-950"
              >
                <ArrowDown size={20} />
              </button>
              <button
                onClick={() => move('RIGHT')}
                className="w-14 h-14 rounded-2xl bg-slate-800/90 hover:bg-indigo-600/80 active:scale-95 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-md shadow-slate-950"
              >
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="mt-3 text-[11px] text-slate-400 text-center">
              Swipe screen or press <span className="text-white font-mono font-semibold">WASD</span> / <span className="text-white font-mono font-semibold">Arrows</span>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="w-full bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Total Moves</span>
              <span className="font-bold text-white">{movesCount}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Highest Tile</span>
              <span className="font-bold text-amber-400">{maxTile}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Undo Status</span>
              <span className={`font-semibold ${history ? 'text-emerald-400' : 'text-slate-500'}`}>
                {history ? 'Available (1 Step)' : 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

