/**
 * Blood on the Clocktower - Game Types
 */

export type GameMode = 'storyteller' | 'player';
export type GamePhase = 'lobby' | 'night' | 'day-discussion' | 'day-nomination' | 'day-vote' | 'day-execution' | 'ended';
export type PlayerStatus = 'normal' | 'poisoned' | 'drunk' | 'dead';
export type Team = 'good' | 'evil';
export type EventType = 'death' | 'ability' | 'nomination' | 'vote' | 'execution' | 'discussion' | 'game-start' | 'game-end' | 'phase-change' | 'night-action';

export interface GameConfig {
  playerCount: number;
  characters: string[];
  mode: GameMode;
  aiModel: string;
  discussionRounds: number;
}

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  isAlive: boolean;
  position: number;
  characterId: string;
  team: Team;
  status: PlayerStatus;
  ghostVote: boolean;
  nomination: string | null;
  voteCount: number;
  lastNightResult: string | null;
}

export interface GameEvent {
  id: string;
  round: number;
  phase: string;
  type: EventType;
  actorId: string;
  targetId: string | null;
  description: string;
  descriptionCN: string;
  isPublic: boolean;
  timestamp: number;
}

export interface DiscussionMessage {
  id: string;
  playerId: string;
  playerName: string;
  content: string;
  isHuman: boolean;
  round: number;
  timestamp: number;
}

export interface NightActionResult {
  playerId: string;
  abilityResult: string | null;
  targetId: string | null;
}

export interface VoteResult {
  nomineeId: string;
  nomineeName: string;
  votes: { voterId: string; voterName: string; voted: boolean }[];
  totalYes: number;
  totalNo: number;
  passed: boolean;
}

export interface GameState {
  id: string;
  mode: GameMode;
  phase: GamePhase;
  round: number;
  players: Player[];
  events: GameEvent[];
  discussions: DiscussionMessage[];
  config: GameConfig;
  winner: Team | null;
  currentNominee: string | null;
  nightActions: NightActionResult[];
  voteResults: VoteResult[];
  createdAt: number;
  updatedAt: number;
}

export interface CreateGameRequest {
  playerCount: number;
  characters?: string[];
  mode: GameMode;
  aiModel?: string;
  discussionRounds?: number;
  humanPlayerName?: string;
}

export interface NightActionRequest {
  playerId: string;
  targetIds: string[];
}

export interface NominateRequest {
  nominatorId: string;
  nomineeId: string;
}

export interface VoteRequest {
  voterId: string;
  nomineeId: string;
  vote: boolean;
}

export interface StorytellerActionRequest {
  action: 'kill' | 'revive' | 'poison' | 'sober' | 'change-role' | 'advance-phase';
  targetId?: string;
  characterId?: string;
}
