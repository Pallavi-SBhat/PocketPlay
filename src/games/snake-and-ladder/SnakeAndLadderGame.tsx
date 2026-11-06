import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, RotateCcw, Volume2, VolumeX, Trophy, Users, 
  Sparkles, Bot, Play, UserPlus, Dices, ChevronRight, Award, ShieldAlert
} from 'lucide-react';
import { sounds } from '../../services/sound';
import { storage } from '../../services/storage';

interface SnakeAndLadderProps {
  onGameOver?: (score: number) => void;
  onBack?: () => void;
}

export interface PlayerConfig {
  id: number;
  name: string;
  avatar: string;
  color: string;
  bgClass: string;
  borderClass: string;
  ringClass: string;
  isBot: boolean;
  position: number; // 1 to 100
}

// Ladders: Start -> End (climb up)
export const LADDERS: Record<number, number> = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91
};

// Snakes: Start -> End (slide down)
export const SNAKES: Record<number, number> = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  99: 78
};

const DEFAULT_AVATARS = ['🦁', '🦊', '🚀', '🤖', '🐱', '⚡', '🐼', '👑'];
const PLAYER_THEMES = [
  { color: '#ef4444', bgClass: 'bg-rose-500', borderClass: 'border-rose-400', ringClass: 'ring-rose-500' },
  { color: '#3b82f6', bgClass: 'bg-blue-500', borderClass: 'border-blue-400', ringClass: 'ring-blue-500' },
  { color: '#10b981', bgClass: 'bg-emerald-500', borderClass: 'border-emerald-400', ringClass: 'ring-emerald-500' },
  { color: '#f59e0b', bgClass: 'bg-amber-500', borderClass: 'border-amber-400', ringClass: 'ring-amber-500' }
];

export function getSquareCoords(square: number): { row: number; col: number; x: number; y: number } {
  const index = Math.max(1, Math.min(100, square)) - 1;
  const rowFromBottom = Math.floor(index / 10);
  const colInRow = index % 10;
  const col = rowFromBottom % 2 === 0 ? colInRow : 9 - colInRow;
  const row = 9 - rowFromBottom; // 0 is top row, 9 is bottom row
  return {
    row,
    col,
    x: (col + 0.5) * 10,
    y: (row + 0.5) * 10
  };
}

export const SnakeAndLadderGame: React.FC<SnakeAndLadderProps> = ({ onGameOver, onBack }) => {
  // Game Setup States
  const [isConfiguring, setIsConfiguring] = useState<boolean>(true);
  const [numPlayers, setNumPlayers] = useState<number>(2);
  const [players, setPlayers] = useState<PlayerConfig[]>([
    { id: 1, name: 'Player 1', avatar: '🦁', color: PLAYER_THEMES[0].color, bgClass: PLAYER_THEMES[0].bgClass, borderClass: PLAYER_THEMES[0].borderClass, ringClass: PLAYER_THEMES[0].ringClass, isBot: false, position: 1 },
    { id: 2, name: 'Player 2', avatar: '🦊', color: PLAYER_THEMES[1].color, bgClass: PLAYER_THEMES[1].bgClass, borderClass: PLAYER_THEMES[1].borderClass, ringClass: PLAYER_THEMES[1].ringClass, isBot: false, position: 1 }
  ]);

  // Active Play States
  const [currentTurnIdx, setCurrentTurnIdx] = useState<number>(0);
  const [diceValue, setDiceValue] = useState<number>(1);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [winner, setWinner] = useState<PlayerConfig | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.getMuted());
  const [gameLog, setGameLog] = useState<{ id: string; text: string; type: 'normal' | 'ladder' | 'snake' | 'win' | 'six' }[]>([]);
  const [turnMessage, setTurnMessage] = useState<string>('Roll the dice to start!');

  const isCurrentBot = players[currentTurnIdx]?.isBot && !winner && !isConfiguring;

  const toggleMute = () => {
    const next = sounds.toggleMute();
    setIsMuted(next);
  };

  // Adjust number of players in configuration
  const handleNumPlayersChange = (count: number) => {
    setNumPlayers(count);
    const newPlayers: PlayerConfig[] = [];
    for (let i = 0; i < count; i++) {
      newPlayers.push({
        id: i + 1,
        name: players[i]?.name || (i === 1 && count > 1 ? 'Player 2' : i > 1 ? `Player ${i + 1}` : 'Player 1'),
        avatar: players[i]?.avatar || DEFAULT_AVATARS[i % DEFAULT_AVATARS.length],
        color: PLAYER_THEMES[i].color,
        bgClass: PLAYER_THEMES[i].bgClass,
        borderClass: PLAYER_THEMES[i].borderClass,
        ringClass: PLAYER_THEMES[i].ringClass,
        isBot: players[i]?.isBot ?? (i > 0 ? false : false),
        position: 1
      });
    }
    setPlayers(newPlayers);
  };

  const updatePlayer = (idx: number, updates: Partial<PlayerConfig>) => {
    setPlayers(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...updates };
      return copy;
    });
  };

  const startGame = () => {
    sounds.playClick();
    setIsConfiguring(false);
    setCurrentTurnIdx(0);
    setWinner(null);
    setGameLog([
      { id: 'start', text: `Game started with ${players.length} players! Roll the dice!`, type: 'normal' }
    ]);
    setTurnMessage(`${players[0].name}'s turn to roll!`);
  };

  const resetGame = () => {
    sounds.playClick();
    setIsConfiguring(true);
    setWinner(null);
    setIsRolling(false);
    setIsMoving(false);
    setPlayers(prev => prev.map(p => ({ ...p, position: 1 })));
    setGameLog([]);
  };

  // Step-by-step token movement
  const movePlayerStepByStep = useCallback(async (playerIdx: number, roll: number) => {
    setIsMoving(true);
    const player = players[playerIdx];
    let currentPos = player.position;
    let targetPos = currentPos + roll;

    // Bounce back if roll exceeds 100
    if (targetPos > 100) {
      const excess = targetPos - 100;
      targetPos = 100 - excess;
      setGameLog(prev => [
        { id: String(Date.now()), text: `⚡ ${player.name} needed exact roll! Bounced back to ${targetPos}`, type: 'normal' },
        ...prev.slice(0, 15)
      ]);
    }

    // Step-by-step animation
    const stepCount = Math.abs(targetPos - currentPos);
    const direction = targetPos >= currentPos ? 1 : -1;

    for (let s = 1; s <= stepCount; s++) {
      currentPos += direction;
      sounds.playTokenStep();
      setPlayers(prev => {
        const copy = [...prev];
        copy[playerIdx] = { ...copy[playerIdx], position: currentPos };
        return copy;
      });
      await new Promise(r => setTimeout(r, 120));
    }

    // Check Ladder
    if (LADDERS[currentPos]) {
      const climbTo = LADDERS[currentPos];
      sounds.playLadderClimb();
      setTurnMessage(`🪜 WOW! ${player.name} climbed a ladder from ${currentPos} to ${climbTo}!`);
      setGameLog(prev => [
        { id: String(Date.now()), text: `🪜 ${player.name} climbed ladder from ${currentPos} to ${climbTo}!`, type: 'ladder' },
        ...prev.slice(0, 15)
      ]);
      await new Promise(r => setTimeout(r, 300));
      currentPos = climbTo;
      setPlayers(prev => {
        const copy = [...prev];
        copy[playerIdx] = { ...copy[playerIdx], position: currentPos };
        return copy;
      });
    }
    // Check Snake
    else if (SNAKES[currentPos]) {
      const slideTo = SNAKES[currentPos];
      sounds.playSnakeBite();
      setTurnMessage(`🐍 OH NO! ${player.name} got bitten by a snake from ${currentPos} down to ${slideTo}!`);
      setGameLog(prev => [
        { id: String(Date.now()), text: `🐍 ${player.name} bitten by snake at ${currentPos}, slid to ${slideTo}!`, type: 'snake' },
        ...prev.slice(0, 15)
      ]);
      await new Promise(r => setTimeout(r, 350));
      currentPos = slideTo;
      setPlayers(prev => {
        const copy = [...prev];
        copy[playerIdx] = { ...copy[playerIdx], position: currentPos };
        return copy;
      });
    }

    // Check Victory
    if (currentPos === 100) {
      setWinner(player);
      sounds.playVictory();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
      storage.recordScore('snake-ladder', 100, `${player.name} won the match!`);
      setGameLog(prev => [
        { id: String(Date.now()), text: `🏆 ${player.name} reached square 100 and WON THE GAME!`, type: 'win' },
        ...prev.slice(0, 15)
      ]);
      if (onGameOver) onGameOver(100);
      setIsMoving(false);
      return;
    }

    // Extra Turn if rolled 6
    if (roll === 6) {
      sounds.playScore();
      setTurnMessage(`🎉 ${player.name} rolled a 6! Gets an EXTRA TURN!`);
      setGameLog(prev => [
        { id: String(Date.now()), text: `🎲 ${player.name} rolled a 6 and gets an extra turn!`, type: 'six' },
        ...prev.slice(0, 15)
      ]);
      setIsMoving(false);
    } else {
      // Pass turn to next player
      const nextTurn = (playerIdx + 1) % players.length;
      setCurrentTurnIdx(nextTurn);
      setTurnMessage(`${players[nextTurn].name}'s turn to roll!`);
      setIsMoving(false);
    }
  }, [players, onGameOver]);

  // Dice Roll Handler
  const handleRollDice = useCallback(() => {
    if (isRolling || isMoving || winner) return;

    setIsRolling(true);
    sounds.playDiceRoll();

    // Dice animation frames
    let rollTicks = 0;
    const interval = setInterval(() => {
      const tempRoll = Math.floor(Math.random() * 6) + 1;
      setDiceValue(tempRoll);
      rollTicks++;

      if (rollTicks >= 9) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalRoll);
        setIsRolling(false);
        movePlayerStepByStep(currentTurnIdx, finalRoll);
      }
    }, 60);
  }, [isRolling, isMoving, winner, currentTurnIdx, movePlayerStepByStep]);

  // Automatic roll for Computer Bot
  useEffect(() => {
    if (isCurrentBot && !isRolling && !isMoving && !winner) {
      const botTimer = setTimeout(() => {
        handleRollDice();
      }, 750);
      return () => clearTimeout(botTimer);
    }
  }, [isCurrentBot, isRolling, isMoving, winner, handleRollDice]);

  // Render SVG connecting lines for Ladders and Snakes
  const renderBoardConnections = () => {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          {/* Ladder Gradient */}
          <linearGradient id="ladderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Snake Gradient */}
          <linearGradient id="snakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
        </defs>

        {/* Draw Ladders */}
        {Object.entries(LADDERS).map(([startStr, end]) => {
          const start = Number(startStr);
          const p1 = getSquareCoords(start);
          const p2 = getSquareCoords(end);

          // Vector math for parallel ladder rails
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const nx = (-dy / len) * 1.4;
          const ny = (dx / len) * 1.4;

          const numRungs = Math.max(3, Math.floor(len / 4));
          const rungs = [];
          for (let r = 1; r < numRungs; r++) {
            const t = r / numRungs;
            const rx = p1.x + dx * t;
            const ry = p1.y + dy * t;
            rungs.push(
              <line
                key={`rung-${start}-${r}`}
                x1={rx - nx}
                y1={ry - ny}
                x2={rx + nx}
                y2={ry + ny}
                stroke="#38bdf8"
                strokeWidth="0.8"
                strokeLinecap="round"
                opacity="0.9"
              />
            );
          }

          return (
            <g key={`ladder-${start}`}>
              {/* Left Rail */}
              <line
                x1={p1.x - nx}
                y1={p1.y - ny}
                x2={p2.x - nx}
                y2={p2.y - ny}
                stroke="url(#ladderGrad)"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.85"
              />
              {/* Right Rail */}
              <line
                x1={p1.x + nx}
                y1={p1.y + ny}
                x2={p2.x + nx}
                y2={p2.y + ny}
                stroke="url(#ladderGrad)"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.85"
              />
              {/* Rungs */}
              {rungs}
            </g>
          );
        })}

        {/* Draw Snakes (Smooth Bézier Curves) */}
        {Object.entries(SNAKES).map(([headStr, tail]) => {
          const head = Number(headStr);
          const p1 = getSquareCoords(head); // Snake Head
          const p2 = getSquareCoords(tail); // Snake Tail

          // Control point for a wavy snake curve
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          const offset = ((head % 2 === 0 ? 1 : -1) * 7);
          const cp1x = midX + offset;
          const cp1y = midY - offset;

          return (
            <g key={`snake-${head}`}>
              {/* Snake Body Shadow */}
              <path
                d={`M ${p1.x} ${p1.y} Q ${cp1x} ${cp1y} ${p2.x} ${p2.y}`}
                fill="none"
                stroke="rgba(0,0,0,0.4)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Snake Body Glowing Spine */}
              <path
                d={`M ${p1.x} ${p1.y} Q ${cp1x} ${cp1y} ${p2.x} ${p2.y}`}
                fill="none"
                stroke="url(#snakeGrad)"
                strokeWidth="1.8"
                strokeDasharray="2 1.2"
                strokeLinecap="round"
              />
              {/* Snake Head Marker */}
              <circle cx={p1.x} cy={p1.y} r="2.2" fill="#ef4444" stroke="#ffffff" strokeWidth="0.6" />
              <circle cx={p1.x} cy={p1.y} r="1" fill="#7f1d1d" />
              {/* Snake Tail Marker */}
              <circle cx={p2.x} cy={p2.y} r="1.2" fill="#f97316" />
            </g>
          );
        })}
      </svg>
    );
  };

  // Dots layout for dice face
  const renderDiceDots = (val: number) => {
    switch (val) {
      case 1:
        return <div className="w-3.5 h-3.5 bg-rose-500 rounded-full shadow-inner" />;
      case 2:
        return (
          <div className="w-full h-full flex flex-col justify-between p-1.5">
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full self-start" />
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full self-end" />
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full flex flex-col justify-between p-1.5">
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full self-start" />
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full self-center" />
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full self-end" />
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full grid grid-cols-2 p-1.5 place-items-center">
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />
          </div>
        );
      case 5:
        return (
          <div className="w-full h-full grid grid-cols-3 p-1.5 place-items-center">
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />
            <div />
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />
            <div />
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />
            <div />
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />
            <div />
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />
          </div>
        );
      case 6:
        return (
          <div className="w-full h-full grid grid-cols-2 p-1.5 place-items-center gap-y-1">
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] py-4 select-none">
      {/* Top Header Bar */}
      <div className="w-full max-w-4xl mb-4 flex items-center justify-between px-2 text-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Arcade Store</span>
        </button>

        <div className="flex items-center gap-2">
          {!isConfiguring && (
            <button
              onClick={resetGame}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-semibold"
            >
              <RotateCcw size={14} />
              <span>New Match</span>
            </button>
          )}

          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={16} className="text-red-400" /> : <Volume2 size={16} className="text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* 1. MATCH CONFIGURATION VIEW (Choose Players & Avatars) */}
      {isConfiguring ? (
        <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md animate-in fade-in duration-200">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20 mb-3">
              🎲
            </div>
            <h2 className="text-2xl font-black text-white">Snake & Ladder Arcade</h2>
            <p className="text-xs text-slate-400 mt-1">
              Multiplayer Pass & Play • Challenge friends or play with Computer Bots!
            </p>
          </div>

          {/* Number of Players Selector */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select Number of Players
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[2, 3, 4].map(n => (
                <button
                  key={n}
                  onClick={() => handleNumPlayersChange(n)}
                  className={`py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border transition-all ${
                    numPlayers === n
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Users size={16} />
                  <span>{n} Players</span>
                </button>
              ))}
            </div>
          </div>

          {/* Players Customization Cards */}
          <div className="space-y-3 mb-6">
            {players.map((p, idx) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center gap-3"
              >
                {/* Avatar Cycle Button */}
                <button
                  type="button"
                  title="Click to cycle avatar"
                  onClick={() => {
                    const currentIdx = DEFAULT_AVATARS.indexOf(p.avatar);
                    const nextAvatar = DEFAULT_AVATARS[(currentIdx + 1) % DEFAULT_AVATARS.length];
                    updatePlayer(idx, { avatar: nextAvatar });
                  }}
                  className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center border ${p.borderClass} ${p.bgClass}/20 hover:scale-105 transition-transform flex-shrink-0`}
                >
                  {p.avatar}
                </button>

                {/* Player Name Input */}
                <div className="flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                    Player {idx + 1}
                  </div>
                  <input
                    type="text"
                    value={p.name}
                    onChange={e => updatePlayer(idx, { name: e.target.value })}
                    className="w-full bg-slate-950/70 border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs text-white font-semibold outline-none focus:border-indigo-500"
                    placeholder={`Player ${idx + 1}`}
                  />
                </div>

                {/* Human vs Computer Bot Toggle */}
                <button
                  type="button"
                  onClick={() => updatePlayer(idx, { isBot: !p.isBot })}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    p.isBot
                      ? 'bg-purple-600/20 border border-purple-500/50 text-purple-300'
                      : 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-300'
                  }`}
                >
                  {p.isBot ? <Bot size={14} /> : <Users size={14} />}
                  <span>{p.isBot ? 'Bot' : 'Human'}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Start Game Button */}
          <button
            onClick={startGame}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 font-black text-sm text-white shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Play size={18} fill="currentColor" />
            <span>Launch Game</span>
          </button>
        </div>
      ) : (
        /* 2. ACTIVE SNAKE AND LADDER BOARD VIEW */
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left/Main Column: 10x10 Game Board */}
          <div className="lg:col-span-8 flex flex-col items-center">
            {/* Board Frame */}
            <div className="relative w-full aspect-square max-w-[500px] bg-slate-950 rounded-3xl p-3 border-4 border-indigo-500/30 shadow-2xl overflow-hidden">
              {/* SVG Overlay for drawing Ladders and Snakes */}
              {renderBoardConnections()}

              {/* 10x10 Grid */}
              <div className="grid grid-cols-10 grid-rows-10 w-full h-full gap-1 relative z-0">
                {Array.from({ length: 100 }, (_, i) => {
                  const squareNumber = 100 - i;
                  // Map display square based on boustrophedon
                  const rowFromTop = Math.floor(i / 10);
                  const colInGrid = i % 10;
                  const rowFromBottom = 9 - rowFromTop;
                  const actualSquare =
                    rowFromBottom % 2 === 0
                      ? rowFromBottom * 10 + (colInGrid + 1)
                      : rowFromBottom * 10 + (10 - colInGrid);

                  const isLadderStart = LADDERS[actualSquare] !== undefined;
                  const isLadderEnd = Object.values(LADDERS).includes(actualSquare);
                  const isSnakeHead = SNAKES[actualSquare] !== undefined;
                  const isSnakeTail = Object.values(SNAKES).includes(actualSquare);

                  // Players on this square
                  const playersHere = players.filter(p => p.position === actualSquare);

                  return (
                    <div
                      key={actualSquare}
                      className={`relative rounded-lg flex flex-col justify-between p-0.5 sm:p-1 text-[9px] sm:text-[11px] font-bold border transition-colors ${
                        actualSquare === 100
                          ? 'bg-gradient-to-tr from-amber-500/30 to-yellow-500/40 border-amber-400/80 text-amber-200'
                          : actualSquare === 1
                          ? 'bg-gradient-to-tr from-emerald-500/30 to-teal-500/40 border-emerald-400/80 text-emerald-200'
                          : isSnakeHead
                          ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                          : isLadderStart
                          ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
                          : actualSquare % 2 === 0
                          ? 'bg-slate-900/90 border-slate-800/80 text-slate-400'
                          : 'bg-slate-800/50 border-slate-700/60 text-slate-300'
                      }`}
                    >
                      {/* Square Number & Indicator Badges */}
                      <div className="flex items-center justify-between leading-none">
                        <span className="font-mono">{actualSquare}</span>
                        {actualSquare === 100 && <span>🏆</span>}
                        {actualSquare === 1 && <span className="text-[8px] text-emerald-400">START</span>}
                        {isSnakeHead && (
                          <span className="text-[8px] text-rose-400 font-extrabold">
                            🐍↓{SNAKES[actualSquare]}
                          </span>
                        )}
                        {isLadderStart && (
                          <span className="text-[8px] text-cyan-400 font-extrabold">
                            🪜↑{LADDERS[actualSquare]}
                          </span>
                        )}
                      </div>

                      {/* Token Container for Players on this tile */}
                      <div className="flex flex-wrap items-center justify-center gap-0.5 mt-auto">
                        {playersHere.map(p => (
                          <div
                            key={p.id}
                            title={`${p.name} (Tile ${actualSquare})`}
                            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full ${p.bgClass} flex items-center justify-center text-[10px] sm:text-xs shadow-md border border-white transform transition-all duration-300 animate-in zoom-in-75`}
                          >
                            <span>{p.avatar}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Turn status ticker */}
            <div className="w-full max-w-[500px] mt-3 px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-center text-slate-200 flex items-center justify-center gap-2">
              <span className="text-base">{players[currentTurnIdx]?.avatar}</span>
              <span>{turnMessage}</span>
            </div>
          </div>

          {/* Right Column: Dice Roller, Players Leaderboard & Match Logs */}
          <div className="lg:col-span-4 space-y-4">
            {/* DICE ROLLING PANEL */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col items-center text-center">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Current Turn: <strong className="text-white">{players[currentTurnIdx]?.name}</strong>
              </div>

              {/* 3D-styled Animated Dice */}
              <div className="relative my-2">
                <div
                  className={`w-20 h-20 rounded-2xl bg-white border-2 border-slate-300 shadow-2xl flex items-center justify-center transition-all transform ${
                    isRolling ? 'rotate-180 scale-105' : 'hover:scale-105'
                  }`}
                >
                  {renderDiceDots(diceValue)}
                </div>

                {/* Roll glow */}
                <div
                  className="absolute inset-0 rounded-2xl blur-lg pointer-events-none opacity-40"
                  style={{ backgroundColor: players[currentTurnIdx]?.color }}
                />
              </div>

              {/* Roll Dice Button */}
              <button
                onClick={handleRollDice}
                disabled={isRolling || isMoving || winner !== null || isCurrentBot}
                className={`w-full mt-4 py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isRolling || isMoving || winner !== null || isCurrentBot
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-orange-500/25 active:scale-95'
                }`}
              >
                <Dices size={18} className={isRolling ? 'animate-spin' : ''} />
                <span>
                  {isCurrentBot
                    ? `${players[currentTurnIdx]?.name} is Rolling...`
                    : isRolling
                    ? 'Rolling...'
                    : isMoving
                    ? 'Moving...'
                    : 'Roll Dice'}
                </span>
              </button>
            </div>

            {/* PLAYERS STANDINGS */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Trophy size={14} className="text-amber-400" />
                <span>Match Standings</span>
              </h4>

              <div className="space-y-2">
                {[...players]
                  .sort((a, b) => b.position - a.position)
                  .map((p, rank) => {
                    const isTurn = players[currentTurnIdx]?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                          isTurn
                            ? 'bg-indigo-600/20 border-indigo-500/50 shadow-md'
                            : 'bg-slate-800/40 border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-5 font-black text-center ${rank === 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                            #{rank + 1}
                          </span>
                          <span className="text-lg">{p.avatar}</span>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1">
                              <span>{p.name}</span>
                              {p.isBot && <Bot size={11} className="text-slate-400" />}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {100 - p.position} steps to Goal
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-indigo-300">
                            Square {p.position}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* LIVE MATCH LOGS */}
            <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Action Log
              </h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-[11px]">
                {gameLog.map(item => (
                  <div
                    key={item.id}
                    className={`px-2.5 py-1 rounded-lg border ${
                      item.type === 'win'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-bold'
                        : item.type === 'ladder'
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                        : item.type === 'snake'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : item.type === 'six'
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 font-semibold'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-300'
                    }`}
                  >
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WINNER CELEBRATION MODAL */}
      {winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-3xl p-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-4xl mx-auto flex items-center justify-center mb-3 animate-bounce">
              🏆
            </div>
            <h3 className="text-2xl font-black text-amber-400 mb-1">VICTORY!</h3>
            <p className="text-base font-bold text-white flex items-center justify-center gap-1.5 mb-2">
              <span>{winner.avatar}</span>
              <span>{winner.name} Reached 100!</span>
            </p>
            <p className="text-xs text-slate-400 mb-6">
              Champion of the Snake & Ladder Arcade!
            </p>

            <div className="flex gap-2">
              <button
                onClick={resetGame}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={16} />
                <span>Play Again</span>
              </button>

              <button
                onClick={onBack}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Arcade Store
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

