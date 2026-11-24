import React, { useEffect, useState } from 'react';

interface Props {
  gameId: string;
  onScoreChange: (score: number) => void;
}

export const TimingSensorGames: React.FC<Props> = ({ gameId, onScoreChange }) => {
  // 07. 10초를 멈춰라
  const [elapsed, setElapsed] = useState(0);
  const [stopped, setStopped] = useState(false);

  // 09. 레몬짜기
  const [lemonGauge, setLemonGauge] = useState(55);

  // 10. 순간포착
  const [isGreen, setIsGreen] = useState(false);

  // 11. 탑 쌓기
  const [stackFloor, setStackFloor] = useState(0);
  const [baseBlock, setBaseBlock] = useState({ left: 26, width: 48 });
  const [movingLeft, setMovingLeft] = useState(12);
  const [movingDir, setMovingDir] = useState<1 | -1>(1);
  const [towerHistory, setTowerHistory] = useState<Array<{ left: number; width: number }>>([]);

  useEffect(() => {
    setElapsed(0);
    setStopped(false);
    setLemonGauge(55);
    setIsGreen(false);
    setStackFloor(0);
    setBaseBlock({ left: 26, width: 48 });
    setMovingLeft(12);
    setMovingDir(1);
    setTowerHistory([]);
  }, [gameId]);

  useEffect(() => {
    if (gameId !== 'stop-10s' || stopped) return;
    const start = Date.now();
    const id = window.setInterval(() => {
      setElapsed((Date.now() - start) / 1000);
    }, 30);
    return () => clearInterval(id);
  }, [gameId, stopped]);

  useEffect(() => {
    if (gameId !== 'squeeze-lemon') return;
    const id = window.setInterval(() => {
      setLemonGauge((g) => {
        const next = Math.max(0, g - 3.2);
        if (next >= 45 && next <= 75) {
          onScoreChange(4);
        }
        return next;
      });
    }, 150);
    return () => clearInterval(id);
  }, [gameId, onScoreChange]);

  useEffect(() => {
    if (gameId !== 'quick-catch') return;
    const id = window.setInterval(() => {
      setIsGreen((prev) => !prev);
    }, 1300);
    return () => clearInterval(id);
  }, [gameId]);

  useEffect(() => {
    if (gameId !== 'tower-stack') return;
    const speed = 1.6 + Math.min(2.2, stackFloor * 0.14);
    const id = window.setInterval(() => {
      setMovingLeft((prev) => {
        const next = prev + movingDir * speed;
        const maxLeft = Math.max(0, 100 - baseBlock.width);
        if (next >= maxLeft) {
          setMovingDir(-1);
          return maxLeft;
        }
        if (next <= 0) {
          setMovingDir(1);
          return 0;
        }
        return next;
      });
    }, 16);
    return () => clearInterval(id);
  }, [gameId, movingDir, baseBlock.width, stackFloor]);

  // 07. 10초를 멈춰라
  if (gameId === 'stop-10s') {
    const hideNumber = elapsed > 3;
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 bg-[#0e0f15] select-none touch-none">
        <div className="text-5xl font-black font-mono text-rose-300">
          {hideNumber ? '?.??초' : `${elapsed.toFixed(2)}초`}
        </div>
        <p className="text-xs text-zinc-400">
          {hideNumber ? '감으로 딱 10.00초에 맞춰 STOP을 누르세요!' : '3초 뒤 숫자가 가려집니다!'}
        </p>
        <button
          type="button"
          disabled={stopped}
          onPointerDown={() => {
            setStopped(true);
            const diff = Math.abs(10 - elapsed);
            const gained = Math.max(0, Math.round(100 - diff * 25));
            onScoreChange(gained);
          }}
          className="px-10 py-5 rounded-2xl bg-rose-600 active:bg-rose-500 disabled:bg-zinc-700 text-white font-black text-2xl shadow-lg"
        >
          {stopped ? `기록: ${elapsed.toFixed(2)}초` : 'STOP'}
        </button>
      </div>
    );
  }

  // 09. 레몬짜기
  if (gameId === 'squeeze-lemon') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 bg-[#0e0f15] select-none touch-none">
        <div className="text-xs font-bold text-yellow-300">노란 타겟(45~75%) 안에 유지하세요!</div>
        <div className="w-full max-w-xs h-8 rounded-full bg-zinc-800 relative overflow-hidden border border-zinc-700">
          <div className="absolute left-[45%] w-[30%] h-full bg-yellow-400/25 border-x border-yellow-300/60" />
          <div
            className="h-full bg-yellow-400 transition-all duration-100"
            style={{ width: `${lemonGauge}%` }}
          />
        </div>
        <button
          type="button"
          onPointerDown={() => setLemonGauge((g) => Math.min(100, g + 11))}
          className="px-8 py-4 rounded-2xl bg-yellow-400 active:bg-yellow-300 text-black font-black text-lg"
        >
          🍋 꾹 짜기!
        </button>
      </div>
    );
  }

  // 10. 순간포착
  if (gameId === 'quick-catch') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 bg-[#0e0f15] select-none touch-none">
        <button
          type="button"
          onPointerDown={() => onScoreChange(isGreen ? 25 : -15)}
          className={`w-52 h-52 rounded-3xl font-black text-2xl text-white transition-colors flex flex-col items-center justify-center shadow-2xl ${
            isGreen ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-rose-600 shadow-rose-600/30'
          }`}
        >
          <span>{isGreen ? '지금 터치!' : '기다리세요'}</span>
          <span className="text-xs mt-1 opacity-85">{isGreen ? 'GREEN' : 'RED'}</span>
        </button>
      </div>
    );
  }

  // 11. 탑 쌓기
  const handleDropBlock = () => {
    const mStart = movingLeft;
    const mEnd = movingLeft + baseBlock.width;
    const bStart = baseBlock.left;
    const bEnd = baseBlock.left + baseBlock.width;

    const overlapStart = Math.max(mStart, bStart);
    const overlapEnd = Math.min(mEnd, bEnd);
    const overlapWidth = overlapEnd - overlapStart;

    if (overlapWidth <= 2) {
      onScoreChange(-10);
      setStackFloor(0);
      setTowerHistory([]);
      setBaseBlock({ left: 26, width: 48 });
      setMovingLeft(10);
      return;
    }

    const isPerfect = Math.abs(mStart - bStart) < 2.5;
    const nextWidth = isPerfect ? baseBlock.width : overlapWidth;
    const nextLeft = isPerfect ? baseBlock.left : overlapStart;

    setTowerHistory((prev) => [...prev.slice(-7), { left: overlapStart, width: overlapWidth }]);
    setBaseBlock({ left: nextLeft, width: nextWidth });
    setStackFloor((f) => f + 1);
    onScoreChange(isPerfect ? 25 : 15);
    setMovingLeft(nextLeft > 50 ? 4 : 96 - nextWidth);
  };

  const visibleStack = [...towerHistory, baseBlock];

  return (
    <div
      onPointerDown={handleDropBlock}
      className="flex-1 flex flex-col items-center justify-between px-4 py-3 gap-2 bg-[#0e0f15] select-none cursor-pointer touch-none"
    >
      <div className="px-4 py-1 rounded-xl bg-amber-400 text-black font-black text-sm shadow">
        {stackFloor}층
      </div>

      <div className="relative flex-1 w-full max-w-sm rounded-3xl bg-[#191820] border-2 border-zinc-800/90 overflow-hidden flex flex-col justify-end p-4">
        <div
          className="h-11 rounded-md bg-[#f6f0dc] border-[3px] border-blue-600 shadow-lg mb-2 transition-none"
          style={{
            width: `${baseBlock.width}%`,
            marginLeft: `${movingLeft}%`,
          }}
        />

        <div className="flex flex-col-reverse gap-1 w-full">
          {visibleStack.map((blk, i) => (
            <div
              key={i}
              className="h-10 rounded-md bg-[#3c6df0] border-2 border-[#2952c8] shadow"
              style={{
                width: `${blk.width}%`,
                marginLeft: `${blk.left}%`,
              }}
            />
          ))}
        </div>
      </div>

      <p className="text-xs font-bold text-zinc-300">
        아래 블록과 딱 겹칠 때 탭!
      </p>
    </div>
  );
};