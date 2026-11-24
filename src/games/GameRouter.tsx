import React from 'react';
import { QuickTapGames } from './QuickTapGames';
import { TimingSensorGames } from './TimingSensorGames';
import { ActionArcadeGames } from './ActionArcadeGames';
import { BrainQuizGames } from './BrainQuizGames';

interface GameRouterProps {
  gameId: string;
  onScoreChange: (score: number) => void;
}

export const GameRouter: React.FC<GameRouterProps> = ({ gameId, onScoreChange }) => {
  if (['tap-king', 'shake-it', 'rub-rub', 'whack-mole', 'piano-tiles'].includes(gameId)) {
    return <QuickTapGames gameId={gameId} onScoreChange={onScoreChange} />;
  }

  if (['rhythm-king', 'stop-10s', 'squeeze-lemon', 'quick-catch', 'tower-stack', 'shout-battle'].includes(gameId)) {
    return <TimingSensorGames gameId={gameId} onScoreChange={onScoreChange} />;
  }

  if (['line-clear', 'bomb-defuse', 'dodge-meteor', 'kart-race', 'star-catch'].includes(gameId)) {
    return <ActionArcadeGames gameId={gameId} onScoreChange={onScoreChange} />;
  }

  return <BrainQuizGames gameId={gameId} onScoreChange={onScoreChange} />;
};