import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, onValue, update, get } from 'firebase/database';
import type { Player, RoomState } from '../types/game';
import { GAMES_CATALOG } from '../data/gamesCatalog';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
};

const isFirebaseEnabled = Boolean(firebaseConfig.databaseURL);
let db: ReturnType<typeof getDatabase> | null = null;

if (isFirebaseEnabled) {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getDatabase(app);
}

// 로컬 메모리 상태 (Firebase 미연결 시 즉각 테스트용)
let localRoom: RoomState | null = null;
const localListeners = new Set<(room: RoomState | null) => void>();
let botInterval: number | null = null;

function notifyLocal() {
  localListeners.forEach((cb) => cb(localRoom ? { ...localRoom, players: { ...localRoom.players } } : null));
}

export function generateRoomCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function createRoom(hostPlayer: Omit<Player, 'isHost' | 'currentScore' | 'totalScore'>): Promise<string> {
  const roomCode = generateRoomCode();
  const initialRoom: RoomState = {
    roomCode,
    phase: 'select',
    mode: 'solo',
    matchType: 'olympic',
    playlist: [],
    currentIndex: 0,
    activeGameId: null,
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
    await set(ref(db, `rooms/${roomCode}`), initialRoom);
  } else {
    localRoom = initialRoom;
    notifyLocal();
  }
  return roomCode;
}

export async function joinRoom(
  roomCode: string,
  player: Omit<Player, 'isHost' | 'currentScore' | 'totalScore'>
): Promise<boolean> {
  if (db) {
    const snap = await get(ref(db, `rooms/${roomCode}`));
    if (!snap.exists()) return false;
    await set(ref(db, `rooms/${roomCode}/players/${player.id}`), {
      ...player,
      isHost: false,
      currentScore: 0,
      totalScore: 0,
    });
    return true;
  } else {
    if (!localRoom || localRoom.roomCode !== roomCode) return false;
    localRoom.players[player.id] = {
      ...player,
      isHost: false,
      currentScore: 0,
      totalScore: 0,
    };
    notifyLocal();
    return true;
  }
}

export function addPracticeBots(roomCode: string) {
  const bots: Player[] = [
    { id: 'bot-1', name: '민수(AI)', avatar: '🦊', team: 'B', isHost: false, isBot: true, currentScore: 0, totalScore: 0 },
    { id: 'bot-2', name: '지연(AI)', avatar: '🐰', team: 'A', isHost: false, isBot: true, currentScore: 0, totalScore: 0 },
    { id: 'bot-3', name: '현우(AI)', avatar: '🐻', team: 'B', isHost: false, isBot: true, currentScore: 0, totalScore: 0 },
  ];

  if (db) {
    const updates: Record<string, Player> = {};
    bots.forEach((b) => (updates[`rooms/${roomCode}/players/${b.id}`] = b));
    update(ref(db), updates);
  } else if (localRoom) {
    bots.forEach((b) => {
      localRoom!.players[b.id] = b;
    });
    notifyLocal();
  }
}

export function subscribeRoom(roomCode: string, callback: (room: RoomState | null) => void): () => void {
  if (db) {
    const roomRef = ref(db, `rooms/${roomCode}`);
    return onValue(roomRef, (snap) => {
      callback(snap.val());
    });
  } else {
    localListeners.add(callback);
    callback(localRoom);
    return () => {
      localListeners.delete(callback);
    };
  }
}

export async function updateRoom(roomCode: string, partial: Partial<RoomState>) {
  if (db) {
    await update(ref(db, `rooms/${roomCode}`), partial);
  } else if (localRoom) {
    localRoom = { ...localRoom, ...partial };
    notifyLocal();
  }
}

export async function updatePlayerScore(roomCode: string, playerId: string, score: number) {
  if (db) {
    await update(ref(db, `rooms/${roomCode}/players/${playerId}`), { currentScore: score });
  } else if (localRoom && localRoom.players[playerId]) {
    localRoom.players[playerId].currentScore = score;
    notifyLocal();
  }
}

export async function openGameBriefing(
  roomCode: string,
  gameId: string,
  currentPlayers: Record<string, Player>
) {
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
    roundStartTime: 0,
    players: resetPlayers,
  });
}

export async function launchActiveGame(roomCode: string, currentPlayers: Record<string, Player>) {
  const resetPlayers: Record<string, Player> = {};
  Object.values(currentPlayers).forEach((p) => {
    resetPlayers[p.id] = { ...p, currentScore: 0, finished: false };
  });

  await updateRoom(roomCode, {
    phase: 'playing',
    roundStartTime: Date.now(),
    players: resetPlayers,
  });

  if (botInterval) clearInterval(botInterval);
  botInterval = window.setInterval(() => {
    const bots = Object.values(resetPlayers).filter((p) => p.isBot);
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

export async function finishGameRound(roomCode: string, players: Record<string, Player>) {
  if (botInterval) {
    clearInterval(botInterval);
    botInterval = null;
  }

  const sorted = Object.values(players).sort((a, b) => b.currentScore - a.currentScore);
  const rankPoints = [100, 80, 60, 45, 35, 25, 15, 10];
  const updatedPlayers: Record<string, Player> = {};

  sorted.forEach((p, idx) => {
    const earned = p.currentScore > 0 ? (rankPoints[idx] ?? 10) : 0;
    updatedPlayers[p.id] = {
      ...p,
      totalScore: p.totalScore + earned,
      finished: true,
    };
  });

  await updateRoom(roomCode, {
    phase: 'round_result',
    players: updatedPlayers,
  });
}

export function getGameMeta(gameId: string | null) {
  return GAMES_CATALOG.find((g) => g.id === gameId) || GAMES_CATALOG[0];
}