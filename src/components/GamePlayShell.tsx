import React, { useEffect, useState } from 'react';
import type { MiniGameMeta, Player, RoomState } from '../types/game';
import { Clock } from 'lucide-react';

interface Props {
  room: RoomState;
  me: Player;
  game: MiniGameMeta;
  myScore: number;
  onTimeUp: () => void;
  children: React.ReactNode;
}

export const GamePlayShell: React.FC<Props> = ({ room, me, game, myScore, onTimeUp, children }) => {
  const [timeLeft, setTimeLeft] = useState(game.durationSec);

  useEffect(() => {
    if (room.phase !== 'playing') return;
    const interval = window.setInterval(() => {
      const elapsed = (Date.now() - room.roundStartTime) / 1000;
      const remain = Math.max(0, game.durationSec - elapsed);
      setTimeLeft(remain);
      if (remain <= 0) {
        clearInterval(interval);
        if (me.isHost) onTimeUp();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [room.phase, room.roundStartTime, game.durationSec, me.isHost, onTimeUp]);

  const sortedPlayers = Object.values(room.players)
    .map((p) => (p.id === me.id ? { ...p, currentScore: myScore } : p))
    .sort((a, b) => b.currentScore - a.currentScore);

  return (
    <div className="min-h-screen bg-[#0d0e12] flex flex-col">
      <div className="px-4 pt-3 pb-2 bg-[#14161f] border-b border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{game.heroEmoji}</span>
            <span className="font-black text-white text-base">{game.title}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-300 font-bold">
              내 점수 {myScore}
            </span>
          </div>
          <div
            className={`flex items-center gap-1 font-mono font-black text-lg ${
              timeLeft <= 3 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            {timeLeft.toFixed(1)}s
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {sortedPlayers.slice(0, 4).map((p, idx) => (
            <div
              key={p.id}
              className={`px-2 py-1 rounded-lg text-[11px] flex items-center justify-between border ${
                p.id === me.id
                  ? 'bg-yellow-400/15 border-yellow-400/50 text-yellow-200 font-bold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300'
              }`}
            >
              <span className="truncate">
                {idx + 1}.{p.avatar}
                {p.name}
              </span>
              <span className="font-mono font-bold ml-1">{p.currentScore}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
};