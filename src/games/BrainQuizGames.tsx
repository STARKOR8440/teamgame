import React, { useEffect, useState } from 'react';

interface Props {
  gameId: string;
  onScoreChange: (delta: number) => void;
}

const BALLOON_COLORS = [
  { id: 'red', name: '빨강', fill: 'bg-rose-500', shadow: 'shadow-rose-500/30' },
  { id: 'blue', name: '파랑', fill: 'bg-sky-500', shadow: 'shadow-sky-500/30' },
  { id: 'yellow', name: '노랑', fill: 'bg-amber-400', shadow: 'shadow-amber-400/30' },
  { id: 'green', name: '초록', fill: 'bg-emerald-400', shadow: 'shadow-emerald-400/30' },
] as const;

const GUGUDAN_LIST = [
  { q: '7 × 8 = ?', a: 56 },
  { q: '9 × 6 = ?', a: 54 },
  { q: '8 × 8 = ?', a: 64 },
  { q: '6 × 7 = ?', a: 42 },
  { q: '9 × 9 = ?', a: 81 },
];

const CHOSEONG_BANK = [
  { cho: 'ㅅㄱㅇ', ans: '사과' },
  { cho: 'ㅂㄴㄴ', ans: '바나나' },
  { cho: 'ㅎㄹㅇ', ans: '호랑이' },
  { cho: 'ㅋㅍㅌ', ans: '컴퓨터' },
];

export const BrainQuizGames: React.FC<Props> = ({ gameId, onScoreChange }) => {
  const [tick, setTick] = useState(0);

  // 20. 색깔 풍선
  const [balloonCorrect, setBalloonCorrect] = useState(0);
  const [balloonRound, setBalloonRound] = useState(() => ({
    actualIdx: 3,
    textIdx: 2,
  }));

  // 22. 숫자 사냥
  const [nextNum, setNextNum] = useState(1);
  const [boardNums, setBoardNums] = useState<number[]>(() =>
    Array.from({ length: 16 }, (_, i) => i + 1).sort(() => Math.random() - 0.5)
  );

  // 23. 반짝 기억
  const [litCells, setLitCells] = useState<number[]>([0, 4, 8]);

  // 24. 금고 열기
  const [secretCode] = useState(() => Math.floor(Math.random() * 30) + 10);
  const [guessInput, setGuessInput] = useState('');
  const [hintText, setHintText] = useState('10~40 사이 숫자를 입력해 보세요!');

  useEffect(() => {
    setTick(0);
    setBalloonCorrect(0);
    setBalloonRound({ actualIdx: 3, textIdx: 2 });
    setNextNum(1);
    setBoardNums(Array.from({ length: 16 }, (_, i) => i + 1).sort(() => Math.random() - 0.5));
  }, [gameId]);

  useEffect(() => {
    if (gameId !== 'flash-memory') return;
    const id = window.setInterval(() => {
      const picks = [0, 1, 2, 3, 4, 5, 6, 7, 8]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      setLitCells(picks);
    }, 1800);
    return () => clearInterval(id);
  }, [gameId]);

  // 05. 가위바위보
  if (gameId === 'rps-command') {
    const commands = ['이겨라', '져라', '비겨라'] as const;
    const hands = ['가위', '바위', '보'] as const;
    const cmd = commands[tick % commands.length];
    const enemyHand = hands[(tick + 1) % hands.length];

    const isWinChoice = (myHand: string) => {
      const beats: Record<string, string> = { 가위: '보', 바위: '가위', 보: '바위' };
      if (cmd === '이겨라') return beats[myHand] === enemyHand;
      if (cmd === '져라') return beats[enemyHand] === myHand;
      return myHand === enemyHand;
    };

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5 bg-[#0e0f15] select-none touch-none">
        <div className="text-center space-y-1">
          <div className="text-2xl font-black text-cyan-300">지시: {cmd}!</div>
          <div className="text-sm text-zinc-300">상대 손: {enemyHand}</div>
        </div>
        <div className="flex gap-3">
          {hands.map((h) => (
            <button
              key={h}
              type="button"
              onPointerDown={() => {
                onScoreChange(isWinChoice(h) ? 15 : -10);
                setTick((t) => t + 1);
              }}
              className="px-6 py-4 rounded-2xl bg-zinc-800 active:bg-cyan-600 text-white font-black text-lg"
            >
              {h}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 18. 홀짝 계산기
  if (gameId === 'odd-even') {
    const a = ((tick * 3 + 4) % 9) + 1;
    const b = ((tick * 5 + 2) % 9) + 1;
    const isEven = (a + b) % 2 === 0;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 bg-[#0e0f15] select-none touch-none">
        <div className="text-4xl font-black text-white font-mono">
          {a} + {b} = ?
        </div>
        <div className="flex gap-4 w-full max-w-xs">
          <button
            type="button"
            onPointerDown={() => {
              onScoreChange(!isEven ? 15 : -10);
              setTick((t) => t + 1);
            }}
            className="flex-1 py-5 rounded-2xl bg-violet-600 active:bg-violet-500 text-white font-black text-xl"
          >
            홀수
          </button>
          <button
            type="button"
            onPointerDown={() => {
              onScoreChange(isEven ? 15 : -10);
              setTick((t) => t + 1);
            }}
            className="flex-1 py-5 rounded-2xl bg-indigo-600 active:bg-indigo-500 text-white font-black text-xl"
          >
            짝수
          </button>
        </div>
      </div>
    );
  }

  // 19. 왼쪽 오른쪽
  if (gameId === 'left-right') {
    const items = [
      { icon: '🍎', isFruit: true },
      { icon: '🐶', isFruit: false },
      { icon: '🍌', isFruit: true },
      { icon: '🐱', isFruit: false },
    ];
    const current = items[tick % items.length];

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 bg-[#0e0f15] select-none touch-none">
        <div className="text-6xl">{current.icon}</div>
        <p className="text-xs text-zinc-400">과일 = 왼쪽 / 동물 = 오른쪽</p>
        <div className="flex gap-4 w-full max-w-xs">
          <button
            type="button"
            onPointerDown={() => {
              onScoreChange(current.isFruit ? 15 : -10);
              setTick((t) => t + 1);
            }}
            className="flex-1 py-4 rounded-2xl bg-emerald-600 active:bg-emerald-500 text-white font-black"
          >
            ◀ 왼쪽 (과일)
          </button>
          <button
            type="button"
            onPointerDown={() => {
              onScoreChange(!current.isFruit ? 15 : -10);
              setTick((t) => t + 1);
            }}
            className="flex-1 py-4 rounded-2xl bg-amber-600 active:bg-amber-500 text-white font-black"
          >
            오른쪽 (동물) ▶
          </button>
        </div>
      </div>
    );
  }

  // 20. 색깔 풍선
  if (gameId === 'color-balloon') {
    const actualColor = BALLOON_COLORS[balloonRound.actualIdx];
    const trapText = BALLOON_COLORS[balloonRound.textIdx].name;

    const nextBalloon = () => {
      const nextActual = Math.floor(Math.random() * 4);
      let nextText = Math.floor(Math.random() * 4);
      if (nextText === nextActual && Math.random() < 0.8) {
        nextText = (nextActual + 1) % 4;
      }
      setBalloonRound({ actualIdx: nextActual, textIdx: nextText });
    };

    return (
      <div className="flex-1 flex flex-col justify-between p-4 gap-3 bg-[#0e0f15] select-none touch-none">
        <div className="flex justify-center">
          <span className="px-4 py-1 rounded-xl bg-amber-400 text-black font-black text-sm shadow">
            정답 {balloonCorrect}개
          </span>
        </div>

        <div className="flex-1 rounded-3xl bg-[#191820] border-2 border-zinc-800 flex flex-col items-center justify-center p-5 gap-3">
          <div className="relative flex flex-col items-center">
            <div
              className={`w-36 h-44 rounded-full ${actualColor.fill} border-4 border-zinc-950 shadow-xl ${actualColor.shadow} relative flex items-center justify-center transition-colors`}
            >
              <div className="absolute top-6 left-7 w-7 h-7 rounded-full bg-white/45" />
              <span
                className="text-3xl font-black text-white tracking-tight select-none"
                style={{
                  textShadow:
                    '-2px -2px 0 #111, 2px -2px 0 #111, -2px 2px 0 #111, 2px 2px 0 #111',
                }}
              >
                {trapText}
              </span>
            </div>
            <div className="w-[3px] h-4 bg-stone-400 rounded-b" />
          </div>

          <p className="text-xs font-extrabold text-zinc-200 mt-1">
            풍선 색깔은? (글자 말고!)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {BALLOON_COLORS.map((c, idx) => (
            <button
              key={c.id}
              type="button"
              onPointerDown={() => {
                if (idx === balloonRound.actualIdx) {
                  setBalloonCorrect((prev) => prev + 1);
                  onScoreChange(15);
                } else {
                  onScoreChange(-10);
                }
                nextBalloon();
              }}
              className="py-6 rounded-2xl bg-[#1c1b24] hover:bg-[#252430] active:scale-95 border-2 border-zinc-800 text-white font-black text-xl transition"
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 21. 구구단 릴레이
  if (gameId === 'gugudan-relay') {
    const item = GUGUDAN_LIST[tick % GUGUDAN_LIST.length];
    const options = [item.a, item.a + 6, item.a - 4, item.a + 12].sort(() => Math.random() - 0.5);

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5 bg-[#0e0f15] select-none touch-none">
        <div className="text-3xl font-black text-rose-300 font-mono">{item.q}</div>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onPointerDown={() => {
                onScoreChange(opt === item.a ? 15 : -10);
                setTick((t) => t + 1);
              }}
              className="py-4 rounded-2xl bg-zinc-800 active:bg-rose-600 text-white font-black text-xl font-mono"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 22. 숫자 사냥
  if (gameId === 'number-hunt') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-3 bg-[#0e0f15] select-none touch-none">
        <div className="text-sm font-black text-emerald-300">다음 숫자: {nextNum} (1~16)</div>
        <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
          {boardNums.map((n) => (
            <button
              key={n}
              type="button"
              onPointerDown={() => {
                if (n === nextNum) {
                  onScoreChange(10);
                  if (nextNum === 16) {
                    setNextNum(1);
                    setBoardNums(
                      Array.from({ length: 16 }, (_, i) => i + 1).sort(() => Math.random() - 0.5)
                    );
                  } else {
                    setNextNum((x) => x + 1);
                  }
                } else {
                  onScoreChange(-5);
                }
              }}
              className={`aspect-square rounded-xl font-black text-base font-mono ${
                n < nextNum
                  ? 'bg-emerald-950/60 text-emerald-500 border border-emerald-700/40'
                  : 'bg-zinc-800 active:bg-zinc-700 text-white'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 23. 반짝 기억
  if (gameId === 'flash-memory') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-3 bg-[#0e0f15] select-none touch-none">
        <div className="text-xs font-bold text-violet-300">빛났던 칸을 기억해서 누르세요!</div>
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs">
          {Array.from({ length: 9 }).map((_, idx) => {
            const isLit = litCells.includes(idx);
            return (
              <button
                key={idx}
                type="button"
                onPointerDown={() => onScoreChange(isLit ? 15 : -10)}
                className={`aspect-square rounded-2xl border transition-all ${
                  isLit
                    ? 'bg-violet-500 border-violet-200 shadow-lg shadow-violet-500/40'
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // 24. 금고 열기
  if (gameId === 'safe-crack') {
    const handleGuess = () => {
      const num = Number(guessInput);
      if (!num) return;
      if (num === secretCode) {
        setHintText(`정답! (${secretCode}) +50점`);
        onScoreChange(50);
      } else if (num < secretCode) {
        setHintText(`${num} 보다 UP! (더 큰 수)`);
        onScoreChange(-5);
      } else {
        setHintText(`${num} 보다 DOWN! (더 작은 수)`);
        onScoreChange(-5);
      }
      setGuessInput('');
    };

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 bg-[#0e0f15]">
        <div className="text-sm font-black text-lime-300">{hintText}</div>
        <div className="flex gap-2 w-full max-w-xs">
          <input
            type="number"
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            placeholder="숫자 입력"
            className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-center"
          />
          <button
            type="button"
            onClick={handleGuess}
            className="px-5 py-3 rounded-xl bg-lime-500 text-black font-black"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  // 25. 다른 색 찾기
  if (gameId === 'find-diff-color') {
    const diffIdx = tick % 9;
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-3 bg-[#0e0f15] select-none touch-none">
        <div className="text-xs font-bold text-pink-300">색이 살짝 다른 1칸을 찾으세요!</div>
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs">
          {Array.from({ length: 9 }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onPointerDown={() => {
                onScoreChange(idx === diffIdx ? 15 : -10);
                setTick((t) => t + 1);
              }}
              className={`aspect-square rounded-2xl ${
                idx === diffIdx ? 'bg-pink-400' : 'bg-pink-600'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  // 26. 초성 퀴즈
  const item = CHOSEONG_BANK[tick % CHOSEONG_BANK.length];
  const choices = [item.ans, '바다표범', '컴퓨터', '운동화'].sort(() => Math.random() - 0.5);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5 bg-[#0e0f15] select-none touch-none">
      <div className="text-4xl font-black tracking-widest text-cyan-300">{item.cho}</div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {choices.map((c) => (
          <button
            key={c}
            type="button"
            onPointerDown={() => {
              onScoreChange(c === item.ans ? 20 : -10);
              setTick((t) => t + 1);
            }}
            className="py-3.5 rounded-xl bg-zinc-800 active:bg-cyan-600 text-white font-bold"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
};