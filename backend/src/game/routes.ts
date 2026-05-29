/**
 * Blood on the Clocktower - Game API Routes
 */

import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import * as engine from './engine.js';
import * as aiPlayer from './ai-player.js';
import { CHARACTERS, getCharactersByFaction, getDefaultSetup } from './characters.js';

export const gameRouter: RouterType = Router();

// ==================== Validation Schemas ====================

const createGameSchema = z.object({
  playerCount: z.number().min(5).max(15).default(7),
  characters: z.array(z.string()).optional(),
  mode: z.enum(['storyteller', 'player']).default('player'),
  aiModel: z.string().default('hunyuan'),
  discussionRounds: z.number().min(1).max(5).default(3),
  humanPlayerName: z.string().optional(),
});

const nightActionSchema = z.object({
  playerId: z.string(),
  targetIds: z.array(z.string()),
});

const nominateSchema = z.object({
  nominatorId: z.string(),
  nomineeId: z.string(),
});

const voteSchema = z.object({
  votes: z.array(z.object({
    voterId: z.string(),
    vote: z.boolean(),
  })),
});

const storytellerActionSchema = z.object({
  action: z.enum(['kill', 'revive', 'poison', 'sober', 'advance-phase']),
  targetId: z.string().optional(),
  characterId: z.string().optional(),
});

const discussSchema = z.object({
  playerId: z.string(),
  content: z.string().optional(),
});

// ==================== Game Management ====================

/** Create a new game */
gameRouter.post('/create', async (req, res) => {
  const parsed = createGameSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const game = engine.createGame(parsed.data);
  res.json({ game });
});

/** Get game state */
gameRouter.get('/:id', async (req, res) => {
  const perspective = req.query.perspective as string | undefined;
  const game = engine.getGameState(req.params.id, perspective);
  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }
  res.json({ game });
});

/** Start the game */
gameRouter.post('/:id/start', async (req, res) => {
  try {
    const game = engine.startGame(req.params.id);
    res.json({ game });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/** Delete a game */
gameRouter.delete('/:id', async (req, res) => {
  const success = engine.deleteGame(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }
  res.json({ success: true });
});

// ==================== Game Actions ====================

/** Submit night action */
gameRouter.post('/:id/night-action', async (req, res) => {
  const parsed = nightActionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const game = engine.submitNightAction(
      req.params.id,
      parsed.data.playerId,
      parsed.data.targetIds
    );
    res.json({ game });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/** Process AI night actions for all AI players */
gameRouter.post('/:id/ai-night', async (req, res) => {
  try {
    const gameState = engine.getGameState(req.params.id);
    if (!gameState) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    const aiPlayers = gameState.players.filter(p => !p.isHuman && p.isAlive);
    const results: { playerId: string; targetIds: string[]; reasoning: string }[] = [];

    for (const ai of aiPlayers) {
      const charDef = CHARACTERS[ai.characterId];
      if (!charDef?.nightAction) continue;
      if (gameState.round === 1 && !charDef.firstNight) continue;
      if (gameState.round > 1 && !charDef.otherNights) continue;

      try {
        const decision = await aiPlayer.generateNightAction(ai, gameState);
        if (decision.targetIds.length > 0) {
          engine.submitNightAction(req.params.id, ai.id, decision.targetIds);
          results.push({
            playerId: ai.id,
            targetIds: decision.targetIds,
            reasoning: decision.reasoning,
          });
        }
      } catch (err) {
        console.error(`AI night action error for ${ai.name}:`, err);
      }
    }

    res.json({ results });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/** Resolve night phase */
gameRouter.post('/:id/resolve-night', async (req, res) => {
  try {
    const game = engine.resolveNightPhase(req.params.id);
    res.json({ game });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/** Generate AI discussion messages */
gameRouter.post('/:id/ai-discuss', async (req, res) => {
  try {
    const gameState = engine.getGameState(req.params.id);
    if (!gameState) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    const aiPlayers = gameState.players.filter(p => !p.isHuman && p.isAlive);
    const messages: { playerId: string; content: string }[] = [];

    for (const ai of aiPlayers) {
      try {
        const recentMsgs = gameState.discussions.slice(-20);
        const content = await aiPlayer.generateDiscussion(ai, gameState, recentMsgs);
        engine.addDiscussion(req.params.id, ai.id, content);
        messages.push({ playerId: ai.id, content });
      } catch (err) {
        console.error(`AI discussion error for ${ai.name}:`, err);
      }
    }

    const updatedGame = engine.getGameState(req.params.id);
    res.json({ messages, game: updatedGame });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/** Human player discussion message */
gameRouter.post('/:id/discuss', async (req, res) => {
  const parsed = discussSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const game = engine.addDiscussion(req.params.id, parsed.data.playerId, parsed.data.content || '');
    res.json({ game });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/** Start nomination phase */
gameRouter.post('/:id/start-nomination', async (req, res) => {
  try {
    const game = engine.startNominationPhase(req.params.id);
    res.json({ game });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/** Process a nomination */
gameRouter.post('/:id/nominate', async (req, res) => {
  const parsed = nominateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const game = engine.processNomination(req.params.id, parsed.data.nominatorId, parsed.data.nomineeId);
    res.json({ game });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/** Process AI nominations */
gameRouter.post('/:id/ai-nominate', async (req, res) => {
  try {
    const gameState = engine.getGameState(req.params.id);
    if (!gameState) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    const aiPlayers = gameState.players.filter(p => !p.isHuman && p.isAlive);
    const results: { playerId: string; nomineeId: string | null; reasoning: string }[] = [];

    for (const ai of aiPlayers) {
      try {
        const decision = await aiPlayer.generateNominationDecision(ai, gameState);
        results.push({
          playerId: ai.id,
          nomineeId: decision.nomineeId,
          reasoning: decision.reasoning,
        });
      } catch (err) {
        console.error(`AI nomination error for ${ai.name}:`, err);
      }
    }

    res.json({ results });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/** Process votes */
gameRouter.post('/:id/vote', async (req, res) => {
  const parsed = voteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const game = engine.processVote(req.params.id, parsed.data.votes);
    res.json({ game });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/** Process AI votes */
gameRouter.post('/:id/ai-vote', async (req, res) => {
  try {
    const gameState = engine.getGameState(req.params.id);
    if (!gameState) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    const nomineeId = gameState.currentNominee;
    if (!nomineeId) {
      res.status(400).json({ error: 'No current nominee' });
      return;
    }

    const nominee = gameState.players.find(p => p.id === nomineeId);
    const aiPlayers = gameState.players.filter(
      p => !p.isHuman && (p.isAlive || p.ghostVote)
    );

    const votes: { voterId: string; vote: boolean; reasoning: string }[] = [];

    for (const ai of aiPlayers) {
      try {
        const decision = await aiPlayer.generateVoteDecision(
          ai,
          gameState,
          nominee?.name || 'Unknown',
          nomineeId
        );
        votes.push({
          voterId: ai.id,
          vote: decision.vote,
          reasoning: decision.reasoning,
        });
      } catch (err) {
        console.error(`AI vote error for ${ai.name}:`, err);
        votes.push({ voterId: ai.id, vote: false, reasoning: '' });
      }
    }

    res.json({ votes });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/** End day phase */
gameRouter.post('/:id/end-day', async (req, res) => {
  try {
    const game = engine.endDayPhase(req.params.id);
    res.json({ game });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== Storyteller Actions ====================

/** Storyteller action */
gameRouter.post('/:id/storyteller', async (req, res) => {
  const parsed = storytellerActionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const game = engine.processStorytellerAction(
      req.params.id,
      parsed.data.action,
      parsed.data.targetId,
      parsed.data.characterId
    );
    res.json({ game });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== Reference Data ====================

/** Get all characters */
gameRouter.get('/characters/all', async (_req, res) => {
  const byFaction = getCharactersByFaction();
  res.json({ characters: CHARACTERS, byFaction });
});

/** Get default setup for player count */
gameRouter.get('/setup/:count', async (req, res) => {
  const count = parseInt(req.params.count, 10);
  if (isNaN(count) || count < 5 || count > 15) {
    res.status(400).json({ error: 'Player count must be between 5 and 15' });
    return;
  }
  const setup = getDefaultSetup(count);
  res.json({ playerCount: count, characters: setup });
});
