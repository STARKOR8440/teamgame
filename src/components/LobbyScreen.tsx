import React, { useState } from 'react';
import { Gamepad2, Users, Sparkles } from 'lucide-react';

interface Props {
  onCreateRoom: (name: string, avatar: string) => void;
  onJoinRoom: (code: string, name: string, avatar: string) => void;
  errorMsg?: string;
}

const AVATARS = ['🐶', '🐱', '🦊', '🐻', '🐼', '🐯', '🦁', '🐸', '🐵', '🐧', '🦄', '🐲'];

export const LobbyScreen: React.FC<Props> = ({ onCreateRoom, onJoinRoom, errorMsg }) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🦊');
  const [joinCode, setJoinCode] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const playerName = name.trim() || `플레이어${Math.floor(Math.random() * 90 + 10)}`;
    if (tab === 'create') {
      onCreateRoom(playerName, avatar);
    } else {
      if (joinCode.trim().length !== 4) return;
      onJoinRoom(joinCode.trim(), playerName, avatar);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8 bg-[#0d0e12]">
      <div className="w-full max-w-md space-y-6">
        {/* 헤더 타이틀 */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> 모바일 파티 레크리에이션
          </div>
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-yellow-400 text-black flex items-center justify-center shadow-lg shadow-yellow-400/20">
              <Gamepad2 className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">모두의 오락실</h1>
          </div>
          <p className="text-zinc-400 text-sm">별도 호스트 화면 없이 각자 스마트폰으로 함께 즐기세요!</p>
        </div>

        {/* 프로필 카드 */}
        <form onSubmit={handleSubmit} className="bg-[#161821] border border-zinc-800 rounded-3xl p-5 space-y-5 shadow-2xl">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2">아바타 선택</label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((emo) => (
                <button
                  key={emo}
                  type="button"
                  onClick={() => setAvatar(emo)}
                  className={`h-11 rounded-xl text-2xl flex items-center justify-center transition ${
                    avatar === emo
                      ? 'bg-yellow-400/20 border-2 border-yellow-400 scale-105'
                      : 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800'
                  }`}
                >
                  {emo}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">내 닉네임</label>
            <input
              type="text"
              maxLength={8}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 홍길동 (미입력 시 자동 생성)"
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400"
            />
          </div>

          {/* 탭 전환 */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
            <button
              type="button"
              onClick={() => setTab('create')}
              className={`py-2.5 rounded-lg text-sm font-bold transition ${
                tab === 'create' ? 'bg-yellow-400 text-black' : 'text-zinc-400'
              }`}
            >
              새 방 만들기
            </button>
            <button
              type="button"
              onClick={() => setTab('join')}
              className={`py-2.5 rounded-lg text-sm font-bold transition ${
                tab === 'join' ? 'bg-cyan-400 text-black' : 'text-zinc-400'
              }`}
            >
              코드로 입장하기
            </button>
          </div>

          {tab === 'join' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">4자리 입장 코드</label>
              <input
                type="tel"
                maxLength={4}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-center text-2xl font-black tracking-[0.4em] text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {errorMsg && <p className="text-rose-400 text-xs text-center font-medium">{errorMsg}</p>}

          <button
            type="submit"
            className={`w-full py-3.5 rounded-xl font-black text-base transition active:scale-98 flex items-center justify-center gap-2 ${
              tab === 'create'
                ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-400/20'
                : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-lg shadow-cyan-400/20'
            }`}
          >
            <Users className="w-5 h-5" />
            {tab === 'create' ? '방 만들고 오락실 입장' : '친구 방에 참여하기'}
          </button>
        </form>
      </div>
    </div>
  );
};