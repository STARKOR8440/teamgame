import React, { useEffect, useRef, useState } from 'react';

interface Props {
  gameId: string;
  onScoreChange: (delta: number) => void;
}

const PIANO_NOTES = [
  { key: 'C4', label: '도', freq: 261.63, dotClass: 'bg-rose-500' },
  { key: 'D4', label: '레', freq: 293.66, dotClass: 'bg-orange-400' },
  { key: 'E4', label: '미', freq: 329.63, dotClass: 'bg-yellow-400' },
  { key: 'F4', label: '파', freq: 349.23, dotClass: 'bg-emerald-400' },
  { key: 'G4', label: '솔', freq: 392.0, dotClass: 'bg-sky-400' },
  { key: 'A4', label: '라', freq: 440.0, dotClass: 'bg-indigo-500' },
  { key: 'B4', label: '시', freq: 493.88, dotClass: 'bg-purple-500' },
  { key: 'C5', label: '도', freq: 523.25, dotClass: 'bg-rose-500' },
] as const;

const JINGLE_BELLS_SEQ: number[] = [
  2, 2, 2, 2, 2, 2, 2, 4, 0, 1, 2,
  3, 3, 3, 3, 3, 2, 2, 2, 2, 1, 1, 2, 1, 4,
  2, 2, 2, 2, 2, 2, 2, 4, 0, 1, 2,
];

export const QuickTapGames: React.FC<Props> = ({ gameId, onScoreChange }) => {
  // 01. 연타왕
  const [tapCount, setTapCount] = useState(0);

  // 02. 흔들흔들
  const [shakePower, setShakePower] = useState(0);

  // 03. 문질문질
  const [rubDistance, setRubDistance] = useState(0);
  const [rubPos, setRubPos] = useState(50);
  const isRubbingRef = useRef(false);
  const lastRubXRef = useRef<number | null>(null);
  const pendingRubPxRef = useRef(0);
  const rubAreaRef = useRef<HTMLDivElement | null>(null);

  // 04. 두더지
  const [moles, setMoles] = useState<number[]>(Array(9).fill(0));
  const [caughtCount, setCaughtCount] = useState(0);
  const [missLocked, setMissLocked] = useState(false);
  const missLockTimerRef = useRef<number | null>(null);

  // 06. 피아노
  const [pianoIdx, setPianoIdx] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // 08. 박자왕
  const [beatActive, setBeatActive] = useState(false);
  const [beatCombo, setBeatCombo] = useState(0);

  // 17. 함성 대결
  const [shoutEnergy, setShoutEnergy] = useState(0);

  const playTone = (freq: number) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } catch {
      // 오디오 미지원 환경 무시
    }
  };

  useEffect(() => {
    setTapCount(0);
    setShakePower(0);
    setRubDistance(0);
    setRubPos(50);
    isRubbingRef.current = false;
    lastRubXRef.current = null;
    pendingRubPxRef.current = 0;
    setCaughtCount(0);
    setMissLocked(false);
    setPianoIdx(0);
    setBeatCombo(0);
    setShoutEnergy(0);
  }, [gameId]);

  useEffect(() => {
    if (gameId !== 'shake-it') return;
    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastZ: number | null = null;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;
      if (lastX !== null && lastY !== null && lastZ !== null) {
        const delta = Math.abs(acc.x - lastX) + Math.abs(acc.y - lastY) + Math.abs(acc.z - lastZ);
        if (delta > 8) {
          const gain = Math.min(25, Math.round(delta / 2));
          setShakePower((p) => p + gain);
          onScoreChange(gain);
        }
      }
      lastX = acc.x;
      lastY = acc.y;
      lastZ = acc.z;
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [gameId, onScoreChange]);

  useEffect(() => {
    if (gameId !== 'whack-mole') return;
    let tickCount = 0;
    let timeoutId: number;

    const spawn = () => {
      tickCount += 1;
      setMoles(
        Array.from({ length: 9 }, () => {
          const r = Math.random();
          if (r < 0.32) return 1;
          if (r < 0.4) return 2;
          return 0;
        })
      );
      const nextDelay = Math.max(380, 720 - tickCount * 12);
      timeoutId = window.setTimeout(spawn, nextDelay);
    };

    spawn();
    return () => {
      clearTimeout(timeoutId);
      if (missLockTimerRef.current) clearTimeout(missLockTimerRef.current);
    };
  }, [gameId]);

  useEffect(() => {
    if (gameId !== 'rhythm-king') return;
    const id = window.setInterval(() => {
      setBeatActive((prev) => !prev);
    }, 650);
    return () => clearInterval(id);
  }, [gameId]);

  // 01. 연타왕
  if (gameId === 'tap-king') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 bg-[#0e0f15] select-none touch-none">
        <div className="text-center space-y-1">
          <div className="text-xs font-bold text-blue-400">TAP KING</div>
          <div className="text-5xl font-black text-white font-mono">{tapCount}회</div>
          <p className="text-xs text-zinc-400">제한 시간 동안 버튼을 최대한 빠르게 연타하세요!</p>
        </div>
        <button
          type="button"
          onPointerDown={() => {
            setTapCount((c) => c + 1);
            onScoreChange(5);
          }}
          className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 active:scale-90 transition-transform shadow-2xl shadow-blue-500/40 border-4 border-blue-200/40 flex flex-col items-center justify-center text-white font-black text-2xl"
        >
          <span>연타!</span>
          <span className="text-xs font-normal text-blue-100 mt-1">TAP</span>
        </button>
      </div>
    );
  }

  // 02. 흔들흔들
  if (gameId === 'shake-it') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 bg-[#0e0f15] select-none touch-none">
        <div className="text-center space-y-1">
          <div className="text-xs font-bold text-pink-400">SHAKE IT</div>
          <div className="text-5xl font-black text-white font-mono">{shakePower}</div>
          <p className="text-xs text-zinc-400">폰을 흔들거나 아래 버튼을 빠르게 눌러 게이지를 채우세요!</p>
        </div>
        <div className="w-full max-w-xs h-4 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-150"
            style={{ width: `${Math.min(100, shakePower % 100)}%` }}
          />
        </div>
        <button
          type="button"
          onPointerDown={() => {
            setShakePower((p) => p + 12);
            onScoreChange(12);
          }}
          className="px-8 py-5 rounded-2xl bg-pink-600 active:bg-pink-500 active:scale-95 text-white font-black text-lg shadow-lg shadow-pink-600/30"
        >
          흔들기 부스트 (터치)
        </button>
      </div>
    );
  }

  // 03. 문질문질
  if (gameId === 'rub-rub') {
    const handleRubPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      isRubbingRef.current = true;
      lastRubXRef.current = e.clientX;

      if (rubAreaRef.current) {
        const rect = rubAreaRef.current.getBoundingClientRect();
        const pct = Math.max(8, Math.min(92, ((e.clientX - rect.left) / rect.width) * 100));
        setRubPos(pct);
      }
    };

    const handleRubPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isRubbingRef.current || lastRubXRef.current === null) return;

      const deltaX = Math.abs(e.clientX - lastRubXRef.current);
      lastRubXRef.current = e.clientX;

      if (rubAreaRef.current) {
        const rect = rubAreaRef.current.getBoundingClientRect();
        const pct = Math.max(8, Math.min(92, ((e.clientX - rect.left) / rect.width) * 100));
        setRubPos(pct);
      }

      if (deltaX > 0) {
        pendingRubPxRef.current += deltaX;
        setRubDistance((d) => d + Math.round(deltaX));

        if (pendingRubPxRef.current >= 45) {
          const gainedPts = Math.floor(pendingRubPxRef.current / 45) * 5;
          pendingRubPxRef.current %= 45;
          onScoreChange(gainedPts);
        }
      }
    };

    const handleRubPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      isRubbingRef.current = false;
      lastRubXRef.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    };

    const gaugePct = Math.min(100, (rubDistance % 1000) / 10);

    return (
      <div className="flex-1 flex flex-col items-center justify-between px-4 py-4 gap-3 bg-[#0e0f15] select-none">
        <div className="w-full max-w-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-orange-300">문지름 파워</span>
            <span className="font-mono text-amber-300">{rubDistance}px</span>
          </div>
          <div className="w-full h-3 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-300 transition-all duration-75"
              style={{ width: `${gaugePct}%` }}
            />
          </div>
        </div>

        <div
          ref={rubAreaRef}
          onPointerDown={handleRubPointerDown}
          onPointerMove={handleRubPointerMove}
          onPointerUp={handleRubPointerUp}
          onPointerCancel={handleRubPointerUp}
          className="relative flex-1 w-full max-w-sm rounded-3xl bg-[#181a24] border-2 border-orange-500/40 touch-none flex flex-col items-center justify-center overflow-hidden shadow-inner"
        >
          <div className="w-4/5 h-2 rounded-full bg-zinc-800 relative flex items-center">
            <div
              className="w-11 h-11 rounded-full bg-orange-400 border-4 border-white shadow-lg shadow-orange-500/40 -translate-x-1/2 flex items-center justify-center text-lg font-black text-black transition-transform duration-75"
              style={{ left: `${rubPos}%`, position: 'absolute' }}
            >
              ↔️
            </div>
          </div>

          <p className="mt-10 text-sm font-black text-zinc-100">
            손가락을 떼지 말고 좌우로 빠르게 문질러요!
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            터치한 채 왼쪽 ↔ 오른쪽으로 문지르면 점수가 쌓입니다
          </p>
        </div>
      </div>
    );
  }

  // 04. 두더지
  if (gameId === 'whack-mole') {
    const triggerMissLock = () => {
      setMissLocked(true);
      if (missLockTimerRef.current) clearTimeout(missLockTimerRef.current);
      missLockTimerRef.current = window.setTimeout(() => {
        setMissLocked(false);
      }, 500);
    };

    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-3 gap-3 bg-[#0e0f15] select-none touch-none">
        <div className="px-4 py-1 rounded-xl bg-amber-400 text-black font-black text-sm shadow">
          {caughtCount}마리
        </div>

        <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
          {moles.map((val, idx) => (
            <button
              key={idx}
              type="button"
              disabled={missLocked}
              onPointerDown={() => {
                if (missLocked) return;

                if (val === 1) {
                  setCaughtCount((c) => c + 1);
                  onScoreChange(10);
                  setMoles((prev) => prev.map((v, i) => (i === idx ? 0 : v)));
                } else if (val === 2) {
                  onScoreChange(-15);
                  setMoles((prev) => prev.map((v, i) => (i === idx ? 0 : v)));
                } else {
                  triggerMissLock();
                }
              }}
              className={`relative aspect-square rounded-full bg-[#241c16] border-[5px] border-[#3a3028] shadow-inner overflow-hidden flex items-end justify-center active:scale-95 transition-transform ${
                missLocked ? 'opacity-65 cursor-not-allowed' : ''
              }`}
            >
              <div className="absolute inset-2 rounded-full bg-[#140f0c] shadow-inner" />

              {val === 1 && (
                <div className="relative z-10 mb-1 flex flex-col items-center animate-bounce">
                  <div className="w-14 h-14 rounded-t-full bg-[#7c5335] border-2 border-[#3b2516] flex flex-col items-center justify-center pt-1 shadow-md">
                    <div className="flex gap-2 text-[10px] font-black text-white">
                      <span>•</span>
                      <span>•</span>
                    </div>
                    <div className="w-3.5 h-2.5 rounded-full bg-pink-400 mt-0.5" />
                    <div className="flex gap-0.5 mt-0.5">
                      <span className="w-1.5 h-2 bg-white rounded-b-sm" />
                      <span className="w-1.5 h-2 bg-white rounded-b-sm" />
                    </div>
                  </div>
                </div>
              )}

              {val === 2 && (
                <div className="relative z-10 mb-3 text-3xl select-none">💣</div>
              )}
            </button>
          ))}
        </div>

        <p className="text-xs font-bold text-zinc-300 mt-1">
          {missLocked ? '빈 구멍 터치! 0.5초 대기...' : '튀어나오면 바로 탭!'}
        </p>
      </div>
    );
  }

  // 06. 피아노
  if (gameId === 'piano-tiles') {
    const totalNotes = JINGLE_BELLS_SEQ.length;
    const currentNoteIdx = pianoIdx % totalNotes;
    const targetKeyIdx = JINGLE_BELLS_SEQ[currentNoteIdx];
    const upcomingNotes = Array.from({ length: 6 }, (_, offset) => {
      const seqPos = (currentNoteIdx + offset) % totalNotes;
      const kIdx = JINGLE_BELLS_SEQ[seqPos];
      return { seqPos, note: PIANO_NOTES[kIdx], isCurrent: offset === 0 };
    });

    const handleKeyPress = (pressedIdx: number) => {
      const pressedNote = PIANO_NOTES[pressedIdx];
      playTone(pressedNote.freq);

      if (pressedIdx === targetKeyIdx) {
        onScoreChange(10);
        setPianoIdx((prev) => prev + 1);
      } else {
        onScoreChange(-5);
      }
    };

    return (
      <div className="flex-1 flex flex-col justify-between p-3.5 gap-3 bg-[#0f1016] select-none touch-none">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-lg bg-amber-400 text-black font-black text-xs shadow">
            {pianoIdx} / {totalNotes}
          </span>
          <span className="text-xs font-black text-amber-300 flex items-center gap-1">
            🎵 징글벨
          </span>
        </div>

        <div className="w-full rounded-2xl bg-[#f3ead0] border-2 border-[#5c4628] p-3 relative overflow-hidden">
          <div className="relative h-24 flex items-center">
            <span className="text-4xl font-serif text-[#2b2115] select-none mr-2 z-10">𝄞</span>

            <div className="flex-1 relative h-20 flex flex-col justify-between py-2">
              {[0, 1, 2, 3, 4].map((line) => (
                <div key={line} className="w-full h-[1.5px] bg-[#7c6a4f]/70" />
              ))}

              <div className="absolute inset-0 flex items-center justify-around pl-2 pr-1">
                {upcomingNotes.map(({ seqPos, note, isCurrent }) => (
                  <div
                    key={`${seqPos}-${note.key}`}
                    className={`relative flex flex-col items-center transition-transform ${
                      isCurrent ? 'scale-110 z-10' : 'opacity-65'
                    }`}
                  >
                    <div
                      className={`w-7 h-5 rounded-full border-2 flex items-center justify-center ${
                        isCurrent
                          ? 'bg-amber-300 border-amber-600 ring-4 ring-amber-400/60'
                          : 'bg-amber-200/80 border-stone-600'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${note.dotClass}`} />
                    </div>
                    <div className="w-[2px] h-6 bg-stone-700 -mt-0.5 self-end mr-0.5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs font-bold text-zinc-200">
          금색 테두리 음표와 <span className="text-amber-400">같은 색 건반</span>을 눌러요
        </p>

        <div className="relative h-48 w-full rounded-2xl bg-[#2a1d12] p-2 border-2 border-[#4a3420] flex select-none overflow-hidden">
          {PIANO_NOTES.map((note, idx) => (
            <button
              key={`${note.key}-${idx}`}
              type="button"
              onPointerDown={() => handleKeyPress(idx)}
              className="relative flex-1 h-full bg-[#f7f2e4] hover:bg-amber-50 active:bg-amber-200 first:rounded-l-xl last:rounded-r-xl border-r border-stone-300 last:border-r-0 flex flex-col items-center justify-end pb-2.5 transition-colors"
            >
              <span className={`w-3.5 h-3.5 rounded-full ${note.dotClass} mb-1 shadow-sm`} />
              <span className="text-xs font-black text-stone-800">{note.label}</span>
            </button>
          ))}

          <div className="pointer-events-none absolute top-2 inset-x-2 h-24 flex">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const hasBlackKey = [0, 1, 3, 4, 5].includes(i);
              return (
                <div key={i} className="flex-1 flex justify-end">
                  {hasBlackKey && (
                    <div className="w-5 h-full bg-zinc-900 rounded-b-lg translate-x-1/2 z-10 shadow-md border-x border-b border-zinc-700" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 08. 박자왕
  if (gameId === 'rhythm-king') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 bg-[#0e0f15] select-none touch-none">
        <div className="text-center space-y-1">
          <div className="text-xs font-bold text-pink-400">RHYTHM KING · 콤보 {beatCombo}</div>
          <p className="text-xs text-zinc-400">네온 링이 밝게 빛날 때 맞춰서 탭하세요!</p>
        </div>
        <button
          type="button"
          onPointerDown={() => {
            if (beatActive) {
              setBeatCombo((c) => c + 1);
              onScoreChange(15);
            } else {
              setBeatCombo(0);
              onScoreChange(-10);
            }
          }}
          className={`w-44 h-44 rounded-full font-black text-xl transition-all flex flex-col items-center justify-center ${
            beatActive
              ? 'bg-pink-500 text-white scale-105 shadow-[0_0_40px_rgba(236,72,153,0.8)] border-4 border-pink-200'
              : 'bg-zinc-900 text-zinc-500 scale-95 border-2 border-zinc-700'
          }`}
        >
          <span>{beatActive ? '지금 탭!' : '기다려...'}</span>
          <span className="text-xs mt-1 opacity-80">{beatActive ? 'BEAT ON' : 'OFF'}</span>
        </button>
      </div>
    );
  }

  // 17. 함성 대결
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 bg-[#0e0f15] select-none touch-none">
      <div className="text-center space-y-1">
        <div className="text-xs font-bold text-orange-400">SHOUT BATTLE</div>
        <div className="text-5xl font-black text-amber-300 font-mono">{shoutEnergy}</div>
        <p className="text-xs text-zinc-400">함성을 지르거나 버튼을 연타해 열기를 끌어올리세요!</p>
      </div>
      <button
        type="button"
        onPointerDown={() => {
          setShoutEnergy((e) => e + 20);
          onScoreChange(20);
        }}
        className="w-48 h-48 rounded-full bg-gradient-to-tr from-orange-600 to-amber-400 active:scale-90 transition-transform text-black font-black text-2xl shadow-2xl shadow-orange-500/40 flex flex-col items-center justify-center"
      >
        <span>함성!</span>
        <span className="text-xs font-bold mt-1">SHOUT</span>
      </button>
    </div>
  );
};