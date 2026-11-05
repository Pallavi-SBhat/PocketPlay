import { User, GameScoreRecord } from '../types';

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
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  // Auth & User Management
  public getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, []);
  }

  public register(username: string, email: string, avatar: string = '🎮'): { success: boolean; message: string; user?: User } {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      return { success: false, message: 'Username cannot be empty' };
    }

    const users = this.getUsers();
    const existing = users.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());
    if (existing) {
      return { success: false, message: 'Username already taken. Please choose another.' };
    }

    const newUser: User = {
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

  public login(username: string): { success: boolean; message: string; user?: User } {
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

  public getCurrentUser(): User {
    const current = this.get<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (current) return current;

    // Default guest user
    const guestUser: User = {
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

  public setCurrentUser(user: User): void {
    this.set(STORAGE_KEYS.CURRENT_USER, user);
  }

  public logout(): void {
    const guestUser: User = {
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

  public updateProfile(avatar: string, username?: string): User {
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
  public recordScore(gameId: string, score: number, metadata?: string): GameScoreRecord {
    const currentUser = this.getCurrentUser();
    currentUser.gamesPlayed = (currentUser.gamesPlayed || 0) + 1;
    this.setCurrentUser(currentUser);

    const record: GameScoreRecord = {
      gameId,
      score,
      date: new Date().toISOString(),
      userId: currentUser.id,
      username: currentUser.username,
      metadata
    };

    const scores = this.get<GameScoreRecord[]>(STORAGE_KEYS.SCORES, []);
    scores.unshift(record);
    // Keep last 100 records
    this.set(STORAGE_KEYS.SCORES, scores.slice(0, 100));

    return record;
  }

  public getHighScore(gameId: string): number {
    const scores = this.get<GameScoreRecord[]>(STORAGE_KEYS.SCORES, []);
    const gameScores = scores.filter(s => s.gameId === gameId).map(s => s.score);
    return gameScores.length > 0 ? Math.max(...gameScores) : 0;
  }

  public getUserHighScore(gameId: string, userId?: string): number {
    const uid = userId || this.getCurrentUser().id;
    const scores = this.get<GameScoreRecord[]>(STORAGE_KEYS.SCORES, []);
    const userScores = scores.filter(s => s.gameId === gameId && s.userId === uid).map(s => s.score);
    return userScores.length > 0 ? Math.max(...userScores) : 0;
  }

  public getLeaderboard(gameId: string, limit: number = 5): GameScoreRecord[] {
    const scores = this.get<GameScoreRecord[]>(STORAGE_KEYS.SCORES, []);
    return scores
      .filter(s => s.gameId === gameId)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Favorites
  public toggleFavorite(gameId: string): boolean {
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

  public isFavorite(gameId: string): boolean {
    const currentUser = this.getCurrentUser();
    return (currentUser.favorites || []).includes(gameId);
  }
}

export const storage = new StorageService();

