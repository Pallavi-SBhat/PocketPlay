import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Volume2, VolumeX, User, Bot, Users, Trophy, Sparkles } from 'lucide-react';
import { sounds } from '../../services/sound';
import { storage } from '../../services/storage';

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6]             // diagonals
];

export const XoxGame = ({ onGameOver, onBack }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameMode, setGameMode] = useState('ai');
  const [difficulty, setDifficulty] = useState('medium');
  const [winningLine, setWinningLine] = useState(null);
  const [winner, setWinner] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isMuted, setIsMuted] = useState(() => sounds.getMuted());

  // Score counters
  const [scores, setScores] = useState({
    xWins: 0,
    oWins: 0,
    draws: 0,
    winStreak: 0
  });

  const [bestStreak, setBestStreak] = useState(() => storage.getHighScore('xox'));

  const toggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const checkWinner = useCallback((currentBoard) => {
    for (const [a, b, c] of WINNING_COMBOS) {
      if (
        currentBoard[a] &&
        currentBoard[a] === currentBoard[b] &&
        currentBoard[a] === currentBoard[c]
      ) {
        return { winner: currentBoard[a], line: [a, b, c] };
      }
    }
    if (currentBoard.every(cell => cell !== null)) {
      return { winner: 'draw', line: null };
    }
    return { winner: null, line: null };
  }, []);

  // Minimax Algorithm for Hard AI
  const minimax = (tempBoard, depth, isMaximizing) => {
    const res = checkWinner(tempBoard);
    if (res.winner === 'O') return 10 - depth;
    if (res.winner === 'X') return depth - 10;
    if (res.winner === 'draw') return 0;

    const emptyIndices = tempBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((idx) => idx !== null);

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const idx of emptyIndices) {
        tempBoard[idx] = 'O';
        const evaluation = minimax(tempBoard, depth + 1, false);
        tempBoard[idx] = null;
        maxEval = Math.max(maxEval, evaluation);
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const idx of emptyIndices) {
        tempBoard[idx] = 'X';
        const evaluation = minimax(tempBoard, depth + 1, true);
        tempBoard[idx] = null;
        minEval = Math.min(minEval, evaluation);
      }
      return minEval;
    }
  };

  // Compute best move for AI
  const getAiMove = useCallback((currentBoard) => {
    const emptyIndices = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((idx) => idx !== null);

    if (emptyIndices.length === 0) return -1;

    // Easy: purely random
    if (difficulty === 'easy') {
      const randomIndex = Math.floor(Math.random() * emptyIndices.length);
      return emptyIndices[randomIndex];
    }

    // Medium: Win or block immediate threats
    if (difficulty === 'medium') {
      for (const idx of emptyIndices) {
        const copy = [...currentBoard];
        copy[idx] = 'O';
        if (checkWinner(copy).winner === 'O') return idx;
      }
      for (const idx of emptyIndices) {
        const copy = [...currentBoard];
        copy[idx] = 'X';
        if (checkWinner(copy).winner === 'X') return idx;
      }
      if (currentBoard[4] === null && Math.random() > 0.3) {
        return 4;
      }
      const randomIndex = Math.floor(Math.random() * emptyIndices.length);
      return emptyIndices[randomIndex];
    }

    // Hard: Minimax (Unbeatable)
    let bestScore = -Infinity;
    let bestMove = emptyIndices[0];

    for (const idx of emptyIndices) {
      const copy = [...currentBoard];
      copy[idx] = 'O';
      const score = minimax(copy, 0, false);
      if (score > bestScore) {
        bestScore = score;
        bestMove = idx;
      }
    }

    return bestMove;
  }, [difficulty, checkWinner]);

  // Handle cell click
  const handleCellClick = (index) => {
    if (board[index] || winner || (gameMode === 'ai' && !isXNext)) {
      return;
    }

    const currentTurn = isXNext ? 'X' : 'O';
    sounds.playMark(currentTurn);

    const newBoard = [...board];
    newBoard[index] = currentTurn;
    setBoard(newBoard);

    const check = checkWinner(newBoard);
    if (check.winner) {
      finalizeGame(check.winner, check.line, newBoard);
    } else {
      setIsXNext(!isXNext);
    }
  };

  // AI Turn effect
  useEffect(() => {
    if (gameMode === 'ai' && !isXNext && !winner) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const aiMove = getAiMove(board);
        if (aiMove !== -1) {
          sounds.playMark('O');
          const newBoard = [...board];
          newBoard[aiMove] = 'O';
          setBoard(newBoard);

          const check = checkWinner(newBoard);
          if (check.winner) {
            finalizeGame(check.winner, check.line, newBoard);
          } else {
            setIsXNext(true);
          }
        }
        setIsAiThinking(false);
      }, 450);

      return () => clearTimeout(timer);
    }
  }, [board, isXNext, gameMode, winner, getAiMove, checkWinner]);

  // End of game processing
  const finalizeGame = (gameWinner, line) => {
    setWinner(gameWinner);
    setWinningLine(line);

    if (gameWinner === 'draw') {
      sounds.playCrash();
      setScores(prev => ({ ...prev, draws: prev.draws + 1, winStreak: 0 }));
    } else {
      sounds.playVictory();

      if (gameWinner === 'X') {
        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.6 }
        });

        setScores(prev => {
          const nextStreak = prev.winStreak + 1;
          const newBest = Math.max(nextStreak, bestStreak);
          setBestStreak(newBest);
          storage.recordScore('xox', nextStreak, `Streak of ${nextStreak} wins`);
          return {
            ...prev,
            xWins: prev.xWins + 1,
            winStreak: nextStreak
          };
        });

        if (onGameOver) {
          onGameOver(scores.winStreak + 1);
        }
      } else {
        setScores(prev => ({
          ...prev,
          oWins: prev.oWins + 1,
          winStreak: 0
        }));
      }
    }
  };

  const resetRound = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    setIsAiThinking(false);
  };

  const resetAllScores = () => {
    resetRound();
    setScores({
      xWins: 0,
      oWins: 0,
      draws: 0,
      winStreak: 0
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] py-4 select-none">
      {/* Top Bar */}
      <div className="w-full max-w-[420px] mb-4 flex items-center justify-between px-2 text-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Arcade Store</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-lg">
            <Trophy size={14} />
            <span className="font-semibold text-xs">Best Streak: {bestStreak}</span>
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

      {/* Main Game Container Card */}
      <div className="w-full max-w-[420px] bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
        {/* Game Mode Selector */}
        <div className="flex rounded-xl bg-slate-800/70 p-1 mb-5">
          <button
            onClick={() => {
              setGameMode('ai');
              resetRound();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              gameMode === 'ai'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot size={15} />
            <span>vs Smart Bot</span>
          </button>
          <button
            onClick={() => {
              setGameMode('pvp');
              resetRound();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              gameMode === 'pvp'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={15} />
            <span>2-Player Pass</span>
          </button>
        </div>

        {/* AI Difficulty Selector */}
        {gameMode === 'ai' && (
          <div className="flex items-center justify-between text-xs mb-4 px-1">
            <span className="text-slate-400 font-medium">Bot Difficulty:</span>
            <div className="flex gap-1.5">
              {['easy', 'medium', 'hard'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => {
                    setDifficulty(lvl);
                    resetRound();
                  }}
                  className={`px-2.5 py-1 rounded-md font-semibold capitalize transition-all ${
                    difficulty === lvl
                      ? lvl === 'hard'
                        ? 'bg-rose-500/20 border border-rose-500/50 text-rose-400'
                        : lvl === 'medium'
                        ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
                        : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Score Board Cards */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div
            className={`p-3 rounded-2xl border text-center transition-all ${
              isXNext && !winner
                ? 'bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-800/50 border-slate-800'
            }`}
          >
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <User size={12} />
              <span>Player X</span>
            </div>
            <div className="text-2xl font-black text-white mt-0.5">{scores.xWins}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800 text-center">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Ties
            </div>
            <div className="text-2xl font-black text-slate-300 mt-0.5">{scores.draws}</div>
          </div>

          <div
            className={`p-3 rounded-2xl border text-center transition-all ${
              !isXNext && !winner
                ? 'bg-rose-500/10 border-rose-500/40 shadow-lg shadow-rose-500/10'
                : 'bg-slate-800/50 border-slate-800'
            }`}
          >
            <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center justify-center gap-1">
              {gameMode === 'ai' ? <Bot size={12} /> : <User size={12} />}
              <span>{gameMode === 'ai' ? 'Bot (O)' : 'Player O'}</span>
            </div>
            <div className="text-2xl font-black text-white mt-0.5">{scores.oWins}</div>
          </div>
        </div>

        {/* Turn Status Message */}
        <div className="h-8 flex items-center justify-center text-sm font-semibold mb-4">
          {winner ? (
            winner === 'draw' ? (
              <span className="text-amber-400 font-bold">🤝 Round ended in a Tie!</span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Sparkles size={16} />
                <span>
                  {winner === 'X'
                    ? 'Player X Wins!'
                    : gameMode === 'ai'
                    ? 'Bot Wins! Better luck next round!'
                    : 'Player O Wins!'}
                </span>
              </span>
            )
          ) : isAiThinking ? (
            <span className="text-indigo-400 flex items-center gap-2 animate-pulse">
              <Bot size={16} />
              <span>Bot is thinking...</span>
            </span>
          ) : (
            <span className={isXNext ? 'text-cyan-400' : 'text-rose-400'}>
              {isXNext
                ? 'Player X Turn'
                : gameMode === 'ai'
                ? 'Bot Turn'
                : 'Player O Turn'}
            </span>
          )}
        </div>

        {/* 3x3 Game Board Grid */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
          {board.map((cell, index) => {
            const isWinningCell = winningLine?.includes(index);
            return (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={cell !== null || winner !== null || (gameMode === 'ai' && !isXNext)}
                className={`h-24 sm:h-28 rounded-xl font-arcade text-3xl sm:text-4xl flex items-center justify-center transition-all duration-150 transform ${
                  isWinningCell
                    ? 'bg-emerald-500/30 border-2 border-emerald-400 scale-105 shadow-lg shadow-emerald-500/20'
                    : cell
                    ? 'bg-slate-800/90 border border-slate-700/60'
                    : 'bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 hover:scale-[1.02] active:scale-95'
                }`}
              >
                {cell === 'X' && (
                  <span className="text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)] animate-in zoom-in duration-150">
                    X
                  </span>
                )}
                {cell === 'O' && (
                  <span className="text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.8)] animate-in zoom-in duration-150">
                    O
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={resetRound}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <RotateCcw size={16} />
            <span>Next Round</span>
          </button>

          <button
            onClick={resetAllScores}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            title="Reset scores to 0"
          >
            Reset Scores
          </button>
        </div>
      </div>
    </div>
  );
};

