import React from 'react';
import { Play, Trophy, Info, Heart } from 'lucide-react';
import { storage } from '../services/storage';
import { sounds } from '../services/sound';

export const GameCard = ({ game, onPlay, onInspect }) => {
  const [isFav, setIsFav] = React.useState(() => storage.isFavorite(game.id));
  const highScore = storage.getHighScore(game.id);

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    sounds.playClick();
    const nextFav = storage.toggleFavorite(game.id);
    setIsFav(nextFav);
  };

  return (
    <div
      onClick={() => onInspect(game)}
      className="group relative bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/15 hover:-translate-y-1.5 flex flex-col cursor-pointer"
    >
      {/* Thumbnail Banner with Gradient Overlay */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-950">
        <img
          src={game.thumbnail}
          alt={game.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

        {/* Category & Badge pills */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-indigo-300 border border-indigo-500/30">
            {game.category}
          </span>
          {game.badge && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md">
              {game.badge}
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={handleToggleFavorite}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all ${
            isFav
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
              : 'bg-black/40 border-white/10 text-white/70 hover:text-white'
          }`}
          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
        </button>

        {/* High Score Badge in bottom corner */}
        {highScore > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-bold">
            <Trophy size={13} className="text-amber-400" />
            <span>High: {highScore}</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-black text-white group-hover:text-indigo-300 transition-colors">
            {game.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {game.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {game.tags.map(t => (
              <span
                key={t}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center gap-2">
          <button
            onClick={e => {
              e.stopPropagation();
              sounds.playClick();
              onPlay(game.id);
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-95 transition-all"
          >
            <Play size={14} fill="currentColor" />
            <span>Play Game</span>
          </button>

          <button
            onClick={e => {
              e.stopPropagation();
              sounds.playClick();
              onInspect(game);
            }}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
            title="Game Info & Controls"
          >
            <Info size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

