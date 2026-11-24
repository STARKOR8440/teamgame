// src/components/RoundResultModal.tsx
import React from 'react';
import type { Player, RoomState } from '../types/game';
import { ArrowRight, Home, Trophy } from 'lucide-react';

interface Props {
  room: RoomState;
  me: Player;
  onNextGame: () => void;
  onBackToSelect: () => void;
  onGoPodium: () => void;
}

export const RoundResultModal: React.FC<Props> = ({
  room,
  me,
  onNextGame,
  onBackToSelect,
  onGoPodium,
}) => {
  const sorted = Object.values(room.players).sort((a, b) => b.currentScore - a.currentScore);
  const playlist = room.playlist ?? [];
  const hasNextInPlaylist = playlist.length > 0 && room.currentIndex + 1 < playlist.length;

  return (
    <div className="min-h-screen bg-[#0d0e12] px-5 py-8 flex flex-col justify-between">
      <div className="space-y-4">
        <div className="text-center">
          <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">ROUND RESULT</span>
          <h2 className="text-2xl font-black text-white mt-1">라운드 순위 발표</h2>
        </div>

        <div className="space-y-2.5">
          {sorted.map((p, idx) => (
            <div
              key={p.id}
              className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border ${
                idx === 0
                  ? 'bg-yellow-400/15 border-yellow-400 text-white'
                  : 'bg-[#161821] border-zinc-800 text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center font-black text-lg text-yellow-400">{idx + 1}</span>
                <span className="text-2xl">{p.avatar}</span>
                <div>
                  <div className="font-bold text-sm">
                    {p.name} {p.id === me.id && '(나)'}
                  </div>
                  <div className="text-xs text-zinc-400">누적 {p.totalScore}점</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-black text-lg text-cyan-300">{p.currentScore}</div>
                <div className="text-[10px] text-zinc-500">이번 판 기록</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {me.isHost ? (
        <div className="space-y-2.5 pt-6">
          {hasNextInPlaylist && (
            <button
              onClick={onNextGame}
              className="w-full py-4 rounded-2xl bg-yellow-400 text-black font-black flex items-center justify-center gap-2"
            >
              다음 순서 게임 시작 ({room.currentIndex + 2}/{room.playlist.length})
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onBackToSelect}
              className="py-3.5 rounded-xl bg-zinc-800 text-white font-bold flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4" /> 게임 목록으로
            </button>
            <button
              onClick={onGoPodium}
              className="py-3.5 rounded-xl bg-amber-500 text-black font-black flex items-center justify-center gap-1.5"
            >
              <Trophy className="w-4 h-4" /> 최종 시상식
            </button>
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-zinc-400 py-4">방장이 다음 화면을 선택하고 있습니다...</p>
      )}
    </div>
  );
};