/**
 * Blood on the Clocktower - Frontend Types
 */

export type GameMode = 'storyteller' | 'player';
export type GamePhase = 'lobby' | 'night' | 'day-discussion' | 'day-nomination' | 'day-vote' | 'day-execution' | 'ended';
export type PlayerStatus = 'normal' | 'poisoned' | 'drunk' | 'dead';
export type Team = 'good' | 'evil';
export type Faction = 'townsfolk' | 'outsider' | 'minion' | 'demon';
export type AbilityType = 'information' | 'protection' | 'offensive' | 'passive' | 'revenge' | 'modifier';

export interface CharacterDef {
  id: string;
  name: string;
  nameCN: string;
  faction: Faction;
  team: Team;
  ability: string;
  abilityCN: string;
  abilityType: AbilityType;
  nightAction: boolean;
  firstNight: boolean;
  otherNights: boolean;
  icon: string;
  description: string;
  descriptionCN: string;
  promptHint: string;
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
  type: string;
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

export interface GameConfig {
  playerCount: number;
  characters: string[];
  mode: GameMode;
  aiModel: string;
  discussionRounds: number;
}

export interface NightActionResult {
  playerId: string;
  abilityResult: string | null;
  targetId: string | null;
}

export interface CreateGameRequest {
  playerCount: number;
  characters?: string[];
  mode: GameMode;
  aiModel?: string;
  discussionRounds?: number;
  humanPlayerName?: string;
}
