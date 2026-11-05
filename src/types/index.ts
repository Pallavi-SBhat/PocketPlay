export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  createdAt: string;
  gamesPlayed: number;
  favorites: string[];
}

export interface GameScoreRecord {
  gameId: string;
  score: number;
  date: string;
  userId: string;
  username: string;
  metadata?: string;
}

export interface GameMetadata {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: 'Arcade' | 'Strategy' | 'Puzzle' | 'Action' | 'Classic';
  tags: string[];
  thumbnail: string;
  badge?: string;
  accentColor: string;
  instructions: string[];
  controls: {
    key: string;
    action: string;
  }[];
  component: React.ComponentType<{
    onGameOver?: (score: number) => void;
    onBack?: () => void;
  }>;
}

export type ActiveView = 
  | { type: 'store' }
  | { type: 'game'; gameId: string }
  | { type: 'profile' };

