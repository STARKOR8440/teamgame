// src/components/PodiumScreen.tsx
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Player, RoomState } from '../types/game';
import { RotateCcw } from 'lucide-react';

interface Props {
  room: RoomState;
  me: Player;
  onBackToSelect: () => void;
}

export const PodiumScreen: React.FC<Props> = ({ room, me, onBackToSelect }) => {
  const sorted = Object.values(room.players).sort((a, b) => b.totalScore - a.totalScore);
  const top3 = [sorted[1], sorted[0], sorted[2]]; // 2위 - 1위 - 3위 포디움 배치

  useEffect(() => {
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0e12] px-5 py-8 flex flex-col justify-between">
      <div className="space-y-6">
        <div className="text-center">
          <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black">
            FINAL CEREMONY
          </span>
          <h2 className="text-3xl font-black text-white mt-2">🏆 최종 시상식</h2>
        </div>

        {/* 1~3위 포디움 */}
        <div className="grid grid-cols-3 items-end gap-2 pt-8 px-2">
          {top3.map((p, i) => {
            if (!p) return <div key={i} />;
            const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
            const height = rank === 1 ? 'h-40 bg-yellow-400 text-black' : rank === 2 ? 'h-28 bg-zinc-300 text-black' : 'h-24 bg-amber-700 text-white';

            return (
              <div key={p.id} className="flex flex-col items-center">
                <div className="text-4xl mb-1">{p.avatar}</div>
                <div className="text-xs font-bold text-white truncate max-w-full mb-1">{p.name}</div>
                <div className={`w-full rounded-t-2xl flex flex-col items-center justify-center font-black ${height}`}>
                  <span className="text-2xl">{rank}위</span>
                  <span className="text-xs opacity-80">{p.totalScore}점</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 전체 순위 리스트 */}
        <div className="space-y-2 pt-4">
          {sorted.map((p, idx) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#161821] border border-zinc-800">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-zinc-400 w-5">{idx + 1}</span>
                <span>{p.avatar}</span>
                <span className="text-sm font-bold text-white">{p.name}</span>
              </div>
              <span className="font-mono font-black text-yellow-400">{p.totalScore}점</span>
            </div>
          ))}
        </div>
      </div>

      {me.isHost && (
        <button
          onClick={onBackToSelect}
          className="w-full py-4 rounded-2xl bg-yellow-400 text-black font-black flex items-center justify-center gap-2 mt-6"
        >
          <RotateCcw className="w-5 h-5" /> 오락실 메인으로 돌아가기
        </button>
      )}
    </div>
  );
};