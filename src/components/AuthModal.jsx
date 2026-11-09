import React, { useState } from 'react';
import { X, UserPlus, LogIn, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { storage, AVATAR_OPTIONS } from '../services/storage';
import { sounds } from '../services/sound';

export const AuthModal = ({ isOpen, onClose, onUserChange }) => {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [statusMessage, setStatusMessage] = useState(null);

  const existingUsers = storage.getUsers();

  if (!isOpen) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    sounds.playClick();
    const result = storage.login(username);
    if (result.success && result.user) {
      setStatusMessage({ type: 'success', text: result.message });
      setTimeout(() => {
        onUserChange(result.user);
        onClose();
        setStatusMessage(null);
        setUsername('');
      }, 500);
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  const handleQuickSelectUser = (u) => {
    sounds.playClick();
    storage.setCurrentUser(u);
    onUserChange(u);
    onClose();
  };

  const handleRegister = (e) => {
    e.preventDefault();
    sounds.playClick();
    const result = storage.register(username, email, selectedAvatar);
    if (result.success && result.user) {
      setStatusMessage({ type: 'success', text: result.message });
      sounds.playVictory();
      setTimeout(() => {
        onUserChange(result.user);
        onClose();
        setStatusMessage(null);
        setUsername('');
        setEmail('');
      }, 600);
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  const handleContinueAsGuest = () => {
    sounds.playClick();
    storage.logout();
    onUserChange(storage.getCurrentUser());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Tabs: Login / Register */}
        <div className="flex bg-slate-800/80 rounded-2xl p-1 mb-6">
          <button
            onClick={() => {
              setMode('login');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              mode === 'login'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn size={16} />
            <span>Player Login</span>
          </button>
          <button
            onClick={() => {
              setMode('register');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              mode === 'register'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus size={16} />
            <span>Create Account</span>
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mb-5 p-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter Player Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. NeonGamer99"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white text-sm transition-all"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 font-bold text-sm text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <LogIn size={18} />
                <span>Sign In</span>
              </button>
            </form>

            {/* Existing local accounts on this offline device */}
            {existingUsers.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Quick Switch Local Player:
                </p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                  {existingUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleQuickSelectUser(u)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500 text-xs text-slate-200 transition-all"
                    >
                      <span>{u.avatar}</span>
                      <span className="font-semibold">{u.username}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Choose Your Gamer Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map(avatar => (
                  <button
                    type="button"
                    key={avatar}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                      selectedAvatar === avatar
                        ? 'bg-indigo-600 border-2 border-indigo-400 scale-105 shadow-md shadow-indigo-600/40'
                        : 'bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Gamer Username *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Choose your handle..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email / Tag <span className="text-slate-500 font-normal">(optional offline identifier)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="player@offline.game"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white text-sm transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 font-bold text-sm text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              <span>Create Offline Profile</span>
            </button>
          </form>
        )}

        {/* Continue as Guest option */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
          <button
            onClick={handleContinueAsGuest}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Just want to play without logging in? <span className="text-indigo-400 font-semibold underline underline-offset-4">Continue as Guest</span>
          </button>
        </div>
      </div>
    </div>
  );
};

