import React from 'react';
import { ActionArcadeGames } from '../games/ActionArcadeGames';
import { BrainQuizGames } from '../games/BrainQuizGames';
import { QuickTapGames } from '../games/QuickTapGames';
import { TimingSensorGames } from '../games/TimingSensorGames';

interface Props {
  gameId: string;
  onScoreChange: (delta: number) => void;
}

const QUICK_TAP_IDS = new Set([
  'tap-king',
  'shake-it',
  'rub-rub',
  'whack-mole',
  'piano-tiles',
  'rhythm-king',
  'shout-battle',
]);

const TIMING_SENSOR_IDS = new Set([
  'stop-10s',
  'squeeze-lemon',
  'quick-catch',
  'tower-stack',
]);

const ACTION_ARCADE_IDS = new Set([
  'line-clear',
  'bomb-defuse',
  'dodge-meteor',
  'kart-race',
  'star-catch',
]);

export const GameRouter: React.FC<Props> = ({ gameId, onScoreChange }) => {
  if (QUICK_TAP_IDS.has(gameId)) {
    return <QuickTapGames gameId={gameId} onScoreChange={onScoreChange} />;
  }

  if (TIMING_SENSOR_IDS.has(gameId)) {
    return <TimingSensorGames gameId={gameId} onScoreChange={onScoreChange} />;
  }

  if (ACTION_ARCADE_IDS.has(gameId)) {
    return <ActionArcadeGames gameId={gameId} onScoreChange={onScoreChange} />;
  }

  return <BrainQuizGames gameId={gameId} onScoreChange={onScoreChange} />;
};