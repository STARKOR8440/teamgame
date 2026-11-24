import React, { useEffect, useState } from 'react';
import type { MiniGameMeta, Player, RoomState } from '../types/game';

interface Props {
  room: RoomState;
  me: Player;
  game: MiniGameMeta;
  onCountdownDone: () => void;
}

export const CountdownScreen: React.FC<Props> = ({ room, me, game, onCountdownDone }) => {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const startAt = room.countdownStartTime || Date.now();
    let done = false;

    const tick = () => {
      const elapsedSec = (Date.now() - startAt) / 1000;
      const remain = Math.ceil(3 - elapsedSec);

      if (remain > 0) {
        setCount(Math.min(3, remain));
      } else if (!done) {
        done = true;
        setCount(0);
        if (me.isHost) {
          onCountdownDone();
        }
      }
    };

    tick();
    const timer = window.setInterval(tick, 50);
    return () => clearInterval(timer);
  }, [room.countdownStartTime, me.isHost, onCountdownDone]);

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white flex flex-col items-center justify-center px-6 select-none">
      <div className="text-5xl mb-3">{game.heroEmoji}</div>
      <div className="text-lg font-black text-zinc-300 mb-6">{game.title}</div>

      <div className="w-36 h-36 rounded-full bg-yellow-400/15 border-4 border-yellow-400 flex items-center justify-center shadow-[0_0_40px_rgba(250,204,21,0.35)]">
        <span key={count} className="text-7xl font-black text-yellow-300 animate-bounce">
          {count > 0 ? count : 'GO!'}
        </span>
      </div>

      <p className="mt-6 text-sm font-bold text-zinc-400">
        3초 후 게임이 시작됩니다!
      </p>
    </div>
  );
};