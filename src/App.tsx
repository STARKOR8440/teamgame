import { useEffect, useMemo, useState } from 'react';
import type { Player, RoomState } from './types/game';
import { GameBriefingScreen } from './components/GameBriefingScreen';
import {
  addPracticeBots,
  createRoom,
  finishGameRound,
  getGameMeta,
  joinRoom,
  launchActiveGame,
  openGameBriefing,
  subscribeRoom,
  updatePlayerScore,
  updateRoom,
} from './services/roomService';

import { LobbyScreen } from './components/LobbyScreen';
import { GameSelectScreen } from './components/GameSelectScreen';
import { GamePlayShell } from './components/GamePlayShell';
import { RoundResultModal } from './components/RoundResultModal';
import { PodiumScreen } from './components/PodiumScreen';
import { GameRouter } from './games/GameRouter';

export function App() {
  const [myId] = useState(() => `player-${Math.random().toString(36).slice(2, 8)}`);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [myScore, setMyScore] = useState(0);

  useEffect(() => {
    if (!roomCode) return;
    return subscribeRoom(roomCode, (nextRoom) => {
      setRoom(nextRoom);
      if (nextRoom?.phase === 'briefing') {
        setMyScore(0);
      }
    });
  }, [roomCode]);

  const me: Player | undefined = useMemo(() => {
    if (!room) return undefined;
    return room.players[myId];
  }, [room, myId]);

  const handleCreateRoom = async (name: string, avatar: string) => {
    setErrorMsg('');
    const code = await createRoom({ id: myId, name, avatar, team: 'A' });
    setRoomCode(code);
  };

  const handleJoinRoom = async (code: string, name: string, avatar: string) => {
    setErrorMsg('');
    const ok = await joinRoom(code, { id: myId, name, avatar, team: 'B' });
    if (!ok) {
      setErrorMsg('존재하지 않는 방 코드입니다. 코드를 다시 확인해 주세요.');
      return;
    }
    setRoomCode(code);
  };

  const handleScoreChange = (score: number) => {
    setMyScore(score);
    if (roomCode) {
      updatePlayerScore(roomCode, myId, score);
    }
  };

  if (!room || !me) {
    return <LobbyScreen onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} errorMsg={errorMsg} />;
  }

  if (room.phase === 'select') {
    return (
      <GameSelectScreen
        room={room}
        me={me}
        onStartSingleGame={(gameId) => {
          updateRoom(room.roomCode, { playlist: [], currentIndex: 0 });
          openGameBriefing(room.roomCode, gameId, room.players);
        }}
        onTogglePlaylistGame={(gameId) => {
          const exists = room.playlist.includes(gameId);
          const next = exists ? room.playlist.filter((id) => id !== gameId) : [...room.playlist, gameId];
          updateRoom(room.roomCode, { playlist: next });
        }}
        onStartPlaylist={() => {
  const playlist = room.playlist ?? [];
  if (playlist.length === 0) return;
  updateRoom(room.roomCode, { currentIndex: 0 });
  openGameBriefing(room.roomCode, playlist[0], room.players);
}}
        onToggleMode={() => updateRoom(room.roomCode, { mode: room.mode === 'solo' ? 'team' : 'solo' })}
        onToggleMatchType={() =>
          updateRoom(room.roomCode, { matchType: room.matchType === 'olympic' ? 'single' : 'olympic' })
        }
        onOpenPodium={() => updateRoom(room.roomCode, { phase: 'podium' })}
        onAddBots={() => addPracticeBots(room.roomCode)}
        onSwitchTeam={(playerId) => {
          const target = room.players[playerId];
          if (!target) return;
          updateRoom(room.roomCode, {
            players: {
              ...room.players,
              [playerId]: { ...target, team: target.team === 'A' ? 'B' : 'A' },
            },
          });
        }}
      />
    );
  }

  if (room.phase === 'briefing') {
    const gameMeta = getGameMeta(room.activeGameId);
    return (
      <GameBriefingScreen
        room={room}
        me={me}
        game={gameMeta}
        onStartGame={() => launchActiveGame(room.roomCode, room.players)}
        onBackToSelect={() => updateRoom(room.roomCode, { phase: 'select', activeGameId: null })}
      />
    );
  }

  if (room.phase === 'playing') {
    const gameMeta = getGameMeta(room.activeGameId);
    return (
      <GamePlayShell
        room={room}
        me={me}
        game={gameMeta}
        myScore={myScore}
        onTimeUp={() => finishGameRound(room.roomCode, room.players)}
      >
        <GameRouter gameId={gameMeta.id} onScoreChange={handleScoreChange} />
      </GamePlayShell>
    );
  }

  if (room.phase === 'round_result') {
    return (
      <RoundResultModal
        room={room}
        me={me}
        onNextGame={() => {
  const playlist = room.playlist ?? [];
  const nextIdx = room.currentIndex + 1;
  const nextGameId = playlist[nextIdx];
  if (!nextGameId) return;
  updateRoom(room.roomCode, { currentIndex: nextIdx });
  openGameBriefing(room.roomCode, nextGameId, room.players);
}}
        onBackToSelect={() => updateRoom(room.roomCode, { phase: 'select', activeGameId: null })}
        onGoPodium={() => updateRoom(room.roomCode, { phase: 'podium' })}
      />
    );
  }

  return (
    <PodiumScreen
      room={room}
      me={me}
      onBackToSelect={() => updateRoom(room.roomCode, { phase: 'select', activeGameId: null })}
    />
  );
}

export default App;