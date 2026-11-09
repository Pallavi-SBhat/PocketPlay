import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, RotateCcw, Volume2, VolumeX, Lightbulb, Trophy, 
  Grid, ChevronRight, Check, Lock, Play, Search
} from 'lucide-react';
import { sounds } from '../../services/sound';
import { storage } from '../../services/storage';
import { generateLevel } from './wordData';

export const WordFinderGame = ({ onGameOver, onBack }) => {
  const [currentLevel, setCurrentLevel] = useState(() => {
    return storage.getWordFinderUnlockedLevel();
  });

  const [levelData, setLevelData] = useState(() => generateLevel(currentLevel));
  const [foundWords, setFoundWords] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);

  // Hints & Timer
  const [hintsAvailable, setHintsAvailable] = useState(() => storage.getWordFinderHints());
  const [hintedWord, setHintedWord] = useState(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Modals & UI States
  const [isLevelSelectorOpen, setIsLevelSelectorOpen] = useState(false);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [levelStars, setLevelStars] = useState(3);
  const [isMuted, setIsMuted] = useState(() => sounds.getMuted());
  const [selectorChapter, setSelectorChapter] = useState(0);
  const [jumpInput, setJumpInput] = useState('');

  const gridRef = useRef(null);

  const toggleMute = () => {
    const next = sounds.toggleMute();
    setIsMuted(next);
  };

  const loadLevel = useCallback((lvl) => {
    const validLevel = Math.max(1, Math.min(1000, lvl));
    setCurrentLevel(validLevel);
    setLevelData(generateLevel(validLevel));
    setFoundWords([]);
    setSelectedCells([]);
    setSelectionStart(null);
    setHintedWord(null);
    setIsLevelComplete(false);
    setSecondsElapsed(0);
    setIsTimerRunning(true);
    setIsLevelSelectorOpen(false);
  }, []);

  useEffect(() => {
    if (!isTimerRunning || isLevelComplete) return;
    const interval = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, isLevelComplete]);

  const getLinePath = (p1, p2) => {
    const dRow = p2.row - p1.row;
    const dCol = p2.col - p1.col;

    const isHorizontal = dRow === 0;
    const isVertical = dCol === 0;
    const isDiagonal = Math.abs(dRow) === Math.abs(dCol);

    if (!isHorizontal && !isVertical && !isDiagonal) {
      return [p1];
    }

    const stepRow = dRow === 0 ? 0 : dRow > 0 ? 1 : -1;
    const stepCol = dCol === 0 ? 0 : dCol > 0 ? 1 : -1;
    const steps = Math.max(Math.abs(dRow), Math.abs(dCol));

    const path = [];
    for (let i = 0; i <= steps; i++) {
      path.push({
        row: p1.row + stepRow * i,
        col: p1.col + stepCol * i
      });
    }
    return path;
  };

  const getSelectedString = (cells) => {
    return cells.map(pt => levelData.grid[pt.row][pt.col]).join('');
  };

  const handleCellMouseDown = (row, col) => {
    if (selectionStart && (selectionStart.row !== row || selectionStart.col !== col)) {
      const path = getLinePath(selectionStart, { row, col });
      setSelectedCells(path);
      validateSelection(path);
      setSelectionStart(null);
      setIsSelecting(false);
      return;
    }

    setIsSelecting(true);
    setSelectionStart({ row, col });
    setSelectedCells([{ row, col }]);
    sounds.playLetterSelect(0);
  };

  const handleCellMouseEnter = (row, col) => {
    if (!isSelecting || !selectionStart) return;

    const path = getLinePath(selectionStart, { row, col });
    if (path.length !== selectedCells.length) {
      sounds.playLetterSelect(path.length);
    }
    setSelectedCells(path);
  };

  const handleMouseUp = () => {
    if (!isSelecting) return;
    setIsSelecting(false);

    if (selectedCells.length > 1) {
      validateSelection(selectedCells);
      setSelectionStart(null);
    }
  };

  const handleTouchStart = (row, col) => {
    setIsSelecting(true);
    setSelectionStart({ row, col });
    setSelectedCells([{ row, col }]);
    sounds.playLetterSelect(0);
  };

  const handleTouchMove = (e) => {
    if (!isSelecting || !selectionStart || !gridRef.current) return;

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const cellEl = element?.closest('[data-cell]');
    if (cellEl) {
      const r = Number(cellEl.getAttribute('data-row'));
      const c = Number(cellEl.getAttribute('data-col'));
      if (!isNaN(r) && !isNaN(c)) {
        const path = getLinePath(selectionStart, { row: r, col: c });
        if (path.length !== selectedCells.length) {
          sounds.playLetterSelect(path.length);
        }
        setSelectedCells(path);
      }
    }
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  const validateSelection = (cells) => {
    const forwardStr = getSelectedString(cells);
    const reverseStr = forwardStr.split('').reverse().join('');

    const matchedWord = levelData.words.find(
      w => !foundWords.includes(w.word) && (w.word === forwardStr || w.word === reverseStr)
    );

    if (matchedWord) {
      sounds.playWordFound();
      const updatedFound = [...foundWords, matchedWord.word];
      setFoundWords(updatedFound);

      if (hintedWord?.word === matchedWord.word) {
        setHintedWord(null);
      }

      if (updatedFound.length === levelData.words.length) {
        handleLevelComplete();
      }
    } else {
      if (cells.length > 1) {
        sounds.playWordError();
      }
    }

    setSelectedCells([]);
  };

  const handleLevelComplete = () => {
    setIsTimerRunning(false);
    setIsLevelComplete(true);
    sounds.playVictory();

    confetti({
      particleCount: 80,
      spread: 75,
      origin: { y: 0.6 }
    });

    let stars = 3;
    if (secondsElapsed > 90 || hintedWord) {
      stars = 2;
    }
    if (secondsElapsed > 180) {
      stars = 1;
    }
    setLevelStars(stars);

    storage.saveWordFinderLevelComplete(currentLevel, stars, levelData.words.length);
    setHintsAvailable(storage.getWordFinderHints());

    if (onGameOver) {
      onGameOver(currentLevel);
    }
  };

  const handleUseHint = () => {
    if (hintsAvailable <= 0) return;

    const unfound = levelData.words.filter(w => !foundWords.includes(w.word));
    if (unfound.length === 0) return;

    sounds.playHintUsed();
    storage.useWordFinderHint();
    setHintsAvailable(prev => Math.max(0, prev - 1));

    const target = unfound[0];
    setHintedWord(target);
  };

  const getCellFoundColor = (row, col) => {
    for (const w of levelData.words) {
      if (foundWords.includes(w.word)) {
        const path = getLinePath(
          { row: w.startRow, col: w.startCol },
          { row: w.endRow, col: w.endCol }
        );
        if (path.some(p => p.row === row && p.col === col)) {
          return w.color;
        }
      }
    }
    return null;
  };

  const isCellSelected = (row, col) => {
    return selectedCells.some(p => p.row === row && p.col === col);
  };

  const isCellHinted = (row, col) => {
    if (!hintedWord) return false;
    return hintedWord.startRow === row && hintedWord.startCol === col;
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const unlockedLevel = storage.getWordFinderUnlockedLevel();
  const starsMap = storage.getWordFinderStarsMap();
  const currentSelectionString = getSelectedString(selectedCells);

  return (
    <div
      onMouseUp={handleMouseUp}
      onTouchEnd={handleTouchEnd}
      className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] py-4 select-none"
    >
      {/* Top Header Bar */}
      <div className="w-full max-w-3xl mb-4 flex items-center justify-between px-2 text-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Arcade Store</span>
        </button>

        {/* Level Selector Trigger & Timer */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              setIsLevelSelectorOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 transition-all font-bold text-xs"
          >
            <Grid size={14} />
            <span>Level {currentLevel} / 1000</span>
          </button>

          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono font-bold">
            ⏱️ {formatTime(secondsElapsed)}
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

      {/* Main Game Container */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left Column: Word Grid */}
        <div className="md:col-span-8 flex flex-col items-center">
          {/* Level Theme & Live Selection Banner */}
          <div className="w-full max-w-[460px] mb-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{levelData.themeIcon}</span>
              <div>
                <h3 className="text-sm font-black text-white">{levelData.themeName}</h3>
                <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400">
                  {levelData.tierName} Tier
                </span>
              </div>
            </div>

            {/* Hint Button */}
            <button
              onClick={handleUseHint}
              disabled={hintsAvailable <= 0 || foundWords.length === levelData.words.length}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                hintsAvailable > 0
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 hover:bg-amber-500/30 active:scale-95'
                  : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
              }`}
              title="Reveal first letter of an unfound word"
            >
              <Lightbulb size={14} className={hintsAvailable > 0 ? 'text-amber-400' : ''} />
              <span>Hint ({hintsAvailable})</span>
            </button>
          </div>

          {/* Active Word Preview Bar */}
          <div className="w-full max-w-[460px] h-9 mb-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-xs font-bold font-mono tracking-widest text-indigo-300">
            {currentSelectionString ? (
              <span className="animate-in zoom-in-95 text-cyan-400 font-extrabold text-sm">
                {currentSelectionString}
              </span>
            ) : (
              <span className="text-slate-500 text-[11px] font-sans font-normal">
                Drag or click start & end letters to find words
              </span>
            )}
          </div>

          {/* Word Search Grid */}
          <div
            ref={gridRef}
            onTouchMove={handleTouchMove}
            className="w-full max-w-[460px] aspect-square bg-slate-950/90 rounded-3xl p-3 border-4 border-indigo-500/30 shadow-2xl relative select-none"
          >
            <div
              className="grid w-full h-full gap-1 sm:gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${levelData.gridSize}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${levelData.gridSize}, minmax(0, 1fr))`
              }}
            >
              {levelData.grid.map((row, r) =>
                row.map((letter, c) => {
                  const isSelected = isCellSelected(r, c);
                  const foundColor = getCellFoundColor(r, c);
                  const isHinted = isCellHinted(r, c);

                  return (
                    <div
                      key={`${r}-${c}`}
                      data-cell="true"
                      data-row={r}
                      data-col={c}
                      onMouseDown={() => handleCellMouseDown(r, c)}
                      onMouseEnter={() => handleCellMouseEnter(r, c)}
                      onTouchStart={() => handleTouchStart(r, c)}
                      className={`relative rounded-xl flex items-center justify-center font-black cursor-pointer transition-all duration-100 ${
                        levelData.gridSize <= 7
                          ? 'text-lg sm:text-2xl'
                          : levelData.gridSize <= 8
                          ? 'text-base sm:text-xl'
                          : 'text-sm sm:text-lg'
                      } ${
                        isSelected
                          ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/40 scale-105 z-20'
                          : foundColor
                          ? 'text-white shadow-md z-10'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800/80 hover:border-slate-700'
                      }`}
                      style={{
                        backgroundColor: isSelected
                          ? '#06b6d4'
                          : foundColor
                          ? foundColor
                          : undefined
                      }}
                    >
                      <span>{letter}</span>

                      {/* Hint pulsating ring */}
                      {isHinted && !foundColor && (
                        <span className="absolute inset-0 rounded-xl border-2 border-amber-400 animate-ping pointer-events-none" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Target Words List & Level Info */}
        <div className="md:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Search size={14} className="text-indigo-400" />
                <span>Hidden Words</span>
              </h4>
              <span className="text-xs font-bold text-emerald-400">
                {foundWords.length} / {levelData.words.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {levelData.words.map((w, idx) => {
                const isFound = foundWords.includes(w.word);
                const isTargetHinted = hintedWord?.word === w.word;

                return (
                  <div
                    key={idx}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider flex items-center gap-1.5 transition-all ${
                      isFound
                        ? 'bg-slate-800/60 text-slate-500 line-through border border-slate-700/40'
                        : isTargetHinted
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-md animate-pulse'
                        : 'bg-slate-800/90 text-white border border-slate-700 hover:border-indigo-500/50'
                    }`}
                  >
                    {isFound ? (
                      <Check size={13} className="text-emerald-400" />
                    ) : (
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color }} />
                    )}
                    <span>{w.word}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Player Stats & Progress Card */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3 text-xs">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy size={14} className="text-amber-400" />
              <span>Word Finder Stats</span>
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                <div className="text-[10px] text-slate-400">Highest Unlocked</div>
                <div className="text-base font-black text-white mt-0.5">Level {unlockedLevel}</div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                <div className="text-[10px] text-slate-400">Total Stars</div>
                <div className="text-base font-black text-amber-400 mt-0.5">
                  ★ {Object.values(starsMap).reduce((a, b) => a + b, 0)}
                </div>
              </div>
            </div>

            {/* Quick Level Actions */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => loadLevel(currentLevel)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw size={14} />
                <span>Restart Level</span>
              </button>

              {currentLevel < unlockedLevel && (
                <button
                  onClick={() => loadLevel(currentLevel + 1)}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 1000 LEVEL SELECTOR MODAL */}
      {isLevelSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Grid size={20} className="text-indigo-400" />
                  <span>Select Level (1 - 1000)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Unlocked up to Level {unlockedLevel}
                </p>
              </div>

              <button
                onClick={() => setIsLevelSelectorOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            {/* Jump to specific Level Input */}
            <div className="py-3 flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={unlockedLevel}
                value={jumpInput}
                onChange={e => setJumpInput(e.target.value)}
                placeholder={`Jump to level (1-${unlockedLevel})...`}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500 font-mono"
              />
              <button
                onClick={() => {
                  const num = parseInt(jumpInput, 10);
                  if (num >= 1 && num <= unlockedLevel) {
                    loadLevel(num);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Go
              </button>
            </div>

            {/* Chapter Tabs */}
            <div className="flex gap-1.5 overflow-x-auto py-2 scrollbar-none border-b border-slate-800">
              {Array.from({ length: 10 }, (_, ch) => {
                const start = ch * 100 + 1;
                const end = (ch + 1) * 100;
                const isSelected = selectorChapter === ch;

                return (
                  <button
                    key={ch}
                    onClick={() => setSelectorChapter(ch)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {start}-{end}
                  </button>
                );
              })}
            </div>

            {/* 100 Levels Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-3 overflow-y-auto flex-1 my-2">
              {Array.from({ length: 100 }, (_, idx) => {
                const lvl = selectorChapter * 100 + idx + 1;
                const isUnlocked = lvl <= unlockedLevel;
                const isCurrent = lvl === currentLevel;
                const stars = starsMap[lvl] || 0;

                return (
                  <button
                    key={lvl}
                    disabled={!isUnlocked}
                    onClick={() => loadLevel(lvl)}
                    className={`h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all relative ${
                      isCurrent
                        ? 'bg-indigo-600 border-2 border-indigo-300 text-white shadow-lg shadow-indigo-600/40 scale-105'
                        : isUnlocked
                        ? 'bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700'
                        : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {isUnlocked ? (
                      <>
                        <span>{lvl}</span>
                        {stars > 0 && (
                          <span className="text-[9px] text-amber-400 leading-none">
                            {'★'.repeat(stars)}
                          </span>
                        )}
                      </>
                    ) : (
                      <Lock size={12} className="text-slate-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LEVEL COMPLETE VICTORY MODAL */}
      {isLevelComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 text-3xl mx-auto flex items-center justify-center mb-3">
              🎉
            </div>

            <h3 className="text-2xl font-black text-white mb-1">LEVEL {currentLevel} CLEARED!</h3>
            <p className="text-xs text-indigo-300 font-semibold mb-3">
              {levelData.themeName}
            </p>

            <div className="flex justify-center gap-2 text-3xl text-amber-400 my-4 animate-bounce">
              {Array.from({ length: 3 }, (_, i) => (
                <span key={i} className={i < levelStars ? 'opacity-100' : 'opacity-20'}>
                  ★
                </span>
              ))}
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 my-4 space-y-1 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Time Taken:</span>
                <span className="font-bold text-white">{formatTime(secondsElapsed)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Words Found:</span>
                <span className="font-bold text-emerald-400">{levelData.words.length}</span>
              </div>
              {currentLevel % 3 === 0 && (
                <div className="text-[11px] text-amber-400 font-semibold pt-1">
                  🎁 Bonus Hint Token Unlocked!
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => loadLevel(currentLevel)}
                className="px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                title="Replay this level"
              >
                <RotateCcw size={15} />
              </button>

              <button
                onClick={() => loadLevel(currentLevel + 1)}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Play size={15} fill="currentColor" />
                <span>Next Level ({currentLevel + 1})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

