import React, { useEffect, useState } from 'react';

interface Props {
  gameId: string;
  onScoreChange: (score: number) => void;
}

const WIRES = [
  { id: 'red', label: '빨간 선', color: 'bg-rose-500' },
  { id: 'blue', label: '파란 선', color: 'bg-sky-500' },
  { id: 'yellow', label: '노란 선', color: 'bg-yellow-400 text-black' },
  { id: 'green', label: '초록 선', color: 'bg-emerald-500' },
];

export const ActionArcadeGames: React.FC<Props> = ({ gameId, onScoreChange }) => {
  const [score, setScore] = useState(0);
  // 12. 줄 지우기
  const [grid, setGrid] = useState<number[]>(Array(16).fill(0));
  // 13. 폭탄 해체
  const [targetWire, setTargetWire] = useState(WIRES[0]);
  // 14 & 15. 레인 회피/주행 (0, 1, 2)
  const [lane, setLane] = useState(1);
  const [obstacleLane, setObstacleLane] = useState(0);
  // 16. 별잡기 (0~8)
  const [starIdx, setStarIdx] = useState(4);

  const addScore = (pts: number) => {
    setScore((prev) => {
      const next = Math.max(0, prev + pts);
      onScoreChange(next);
      return next;
    });
  };

  // 13. 폭탄 해체 문제 갱신
  useEffect(() => {
    if (gameId !== 'bomb-defuse') return;
    setTargetWire(WIRES[Math.floor(Math.random() * WIRES.length)]);
  }, [gameId, score]);

  // 14 & 15. 장애물 이동 루프
  useEffect(() => {
    if (gameId !== 'dodge-meteor' && gameId !== 'kart-race') return;
    const id = window.setInterval(() => {
      setObstacleLane((prev) => {
        const next = Math.floor(Math.random() * 3);
        if (prev !== lane) {
          addScore(10);
        } else {
          addScore(-10);
        }
        return next;
      });
    }, 700);
    return () => clearInterval(id);
  }, [gameId, lane]);

  if (gameId === 'line-clear') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-5 gap-4">
        <p className="text-xs text-zinc-400">한 줄(4칸)을 모두 채우면 줄이 지워지며 +30점!</p>
        <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
          {grid.map((v, idx) => (
            <button
              key={idx}
              onClick={() => {
                const next = [...grid];
                next[idx] = next[idx] ? 0 : 1;
                // 가로줄 체크
                for (let r = 0; r < 4; r++) {
                  const rowIndices = [r * 4, r * 4 + 1, r * 4 + 2, r * 4 + 3];
                  if (rowIndices.every((i) => next[i] === 1)) {
                    rowIndices.forEach((i) => (next[i] = 0));
                    addScore(30);
                  }
                }
                setGrid(next);
              }}
              className={`h-16 rounded-xl border ${
                v ? 'bg-violet-500 border-violet-300' : 'bg-zinc-900 border-zinc-800'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (gameId === 'bomb-defuse') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
        <div className="text-5xl">💣</div>
        <div className="text-xl font-black text-white">
          지시: <span className="text-yellow-300">"{targetWire.label}"</span>을 끊으세요!
        </div>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          {WIRES.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                if (w.id === targetWire.id) addScore(20);
                else addScore(-15);
              }}
              className={`py-4 rounded-2xl font-black text-white ${w.color} active:scale-95`}
            >
              ✂️ {w.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (gameId === 'dodge-meteor' || gameId === 'kart-race') {
    const isKart = gameId === 'kart-race';
    return (
      <div className="flex-1 flex flex-col justify-between p-5">
        <div className="text-center text-xs text-zinc-400">
          {isKart ? '🏎️ 장애물 차선을 피해 주행하세요!' : '🚀 떨어지는 운석을 피하세요!'}
        </div>
        <div className="grid grid-cols-3 gap-2 h-56 my-auto bg-zinc-900/70 rounded-2xl p-3 border border-zinc-800">
          {[0, 1, 2].map((l) => (
            <div key={l} className="flex flex-col items-center justify-between py-2 border-x border-dashed border-zinc-800">
              <div className="text-3xl">{obstacleLane === l ? (isKart ? '🚧' : '☄️') : ''}</div>
              <div className="text-4xl">{lane === l ? (isKart ? '🏎️' : '🚀') : ''}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setLane((l) => Math.max(0, l - 1))}
            className="py-4 rounded-2xl bg-zinc-800 text-white font-black text-lg active:bg-zinc-700"
          >
            ◀ 왼쪽
          </button>
          <button
            onClick={() => setLane((l) => Math.min(2, l + 1))}
            className="py-4 rounded-2xl bg-zinc-800 text-white font-black text-lg active:bg-zinc-700"
          >
            오른쪽 ▶
          </button>
        </div>
      </div>
    );
  }

  // 16. 한마음 별잡기
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-5 gap-4">
      <p className="text-xs text-zinc-400">반짝이는 별(⭐)을 빠르게 터치해 모으세요!</p>
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {Array.from({ length: 9 }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (idx === starIdx) {
                addScore(15);
                setStarIdx(Math.floor(Math.random() * 9));
              }
            }}
            className="h-24 rounded-2xl bg-[#191c28] border border-zinc-800 flex items-center justify-center text-4xl"
          >
            {idx === starIdx ? '⭐' : '✨'}
          </button>
        ))}
      </div>
    </div>
  );
};