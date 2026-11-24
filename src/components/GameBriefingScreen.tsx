import React from 'react';
import { ArrowLeft, CheckCircle2, Play, Users, Volume2 } from 'lucide-react';
import type { MiniGameMeta, Player, RoomState } from '../types/game';

interface Props {
  room: RoomState;
  me: Player;
  game: MiniGameMeta;
  onStartGame: () => void;
  onBackToSelect: () => void;
}

export const GameBriefingScreen: React.FC<Props> = ({
  room,
  me,
  game,
  onStartGame,
  onBackToSelect,
}) => {
  const players = Object.values(room.players);

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white flex flex-col justify-between">
      <header className="px-4 py-3 bg-[#14161f] border-b border-zinc-800/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-sm bg-blue-500 inline-block" />
          <span className="font-bold text-sm text-zinc-100">
            {room.mode === 'team' ? `${me.team}팀` : me.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-yellow-500/40 text-yellow-300 font-mono text-xs font-black">
            {me.totalScore}점
          </span>
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <Volume2 className="w-4 h-4" />
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 max-w-md w-full mx-auto flex flex-col justify-center space-y-5">
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="w-24 h-24 rounded-3xl bg-[#1b1e2b] border-2 border-zinc-700/80 shadow-xl flex items-center justify-center text-5xl">
            {game.heroEmoji}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">{game.title}</h1>
          <p className="text-sm text-zinc-300 font-medium">{game.subtitle}</p>
        </div>

        <div className="space-y-2.5 pt-1">
          {game.rules.map((rule, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 pb-2.5 border-b border-dashed border-zinc-800 last:border-b-0"
            >
              <span className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/50 text-amber-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="text-sm font-bold text-zinc-100 leading-snug">{rule}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-yellow-400/60 bg-yellow-400/5 text-xs font-bold text-zinc-200">
            <span>{room.mode === 'solo' ? '👤' : '👥'}</span>
            <span>
              {room.mode === 'solo'
                ? '개인전! 내 기록으로 순위가 정해져요'
                : '팀전! 팀원들의 기록으로 승부가 정해져요'}
            </span>
          </div>
        </div>

        <div className="bg-[#151822] border border-zinc-800 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              참가자 확인 ({players.length}명)
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 준비 완료
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {players.map((p) => (
              <div
                key={p.id}
                className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                  p.id === me.id
                    ? 'bg-yellow-400/15 border-yellow-400/60 text-yellow-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-200'
                }`}
              >
                <span>{p.avatar}</span>
                <span>{p.name}</span>
                {p.isHost && (
                  <span className="text-[10px] px-1 rounded bg-amber-400/20 text-amber-300">방장</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 bg-[#12141c] border-t border-zinc-800 px-4 py-3 flex items-center justify-between gap-2.5">
        <div className="text-xs font-bold text-amber-300 truncate">{game.title} 준비 완료!</div>

        {me.isHost ? (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onBackToSelect}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> 다른 게임
            </button>
            <button
              type="button"
              onClick={onStartGame}
              className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm flex items-center gap-1.5 shadow-lg shadow-yellow-400/25 active:scale-95"
            >
              <Play className="w-4 h-4 fill-black" /> 시작
            </button>
          </div>
        ) : (
          <span className="text-xs text-zinc-400 shrink-0">방장이 시작을 누르길 기다리는 중...</span>
        )}
      </footer>
    </div>
  );
};