import React, { useEffect, useRef, useState } from 'react';

interface Props {
  gameId: string;
  onScoreChange: (delta: number) => void;
}

interface MeteorItem {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
}

const LINE_COLS = 8;
const LINE_ROWS = 13;

type PieceDef = {
  cells: Array<[number, number]>;
  colorClass: string;
};

const LINE_PIECES: PieceDef[] = [
  {
    cells: [
      [0, 0],
      [0, 1],
      [1, -1],
      [1, 0],
    ],
    colorClass: 'bg-emerald-400 border-emerald-200',
  },
  {
    cells: [
      [0, 0],
      [1, -1],
      [1, 0],
      [1, 1],
    ],
    colorClass: 'bg-sky-400 border-sky-200',
  },
  {
    cells: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    colorClass: 'bg-amber-400 border-amber-200',
  },
  {
    cells: [
      [0, -1],
      [0, 0],
      [0, 1],
    ],
    colorClass: 'bg-violet-400 border-violet-200',
  },
];

const createInitialLineBoard = () => {
  const initial = Array.from({ length: LINE_ROWS }, () =>
    Array<string | null>(LINE_COLS).fill(null)
  );
  for (let r = LINE_ROWS - 5; r < LINE_ROWS; r++) {
    for (let c = 0; c < LINE_COLS; c++) {
      if ((r + c) % 4 !== 0) {
        initial[r][c] = 'bg-slate-500/80 border-slate-400';
      }
    }
  }
  return initial;
};

export const ActionArcadeGames: React.FC<Props> = ({ gameId, onScoreChange }) => {
  // 12. 줄 지우기
  const [clearedLines, setClearedLines] = useState(0);
  const [lineBoard, setLineBoard] = useState<Array<Array<string | null>>>(() =>
    createInitialLineBoard()
  );
  const [pieceRow, setPieceRow] = useState(1);
  const [pieceCol, setPieceCol] = useState(3);
  const [pieceCells, setPieceCells] = useState<Array<[number, number]>>(LINE_PIECES[0].cells);
  const [pieceColor, setPieceColor] = useState<string>(LINE_PIECES[0].colorClass);
  const [nextPieceIdx, setNextPieceIdx] = useState(2);

  // 13. 폭탄 해체
  const [targetWire, setTargetWire] = useState<'red' | 'blue' | 'yellow' | 'green'>('red');

  // 14. 장애물 피하기
  const [shipX, setShipX] = useState(50);
  const [meteors, setMeteors] = useState<MeteorItem[]>([]);
  const [nearMissVisible, setNearMissVisible] = useState(false);
  const shipXRef = useRef(50);
  const nearMissTimerRef = useRef<number | null>(null);
  const meteorAreaRef = useRef<HTMLDivElement | null>(null);

  // 15. 카트 레이스
  const [kartLane, setKartLane] = useState<0 | 1 | 2>(1);
  const [obstacleLane, setObstacleLane] = useState<0 | 1 | 2>(0);

  // 16. 한마음 별잡기
  const [starPos, setStarPos] = useState(4);

  useEffect(() => {
    shipXRef.current = shipX;
  }, [shipX]);

  useEffect(() => {
    setClearedLines(0);
    setLineBoard(createInitialLineBoard());
    setPieceRow(1);
    setPieceCol(3);
    setPieceCells(LINE_PIECES[0].cells.map(([r, c]) => [r, c]));
    setPieceColor(LINE_PIECES[0].colorClass);
    setNextPieceIdx(2);
    setShipX(50);
    shipXRef.current = 50;
    setMeteors([]);
    setNearMissVisible(false);
  }, [gameId]);

  const canPlacePiece = (
    board: Array<Array<string | null>>,
    cells: Array<[number, number]>,
    targetRow: number,
    targetCol: number
  ) => {
    return cells.every(([dr, dc]) => {
      const r = targetRow + dr;
      const c = targetCol + dc;
      if (c < 0 || c >= LINE_COLS || r >= LINE_ROWS) return false;
      if (r >= 0 && board[r][c] !== null) return false;
      return true;
    });
  };

  const spawnNextPiece = (nextIdx: number) => {
    const def = LINE_PIECES[nextIdx % LINE_PIECES.length];
    const upcoming = (nextIdx + 1) % LINE_PIECES.length;
    setPieceRow(1);
    setPieceCol(3);
    setPieceCells(def.cells.map(([r, c]) => [r, c]));
    setPieceColor(def.colorClass);
    setNextPieceIdx(upcoming);
  };

  const lockPieceAt = (
    board: Array<Array<string | null>>,
    cells: Array<[number, number]>,
    rPos: number,
    cPos: number,
    color: string,
    upcomingIdx: number
  ) => {
    const nextBoard = board.map((row) => [...row]);
    let overflowed = false;

    cells.forEach(([dr, dc]) => {
      const r = rPos + dr;
      const c = cPos + dc;
      if (r < 0) {
        overflowed = true;
      } else if (r < LINE_ROWS && c >= 0 && c < LINE_COLS) {
        nextBoard[r][c] = color;
      }
    });

    const remainingRows = nextBoard.filter((row) => row.some((cell) => cell === null));
    const removedCount = LINE_ROWS - remainingRows.length;

    if (removedCount > 0) {
      const emptyRows = Array.from({ length: removedCount }, () =>
        Array<string | null>(LINE_COLS).fill(null)
      );
      setLineBoard([...emptyRows, ...remainingRows]);
      setClearedLines((prev) => prev + removedCount);
      onScoreChange(removedCount * 35);
    } else if (overflowed) {
      const resetBoard = Array.from({ length: LINE_ROWS }, (_, r) =>
        Array.from({ length: LINE_COLS }, (__, c) =>
          r >= LINE_ROWS - 3 && (r + c) % 3 !== 0 ? 'bg-slate-500/80 border-slate-400' : null
        )
      );
      setLineBoard(resetBoard);
      onScoreChange(-10);
    } else {
      setLineBoard(nextBoard);
      onScoreChange(5);
    }

    spawnNextPiece(upcomingIdx);
  };

  useEffect(() => {
    if (gameId !== 'line-clear') return;
    const timer = window.setInterval(() => {
      setPieceRow((prevRow) => {
        if (canPlacePiece(lineBoard, pieceCells, prevRow + 1, pieceCol)) {
          return prevRow + 1;
        }
        lockPieceAt(lineBoard, pieceCells, prevRow, pieceCol, pieceColor, nextPieceIdx);
        return 1;
      });
    }, 520);

    return () => clearInterval(timer);
  }, [gameId, lineBoard, pieceCells, pieceCol, pieceColor, nextPieceIdx]);

  useEffect(() => {
    if (gameId !== 'bomb-defuse') return;
    const wires: Array<'red' | 'blue' | 'yellow' | 'green'> = ['red', 'blue', 'yellow', 'green'];
    const id = window.setInterval(() => {
      setTargetWire(wires[Math.floor(Math.random() * wires.length)]);
    }, 1800);
    return () => clearInterval(id);
  }, [gameId]);

  useEffect(() => {
    if (gameId !== 'dodge-meteor') return;
    let nextId = 1;
    let frameCount = 0;

    const timer = window.setInterval(() => {
      frameCount += 1;
      const areaHeight = meteorAreaRef.current?.clientHeight ?? 420;
      const shipY = areaHeight - 72;

      setMeteors((prev) => {
        const spawned = [...prev];
        if (frameCount % 16 === 0) {
          spawned.push({
            id: nextId++,
            x: 12 + Math.random() * 76,
            y: -28,
            size: 36 + Math.floor(Math.random() * 14),
            speed: 5.5 + Math.random() * 3,
          });
        }

        const updated: MeteorItem[] = [];
        for (const m of spawned) {
          const ny = m.y + m.speed;
          const dx = Math.abs(m.x - shipXRef.current);
          const dy = Math.abs(ny - shipY);

          if (dx < 11 && dy < 34) {
            onScoreChange(-15);
            continue;
          }

          if (dx < 19 && dy < 38) {
            onScoreChange(15);
            setNearMissVisible(true);
            if (nearMissTimerRef.current) clearTimeout(nearMissTimerRef.current);
            nearMissTimerRef.current = window.setTimeout(() => {
              setNearMissVisible(false);
            }, 550);
          }

          if (ny > areaHeight + 36) {
            onScoreChange(10);
          } else {
            updated.push({ ...m, y: ny });
          }
        }
        return updated;
      });
    }, 50);

    return () => {
      clearInterval(timer);
      if (nearMissTimerRef.current) clearTimeout(nearMissTimerRef.current);
    };
  }, [gameId, onScoreChange]);

  useEffect(() => {
    if (gameId !== 'kart-race') return;
    const id = window.setInterval(() => {
      const nextObs = Math.floor(Math.random() * 3) as 0 | 1 | 2;
      setObstacleLane(nextObs);
      setKartLane((curr) => {
        onScoreChange(curr === nextObs ? -10 : 12);
        return curr;
      });
    }, 950);
    return () => clearInterval(id);
  }, [gameId, onScoreChange]);

  useEffect(() => {
    if (gameId !== 'star-catch') return;
    const id = window.setInterval(() => {
      setStarPos(Math.floor(Math.random() * 9));
    }, 850);
    return () => clearInterval(id);
  }, [gameId]);

  // 12. 줄 지우기
  if (gameId === 'line-clear') {
    const moveHorizontal = (deltaCol: number) => {
      const targetCol = pieceCol + deltaCol;
      if (canPlacePiece(lineBoard, pieceCells, pieceRow, targetCol)) {
        setPieceCol(targetCol);
      }
    };

    const rotatePiece = () => {
      const rotated = pieceCells.map(([dr, dc]): [number, number] => [dc, -dr]);
      if (canPlacePiece(lineBoard, rotated, pieceRow, pieceCol)) {
        setPieceCells(rotated);
      } else if (canPlacePiece(lineBoard, rotated, pieceRow, pieceCol - 1)) {
        setPieceCol((c) => c - 1);
        setPieceCells(rotated);
      } else if (canPlacePiece(lineBoard, rotated, pieceRow, pieceCol + 1)) {
        setPieceCol((c) => c + 1);
        setPieceCells(rotated);
      }
    };

    const hardDrop = () => {
      let dropRow = pieceRow;
      while (canPlacePiece(lineBoard, pieceCells, dropRow + 1, pieceCol)) {
        dropRow += 1;
      }
      lockPieceAt(lineBoard, pieceCells, dropRow, pieceCol, pieceColor, nextPieceIdx);
    };

    let ghostRow = pieceRow;
    while (canPlacePiece(lineBoard, pieceCells, ghostRow + 1, pieceCol)) {
      ghostRow += 1;
    }

    const activeMap = new Set(pieceCells.map(([dr, dc]) => `${pieceRow + dr}:${pieceCol + dc}`));
    const ghostMap = new Set(pieceCells.map(([dr, dc]) => `${ghostRow + dr}:${pieceCol + dc}`));
    const nextDef = LINE_PIECES[nextPieceIdx % LINE_PIECES.length];
    const nextSet = new Set(nextDef.cells.map(([dr, dc]) => `${dr + 1}:${dc + 1}`));

    return (
      <div className="flex-1 flex flex-col justify-between px-3.5 py-2.5 gap-2.5 bg-[#0e0f15] select-none touch-none">
        <div className="flex items-center justify-center gap-3">
          <div className="px-3.5 py-1 rounded-xl bg-amber-400 text-black font-black text-sm shadow">
            {clearedLines}줄
          </div>

          <div className="px-3 py-1 rounded-xl bg-[#191a24] border border-zinc-800 flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-400">다음</span>
            <div className="grid grid-cols-3 gap-0.5">
              {[0, 1, 2].map((r) =>
                [0, 1, 2].map((c) => (
                  <div
                    key={`${r}-${c}`}
                    className={`w-2.5 h-2.5 rounded-[2px] ${
                      nextSet.has(`${r}:${c}`) ? nextDef.colorClass : 'bg-zinc-900'
                    }`}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center min-h-0">
          <div
            className="h-full max-h-[430px] aspect-[8/13] rounded-2xl bg-[#181922] border-2 border-zinc-800 p-1.5 grid gap-0.5"
            style={{
              gridTemplateColumns: `repeat(${LINE_COLS}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${LINE_ROWS}, minmax(0, 1fr))`,
            }}
          >
            {lineBoard.map((row, r) =>
              row.map((cell, c) => {
                const key = `${r}:${c}`;
                const isActive = activeMap.has(key);
                const isGhost = !isActive && ghostMap.has(key);

                let cellStyle = 'bg-[#212330]/70 border-zinc-800/40';
                if (isActive) {
                  cellStyle = `${pieceColor} shadow-sm`;
                } else if (isGhost) {
                  cellStyle = 'bg-white/10 border border-dashed border-white/30';
                } else if (cell) {
                  cellStyle = `${cell}`;
                }

                return <div key={key} className={`rounded-[4px] border ${cellStyle}`} />;
              })
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 w-full max-w-md mx-auto">
          <button
            type="button"
            onPointerDown={() => moveHorizontal(-1)}
            className="py-3.5 rounded-2xl bg-[#1d1f2b] active:bg-zinc-700 border border-zinc-700/80 text-white font-black text-lg flex items-center justify-center"
            aria-label="왼쪽 이동"
          >
            ◀
          </button>
          <button
            type="button"
            onPointerDown={() => moveHorizontal(1)}
            className="py-3.5 rounded-2xl bg-[#1d1f2b] active:bg-zinc-700 border border-zinc-700/80 text-white font-black text-lg flex items-center justify-center"
            aria-label="오른쪽 이동"
          >
            ▶
          </button>
          <button
            type="button"
            onPointerDown={rotatePiece}
            className="py-3.5 rounded-2xl bg-[#1d1f2b] active:bg-zinc-700 border border-zinc-700/80 text-white font-black text-lg flex items-center justify-center"
            aria-label="회전"
          >
            ↻
          </button>
          <button
            type="button"
            onPointerDown={hardDrop}
            className="py-3.5 rounded-2xl bg-amber-400 active:bg-amber-300 text-black font-black text-lg flex items-center justify-center shadow"
            aria-label="바로 내리기"
          >
            ⬇
          </button>
        </div>
      </div>
    );
  }

  // 13. 폭탄 해체
  if (gameId === 'bomb-defuse') {
    const wireMap = {
      red: { label: '빨강 전선', cls: 'bg-rose-600' },
      blue: { label: '파랑 전선', cls: 'bg-blue-600' },
      yellow: { label: '노랑 전선', cls: 'bg-amber-500 text-black' },
      green: { label: '초록 전선', cls: 'bg-emerald-600' },
    };

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5 bg-[#0e0f15] select-none touch-none">
        <div className="text-center space-y-1">
          <div className="text-xs font-bold text-orange-400">BOMB DEFUSE</div>
          <div className="text-2xl font-black text-white">
            목표: <span className="text-amber-300">{wireMap[targetWire].label}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          {(Object.keys(wireMap) as Array<'red' | 'blue' | 'yellow' | 'green'>).map((w) => (
            <button
              key={w}
              type="button"
              onPointerDown={() => onScoreChange(w === targetWire ? 20 : -15)}
              className={`py-5 rounded-2xl font-black text-white shadow-lg active:scale-95 ${wireMap[w].cls}`}
            >
              {wireMap[w].label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 14. 장애물 피하기
  if (gameId === 'dodge-meteor') {
    const updateShipFromClientX = (clientX: number) => {
      if (!meteorAreaRef.current) return;
      const rect = meteorAreaRef.current.getBoundingClientRect();
      const pct = Math.max(10, Math.min(90, ((clientX - rect.left) / rect.width) * 100));
      setShipX(pct);
      shipXRef.current = pct;
    };

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-3 bg-[#0b0a12] select-none">
        <div
          ref={meteorAreaRef}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            updateShipFromClientX(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1 || e.pointerType === 'touch') {
              updateShipFromClientX(e.clientX);
            }
          }}
          className="relative w-full max-w-md h-[450px] rounded-3xl bg-gradient-to-b from-[#161229] via-[#1c1636] to-[#110e20] border-2 border-indigo-500/30 overflow-hidden touch-none"
        >
          <div className="absolute left-[14%] top-0 bottom-0 w-24 bg-rose-500/15 border-x border-rose-400/20 flex flex-col items-center pt-5 pointer-events-none">
            <span className="text-3xl drop-shadow">⚠️</span>
          </div>

          {nearMissVisible && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <span
                className="text-3xl font-black text-emerald-400 tracking-tight animate-bounce"
                style={{
                  textShadow: '-2px -2px 0 #052e16, 2px -2px 0 #052e16, -2px 2px 0 #052e16, 2px 2px 0 #052e16',
                }}
              >
                아슬아슬!
              </span>
            </div>
          )}

          {meteors.map((m) => (
            <div
              key={m.id}
              style={{
                left: `${m.x}%`,
                top: `${m.y}px`,
                width: `${m.size}px`,
                height: `${m.size}px`,
              }}
              className="absolute -translate-x-1/2 rounded-full bg-gradient-to-br from-[#c9966b] to-[#8a5a36] border-2 border-[#4a2e19] shadow-lg flex items-center justify-center pointer-events-none"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#6b4226]/70 -translate-x-1 -translate-y-1" />
              <span className="w-2 h-2 rounded-full bg-[#6b4226]/60 translate-x-1.5 translate-y-1" />
            </div>
          ))}

          <div
            style={{ left: `${shipX}%` }}
            className="absolute bottom-6 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-transform duration-75"
          >
            <div className="w-6 h-9 rounded-t-full bg-gradient-to-t from-blue-600 via-sky-400 to-white border-2 border-slate-900 relative flex items-center justify-center shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-200 border border-slate-800 -mt-1" />
              <span className="absolute -left-2.5 bottom-0.5 w-2.5 h-4 bg-blue-500 rounded-tl-lg border border-slate-900" />
              <span className="absolute -right-2.5 bottom-0.5 w-2.5 h-4 bg-blue-500 rounded-tr-lg border border-slate-900" />
            </div>
            <div className="w-3 h-4 bg-gradient-to-b from-amber-300 via-orange-500 to-transparent rounded-b-full -mt-0.5" />
          </div>
        </div>
      </div>
    );
  }

  // 15. 카트 레이스
  if (gameId === 'kart-race') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5 bg-[#0e0f15] select-none touch-none">
        <div className="text-xs font-bold text-rose-400">KART RACE · 장애물 차선: {obstacleLane + 1}번</div>
        <div className="grid grid-cols-3 gap-2 w-full max-w-xs h-48 bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
          {[0, 1, 2].map((lane) => (
            <div
              key={lane}
              className="rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col justify-between items-center py-3"
            >
              <span className="text-2xl">{obstacleLane === lane ? '🚧' : ''}</span>
              <span className="text-3xl">{kartLane === lane ? '🏎️' : ''}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onPointerDown={() => setKartLane((l) => (l > 0 ? ((l - 1) as 0 | 1 | 2) : 0))}
            className="px-6 py-3.5 rounded-2xl bg-zinc-800 text-white font-black"
          >
            ◀ 좌측
          </button>
          <button
            type="button"
            onPointerDown={() => setKartLane((l) => (l < 2 ? ((l + 1) as 0 | 1 | 2) : 2))}
            className="px-6 py-3.5 rounded-2xl bg-zinc-800 text-white font-black"
          >
            우측 ▶
          </button>
        </div>
      </div>
    );
  }

  // 16. 한마음 별잡기
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 bg-[#0e0f15] select-none touch-none">
      <div className="text-xs font-bold text-amber-400">STAR CATCH · 별을 빠르게 터치하세요!</div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {Array.from({ length: 9 }).map((_, idx) => (
          <button
            key={idx}
            type="button"
            onPointerDown={() => {
              if (idx === starPos) {
                onScoreChange(15);
                setStarPos((idx + 3) % 9);
              } else {
                onScoreChange(-5);
              }
            }}
            className="aspect-square rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl active:scale-95"
          >
            {idx === starPos ? '⭐' : ''}
          </button>
        ))}
      </div>
    </div>
  );
};