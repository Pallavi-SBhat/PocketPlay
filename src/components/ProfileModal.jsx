import React, { useState } from 'react';
import { X, Trophy, Gamepad2, Calendar, LogOut, Check } from 'lucide-react';
import { storage, AVATAR_OPTIONS } from '../services/storage';
import { sounds } from '../services/sound';

export const ProfileModal = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  onLogout
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatar);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  if (!isOpen) return null;

  const flappyHigh = storage.getUserHighScore('flappy-bird', currentUser.id);
  const xoxStreak = storage.getUserHighScore('xox', currentUser.id);
  const snakeHigh = storage.getUserHighScore('retro-snake', currentUser.id);
  const wordStats = storage.getWordFinderStats();

  const handleAvatarChange = (avatar) => {
    setSelectedAvatar(avatar);
    sounds.playClick();
    const updated = storage.updateProfile(avatar);
    onUserUpdate(updated);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 1500);
  };

  const handleLogout = () => {
    sounds.playClick();
    storage.logout();
    onLogout();
    onClose();
  };

  const formattedDate = new Date(currentUser.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/25">
            {currentUser.avatar}
          </div>
          <div>
            <h2 className="text-xl font-black text-white">{currentUser.username}</h2>
            <p className="text-xs text-indigo-400 font-mono">{currentUser.email}</p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
              <Calendar size={12} />
              <span>Joined {formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
            <div className="flex justify-center text-amber-400 mb-0.5">
              <Trophy size={15} />
            </div>
            <div className="text-base font-black text-amber-400">{flappyHigh}</div>
            <div className="text-[10px] text-slate-400 font-medium">Flappy Best</div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
            <div className="flex justify-center text-emerald-400 mb-0.5">
              <Trophy size={15} />
            </div>
            <div className="text-base font-black text-emerald-400">{snakeHigh}</div>
            <div className="text-[10px] text-slate-400 font-medium">Snake Best</div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
            <div className="flex justify-center text-cyan-400 mb-0.5">
              <Trophy size={15} />
            </div>
            <div className="text-base font-black text-cyan-400">{xoxStreak}</div>
            <div className="text-[10px] text-slate-400 font-medium">XOX Streak</div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
            <div className="flex justify-center text-purple-400 mb-0.5">
              <Trophy size={15} />
            </div>
            <div className="text-base font-black text-purple-300">Lvl {wordStats.unlockedLevel}</div>
            <div className="text-[10px] text-slate-400 font-medium">Word Finder</div>
          </div>
        </div>

        {/* Change Avatar Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300">
              Customize Avatar
            </label>
            {isSavedNotice && (
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check size={12} /> Updated!
              </span>
            )}
          </div>
          <div className="grid grid-cols-6 gap-2">
            {AVATAR_OPTIONS.map(av => (
              <button
                key={av}
                onClick={() => handleAvatarChange(av)}
                className={`h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                  selectedAvatar === av
                    ? 'bg-indigo-600 border-2 border-indigo-400 scale-105'
                    : 'bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Log Out / Switch Account */}
        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/40 text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          <span>Switch Account / Sign Out</span>
        </button>
      </div>
    </div>
  );
};

