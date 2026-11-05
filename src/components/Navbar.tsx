import React from 'react';
import { Gamepad2, Volume2, VolumeX, WifiOff, User as UserIcon, LogIn } from 'lucide-react';
import { User } from '../types';
import { sounds } from '../services/sound';

interface NavbarProps {
  currentUser: User;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onNavigateHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onNavigateHome,
}) => {
  const [isMuted, setIsMuted] = React.useState<boolean>(() => sounds.getMuted());

  const handleToggleSound = () => {
    const next = sounds.toggleMute();
    setIsMuted(next);
  };

  const isGuest = currentUser.id === 'guest_player';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0b0c16]/85 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-3 group text-left transition-transform active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
            <Gamepad2 className="text-white w-6 h-6 transform group-hover:rotate-12 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                GameStack
              </span>
              <span className="text-[10px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Arcade
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none mt-0.5 hidden sm:block">
              100% Offline Game Hub
            </p>
          </div>
        </button>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Offline Ready Pill */}
          <div
            title="All games run 100% locally on your machine without internet required"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <WifiOff size={13} />
            <span>Offline Ready</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX size={18} className="text-rose-400" /> : <Volume2 size={18} className="text-emerald-400" />}
          </button>

          {/* User Profile / Auth Button */}
          {isGuest ? (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <LogIn size={15} />
              <span>Login / Register</span>
            </button>
          ) : (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-indigo-500/30 transition-all group"
            >
              <span className="text-xl transform group-hover:scale-110 transition-transform">
                {currentUser.avatar}
              </span>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-200 group-hover:text-white">
                  {currentUser.username}
                </div>
                <div className="text-[10px] text-indigo-400 font-medium">
                  {currentUser.gamesPlayed} games played
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

