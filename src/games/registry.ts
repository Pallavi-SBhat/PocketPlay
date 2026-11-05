import React from 'react';
import { GameMetadata } from '../types';
import { FlappyBirdGame } from './flappy-bird/FlappyBirdGame';
import { XoxGame } from './xox/XoxGame';

export const GAMES_LIST: GameMetadata[] = [
  {
    id: 'flappy-bird',
    title: 'Flappy Bird Neon',
    tagline: 'Tap to flap and soar through the neon pipes!',
    description: 'The legendary arcade phenomenon rebuilt with smooth physics, parallax night skyline, dynamic difficulty, audio synthesizer, and high score medals. Test your reflexes and set the offline record!',
    category: 'Arcade',
    tags: ['Retro', 'Reflex', 'Endless', 'Offline'],
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    badge: 'Popular',
    accentColor: '#eab308',
    instructions: [
      'Tap or press Spacebar / Up Arrow to make the bird flap upwards.',
      'Gravity continuously pulls the bird downwards.',
      'Navigate safely through the gaps between top and bottom pipes.',
      'Each cleared pipe scores 1 point. Collect Bronze, Silver, Gold, or Platinum medals!'
    ],
    controls: [
      { key: 'Space / Up Arrow / Click', action: 'Flap wings & rise' },
      { key: 'P', action: 'Pause / Resume game' },
      { key: 'R', action: 'Restart immediately' }
    ],
    component: FlappyBirdGame
  },
  {
    id: 'xox',
    title: 'XOX Neon Tactics',
    tagline: 'Classic Tic-Tac-Toe with smart Bot AI & 2-Player Pass mode',
    description: 'Challenge your brain in this sleek neon rendition of Tic-Tac-Toe. Choose between casual play or the unbeatable Minimax master AI, or play with a friend locally on the same screen.',
    category: 'Strategy',
    tags: ['Puzzle', '2-Player', 'AI Bot', 'Classic'],
    thumbnail: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=600&q=80',
    badge: 'AI Powered',
    accentColor: '#06b6d4',
    instructions: [
      'Take turns placing X and O on the 3x3 grid.',
      'First player to connect 3 marks horizontally, vertically, or diagonally wins!',
      'Choose between 3 Bot AI difficulties or Pass & Play with a friend.',
      'Build up your consecutive win streak and claim the title.'
    ],
    controls: [
      { key: 'Mouse Click / Tap', action: 'Place your mark on the board' }
    ],
    component: XoxGame
  }
];

export function getGameById(id: string): GameMetadata | undefined {
  return GAMES_LIST.find(game => game.id === id);
}

