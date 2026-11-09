const STORAGE_KEYS = {
  USERS: 'gamestack_users',
  CURRENT_USER: 'gamestack_current_user',
  SCORES: 'gamestack_scores',
  FAVORITES: 'gamestack_favorites',
};

// Seed avatar options
export const AVATAR_OPTIONS = [
  '🎮', '👾', '🚀', '🦊', '⚡', '🤖', '🐱', '👑', '🔥', '🕹️', '🛡️', '🧙'
];

class StorageService {
  get(key, defaultValue) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  // Auth & User Management
  getUsers() {
    return this.get(STORAGE_KEYS.USERS, []);
  }

  register(username, email, avatar = '🎮') {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      return { success: false, message: 'Username cannot be empty' };
    }

    const users = this.getUsers();
    const existing = users.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());
    if (existing) {
      return { success: false, message: 'Username already taken. Please choose another.' };
    }

    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      username: trimmedUsername,
      email: email.trim() || `${trimmedUsername.toLowerCase()}@offline.arcade`,
      avatar: avatar || '🎮',
      createdAt: new Date().toISOString(),
      gamesPlayed: 0,
      favorites: ['flappy-bird']
    };

    users.push(newUser);
    this.set(STORAGE_KEYS.USERS, users);
    this.setCurrentUser(newUser);

    return { success: true, message: 'Registration successful! Welcome to GameStack.', user: newUser };
  }

  login(username) {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      return { success: false, message: 'Please enter your username' };
    }

    const users = this.getUsers();
    const user = users.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());

    if (!user) {
      return { success: false, message: 'User not found. Please check username or register.' };
    }

    this.setCurrentUser(user);
    return { success: true, message: `Welcome back, ${user.username}!`, user };
  }

  getCurrentUser() {
    const current = this.get(STORAGE_KEYS.CURRENT_USER, null);
    if (current) return current;

    // Default guest user
    const guestUser = {
      id: 'guest_player',
      username: 'Player One',
      email: 'player@offline.arcade',
      avatar: '🎮',
      createdAt: new Date().toISOString(),
      gamesPlayed: 0,
      favorites: ['flappy-bird', 'xox']
    };

    this.setCurrentUser(guestUser);
    return guestUser;
  }

  setCurrentUser(user) {
    this.set(STORAGE_KEYS.CURRENT_USER, user);
  }

  logout() {
    const guestUser = {
      id: 'guest_player',
      username: 'Player One',
      email: 'player@offline.arcade',
      avatar: '🎮',
      createdAt: new Date().toISOString(),
      gamesPlayed: 0,
      favorites: ['flappy-bird', 'xox']
    };
    this.setCurrentUser(guestUser);
  }

  updateProfile(avatar, username) {
    const currentUser = this.getCurrentUser();
    currentUser.avatar = avatar;
    if (username && username.trim()) {
      currentUser.username = username.trim();
    }

    this.setCurrentUser(currentUser);

    // Update in users array
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) {
      users[idx] = currentUser;
      this.set(STORAGE_KEYS.USERS, users);
    }

    return currentUser;
  }

  // High Scores & Game Records
  recordScore(gameId, score, metadata) {
    const currentUser = this.getCurrentUser();
    currentUser.gamesPlayed = (currentUser.gamesPlayed || 0) + 1;
    this.setCurrentUser(currentUser);

    const record = {
      gameId,
      score,
      date: new Date().toISOString(),
      userId: currentUser.id,
      username: currentUser.username,
      metadata
    };

    const scores = this.get(STORAGE_KEYS.SCORES, []);
    scores.unshift(record);
    // Keep last 100 records
    this.set(STORAGE_KEYS.SCORES, scores.slice(0, 100));

    return record;
  }

  getHighScore(gameId) {
    const scores = this.get(STORAGE_KEYS.SCORES, []);
    const gameScores = scores.filter(s => s.gameId === gameId).map(s => s.score);
    return gameScores.length > 0 ? Math.max(...gameScores) : 0;
  }

  getUserHighScore(gameId, userId) {
    const uid = userId || this.getCurrentUser().id;
    const scores = this.get(STORAGE_KEYS.SCORES, []);
    const userScores = scores.filter(s => s.gameId === gameId && s.userId === uid).map(s => s.score);
    return userScores.length > 0 ? Math.max(...userScores) : 0;
  }

  getLeaderboard(gameId, limit = 5) {
    const scores = this.get(STORAGE_KEYS.SCORES, []);
    return scores
      .filter(s => s.gameId === gameId)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Favorites
  toggleFavorite(gameId) {
    const currentUser = this.getCurrentUser();
    const favs = new Set(currentUser.favorites || []);
    let isFav = false;

    if (favs.has(gameId)) {
      favs.delete(gameId);
      isFav = false;
    } else {
      favs.add(gameId);
      isFav = true;
    }

    currentUser.favorites = Array.from(favs);
    this.setCurrentUser(currentUser);

    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) {
      users[idx] = currentUser;
      this.set(STORAGE_KEYS.USERS, users);
    }

    return isFav;
  }

  isFavorite(gameId) {
    const currentUser = this.getCurrentUser();
    return (currentUser.favorites || []).includes(gameId);
  }

  // Word Finder 1000-Level System
  getWordFinderUnlockedLevel() {
    return this.get('gamestack_wordfinder_unlocked', 1);
  }

  getWordFinderStarsMap() {
    return this.get('gamestack_wordfinder_stars', {});
  }

  getWordFinderHints() {
    return this.get('gamestack_wordfinder_hints', 5);
  }

  useWordFinderHint() {
    const hints = this.getWordFinderHints();
    if (hints > 0) {
      this.set('gamestack_wordfinder_hints', hints - 1);
      return true;
    }
    return false;
  }

  addWordFinderHints(count) {
    const hints = this.getWordFinderHints() + count;
    this.set('gamestack_wordfinder_hints', hints);
    return hints;
  }

  saveWordFinderLevelComplete(level, stars, wordsFoundCount) {
    const unlocked = this.getWordFinderUnlockedLevel();
    const nextUnlocked = Math.max(unlocked, Math.min(1000, level + 1));
    const isNew = nextUnlocked > unlocked;
    this.set('gamestack_wordfinder_unlocked', nextUnlocked);

    // Save stars
    const starsMap = this.getWordFinderStarsMap();
    const prevStars = starsMap[level] || 0;
    starsMap[level] = Math.max(prevStars, stars);
    this.set('gamestack_wordfinder_stars', starsMap);

    // Track total words found
    const totalWords = this.get('gamestack_wordfinder_total_words', 0) + wordsFoundCount;
    this.set('gamestack_wordfinder_total_words', totalWords);

    // Grant 1 free hint every 3 levels
    if (isNew && level % 3 === 0) {
      this.addWordFinderHints(1);
    }

    // Record high score
    this.recordScore('word-finder', nextUnlocked, `Level ${level} completed (${stars}★)`);

    return { isNewLevel: isNew, newUnlocked: nextUnlocked };
  }

  getWordFinderStats() {
    const unlocked = this.getWordFinderUnlockedLevel();
    const starsMap = this.getWordFinderStarsMap();
    const totalStars = Object.values(starsMap).reduce((sum, s) => sum + s, 0);
    const hints = this.getWordFinderHints();
    const totalWords = this.get('gamestack_wordfinder_total_words', 0);

    return {
      unlockedLevel: unlocked,
      totalStars,
      hints,
      totalWords
    };
  }
}

export const storage = new StorageService();

