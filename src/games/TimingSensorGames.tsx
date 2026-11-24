import React, { useEffect, useRef, useState } from 'react';

interface Props {
  gameId: string;
  onScoreChange: (score: number) => void;
}

export const TimingSensorGames: React.FC<Props> = ({ gameId, onScoreChange }) => {
  const [score, setScore] = useState(0);
  // 10초 멈춰라
  const [stopwatch, setStopwatch] = useState(0);
  const [stopped, setStopped] = useState(false);
  // 박자왕
  const [beatActive, setBeatActive] = useState(false);
  // 레몬짜기 (게이지 0~100, 타겟 45~75)
  const [lemonGauge, setLemonGauge] = useState(20);
  // 순간포착
  const [signalGreen, setSignalGreen] = useState(false);
  const greenAtRef = useRef<number>(0);
  // 탑 쌓기
  const [stackWidth, setStackWidth] = useState(80);
  const [stackDir, setStackDir] = useState(1);
  const [stackPos, setStackPos] = useState(10);

  const reportScore = (val: number) => {
    const finalVal = Math.max(0, Math.round(val));
    setScore(finalVal);
    onScoreChange(finalVal);
  };

  // 07. 10초를 멈춰라
  useEffect(() => {
    if (gameId !== 'stop-10s' || stopped) return;
    const start = Date.now();
    const id = window.setInterval(() => {
      setStopwatch((Date.now() - start) / 1000);
    }, 30);
    return () => clearInterval(id);
  }, [gameId, stopped]);

  // 08. 박자왕
  useEffect(() => {
    if (gameId !== 'rhythm-king') return;
    const id = window.setInterval(() => {
      setBeatActive(true);
      setTimeout(() => setBeatActive(false), 380);
    }, 780);
    return () => clearInterval(id);
  }, [gameId]);

  // 09. 레몬짜기 자연 감소
  useEffect(() => {
    if (gameId !== 'squeeze-lemon') return;
    const id = window.setInterval(() => {
      setLemonGauge((g) => {
        const next = Math.max(0, g - 3.5);
        if (next >= 45 && next <= 75) {
          setScore((s) => {
            const ns = s + 4;
            onScoreChange(ns);
            return ns;
          });
        }
        return next;
      });
    }, 150);
    return () => clearInterval(id);
  }, [gameId]);

  // 10. 순간포착 신호 전환
  useEffect(() => {
    if (gameId !== 'quick-catch') return;
    const timeout = window.setTimeout(() => {
      setSignalGreen(true);
      greenAtRef.current = Date.now();
    }, 1200 + Math.random() * 2500);
    return () => clearTimeout(timeout);
  }, [gameId, score]);

  // 11. 탑 쌓기 블록 이동
  useEffect(() => {
    if (gameId !== 'tower-stack') return;
    const id = window.setInterval(() => {
      setStackPos((p) => {
        const next = p + stackDir * 4;
        if (next >= 100 - stackWidth) {
          setStackDir(-1);
          return 100 - stackWidth;
        }
        if (next <= 0) {
          setStackDir(1);
          return 0;
        }
        return next;
      });
    }, 35);
    return () => clearInterval(id);
  }, [gameId, stackDir, stackWidth]);

  if (gameId === 'stop-10s') {
    const showNumber = stopwatch < 3.0 || stopped;
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 text-center">
        <p className="text-xs text-zinc-400">3초 뒤 숫자가 사라집니다! 정확히 10.00초에 멈추세요</p>
        <div className="text-6xl font-mono font-black text-yellow-400">
          {showNumber ? `${stopwatch.toFixed(2)}s` : '?.??s'}
        </div>
        {!stopped ? (
          <button
            onClick={() => {
              setStopped(true);
              const diff = Math.abs(10 - stopwatch);
              const pts = Math.max(0, Math.round(200 - diff * 120));
              reportScore(pts);
            }}
            className="px-10 py-4 rounded-2xl bg-rose-500 text-white font-black text-xl active:scale-95"
          >
            STOP! 멈추기
          </button>
        ) : (
          <div className="text-cyan-300 font-bold">
            기록: {stopwatch.toFixed(2)}s (오차 {Math.abs(10 - stopwatch).toFixed(2)}s) → {score}점
          </div>
        )}
      </div>
    );
  }

  if (gameId === 'rhythm-king') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <p className="text-xs text-zinc-400">네온 링이 빛날 때 타이밍 맞춰 탭하세요!</p>
        <button
          onPointerDown={() => {
            if (beatActive) {
              reportScore(score + 15);
            } else {
              reportScore(score - 5);
            }
          }}
          className={`w-44 h-44 rounded-full font-black text-xl transition flex items-center justify-center border-4 ${
            beatActive
              ? 'bg-pink-500 text-white border-pink-200 scale-110 shadow-2xl shadow-pink-500/40'
              : 'bg-zinc-900 text-zinc-400 border-zinc-700'
          }`}
        >
          {beatActive ? '지금 탭!' : '기다려...'}
        </button>
      </div>
    );
  }

  if (gameId === 'squeeze-lemon') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
        <p className="text-xs text-zinc-400">노란 레몬존(45~75%) 안에 게이지를 유지하세요!</p>
        <div className="w-full max-w-xs h-8 rounded-full bg-zinc-800 relative overflow-hidden border border-zinc-700">
          <div className="absolute top-0 bottom-0 left-[45%] w-[30%] bg-yellow-400/30 border-x border-yellow-300" />
          <div
            className="h-full bg-yellow-400 transition-all duration-75"
            style={{ width: `${Math.min(100, lemonGauge)}%` }}
          />
        </div>
        <button
          onPointerDown={() => setLemonGauge((g) => Math.min(100, g + 12))}
          className="px-8 py-4 rounded-2xl bg-yellow-400 text-black font-black text-lg active:scale-95"
        >
          🍋 꽉 짜기!
        </button>
      </div>
    );
  }

  if (gameId === 'quick-catch') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <button
          onPointerDown={() => {
            if (!signalGreen) {
              reportScore(score - 10);
            } else {
              const rt = Date.now() - greenAtRef.current;
              const pts = Math.max(10, Math.round(150 - rt / 5));
              reportScore(score + pts);
              setSignalGreen(false);
            }
          }}
          className={`w-full max-w-xs h-64 rounded-3xl font-black text-2xl flex flex-col items-center justify-center gap-2 transition ${
            signalGreen ? 'bg-emerald-400 text-black shadow-2xl shadow-emerald-400/40' : 'bg-rose-600 text-white'
          }`}
        >
          <span className="text-5xl">{signalGreen ? '⚡' : '🛑'}</span>
          <span>{signalGreen ? '초록불! 지금 터치!' : '빨간불 대기...'}</span>
        </button>
      </div>
    );
  }

  if (gameId === 'tower-stack') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <p className="text-xs text-zinc-400">중앙(50%)에 가까울 때 터치해 탑을 쌓으세요!</p>
        <div className="w-full max-w-xs h-16 bg-zinc-900 rounded-xl relative overflow-hidden border border-zinc-700">
          <div
            className="h-full bg-lime-400 rounded-lg"
            style={{ width: `${stackWidth}%`, marginLeft: `${stackPos}%` }}
          />
        </div>
        <button
          onPointerDown={() => {
            const center = stackPos + stackWidth / 2;
            const accuracy = Math.max(0, 100 - Math.abs(50 - center) * 2.5);
            reportScore(score + Math.round(accuracy / 4));
            setStackWidth((w) => Math.max(20, w - 4));
          }}
          className="px-8 py-4 rounded-2xl bg-lime-400 text-black font-black text-lg active:scale-95"
        >
          블록 내리기
        </button>
      </div>
    );
  }

  // 17. 함성 대결
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5 text-center">
      <div className="text-6xl">📢</div>
      <h3 className="text-2xl font-black text-white">함성 대결!</h3>
      <p className="text-xs text-zinc-400">소리 지르거나 아래 함성 버튼을 연타해 데시벨 게이지를 채우세요!</p>
      <button
        onPointerDown={() => reportScore(score + 8)}
        className="px-8 py-4 rounded-2xl bg-orange-500 text-white font-black text-lg active:scale-95"
      >
        🔥 함성 발사 (+8)
      </button>
    </div>
  );
};