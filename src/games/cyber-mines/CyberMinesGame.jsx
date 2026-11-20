import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, RotateCcw, Volume2, VolumeX, Trophy, Clock,
  HelpCircle, Sparkles, Award, Flame, Flag, Eye, ShieldAlert,
  Zap, Compass
} from 'lucide-react';
import { sounds } from '../../services/sound';
import { storage } from '../../services/storage';

// Difficulty presets
const PRESETS = {
  novice: { name: 'Novice', rows: 9, cols: 9, mines: 10, cellPx: 38 },
  veteran: { name: 'Veteran', rows: 16, cols: 16, mines: 40, cellPx: 30 },
  master: { name: 'Master', rows: 16, cols: 30, mines: 99, cellPx: 26 }
};

// Number colors in dark cyber aesthetic
const NUMBER_COLORS = {
  1: '#38bdf8', // Cyan
  2: '#4ade80', // Emerald
  3: '#f87171', // Rose/Red
  4: '#c084fc', // Purple
  5: '#fb923c', // Orange
  6: '#2dd4bf', // Teal
  7: '#f43f5e', // Crimson
  8: '#fde047'  // Yellow
};

export const CyberMinesGame = ({ onGameOver, onBack }) => {
  const [difficulty, setDifficulty] = useState('novice');
  const [board, setBoard] = useState([]);
  const [gameState, setGameState] = useState('ready'); // ready, playing, won, lost
  const [flagsCount, setFlagsCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [mode, setMode] = useState('dig'); // 'dig' or 'flag' (for mobile touch toggle)
  const [isMuted, setIsMuted] = useState(() => sounds.getMuted());
  const [showHelp, setShowHelp] = useState(false);
  const [bestTimes, setBestTimes] = useState(() => {
    return {
      novice: storage.get('gamestack_mines_novice', null),
      veteran: storage.get('gamestack_mines_veteran', null),
      master: storage.get('gamestack_mines_master', null)
    };
  });

  const timerRef = useRef(null);
  const isFirstClickRef = useRef(true);

  const config = PRESETS[difficulty];

  const toggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Generate clean board grid
  const createEmptyBoard = useCallback((rows, cols) => {
    const grid = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          r,
          c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
          isExploded: false
        });
      }
      grid.push(row);
    }
    return grid;
  }, []);

  // Plant mines ensuring safe first-click zone
  const plantMinesAndCalculate = (grid, safeR, safeC, totalMines) => {
    const rows = grid.length;
    const cols = grid[0].length;
    let planted = 0;

    // Create safe 3x3 exclusion box around first click
    const isSafeZone = (r, c) => Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1;

    while (planted < totalMines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);

      if (!grid[r][c].isMine && !isSafeZone(r, c)) {
        grid[r][c].isMine = true;
        planted++;
      }
    }

    // Calculate neighbor counts
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].isMine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].isMine) {
              count++;
            }
          }
        }
        grid[r][c].neighborMines = count;
      }
    }
  };

  // Reset / Initialize Game
  const resetGame = useCallback((diffKey = difficulty) => {
    sounds.playClick();
    if (timerRef.current) clearInterval(timerRef.current);

    const preset = PRESETS[diffKey];
    setBoard(createEmptyBoard(preset.rows, preset.cols));
    setGameState('ready');
    setFlagsCount(0);
    setTimer(0);
    isFirstClickRef.current = true;
  }, [difficulty, createEmptyBoard]);

  // Start timer
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
  };

  // Stop timer on unmount
  useEffect(() => {
    resetGame(difficulty);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [difficulty, resetGame]);

  // Reveal cell with recursive flood-fill for 0-neighbor clusters
  const revealCell = (r, c) => {
    if (gameState === 'lost' || gameState === 'won') return;

    let newBoard = board.map(row => row.map(cell => ({ ...cell })));
    const target = newBoard[r][c];

    if (target.isRevealed || target.isFlagged) return;

    // Handle First Click Safety
    if (isFirstClickRef.current) {
      isFirstClickRef.current = false;
      setGameState('playing');
      startTimer();
      plantMinesAndCalculate(newBoard, r, c, config.mines);
    }

    // Stepped on a mine!
    if (newBoard[r][c].isMine) {
      if (timerRef.current) clearInterval(timerRef.current);
      sounds.playExplosion();
      newBoard[r][c].isExploded = true;

      // Reveal all other mines
      for (let row of newBoard) {
        for (let cell of row) {
          if (cell.isMine) cell.isRevealed = true;
        }
      }

      setBoard(newBoard);
      setGameState('lost');
      if (onGameOver) onGameOver(0);
      return;
    }

    // Normal safe cell reveal
    sounds.playMineReveal();
    const queue = [[r, c]];
    newBoard[r][c].isRevealed = true;

    while (queue.length > 0) {
      const [currR, currC] = queue.shift();
      const currCell = newBoard[currR][currC];

      if (currCell.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = currR + dr;
            const nc = currC + dc;
            if (
              nr >= 0 && nr < config.rows &&
              nc >= 0 && nc < config.cols &&
              !newBoard[nr][nc].isRevealed &&
              !newBoard[nr][nc].isFlagged &&
              !newBoard[nr][nc].isMine
            ) {
              newBoard[nr][nc].isRevealed = true;
              if (newBoard[nr][nc].neighborMines === 0) {
                queue.push([nr, nc]);
              }
            }
          }
        }
      }
    }

    // Check Victory condition: all non-mine cells revealed
    let unrevealedSafeCells = 0;
    for (let row of newBoard) {
      for (let cell of row) {
        if (!cell.isMine && !cell.isRevealed) {
          unrevealedSafeCells++;
        }
      }
    }

    if (unrevealedSafeCells === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      sounds.playVictory();
      confetti({ particleCount: 130, spread: 80 });
      setGameState('won');

      // Auto-flag remaining mines
      for (let row of newBoard) {
        for (let cell of row) {
          if (cell.isMine) cell.isFlagged = true;
        }
      }
      setFlagsCount(config.mines);

      // Best time update
      const currentBest = bestTimes[difficulty];
      const finalTime = timer + 1;
      if (!currentBest || finalTime < currentBest) {
        const updated = { ...bestTimes, [difficulty]: finalTime };
        setBestTimes(updated);
        storage.set(`gamestack_mines_${difficulty}`, finalTime);
      }

      const scoreAward = Math.max(100, Math.floor(10000 / (finalTime + 10)));
      storage.recordScore('cyber-mines', scoreAward, { difficulty, time: finalTime });
      if (onGameOver) onGameOver(scoreAward);
    }

    setBoard(newBoard);
  };

  // Toggle flag on cell
  const toggleFlag = (e, r, c) => {
    if (e && e.preventDefault) e.preventDefault();
    if (gameState === 'lost' || gameState === 'won') return;

    const cell = board[r][c];
    if (cell.isRevealed) return;

    sounds.playFlagToggle();
    const newBoard = board.map(row => row.map(cl => ({ ...cl })));
    const target = newBoard[r][c];

    if (!target.isFlagged) {
      target.isFlagged = true;
      setFlagsCount(f => f + 1);
    } else {
      target.isFlagged = false;
      setFlagsCount(f => f - 1);
    }

    setBoard(newBoard);
  };

  // Chord Click: clicking a revealed number to reveal adjacent unflagged cells
  const handleChordClick = (r, c) => {
    const cell = board[r][c];
    if (!cell.isRevealed || cell.neighborMines === 0) return;

    // Count surrounding flags
    let flagCount = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols && board[nr][nc].isFlagged) {
          flagCount++;
        }
      }
    }

    // If flags match neighborMines count, reveal all adjacent unflagged cells
    if (flagCount === cell.neighborMines) {
      sounds.playChordClick();
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols && !board[nr][nc].isFlagged && !board[nr][nc].isRevealed) {
            revealCell(nr, nc);
          }
        }
      }
    }
  };

  // Cell click dispatcher (respects mobile mode toggle)
  const handleCellClick = (r, c) => {
    if (mode === 'flag') {
      toggleFlag(null, r, c);
    } else {
      const cell = board[r][c];
      if (cell.isRevealed) {
        handleChordClick(r, c);
      } else {
        revealCell(r, c);
      }
    }
  };

  // Status Avatar Icon
  const renderStatusEmoji = () => {
    if (gameState === 'won') return '😎';
    if (gameState === 'lost') return '💥';
    if (gameState === 'playing') return '🤔';
    return '🙂';
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
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Cyber Mines
                </span>
                <span className="text-xs uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Logic Grid
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Deduce hidden cyber mines with zero guess opening!
            </p>
          </div>
        </div>

        {/* STATS: Mines Left, Status Face, Timer, Best */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mines Remaining Digital Display */}
          <div className="px-3 sm:px-4 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-center font-mono">
            <div className="text-[10px] uppercase font-bold text-slate-500">Mines</div>
            <div className="text-sm sm:text-base font-black text-rose-400">
              {String(Math.max(0, config.mines - flagsCount)).padStart(3, '0')}
            </div>
          </div>

          {/* Reset Face Button */}
          <button
            onClick={() => resetGame()}
            title="Reset Game"
            className="w-11 h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-xl flex items-center justify-center transition-all shadow-md shadow-slate-950"
          >
            {renderStatusEmoji()}
          </button>

          {/* Timer Digital Display */}
          <div className="px-3 sm:px-4 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-center font-mono">
            <div className="text-[10px] uppercase font-bold text-slate-500">Time</div>
            <div className="text-sm sm:text-base font-black text-cyan-400">
              {String(Math.min(999, timer)).padStart(3, '0')}s
            </div>
          </div>

          {/* Audio & Help */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
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
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              <HelpCircle size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* DIFFICULTY & MOBILE MODE TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
        {/* Difficulty Selector */}
        <div className="flex items-center gap-1.5">
          {Object.keys(PRESETS).map(key => {
            const p = PRESETS[key];
            const isAct = difficulty === key;
            return (
              <button
                key={key}
                onClick={() => {
                  sounds.playClick();
                  setDifficulty(key);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isAct
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <span>{p.name}</span>
                <span className="text-[10px] opacity-75 ml-1">({p.mines})</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Tap Mode: Dig vs Flag */}
        <div className="flex items-center gap-2">
          {bestTimes[difficulty] && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-amber-400 font-bold px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30">
              <Trophy size={12} />
              <span>Best: {bestTimes[difficulty]}s</span>
            </div>
          )}

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                sounds.playClick();
                setMode('dig');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                mode === 'dig' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye size={12} />
              <span>Dig</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setMode('flag');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                mode === 'flag' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flag size={12} />
              <span>Flag</span>
            </button>
          </div>
        </div>
      </div>

      {/* HELP DRAWER */}
      {showHelp && (
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-emerald-500/30 text-xs text-slate-300 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Sparkles size={16} />
            <span>How to Play Cyber Mines</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li><strong>Guaranteed Safe Start:</strong> Your first click is 100% safe and always opens an expansive cascade!</li>
            <li><strong>Reveal Cell:</strong> Left-click or tap in <em>Dig</em> mode to inspect a cell.</li>
            <li><strong>Plant Flag:</strong> Right-click or tap in <em>Flag</em> mode to mark suspected mines (🚩).</li>
            <li><strong>Chord Reveal:</strong> Click an already-revealed number cell when you've placed enough surrounding flags to instantly pop all remaining adjacent cells!</li>
            <li><strong>Win Condition:</strong> Safely reveal every non-mine cell on the board.</li>
          </ul>
        </div>
      )}

      {/* MINESWEEPER BOARD CONTAINER */}
      <div className="flex justify-center overflow-x-auto p-2">
        <div
          className="inline-block p-3 sm:p-4 bg-slate-950/90 rounded-3xl border-2 border-slate-800 shadow-2xl shadow-emerald-950/30 select-none"
          onContextMenu={e => e.preventDefault()}
        >
          <div
            className="grid gap-[2px] sm:gap-[3px]"
            style={{
              gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`
            }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isRevealed = cell.isRevealed;
                const isMine = cell.isMine;
                const isFlagged = cell.isFlagged;
                const count = cell.neighborMines;

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    onContextMenu={e => toggleFlag(e, r, c)}
                    style={{
                      width: `${config.cellPx}px`,
                      height: `${config.cellPx}px`
                    }}
                    className={`flex items-center justify-center font-black rounded-lg transition-all text-xs sm:text-sm cursor-pointer select-none ${
                      isRevealed
                        ? cell.isExploded
                          ? 'bg-rose-600/90 text-white animate-bounce'
                          : isMine
                          ? 'bg-rose-950/70 text-rose-400 border border-rose-500/40'
                          : 'bg-slate-900/90 border border-slate-800/80 text-white'
                        : isFlagged
                        ? 'bg-slate-800 hover:bg-slate-700 border border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                        : 'bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/60 active:scale-95 shadow-sm shadow-slate-950'
                    }`}
                  >
                    {isRevealed ? (
                      isMine ? (
                        <span>💣</span>
                      ) : count > 0 ? (
                        <span style={{ color: NUMBER_COLORS[count] || '#ffffff' }}>
                          {count}
                        </span>
                      ) : null
                    ) : isFlagged ? (
                      <span className="text-rose-400 text-xs">🚩</span>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* WIN / LOSS OVERLAY TOAST */}
      {gameState === 'won' && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-center space-y-2 animate-in zoom-in-95 duration-200">
          <div className="text-xl font-black text-emerald-300 flex items-center justify-center gap-2">
            <Award size={22} className="text-emerald-400" />
            <span>Cyber Grid Secured!</span>
          </div>
          <p className="text-xs text-slate-300">
            You successfully cleared all {config.mines} mines in <span className="font-bold text-white">{timer} seconds</span>!
          </p>
          <button
            onClick={() => resetGame()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all"
          >
            Play Again
          </button>
        </div>
      )}

      {gameState === 'lost' && (
        <div className="p-4 bg-rose-950/80 border border-rose-500/50 rounded-2xl text-center space-y-2 animate-in zoom-in-95 duration-200">
          <div className="text-xl font-black text-rose-300 flex items-center justify-center gap-2">
            <Flame size={22} className="text-rose-400" />
            <span>Detonation Triggered!</span>
          </div>
          <p className="text-xs text-slate-300">
            A hidden mine was triggered. Review the map above and try again!
          </p>
          <button
            onClick={() => resetGame()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition-all"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};
