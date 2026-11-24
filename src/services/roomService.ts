import { get, onValue, ref, set, update } from 'firebase/database';
import { GAMES_CATALOG } from '../data/gamesCatalog';
import { db } from 'firebase';
import type { MiniGameMeta, Player, RoomState } from '../types/game';

const DEFAULT_FALLBACK_GAME: MiniGameMeta = {
  id: 'tap-king',
  number: '01',
  title: '연타왕',
  subtitle: '제한 시간 동안 버튼을 최대한 빠르게 연타하세요!',
  heroEmoji: '⚡',
  rules: [
    '카운트다운이 끝나면 연타 버튼을 빠르게 누르세요.',
    '누를 때마다 점수가 올라갑니다.',
    '제한 시간이 끝나면 최종 점수가 집계됩니다.',
  ],
  category: 'fast',
  accent: 'blue',
  durationSec: 20,
  iconName: 'Zap',
};

let localRoom: RoomState | null = null;
const localListeners = new Set<(room: RoomState | null) => void>();
let botInterval: number | null = null;

function notifyLocal(): void {
  localListeners.forEach((cb) => cb(localRoom ? { ...localRoom } : null));
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function getGameMeta(gameId: string | null): MiniGameMeta {
  if (!gameId) return GAMES_CATALOG[0] ?? DEFAULT_FALLBACK_GAME;
  return GAMES_CATALOG.find((g) => g.id === gameId) ?? GAMES_CATALOG[0] ?? DEFAULT_FALLBACK_GAME;
}

export async function createRoom(
  hostPlayer: Omit<Player, 'isHost' | 'currentScore' | 'totalScore'>
): Promise<string> {
  const roomCode = generateRoomCode();
  const initialRoom: RoomState = {
    roomCode,
    phase: 'select',
    mode: 'solo',
    matchType: 'olympic',
    playlist: [],
    currentIndex: 0,
    activeGameId: null,
    countdownStartTime: 0,
    roundStartTime: 0,
    players: {
      [hostPlayer.id]: {
        ...hostPlayer,
        isHost: true,
        currentScore: 0,
        totalScore: 0,
      },
    },
  };

  if (db) {
    try {
      await set(ref(db, `rooms/${roomCode}`), initialRoom);
      return roomCode;
    } catch (err) {
      console.error('Firebase 방 생성 실패:', err);
      throw new Error('Firebase DB 연결 또는 권한(Rules) 오류입니다. 규칙을 확인해 주세요.');
    }
  }

  localRoom = initialRoom;
  notifyLocal();
  return roomCode;
}

export async function joinRoom(
  roomCode: string,
  player: Omit<Player, 'isHost' | 'currentScore' | 'totalScore'>
): Promise<void> {
  if (db) {
    const snap = await get(ref(db, `rooms/${roomCode}`));
    if (!snap.exists()) {
      throw new Error('존재하지 않는 방 코드입니다.');
    }
    const existing = snap.val() as RoomState;
    const prevPlayer = existing.players?.[player.id];
    const newPlayer: Player = {
      ...player,
      isHost: prevPlayer?.isHost ?? false,
      currentScore: prevPlayer?.currentScore ?? 0,
      totalScore: prevPlayer?.totalScore ?? 0,
    };
    await set(ref(db, `rooms/${roomCode}/players/${player.id}`), newPlayer);
    return;
  }

  if (!localRoom || localRoom.roomCode !== roomCode) {
    throw new Error('존재하지 않는 방 코드입니다.');
  }
  const prevPlayer = localRoom.players[player.id];
  localRoom = {
    ...localRoom,
    players: {
      ...localRoom.players,
      [player.id]: {
        ...player,
        isHost: prevPlayer?.isHost ?? false,
        currentScore: prevPlayer?.currentScore ?? 0,
        totalScore: prevPlayer?.totalScore ?? 0,
      },
    },
  };
  notifyLocal();
}

export function subscribeRoom(roomCode: string, cb: (room: RoomState | null) => void): () => void {
  if (db) {
    const roomRef = ref(db, `rooms/${roomCode}`);
    const unsub = onValue(roomRef, (snap) => {
      if (!snap.exists()) {
        cb(null);
        return;
      }
      const data = snap.val() as RoomState;
      cb({
        ...data,
        playlist: data.playlist ?? [],
        players: data.players ?? {},
      });
    });
    return () => unsub();
  }

  localListeners.add(cb);
  cb(localRoom ? { ...localRoom } : null);
  return () => {
    localListeners.delete(cb);
  };
}

export async function updateRoom(roomCode: string, patch: Partial<RoomState>): Promise<void> {
  if (db) {
    await update(ref(db, `rooms/${roomCode}`), patch);
  } else if (localRoom && localRoom.roomCode === roomCode) {
    localRoom = { ...localRoom, ...patch };
    notifyLocal();
  }
}

export async function updatePlayerScore(
  roomCode: string,
  playerId: string,
  nextCurrentScore: number
): Promise<void> {
  if (db) {
    await update(ref(db, `rooms/${roomCode}/players/${playerId}`), {
      currentScore: nextCurrentScore,
    });
  } else if (localRoom && localRoom.roomCode === roomCode && localRoom.players[playerId]) {
    localRoom = {
      ...localRoom,
      players: {
        ...localRoom.players,
        [playerId]: {
          ...localRoom.players[playerId],
          currentScore: nextCurrentScore,
        },
      },
    };
    notifyLocal();
  }
}

export async function openGameBriefing(
  roomCode: string,
  gameId: string,
  currentPlayers: Record<string, Player>
): Promise<void> {
  const resetPlayers: Record<string, Player> = {};
  Object.values(currentPlayers).forEach((p) => {
    resetPlayers[p.id] = { ...p, currentScore: 0, finished: false };
  });

  if (botInterval) {
    clearInterval(botInterval);
    botInterval = null;
  }

  await updateRoom(roomCode, {
    activeGameId: gameId,
    phase: 'briefing',
    countdownStartTime: 0,
    roundStartTime: 0,
    players: resetPlayers,
  });
}

export async function launchActiveGame(
  roomCode: string,
  currentPlayers: Record<string, Player>
): Promise<void> {
  const resetPlayers: Record<string, Player> = {};
  Object.values(currentPlayers).forEach((p) => {
    resetPlayers[p.id] = { ...p, currentScore: 0, finished: false };
  });

  if (botInterval) {
    clearInterval(botInterval);
    botInterval = null;
  }

  await updateRoom(roomCode, {
    phase: 'countdown',
    countdownStartTime: Date.now(),
    roundStartTime: 0,
    players: resetPlayers,
  });
}

export async function startPlayingAfterCountdown(
  roomCode: string,
  currentPlayers: Record<string, Player>
): Promise<void> {
  const startedAt = Date.now();
  await updateRoom(roomCode, {
    phase: 'playing',
    roundStartTime: startedAt,
  });

  if (botInterval) clearInterval(botInterval);
  botInterval = window.setInterval(() => {
    const bots = Object.values(currentPlayers).filter((p) => p.isBot);
    if (bots.length === 0) return;
    bots.forEach((b) => {
      const gain = Math.floor(Math.random() * 18) + 5;
      if (db) {
        get(ref(db!, `rooms/${roomCode}/players/${b.id}/currentScore`)).then((s) => {
          updatePlayerScore(roomCode, b.id, (s.val() || 0) + gain);
        });
      } else if (localRoom && localRoom.phase === 'playing' && localRoom.players[b.id]) {
        localRoom.players[b.id].currentScore += gain;
        notifyLocal();
      }
    });
  }, 900);
}

export async function finishGameRound(
  roomCode: string,
  currentPlayers: Record<string, Player>
): Promise<void> {
  if (botInterval) {
    clearInterval(botInterval);
    botInterval = null;
  }

  let latestPlayers = currentPlayers;
  if (db) {
    const snap = await get(ref(db, `rooms/${roomCode}/players`));
    if (snap.exists()) {
      latestPlayers = snap.val() as Record<string, Player>;
    }
  }

  const updatedPlayers: Record<string, Player> = {};
  Object.values(latestPlayers).forEach((p) => {
    updatedPlayers[p.id] = {
      ...p,
      totalScore: (p.totalScore || 0) + (p.currentScore || 0),
      finished: true,
    };
  });

  await updateRoom(roomCode, {
    phase: 'round_result',
    players: updatedPlayers,
  });
}

export async function addPracticeBots(
  roomCode: string,
  currentPlayers: Record<string, Player>
): Promise<void> {
  const botCandidates: Array<{ id: string; name: string; avatar: string; team: 'A' | 'B' }> = [
    { id: 'bot_1', name: '봇_민수', avatar: '😎', team: 'A' },
    { id: 'bot_2', name: '봇_지영', avatar: '🦊', team: 'B' },
    { id: 'bot_3', name: '봇_현우', avatar: '🐯', team: 'A' },
  ];

  const nextPlayers: Record<string, Player> = { ...currentPlayers };
  botCandidates.forEach((bot) => {
    if (!nextPlayers[bot.id]) {
      nextPlayers[bot.id] = {
        id: bot.id,
        name: bot.name,
        avatar: bot.avatar,
        team: bot.team,
        isHost: false,
        isBot: true,
        currentScore: 0,
        totalScore: 0,
      };
    }
  });

  await updateRoom(roomCode, { players: nextPlayers });
}