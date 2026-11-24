export type GameCategory = 'fast' | 'brain';

export type AccentColor =
  | 'blue'
  | 'pink'
  | 'orange'
  | 'amber'
  | 'cyan'
  | 'yellow'
  | 'emerald'
  | 'violet'
  | 'rose'
  | 'lime';

export interface MiniGameMeta {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  heroEmoji: string;
  rules: [string, string, string];
  category: GameCategory;
  accent: AccentColor;
  durationSec: number;
  iconName: string;
  isNew?: boolean;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  team: 'A' | 'B';
  isHost: boolean;
  isBot?: boolean;
  currentScore: number;
  totalScore: number;
  finished?: boolean;
}

export type RoomPhase =
  | 'lobby'
  | 'select'
  | 'briefing'
  | 'countdown'
  | 'playing'
  | 'round_result'
  | 'podium';

export interface RoomState {
  roomCode: string;
  phase: RoomPhase;
  mode: 'solo' | 'team';
  matchType: 'single' | 'olympic';
  playlist: string[];
  currentIndex: number;
  activeGameId: string | null;
  countdownStartTime?: number;
  roundStartTime: number;
  players: Record<string, Player>;
}