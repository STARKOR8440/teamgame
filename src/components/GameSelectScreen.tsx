import React, { useState } from 'react';
import { GAMES_CATALOG } from '../data/gamesCatalog';
import type { AccentColor, MiniGameMeta, Player, RoomState } from '../types/game';
import {
  Gamepad2,
  ListOrdered,
  Trophy,
  Users,
  User,
  Play,
  Bot,
  Copy,
  Check,
  Shuffle,
} from 'lucide-react';

interface Props {
  room: RoomState;
  me: Player;
  onStartSingleGame: (gameId: string) => void;
  onTogglePlaylistGame: (gameId: string) => void;
  onStartPlaylist: () => void;
  onToggleMode: () => void;
  onToggleMatchType: () => void;
  onOpenPodium: () => void;
  onAddBots: () => void;
  onSwitchTeam: (playerId: string) => void;
}

const ACCENT_STYLES: Record<AccentColor, { top: string; badge: string }> = {
  blue: { top: 'border-t-blue-500', badge: 'bg-blue-500/20 text-blue-300' },
  pink: { top: 'border-t-pink-500', badge: 'bg-pink-500/20 text-pink-300' },
  orange: { top: 'border-t-orange-500', badge: 'bg-orange-500/20 text-orange-300' },
  amber: { top: 'border-t-amber-500', badge: 'bg-amber-500/20 text-amber-300' },
  cyan: { top: 'border-t-cyan-400', badge: 'bg-cyan-500/20 text-cyan-300' },
  yellow: { top: 'border-t-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300' },
  emerald: { top: 'border-t-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
  violet: { top: 'border-t-violet-500', badge: 'bg-violet-500/20 text-violet-300' },
  rose: { top: 'border-t-rose-500', badge: 'bg-rose-500/20 text-rose-300' },
  lime: { top: 'border-t-lime-400', badge: 'bg-lime-500/20 text-lime-300' },
};

export const GameSelectScreen: React.FC<Props> = ({
  room,
  me,
  onStartSingleGame,
  onTogglePlaylistGame,
  onStartPlaylist,
  onToggleMode,
  onToggleMatchType,
  onOpenPodium,
  onAddBots,
  onSwitchTeam,
}) => {
  const [filter, setFilter] = useState<'all' | 'fast' | 'brain'>('all');
  const [queueMode, setQueueMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const playlist = room.playlist ?? [];
  const playersList = Object.values(room.players);
  const filteredGames = GAMES_CATALOG.filter((g) => (filter === 'all' ? true : g.category === filter));

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleCardClick = (game: MiniGameMeta) => {
    if (!me.isHost) return;
    if (queueMode) {
      onTogglePlaylistGame(game.id);
    } else {
      onStartSingleGame(game.id);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] pb-28">
      {/* 상단 고정 헤더 */}
      <header className="sticky top-0 z-20 bg-[#0d0e12]/95 backdrop-blur border-b border-zinc-800/80 px-4 py-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-yellow-400 text-black flex items-center justify-center">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <span className="font-black text-lg text-white">모두의 오락실</span>
            <span className="px-2 py-0.5 rounded-md bg-yellow-400/15 text-yellow-300 text-xs font-bold">
              게임 선택
            </span>
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-bold text-cyan-300"
          >
            <span>방 코드 {room.roomCode}</span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 참가자 스트립 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {playersList.map((p) => (
            <button
              key={p.id}
              onClick={() => room.mode === 'team' && me.isHost && onSwitchTeam(p.id)}
              className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                room.mode === 'team'
                  ? p.team === 'A'
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                    : 'bg-sky-500/15 border-sky-500/50 text-sky-200'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-200'
              }`}
            >
              <span>{p.avatar}</span>
              <span>{p.name}</span>
              {room.mode === 'team' && (
                <span className="text-[10px] font-black px-1 rounded bg-black/40">{p.team}팀</span>
              )}
              <span className="text-yellow-400 font-bold">{p.totalScore}p</span>
            </button>
          ))}

          {me.isHost && playersList.length < 2 && (
            <button
              onClick={onAddBots}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300"
            >
              <Bot className="w-3.5 h-3.5" /> 혼자 연습(AI 봇 추가)
            </button>
          )}
        </div>

        {/* 컨트롤 툴바 (스크린샷 상단 바 모바일 최적화) */}
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto pt-0.5">
          <div className="flex items-center gap-1.5">
            {me.isHost && (
              <button
                onClick={() => setQueueMode(!queueMode)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                  queueMode
                    ? 'bg-yellow-400 text-black border-yellow-400'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                순서 짜기 {playlist.length > 0 && `(${playlist.length})`}
              </button>
            )}

            <button
              onClick={me.isHost ? onToggleMode : undefined}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 border border-zinc-700 text-violet-300"
            >
              {room.mode === 'solo' ? <User className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
              {room.mode === 'solo' ? '개인전' : '팀전'}
              {me.isHost && <Shuffle className="w-3 h-3 opacity-60" />}
            </button>

            <button
              onClick={me.isHost ? onToggleMatchType : undefined}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 border border-zinc-700 text-amber-300"
            >
              {room.matchType === 'olympic' ? '🏅 올림픽(누적)' : '⚡ 단판승부'}
            </button>
          </div>

          <button
            onClick={onOpenPodium}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300"
          >
            <Trophy className="w-3.5 h-3.5" /> 시상식
          </button>
        </div>

        {/* 카테고리 필터 */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {[
            { key: 'all', label: `전체 (${GAMES_CATALOG.length})` },
            { key: 'fast', label: '⚡ 빠르게 (16)' },
            { key: 'brain', label: '🧠 생각해 (11)' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as 'all' | 'fast' | 'brain')}
              className={`py-1.5 rounded-lg text-xs font-bold transition ${
                filter === tab.key
                  ? 'bg-zinc-800 text-white border border-zinc-600'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* 방장 안내 배너 */}
      {!me.isHost && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-xs text-center">
          방장이 게임을 선택하면 모든 참가자 화면에서 동시에 시작됩니다!
        </div>
      )}

      {/* 27종 미니게임 2열 그리드 */}
      <main className="px-4 pt-3 grid grid-cols-2 gap-3">
        {filteredGames.map((game) => {
          const style = ACCENT_STYLES[game.accent];
          const queueIdx = playlist.indexOf(game.id);
          const isQueued = queueIdx !== -1;

          return (
            <button
              key={game.id}
              onClick={() => handleCardClick(game)}
              disabled={!me.isHost}
              className={`relative text-left bg-[#171923] hover:bg-[#1e212e] active:scale-97 transition rounded-2xl p-3.5 border border-zinc-800 border-t-4 ${
                style.top
              } ${isQueued ? 'ring-2 ring-yellow-400 neon-border-yellow' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${style.badge}`}>
                  {game.category === 'fast' ? '빠르게' : '생각해'}
                </span>
                <span className="text-xs font-mono font-bold text-zinc-500">{game.number}</span>
              </div>

              <div className="font-black text-base text-white flex items-center gap-1.5">
                <span>{game.title}</span>
                {game.isNew && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500 text-white font-black">NEW</span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{game.subtitle}</p>

              {isQueued && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-400 text-black font-black text-xs flex items-center justify-center shadow">
                  {queueIdx + 1}
                </div>
              )}
            </button>
          );
        })}
      </main>

      {/* 순서 짜기 하단 플로팅 실행 바 */}
      {me.isHost && playlist.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-30">
          <button
            onClick={onStartPlaylist}
            className="w-full py-4 rounded-2xl bg-yellow-400 text-black font-black text-base shadow-2xl shadow-yellow-400/30 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-black" />
            선택한 {playlist.length}개 게임 연속 시작하기
          </button>
        </div>
      )}
    </div>
  );
};