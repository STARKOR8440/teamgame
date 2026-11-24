import React, { useEffect, useRef, useState } from 'react';

interface Props {
  gameId: string;
  onScoreChange: (score: number) => void;
}

export const QuickTapGames: React.FC<Props> = ({ gameId, onScoreChange }) => {
  const [score, setScore] = useState(0);
  const [moles, setMoles] = useState<number[]>(Array(9).fill(0)); // 0: 빈칸, 1: 두더지, 2: 폭탄
  const [pianoLane, setPianoLane] = useState<number>(Math.floor(Math.random() * 4));
  const lastXRef = useRef<number | null>(null);
  const rubAccumRef = useRef<number>(0);

  const addScore = (pts: number) => {
    setScore((prev) => {
      const next = Math.max(0, prev + pts);
      onScoreChange(next);
      return next;
    });
  };

  // 02. 흔들흔들 (가속도계 센서)
  useEffect(() => {
    if (gameId !== 'shake-it') return;
    let lastMag = 0;
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const mag = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0);
      if (Math.abs(mag - lastMag) > 14) {
        addScore(5);
      }
      lastMag = mag;
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [gameId]);

  // 04. 두더지 타이머
  useEffect(() => {
    if (gameId !== 'whack-mole') return;
    const timer = window.setInterval(() => {
      setMoles(
        Array.from({ length: 9 }, () => {
          const r = Math.random();
          if (r < 0.28) return 1;
          if (r < 0.36) return 2;
          return 0;
        })
      );
    }, 650);
    return () => clearInterval(timer);
  }, [gameId]);

  if (gameId === 'tap-king') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <p className="text-zinc-400 text-sm font-bold">제한 시간 동안 화면 버튼을 미친 듯이 연타하세요!</p>
        <button
          onPointerDown={() => addScore(1)}
          className="w-52 h-52 rounded-full bg-gradient-to-b from-sky-400 to-blue-600 active:scale-90 transition shadow-2xl shadow-blue-500/40 border-4 border-sky-200 flex flex-col items-center justify-center"
        >
          <span className="text-5xl mb-1">👆</span>
          <span className="text-2xl font-black text-white">연타!</span>
          <span className="text-sm font-mono font-bold text-sky-100 mt-1">{score}회</span>
        </button>
      </div>
    );
  }

  if (gameId === 'shake-it') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5 text-center">
        <div className="text-6xl animate-bounce">📱</div>
        <h3 className="text-2xl font-black text-white">폰을 위아래로 흔드세요!</h3>
        <p className="text-xs text-zinc-400">센서 미지원 환경이나 테스트 시 아래 버튼도 사용 가능</p>
        <button
          onClick={() => addScore(5)}
          className="px-8 py-4 rounded-2xl bg-pink-500 active:scale-95 text-white font-black text-lg shadow-lg shadow-pink-500/30"
        >
          흔들기 터치 (+5)
        </button>
      </div>
    );
  }

  if (gameId === 'rub-rub') {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center p-6 gap-4 touch-none"
        onPointerMove={(e) => {
          if (e.buttons === 0 && e.pointerType === 'mouse') return;
          if (lastXRef.current !== null) {
            rubAccumRef.current += Math.abs(e.clientX - lastXRef.current);
            if (rubAccumRef.current >= 45) {
              rubAccumRef.current = 0;
              addScore(3);
            }
          }
          lastXRef.current = e.clientX;
        }}
        onPointerUp={() => {
          lastXRef.current = null;
        }}
      >
        <div className="w-full max-w-sm h-56 rounded-3xl bg-gradient-to-r from-orange-500/20 via-amber-400/20 to-orange-500/20 border-2 border-dashed border-orange-400 flex flex-col items-center justify-center gap-2">
          <span className="text-5xl">↔️</span>
          <span className="font-black text-xl text-orange-300">좌우로 쓱쓱 문지르세요!</span>
          <span className="font-mono text-lg font-bold text-white">{score}점</span>
        </div>
      </div>
    );
  }

  if (gameId === 'whack-mole') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-5 gap-4">
        <p className="text-xs text-zinc-400">🐹 두더지 +10점 | 💣 폭탄 -15점</p>
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {moles.map((val, idx) => (
            <button
              key={idx}
              onPointerDown={() => {
                if (val === 1) {
                  addScore(10);
                  setMoles((prev) => prev.map((v, i) => (i === idx ? 0 : v)));
                } else if (val === 2) {
                  addScore(-15);
                  setMoles((prev) => prev.map((v, i) => (i === idx ? 0 : v)));
                }
              }}
              className="h-24 rounded-2xl bg-[#1a1d2b] border border-zinc-700 flex items-center justify-center text-4xl active:scale-95"
            >
              {val === 1 ? '🐹' : val === 2 ? '💣' : '🕳️'}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 06. 피아노 (건반 순서대로)
  return (
    <div className="flex-1 flex flex-col justify-between p-4 gap-3">
      <p className="text-center text-xs text-zinc-400">빛나는 건반을 빠르게 터치하세요!</p>
      <div className="grid grid-cols-4 gap-2.5 flex-1 max-h-96 my-auto">
        {[0, 1, 2, 3].map((lane) => {
          const active = pianoLane === lane;
          return (
            <button
              key={lane}
              onPointerDown={() => {
                if (active) {
                  addScore(10);
                  let next = Math.floor(Math.random() * 4);
                  if (next === lane) next = (lane + 1) % 4;
                  setPianoLane(next);
                } else {
                  addScore(-5);
                }
              }}
              className={`rounded-2xl font-black text-xl transition flex flex-col items-center justify-end pb-6 border-2 ${
                active
                  ? 'bg-yellow-400 text-black border-yellow-200 shadow-lg shadow-yellow-400/30'
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800'
              }`}
            >
              🎹
            </button>
          );
        })}
      </div>
    </div>
  );
};