import React, { useEffect, useRef, useState } from 'react';

interface Props {
  gameId: string;
  onScoreChange: (score: number) => void;
}

const CHOSEONG_BANK = [
  { cho: 'ㅅㄱㄹ', ans: '사과락' },
  { cho: 'ㅋㅍㅋ', ans: '커피콩' },
  { cho: 'ㅂㄹㅁ', ans: '볼링공' },
  { cho: 'ㅈㄱㅊ', ans: '자전거' },
  { cho: 'ㅎㄴㅂ', ans: '하늘별' },
];


export const BrainQuizGames: React.FC<Props> = ({ gameId, onScoreChange }) => {
  const scoreRef = useRef(0);
  const [tick, setTick] = useState(0);

  // 22. 숫자 사냥 (1~16)
  const [numBoard, setNumBoard] = useState<number[]>(() =>
    Array.from({ length: 16 }, (_, i) => i + 1).sort(() => Math.random() - 0.5)
  );
  const [nextNum, setNextNum] = useState(1);

  // 23. 반짝 기억
  const [litCells, setLitCells] = useState<number[]>([0, 5, 10]);
  const [pickedCells, setPickedCells] = useState<number[]>([]);

  // 24. 금고 열기 (비밀번호 1~50)
  const [secret, setSecret] = useState(() => Math.floor(Math.random() * 50) + 1);
  const [guessInput, setGuessInput] = useState('');
  const [hint, setHint] = useState('1 ~ 50 사이 숫자를 맞춰보세요!');

  const addScore = (pts: number) => {
    const next = Math.max(0, scoreRef.current + pts);
    scoreRef.current = next;
    onScoreChange(next);
    setTick((t) => t + 1);
  };

  // 23. 반짝 기억 패턴 갱신
  useEffect(() => {
    if (gameId !== 'flash-memory') return;
    const cells = Array.from({ length: 16 }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    setLitCells(cells);
    setPickedCells([]);
  }, [gameId, tick]);

  // 05. 가위바위보
  if (gameId === 'rps-command') {
    const cmds = ['이겨라!', '져라!', '비겨라!'];
    const cmd = cmds[tick % cmds.length];
    const aiHand = ['✊', '✌️', '🖐️'][tick % 3];
    const beats: Record<string, string> = { '✊': '🖐️', '✌️': '✊', '🖐️': '✌️' };
    const loses: Record<string, string> = { '✊': '✌️', '✌️': '🖐️', '🖐️': '✊' };

    const expected = cmd === '이겨라!' ? beats[aiHand] : cmd === '져라!' ? loses[aiHand] : aiHand;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
        <div className="text-xl font-black text-cyan-300">{cmd}</div>
        <div className="text-6xl">{aiHand}</div>
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {['✊', '✌️', '🖐️'].map((h) => (
            <button
              key={h}
              onClick={() => addScore(h === expected ? 15 : -10)}
              className="py-4 rounded-2xl bg-zinc-800 text-3xl active:scale-95"
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
    const a = ((tick * 7 + 3) % 19) + 1;
    const b = ((tick * 5 + 2) % 15) + 1;
    const sum = a + b;
    const isOdd = sum % 2 === 1;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <div className="text-4xl font-black text-white">
          {a} + {b} = ?
        </div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
          <button
            onClick={() => addScore(isOdd ? 15 : -10)}
            className="py-5 rounded-2xl bg-violet-600 text-white font-black text-xl"
          >
            홀수
          </button>
          <button
            onClick={() => addScore(!isOdd ? 15 : -10)}
            className="py-5 rounded-2xl bg-fuchsia-600 text-white font-black text-xl"
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
      { label: '🍎 사과', side: 'left' },
      { label: '🐶 강아지', side: 'right' },
      { label: '🍌 바나나', side: 'left' },
      { label: '🐱 고양이', side: 'right' },
    ];
    const cur = items[tick % items.length];
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <p className="text-xs text-zinc-400">과일은 왼쪽, 동물은 오른쪽!</p>
        <div className="text-3xl font-black text-white">{cur.label}</div>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <button
            onClick={() => addScore(cur.side === 'left' ? 15 : -10)}
            className="py-4 rounded-2xl bg-emerald-600 text-white font-black"
          >
            ◀ 왼쪽 (과일)
          </button>
          <button
            onClick={() => addScore(cur.side === 'right' ? 15 : -10)}
            className="py-4 rounded-2xl bg-teal-600 text-white font-black"
          >
            오른쪽 (동물) ▶
          </button>
        </div>
      </div>
    );
  }

  // 20. 색깔 풍선
  if (gameId === 'color-balloon') {
    const colors = [
      { name: '빨강', cls: 'bg-rose-500' },
      { name: '파랑', cls: 'bg-blue-500' },
      { name: '노랑', cls: 'bg-yellow-400 text-black' },
    ];
    const target = colors[tick % colors.length];
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
        <div className="text-lg font-black text-white">
          <span className="text-yellow-300">{target.name}</span> 풍선을 터뜨리세요!
        </div>
        <div className="flex gap-4">
          {colors.map((c) => (
            <button
              key={c.name}
              onClick={() => addScore(c.name === target.name ? 15 : -10)}
              className={`w-20 h-24 rounded-full font-black text-sm text-white ${c.cls} active:scale-90`}
            >
              🎈
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 21. 구구단 릴레이
  if (gameId === 'gugudan-relay') {
    const dan = ((tick * 3 + 2) % 8) + 2;
    const mul = ((tick * 4 + 1) % 8) + 2;
    const ans = dan * mul;
    const options = [ans, ans + 2, ans - 2, ans + dan].sort(() => Math.random() - 0.5);

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
        <div className="text-4xl font-black text-rose-300">
          {dan} × {mul} = ?
        </div>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => addScore(opt === ans ? 15 : -10)}
              className="py-4 rounded-2xl bg-zinc-800 text-white font-black text-xl"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 22. 숫자 사냥 (1~16)
  if (gameId === 'number-hunt') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-3">
        <div className="text-sm font-black text-emerald-300">다음 숫자: {nextNum} / 16</div>
        <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
          {numBoard.map((n) => (
            <button
              key={n}
              onClick={() => {
                if (n === nextNum) {
                  addScore(10);
                  if (nextNum === 16) {
                    setNextNum(1);
                    setNumBoard(Array.from({ length: 16 }, (_, i) => i + 1).sort(() => Math.random() - 0.5));
                  } else {
                    setNextNum(nextNum + 1);
                  }
                }
              }}
              className={`h-14 rounded-xl font-black text-base border ${
                n < nextNum
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-700 text-white'
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
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-3">
        <p className="text-xs text-zinc-400">빛나는 칸 3개를 모두 선택하세요!</p>
        <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
          {Array.from({ length: 16 }).map((_, idx) => {
            const isLit = litCells.includes(idx);
            const isPicked = pickedCells.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => {
                  if (isLit && !isPicked) {
                    const nextPicked = [...pickedCells, idx];
                    setPickedCells(nextPicked);
                    addScore(10);
                    if (nextPicked.length === litCells.length) {
                      addScore(20);
                    }
                  } else if (!isLit) {
                    addScore(-10);
                  }
                }}
                className={`h-14 rounded-xl border font-bold ${
                  isPicked
                    ? 'bg-violet-500 border-violet-300 text-white'
                    : isLit
                    ? 'bg-amber-300/30 border-amber-300 text-amber-200'
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                {isPicked ? '★' : isLit ? '✦' : ''}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 24. 금고 열기
  if (gameId === 'safe-crack') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 text-center">
        <div className="text-5xl">🔐</div>
        <div className="text-sm font-bold text-lime-300">{hint}</div>
        <div className="flex gap-2 max-w-xs w-full">
          <input
            type="number"
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            placeholder="숫자 입력"
            className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-center font-bold"
          />
          <button
            onClick={() => {
              const num = Number(guessInput);
              if (!num) return;
              if (num === secret) {
                addScore(50);
                setHint('🎉 금고 오픈! +50점 (새 비밀번호 생성됨)');
                setSecret(Math.floor(Math.random() * 50) + 1);
              } else if (num < secret) {
                setHint(`⬆️ UP! ${num}보다 큽니다`);
              } else {
                setHint(`⬇️ DOWN! ${num}보다 작습니다`);
              }
              setGuessInput('');
            }}
            className="px-4 py-2.5 rounded-xl bg-lime-400 text-black font-black"
          >
            입력
          </button>
        </div>
      </div>
    );
  }

  // 25. 다른 색 찾기
  if (gameId === 'find-diff-color') {
    const diffIdx = tick % 9;
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-5 gap-4">
        <p className="text-xs text-zinc-400">색이 살짝 다른 1칸을 찾으세요!</p>
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {Array.from({ length: 9 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => addScore(idx === diffIdx ? 15 : -10)}
              className={`h-24 rounded-2xl transition ${
                idx === diffIdx ? 'bg-pink-400/75' : 'bg-pink-500'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  // 26. 초성 퀴즈
  if (gameId === 'choseong-quiz') {
    const item = CHOSEONG_BANK[tick % CHOSEONG_BANK.length];
    const choices = [item.ans, '바다표범', '컴퓨터', '운동화'].sort(() => Math.random() - 0.5);
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
        <div className="text-4xl font-black tracking-widest text-cyan-300">{item.cho}</div>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          {choices.map((c) => (
            <button
              key={c}
              onClick={() => addScore(c === item.ans ? 20 : -10)}
              className="py-3.5 rounded-xl bg-zinc-800 text-white font-bold"
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    );
  }
};