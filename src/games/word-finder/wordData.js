// Curated Themed Word Dictionaries and Procedural 1000-Level Generator for Word Finder Arcade

export const WORD_THEMES = [
  {
    name: 'Animals & Wildlife',
    icon: '🦁',
    words: [
      'LION', 'TIGER', 'BEAR', 'WOLF', 'EAGLE', 'SHARK', 'PANDA', 'ZEBRA', 'OTTER', 'FOX',
      'HAWK', 'WHALE', 'CAMEL', 'FALCON', 'CHEETAH', 'DOLPHIN', 'GIRAFFE', 'LEOPARD', 'GORILLA', 'JAGUAR',
      'KOALA', 'BADGER', 'HYENA', 'BISON', 'WALRUS', 'COUGAR', 'PELICAN', 'FERRET', 'RABBIT', 'BEAVER'
    ]
  },
  {
    name: 'Cosmos & Space',
    icon: '🚀',
    words: [
      'STAR', 'MOON', 'SUN', 'MARS', 'VENUS', 'COMET', 'ORBIT', 'SOLAR', 'LUNAR', 'PLUTO',
      'GALAXY', 'NEBULA', 'PULSAR', 'METEOR', 'SATURN', 'APOLLO', 'COSMOS', 'ROCKET', 'CRATER', 'ZENITH',
      'GRAVITY', 'ECLIPSE', 'ASTRON', 'VOYAGER', 'SHUTTLE', 'JUPITER', 'URANUS', 'NEPTUNE', 'CLUSTER', 'QUASAR'
    ]
  },
  {
    name: 'Nature & Landscapes',
    icon: '🌲',
    words: [
      'TREE', 'RIVER', 'LAKE', 'OCEAN', 'FOREST', 'VALLEY', 'CANYON', 'DESERT', 'JUNGLE', 'GLADE',
      'SUMMIT', 'MEADOW', 'ISLAND', 'STREAM', 'SPRING', 'GEYSER', 'VOLCANO', 'GLACIER', 'LAGOON', 'REEF',
      'TUNDRA', 'SAVANNA', 'PRAIRIE', 'ESTUARY', 'PLATEAU', 'WATERFALL', 'REDWOOD', 'WILLOW', 'EVERGREEN', 'HORIZON'
    ]
  },
  {
    name: 'Cyber & Technology',
    icon: '⚡',
    words: [
      'CODE', 'DATA', 'BYTE', 'CHIP', 'CYBER', 'ROBOT', 'PIXEL', 'LOGIC', 'CLOUD', 'FIBER',
      'VECTOR', 'BINARY', 'SERVER', 'SYNTAX', 'KERNEL', 'MEMORY', 'ENGINE', 'SOCKET', 'ROUTER', 'DOMAIN',
      'ALGORITHM', 'COMPILER', 'QUANTUM', 'NETWORK', 'GATEWAY', 'PROGRAM', 'GRAPHIC', 'NEURAL', 'SILICON', 'FIREWALL'
    ]
  },
  {
    name: 'Food & Culinary',
    icon: '🍕',
    words: [
      'PIZZA', 'SUSHI', 'TACO', 'BREAD', 'APPLE', 'BERRY', 'MANGO', 'LEMON', 'PEACH', 'GRAPE',
      'CHERRY', 'BURGER', 'CHEESE', 'PEPPER', 'TOMATO', 'GARLIC', 'GINGER', 'PASTA', 'COOKIE', 'WAFFLE',
      'PANCAKE', 'CARROT', 'AVOCADO', 'NOODLE', 'MUFFIN', 'VANILLA', 'CINNAMON', 'SALAD', 'OMELET', 'BISCUIT'
    ]
  },
  {
    name: 'Fantasy & Magic',
    icon: '🧙',
    words: [
      'MAGE', 'SWORD', 'SPELL', 'WAND', 'CASTLE', 'DRAGON', 'KNIGHT', 'SHIELD', 'POTION', 'MYTHIC',
      'WIZARD', 'CRYSTAL', 'SHADOW', 'TEMPLE', 'LEGEND', 'GOBLIN', 'ORACLE', 'PORTAL', 'RUNE', 'SCROLL',
      'PHOENIX', 'UNICORN', 'GRIFFIN', 'WARRIOR', 'KINGDOM', 'SORCERY', 'TALISMAN', 'TREASURE', 'ENCHANT', 'CHRONICLE'
    ]
  },
  {
    name: 'Weather & Elements',
    icon: '❄️',
    words: [
      'RAIN', 'WIND', 'SNOW', 'HAIL', 'STORM', 'FROST', 'CLOUD', 'BREEZE', 'THUNDER', 'CYCLONE',
      'TORNADO', 'AURORA', 'TYPHOON', 'SUNSET', 'SUNRISE', 'RAINBOW', 'DRIZZLE', 'BLIZZARD', 'GALE', 'FOGGY',
      'LIGHTNING', 'TEMPEST', 'MONSOON', 'CLIMATE', 'THERMAL', 'PRESSURE', 'DOWNPOUR', 'WARMTH', 'CHILLY', 'OVERCAST'
    ]
  },
  {
    name: 'Oceans & Nautical',
    icon: '⚓',
    words: [
      'SHIP', 'SAIL', 'BOAT', 'WAVE', 'TIDE', 'CORAL', 'ANCHOR', 'PIRATE', 'DOCK', 'HARBOR',
      'COMPASS', 'MARINER', 'VOYAGE', 'ISLAND', 'CAPTAIN', 'VESSEL', 'SEABED', 'TRITON', 'GALLEON', 'BEACON',
      'SUBMARINE', 'NAUTILUS', 'TRENCH', 'CURRENT', 'COASTLINE', 'ABYSS', 'SEAFARER', 'LIGHTHOUSE', 'OFFSHORE', 'PASSAGE'
    ]
  },
  {
    name: 'Gemstones & Crystals',
    icon: '💎',
    words: [
      'RUBY', 'OPAL', 'JADE', 'GOLD', 'AGATE', 'AMBER', 'TOPAZ', 'PEARL', 'ONYX', 'BERYL',
      'DIAMOND', 'EMERALD', 'SAPPHIRE', 'CRYSTAL', 'QUARTZ', 'GARNET', 'ZIRCON', 'MINERAL', 'SILVER', 'PLATINUM',
      'AMETHYST', 'OBSIDIAN', 'TURQUOISE', 'MALACHITE', 'LAPIZ', 'PERIDOT', 'JASPER', 'CARNELIAN', 'SPINEL', 'RHODIUM'
    ]
  },
  {
    name: 'Sports & Athletics',
    icon: '🏆',
    words: [
      'GOLF', 'RACE', 'BALL', 'TEAM', 'GOAL', 'SOCCER', 'TENNIS', 'HOCKEY', 'BOXING', 'RUNNER',
      'SKATER', 'SURFING', 'CYCLING', 'MEDAL', 'LEAGUE', 'CHAMP', 'SPRINT', 'ATHLETE', 'ARCHERY', 'KARATE',
      'BASEBALL', 'FOOTBALL', 'SWIMMING', 'CRICKET', 'MARATHON', 'OLYMPIC', 'TROPHY', 'VICTORY', 'STADIUM', 'FITNESS'
    ]
  },
  {
    name: 'Music & Melodies',
    icon: '🎵',
    words: [
      'DRUM', 'BASS', 'SONG', 'NOTE', 'BEAT', 'GUITAR', 'VIOLIN', 'FLUTE', 'PIANO', 'TEMPO',
      'CHORD', 'RHYTHM', 'MELODY', 'HARP', 'CELLO', 'ORGAN', 'BRASS', 'TREBLE', 'CLEF', 'OCTAVE',
      'SYMPHONY', 'CONCERT', 'ACOUSTIC', 'HARMONY', 'SONATA', 'QUARTET', 'KEYBOARD', 'CYMBAL', 'TRUMPET', 'CLARINET'
    ]
  },
  {
    name: 'Retro Arcade & Gaming',
    icon: '🕹️',
    words: [
      'GAME', 'COIN', 'HERO', 'BOSS', 'PLAY', 'ARCADE', 'PIXEL', 'LEVEL', 'QUEST', 'SCORE',
      'BONUS', 'COMBO', 'RETRO', 'STAGE', 'POWER', 'SHIELD', 'PLAYER', 'BUTTON', 'JOYSTICK', 'EXTRALIFE',
      'SPEEDRUN', 'CHAMPION', 'CONSOLE', 'PLATFORM', 'WARPZONE', 'INVADER', 'REPLAY', 'DUNGEON', 'CHECKPOINT', 'BLASTER'
    ]
  }
];

export const WORD_HIGHLIGHT_COLORS = [
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#eab308', // Gold
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#14b8a6', // Teal
];

function createPRNG(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function getTierInfo(level) {
  if (level <= 100) {
    return { name: 'Apprentice', minLength: 3, maxLength: 5, gridSize: 6, wordCount: 4, allowDiagonal: false, allowReverse: false };
  } else if (level <= 300) {
    return { name: 'Explorer', minLength: 4, maxLength: 6, gridSize: 7, wordCount: 5, allowDiagonal: false, allowReverse: false };
  } else if (level <= 600) {
    return { name: 'Adventurer', minLength: 4, maxLength: 7, gridSize: 8, wordCount: 6, allowDiagonal: true, allowReverse: false };
  } else if (level <= 850) {
    return { name: 'Master', minLength: 4, maxLength: 8, gridSize: 9, wordCount: 7, allowDiagonal: true, allowReverse: true };
  } else {
    return { name: 'Grandmaster', minLength: 4, maxLength: 9, gridSize: 10, wordCount: 8, allowDiagonal: true, allowReverse: true };
  }
}

const DIRECTIONS = {
  RIGHT: [0, 1],
  DOWN: [1, 0],
  DOWN_RIGHT: [1, 1],
  DOWN_LEFT: [1, -1],
  LEFT: [0, -1],
  UP: [-1, 0],
  UP_LEFT: [-1, -1],
  UP_RIGHT: [-1, 1]
};

export function generateLevel(levelNumber) {
  const level = Math.max(1, Math.min(1000, levelNumber));
  const seed = (level * 104729 + 7919) >>> 0;
  const rand = createPRNG(seed);

  const tier = getTierInfo(level);
  const themeIdx = Math.floor(rand() * WORD_THEMES.length);
  const theme = WORD_THEMES[themeIdx];

  const candidateWords = theme.words
    .filter(w => w.length >= tier.minLength && w.length <= Math.min(tier.maxLength, tier.gridSize))
    .sort(() => rand() - 0.5);

  const allowedDirs = [
    DIRECTIONS.RIGHT,
    DIRECTIONS.DOWN
  ];
  if (tier.allowDiagonal) {
    allowedDirs.push(DIRECTIONS.DOWN_RIGHT);
    allowedDirs.push(DIRECTIONS.DOWN_LEFT);
  }
  if (tier.allowReverse) {
    allowedDirs.push(DIRECTIONS.LEFT);
    allowedDirs.push(DIRECTIONS.UP);
    if (tier.allowDiagonal) {
      allowedDirs.push(DIRECTIONS.UP_LEFT);
      allowedDirs.push(DIRECTIONS.UP_RIGHT);
    }
  }

  const grid = Array(tier.gridSize)
    .fill(null)
    .map(() => Array(tier.gridSize).fill(''));

  const placedWords = [];

  const canPlace = (word, r, c, dr, dc) => {
    for (let i = 0; i < word.length; i++) {
      const cr = r + dr * i;
      const cc = c + dc * i;
      if (cr < 0 || cr >= tier.gridSize || cc < 0 || cc >= tier.gridSize) {
        return false;
      }
      const existing = grid[cr][cc];
      if (existing !== '' && existing !== word[i]) {
        return false;
      }
    }
    return true;
  };

  const place = (word, r, c, dr, dc, color) => {
    for (let i = 0; i < word.length; i++) {
      const cr = r + dr * i;
      const cc = c + dc * i;
      grid[cr][cc] = word[i];
    }
    placedWords.push({
      word,
      found: false,
      startRow: r,
      startCol: c,
      endRow: r + dr * (word.length - 1),
      endCol: c + dc * (word.length - 1),
      color
    });
  };

  let wordCandidates = [...candidateWords];
  if (wordCandidates.length < tier.wordCount) {
    const backupTheme = WORD_THEMES[(themeIdx + 1) % WORD_THEMES.length];
    wordCandidates = [...wordCandidates, ...backupTheme.words];
  }

  let colorIdx = 0;
  for (const word of wordCandidates) {
    if (placedWords.length >= tier.wordCount) break;

    for (let attempt = 0; attempt < 120; attempt++) {
      const dir = allowedDirs[Math.floor(rand() * allowedDirs.length)];
      const r = Math.floor(rand() * tier.gridSize);
      const c = Math.floor(rand() * tier.gridSize);

      if (canPlace(word, r, c, dir[0], dir[1])) {
        const color = WORD_HIGHLIGHT_COLORS[colorIdx % WORD_HIGHLIGHT_COLORS.length];
        colorIdx++;
        place(word, r, c, dir[0], dir[1], color);
        break;
      }
    }
  }

  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < tier.gridSize; r++) {
    for (let c = 0; c < tier.gridSize; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = LETTERS[Math.floor(rand() * LETTERS.length)];
      }
    }
  }

  return {
    level,
    themeName: theme.name,
    themeIcon: theme.icon,
    tierName: tier.name,
    gridSize: tier.gridSize,
    grid,
    words: placedWords
  };
}

