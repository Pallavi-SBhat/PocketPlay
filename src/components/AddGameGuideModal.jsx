import React, { useState } from 'react';
import { X, PlusCircle, Code, CheckCircle, FileCode, Sparkles } from 'lucide-react';

export const AddGameGuideModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const codeSnippet = `// 1. Create your game component in src/games/your-game/YourGame.jsx:
export const YourGame = ({ onGameOver, onBack }) => {
  return <div>Your Offline Game Logic Here</div>;
};

// 2. Open src/games/registry.js and add it to GAMES_LIST:
{
  id: 'your-game-id',
  title: 'Your Game Title',
  tagline: 'Short catchy tagline',
  description: 'Full description of how it plays...',
  category: 'Arcade', // or 'Puzzle' | 'Strategy' | 'Action'
  tags: ['Retro', 'Offline'],
  thumbnail: 'https://...',
  accentColor: '#10b981',
  instructions: ['Rule 1', 'Rule 2'],
  controls: [{ key: 'Arrow Keys', action: 'Move' }],
  component: YourGame
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <PlusCircle size={22} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">How to Add More Games</h3>
            <p className="text-xs text-slate-400">Plug-and-play modular architecture for your future games</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          GameStack is architected so you can effortlessly drop in new games over the next few days. Each game is a standalone React component connected to the global offline audio synthesizer and offline high score database.
        </p>

        {/* 3 Step Guide */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">1</span>
            <div className="text-xs">
              <strong className="text-white block mb-0.5">Create your Game Folder</strong>
              <span className="text-slate-300">Create a new folder in <code className="text-indigo-300 font-mono">src/games/pong/</code> or <code className="text-indigo-300 font-mono">src/games/2048/</code>.</span>
            </div>
          </div>

          <div className="flex gap-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">2</span>
            <div className="text-xs">
              <strong className="text-white block mb-0.5">Use the Offline Services</strong>
              <span className="text-slate-300">Call <code className="text-indigo-300 font-mono">storage.recordScore(gameId, score)</code> to save scores offline and <code className="text-indigo-300 font-mono">sounds.playScore()</code> for synthesized retro audio.</span>
            </div>
          </div>

          <div className="flex gap-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">3</span>
            <div className="text-xs">
              <strong className="text-white block mb-0.5">Register in registry.js</strong>
              <span className="text-slate-300">Append your game's metadata to the <code className="text-indigo-300 font-mono">GAMES_LIST</code> array in <code className="text-indigo-300 font-mono">src/games/registry.js</code>. The store UI will automatically render it!</span>
            </div>
          </div>
        </div>

        {/* Code Snippet */}
        <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 mb-6">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <FileCode size={14} className="text-indigo-400" />
              Example Registration
            </span>
            <button
              onClick={copyToClipboard}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Code size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="text-xs font-mono text-indigo-200 overflow-x-auto p-2 bg-slate-900/60 rounded-xl leading-relaxed">
            {codeSnippet}
          </pre>
        </div>

        {/* Popular suggestions */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" />
            <span>Suggested Games for the Next Few Days:</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {['2048 Number Puzzle', 'Brick Breaker / Arkanoid', 'Minesweeper Neon', 'Space Invaders', 'Memory Match Cards', 'Pong Classic'].map(name => (
              <span key={name} className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

