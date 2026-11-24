import React, { useCallback, useEffect, useState } from 'react';
import { CountdownScreen } from './components/CountdownScreen';
import { GameBriefingScreen } from './components/GameBriefingScreen';
import { GamePlayShell } from './components/GamePlayShell';
import { GameRouter } from "./components/GameRouter";
import { GameSelectScreen } from './components/GameSelectScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { PodiumScreen } from './components/PodiumScreen';
import { RoundResultModal } from './components/RoundResultModal';
import {
  addPracticeBots,
  createRoom,
  finishGameRound,
  getGameMeta,
  joinRoom,
  launchActiveGame,
  openGameBriefing,
  startPlayingAfterCountdown,
  subscribeRoom,
  updatePlayerScore,
  updateRoom,
} from './services/roomService';
import type { RoomState } from './types/game';

function getOrCreateMyId(): string {
  const saved = sessionStorage.getItem('party_game_my_id');
  if (saved) return saved;
  const id = `u_${Math.random().toString(36).slice(2, 9)}`;
  sessionStorage.setItem('party_game_my_id', id);
  return id;
}

export const App: React.FC = () => {
  const [myId] = useState<string>(getOrCreateMyId);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [myScore, setMyScore] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!roomCode) return;
    const unsub = subscribeRoom(roomCode, (nextRoom) => {
      setRoom(nextRoom);
      if (nextRoom?.phase === 'briefing' || nextRoom?.phase === 'countdown') {
        setMyScore(0);
      }
    });
    return () => unsub();
  }, [roomCode]);

  const handleScoreChange = useCallback(
    (delta: number) => {
      setMyScore((prev) => {
        const next = prev + delta;
        if (roomCode) {
          updatePlayerScore(roomCode, myId, next);
        }
        return next;
      });
    },
    [roomCode, myId]
  );

  const handleCreateRoom = async (name: string, avatar: string) => {
    setErrorMsg('');
    try {
      const code = await createRoom({ id: myId, name, avatar, team: 'A' });
      setRoomCode(code);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '방 생성 중 오류가 발생했습니다.');
    }
  };

  const handleJoinRoom = async (code: string, name: string, avatar: string) => {
    setErrorMsg('');
    try {
      const normalized = code.trim().toUpperCase();
      await joinRoom(normalized, { id: myId, name, avatar, team: 'B' });
      setRoomCode(normalized);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '방 참여 중 오류가 발생했습니다.');
    }
  };

  if (!room || !room.players[myId]) {
    return (
      <LobbyScreen
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        errorMsg={errorMsg}
      />
    );
  }

  const me = room.players[myId];

  if (room.phase === 'select') {
    return (
      <GameSelectScreen
        room={room}
        me={me}
        onUpdateMode={(mode) => updateRoom(room.roomCode, { mode })}
        onUpdateMatchType={(matchType) => updateRoom(room.roomCode, { matchType })}
        onUpdatePlaylist={(playlist) => updateRoom(room.roomCode, { playlist })}
        onStartSingleGame={(gameId) => {
          updateRoom(room.roomCode, { playlist: [], currentIndex: 0 });
          openGameBriefing(room.roomCode, gameId, room.players);
        }}
        onStartPlaylist={() => {
          const playlist = room.playlist ?? [];
          if (playlist.length === 0) return;
          updateRoom(room.roomCode, { currentIndex: 0 });
          openGameBriefing(room.roomCode, playlist[0], room.players);
        }}
        onAddBots={() => addPracticeBots(room.roomCode, room.players)}
        onLeaveRoom={() => {
          setRoomCode(null);
          setRoom(null);
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

  if (room.phase === 'countdown') {
    const gameMeta = getGameMeta(room.activeGameId);
    return (
      <CountdownScreen
        room={room}
        me={me}
        game={gameMeta}
        onCountdownDone={() => startPlayingAfterCountdown(room.roomCode, room.players)}
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
      onPlayAgain={() => updateRoom(room.roomCode, { phase: 'select', activeGameId: null })}
    />
  );
};

export default App;