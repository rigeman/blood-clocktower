/**
 * Blood on the Clocktower - API Client
 */

import axios from 'axios';
import type { GameState, CreateGameRequest } from '@/types/game';

const api = axios.create({
  baseURL: '/api/game',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

export const gameApi = {
  /** Create a new game */
  create: async (request: CreateGameRequest): Promise<GameState> => {
    const { data } = await api.post('/create', request);
    return data.game;
  },

  /** Get game state */
  getState: async (gameId: string, perspective?: string): Promise<GameState> => {
    const { data } = await api.get(`/${gameId}`, { params: { perspective } });
    return data.game;
  },

  /** Start the game */
  start: async (gameId: string): Promise<GameState> => {
    const { data } = await api.post(`/${gameId}/start`);
    return data.game;
  },

  /** Delete a game */
  delete: async (gameId: string): Promise<void> => {
    await api.delete(`/${gameId}`);
  },

  /** Submit night action */
  nightAction: async (gameId: string, playerId: string, targetIds: string[]): Promise<GameState> => {
    const { data } = await api.post(`/${gameId}/night-action`, { playerId, targetIds });
    return data.game;
  },

  /** Process AI night actions */
  aiNight: async (gameId: string): Promise<{ results: any[] }> => {
    const { data } = await api.post(`/${gameId}/ai-night`);
    return data;
  },

  /** Resolve night phase */
  resolveNight: async (gameId: string): Promise<GameState> => {
    const { data } = await api.post(`/${gameId}/resolve-night`);
    return data.game;
  },

  /** Generate AI discussion */
  aiDiscuss: async (gameId: string): Promise<{ messages: any[]; game: GameState }> => {
    const { data } = await api.post(`/${gameId}/ai-discuss`);
    return data;
  },

  /** Human player discussion */
  discuss: async (gameId: string, playerId: string, content: string): Promise<GameState> => {
    const { data } = await api.post(`/${gameId}/discuss`, { playerId, content });
    return data.game;
  },

  /** Start nomination phase */
  startNomination: async (gameId: string): Promise<GameState> => {
    const { data } = await api.post(`/${gameId}/start-nomination`);
    return data.game;
  },

  /** Nominate a player */
  nominate: async (gameId: string, nominatorId: string, nomineeId: string): Promise<GameState> => {
    const { data } = await api.post(`/${gameId}/nominate`, { nominatorId, nomineeId });
    return data.game;
  },

  /** Get AI nomination decisions */
  aiNominate: async (gameId: string): Promise<{ results: any[] }> => {
    const { data } = await api.post(`/${gameId}/ai-nominate`);
    return data;
  },

  /** Process votes */
  vote: async (gameId: string, votes: { voterId: string; vote: boolean }[]): Promise<GameState> => {
    const { data } = await api.post(`/${gameId}/vote`, { votes });
    return data.game;
  },

  /** Get AI vote decisions */
  aiVote: async (gameId: string): Promise<{ votes: any[] }> => {
    const { data } = await api.post(`/${gameId}/ai-vote`);
    return data;
  },

  /** End day phase */
  endDay: async (gameId: string): Promise<GameState> => {
    const { data } = await api.post(`/${gameId}/end-day`);
    return data.game;
  },

  /** Storyteller action */
  storytellerAction: async (
    gameId: string,
    action: string,
    targetId?: string,
    characterId?: string
  ): Promise<GameState> => {
    const { data } = await api.post(`/${gameId}/storyteller`, { action, targetId, characterId });
    return data.game;
  },

  /** Get all characters */
  getCharacters: async (): Promise<any> => {
    const { data } = await api.get('/characters/all');
    return data;
  },

  /** Get default setup */
  getSetup: async (count: number): Promise<any> => {
    const { data } = await api.get(`/setup/${count}`);
    return data;
  },
};
