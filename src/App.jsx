import React, { useState } from 'react';
import { Search, Flame, PlusCircle, Gamepad2, Heart } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { GameCard } from './components/GameCard';
import { GameDetailModal } from './components/GameDetailModal';
import { AddGameGuideModal } from './components/AddGameGuideModal';
import { GAMES_LIST, getGameById } from './games/registry';
import { storage } from './services/storage';
import { sounds } from './services/sound';

export const App = () => {
  const [currentUser, setCurrentUser] = useState(() => storage.getCurrentUser());
  const [activeGameId, setActiveGameId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddGuideOpen, setIsAddGuideOpen] = useState(false);
  const [inspectedGame, setInspectedGame] = useState(null);

  const categories = ['All', 'Arcade', 'Strategy', 'Classic', 'Puzzle', 'Favorites'];

  // Filter games based on search and category
  const filteredGames = GAMES_LIST.filter(game => {
    const matchesSearch =
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Favorites') return storage.isFavorite(game.id);
    return game.category === selectedCategory;
  });

  const handleLaunchGame = (gameId) => {
    sounds.playClick();
    setInspectedGame(null);
    setActiveGameId(gameId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToStore = () => {
    sounds.playClick();
    setActiveGameId(null);
  };

  const activeGame = activeGameId ? getGameById(activeGameId) : null;

  return (
    <div className="min-h-screen bg-[#0b0c16] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Sticky Global Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onNavigateHome={handleBackToStore}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* IF A GAME IS ACTIVE: RENDER THE GAME */}
        {activeGame ? (
          <div className="animate-in fade-in duration-200">
            {React.createElement(activeGame.component, {
              onBack: handleBackToStore,
              onGameOver: (score) => {
                setCurrentUser(storage.getCurrentUser());
              }
            })}
          </div>
        ) : (
          /* OTHERWISE: RENDER THE STORE / ARCADE HUB */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* HERO PROMO BANNER */}
            <div className="relative rounded-3xl overflow-hidden p-6 sm:p-10 bg-gradient-to-r from-indigo-900/90 via-purple-900/80 to-slate-900/90 border border-indigo-500/30 shadow-2xl shadow-indigo-950/50">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-4">
                  <Flame size={14} className="text-orange-400" />
                  <span>Offline Arcade Station</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  Play Instantly. <br />
                  <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
                    Zero Internet Needed.
                  </span>
                </h1>

                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                  Welcome to GameStack! Jump straight into retro classics like Flappy Bird, tactical XOX, multiplayer Snake & Ladder, Word Finder, and Retro Snake. All player profiles, leaderboards, and high scores stay 100% saved locally on this machine.
                </p>

                {/* Quick Launch Buttons */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleLaunchGame('flappy-bird')}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span>Play Flappy Bird</span>
                  </button>

                  <button
                    onClick={() => handleLaunchGame('xox')}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span>Play XOX</span>
                  </button>

                  <button
                    onClick={() => handleLaunchGame('snake-ladder')}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span>Play Snake & Ladder</span>
                  </button>

                  <button
                    onClick={() => handleLaunchGame('word-finder')}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-500/25 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span>Play Word Finder</span>
                  </button>

                  <button
                    onClick={() => handleLaunchGame('retro-snake')}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span>Play Retro Snake</span>
                  </button>

                  <button
                    onClick={() => setIsAddGuideOpen(true)}
                    className="px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2"
                  >
                    <PlusCircle size={16} className="text-indigo-400" />
                    <span>How to Add More Games</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SEARCH & CATEGORY FILTER BAR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                {categories.map(cat => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        sounds.playClick();
                        setSelectedCategory(cat);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {cat === 'Favorites' && <Heart size={13} className={isActive ? 'fill-current' : ''} />}
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search offline games..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xs sm:text-sm text-white placeholder-slate-500 transition-all"
                />
              </div>
            </div>

            {/* GAMES GRID */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <Gamepad2 className="text-indigo-400" size={22} />
                  <span>Available Games</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                    {filteredGames.length}
                  </span>
                </h2>
              </div>

              {filteredGames.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGames.map(game => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onPlay={handleLaunchGame}
                      onInspect={setInspectedGame}
                    />
                  ))}

                  {/* PROMO CARD: Easily Add More Games */}
                  <div
                    onClick={() => setIsAddGuideOpen(true)}
                    className="group relative bg-slate-900/40 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-900/80 transition-all duration-300 min-h-[380px]"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                      <PlusCircle size={28} />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">
                      Add More Games Soon
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-4">
                      GameStack's modular registry is primed for your next games (2048, Pong, Brick Breaker, etc.). Click to see how to drop them in!
                    </p>
                    <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                      <span>View Developer Guide</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8">
                  <p className="text-slate-400 text-sm">
                    No games found matching your search.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    className="mt-3 text-xs font-bold text-indigo-400 hover:underline"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onUserChange={u => setCurrentUser(u)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onUserUpdate={u => setCurrentUser(u)}
        onLogout={() => setCurrentUser(storage.getCurrentUser())}
      />

      <GameDetailModal
        game={inspectedGame}
        onClose={() => setInspectedGame(null)}
        onPlay={handleLaunchGame}
      />

      <AddGameGuideModal
        isOpen={isAddGuideOpen}
        onClose={() => setIsAddGuideOpen(false)}
      />
    </div>
  );
};

