import React from 'react';
import { X, Play, Trophy, Keyboard, BookOpen } from 'lucide-react';
import { storage } from '../services/storage';
import { sounds } from '../services/sound';

export const GameDetailModal = ({ game, onClose, onPlay }) => {
  if (!game) return null;

  const leaderboard = storage.getLeaderboard(game.id, 5);
  const userHigh = storage.getUserHighScore(game.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header Image Banner */}
        <div className="relative h-52 w-full bg-slate-950 flex-shrink-0">
          <img
            src={game.thumbnail}
            alt={game.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
          >
            <X size={20} />
          </button>

          {/* Banner Title */}
          <div className="absolute bottom-4 left-6 right-6">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
              {game.category}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {game.title}
            </h2>
            <p className="text-xs text-indigo-200/80 font-medium">
              {game.tagline}
            </p>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              About This Game
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {game.description}
            </p>
          </div>

          {/* How to Play & Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* How to play */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <BookOpen size={14} />
                <span>How to Play</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {game.instructions.map((inst, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{inst}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Controls */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Keyboard size={14} />
                <span>Controls & Keys</span>
              </h4>
              <div className="space-y-2">
                {game.controls.map((ctrl, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <kbd className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono text-[11px]">
                      {ctrl.key}
                    </kbd>
                    <span className="text-slate-400">{ctrl.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Local High Scores / Leaderboard */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy size={14} />
                <span>Offline Leaderboard</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                Your Record: <strong className="text-amber-400">{userHigh}</strong>
              </span>
            </div>

            {leaderboard.length > 0 ? (
              <div className="space-y-1.5">
                {leaderboard.map((rec, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 font-black text-center ${
                        idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'
                      }`}>
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-200">{rec.username}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500">
                        {new Date(rec.date).toLocaleDateString()}
                      </span>
                      <span className="font-black text-amber-400 text-sm">{rec.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-3">
                No high scores recorded yet. Be the first champion!
              </p>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onPlay(game.id);
            }}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
          >
            <Play size={16} fill="currentColor" />
            <span>Launch Game</span>
          </button>
        </div>
      </div>
    </div>
  );
};

