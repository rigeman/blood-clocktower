/**
 * Blood on the Clocktower - Game Engine
 * Core game state management and logic
 */

import { CHARACTERS, getDefaultSetup } from './characters.js';
import type {
  GameState,
  GameConfig,
  Player,
  DiscussionMessage,
  VoteResult,
  CreateGameRequest,
  Team,
  EventType,
} from './types.js';

// AI Player Names - Gothic themed
const AI_NAMES = [
  '阿德里安', '贝拉特里克斯', '卡桑德拉', '多里安', '埃莉诺',
  '费利克斯', '格温多林', '赫克托', '伊索尔德', '贾斯珀',
  '卡特琳娜', '卢修斯', '玛格丽特', '尼科莱塔', '奥菲莉亚',
];

let gameCounter = 0;
const activeGames = new Map<string, GameState>();

/** Generate a unique ID */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Create a new game */
export function createGame(request: CreateGameRequest): GameState {
  const id = generateId();
  gameCounter++;

  const config: GameConfig = {
    playerCount: request.playerCount,
    characters: request.characters || getDefaultSetup(request.playerCount),
    mode: request.mode,
    aiModel: request.aiModel || 'hunyuan',
    discussionRounds: request.discussionRounds || 3,
  };

  // Create players
  const players: Player[] = [];
  const humanName = request.humanPlayerName || '你';

  // Add human player
  players.push({
    id: 'human',
    name: humanName,
    isHuman: true,
    isAlive: true,
    position: 0,
    characterId: '',
    team: 'good',
    status: 'normal',
    ghostVote: false,
    nomination: null,
    voteCount: 0,
    lastNightResult: null,
  });

  // Add AI players
  const aiCount = config.playerCount - 1;
  const shuffledNames = [...AI_NAMES].sort(() => Math.random() - 0.5);
  for (let i = 0; i < aiCount; i++) {
    players.push({
      id: `ai-${i + 1}`,
      name: shuffledNames[i],
      isHuman: false,
      isAlive: true,
      position: i + 1,
      characterId: '',
      team: 'good',
      status: 'normal',
      ghostVote: false,
      nomination: null,
      voteCount: 0,
      lastNightResult: null,
    });
  }

  const gameState: GameState = {
    id,
    mode: config.mode,
    phase: 'lobby',
    round: 0,
    players,
    events: [],
    discussions: [],
    config,
    winner: null,
    currentNominee: null,
    nightActions: [],
    voteResults: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  activeGames.set(id, gameState);
  return gameState;
}

/** Start the game - assign roles and enter first night */
export function startGame(gameId: string): GameState {
  const game = activeGames.get(gameId);
  if (!game) throw new Error('Game not found');
  if (game.phase !== 'lobby') throw new Error('Game already started');

  // Assign characters
  const characterIds = [...game.config.characters];
  // Shuffle characters
  const shuffled = characterIds.sort(() => Math.random() - 0.5);

  game.players.forEach((player, index) => {
    const charId = shuffled[index % shuffled.length];
    player.characterId = charId;
    const charDef = CHARACTERS[charId];
    if (charDef) {
      player.team = charDef.team;
    }
  });

  // If in player mode, ensure human player is not the Demon (for better experience)
  if (game.mode === 'player') {
    const humanPlayer = game.players.find(p => p.isHuman);
    if (humanPlayer) {
      const charDef = CHARACTERS[humanPlayer.characterId];
      if (charDef && charDef.faction === 'demon') {
        // Swap with a townsfolk
        const townsfolkPlayer = game.players.find(
          p => !p.isHuman && CHARACTERS[p.characterId]?.faction === 'townsfolk'
        );
        if (townsfolkPlayer) {
          const temp = humanPlayer.characterId;
          humanPlayer.characterId = townsfolkPlayer.characterId;
          townsfolkPlayer.characterId = temp;
          humanPlayer.team = CHARACTERS[humanPlayer.characterId]?.team || 'good';
          townsfolkPlayer.team = CHARACTERS[townsfolkPlayer.characterId]?.team || 'evil';
        }
      }
    }
  }

  game.round = 1;
  game.phase = 'night';

  addEvent(game, {
    type: 'game-start',
    actorId: 'system',
    targetId: null,
    description: 'The game begins. Night falls upon the village...',
    descriptionCN: '游戏开始。夜幕降临村庄...',
    isPublic: true,
  });

  addEvent(game, {
    type: 'phase-change',
    actorId: 'system',
    targetId: null,
    description: `Night ${game.round} - Characters with night abilities, open your eyes...`,
    descriptionCN: `第${game.round}夜 - 拥有夜晚能力的角色，睁开你的眼睛...`,
    isPublic: true,
  });

  game.updatedAt = Date.now();
  return game;
}

/** Get game state (with role visibility based on perspective) */
export function getGameState(gameId: string, perspective?: string): GameState | null {
  const game = activeGames.get(gameId);
  if (!game) return null;

  // In player mode, hide other players' roles
  if (game.mode === 'player' && perspective === 'human') {
    const sanitizedPlayers = game.players.map(p => {
      if (p.isHuman) return p;
      // Hide character for other players
      return {
        ...p,
        characterId: p.isAlive ? '' : p.characterId, // Reveal on death
        team: p.isAlive ? ('good' as Team) : p.team, // Hide team while alive
      };
    });
    return { ...game, players: sanitizedPlayers };
  }

  return game;
}

/** Process night phase - handle all night abilities */
export function processNightPhase(gameId: string): GameState {
  const game = activeGames.get(gameId);
  if (!game) throw new Error('Game not found');

  game.phase = 'night';
  game.nightActions = [];

  addEvent(game, {
    type: 'phase-change',
    actorId: 'system',
    targetId: null,
    description: `Night ${game.round} falls...`,
    descriptionCN: `第${game.round}夜降临...`,
    isPublic: true,
  });

  game.updatedAt = Date.now();
  return game;
}

/** Resolve night actions and transition to day */
export function resolveNightPhase(gameId: string): GameState {
  const game = activeGames.get(gameId);
  if (!game) throw new Error('Game not found');

  // Process kills - Demon kills
  const demon = game.players.find(p => p.isAlive && CHARACTERS[p.characterId]?.faction === 'demon');
  if (demon) {
    const demonAction = game.nightActions.find(a => a.playerId === demon.id);
    if (demonAction && demonAction.targetId) {
      const target = game.players.find(p => p.id === demonAction.targetId);
      if (target && target.isAlive) {
        // Check if target is protected by Monk
        const monkAction = game.nightActions.find(a => {
          const actor = game.players.find(p => p.id === a.playerId);
          return actor && CHARACTERS[actor.characterId]?.id === 'monk' && a.targetId === target.id;
        });

        // Check if target is Soldier
        const isSoldier = CHARACTERS[target.characterId]?.id === 'soldier';

        if (!monkAction && !isSoldier) {
          target.isAlive = false;
          target.status = 'dead';
          target.ghostVote = true;

          addEvent(game, {
            type: 'death',
            actorId: demon.id,
            targetId: target.id,
            description: `${target.name} was found dead this morning.`,
            descriptionCN: `${target.name} 今早被发现死亡。`,
            isPublic: true,
          });

          // Ravenkeeper ability
          if (CHARACTERS[target.characterId]?.id === 'ravenkeeper') {
            addEvent(game, {
              type: 'ability',
              actorId: target.id,
              targetId: null,
              description: `${target.name} (Ravenkeeper) may choose a player to learn is not the Demon.`,
              descriptionCN: `${target.name}（渡鸦饲养员）可以选择一名玩家得知其不是恶魔。`,
              isPublic: false,
            });
          }
        }
      }
    }
  }

  // Process information abilities
  for (const action of game.nightActions) {
    const actor = game.players.find(p => p.id === action.playerId);
    if (!actor || !actor.isAlive) continue;

    const charDef = CHARACTERS[actor.characterId];
    if (!charDef) continue;

    // Only process information-type abilities here
    if (charDef.abilityType === 'information' && action.abilityResult) {
      actor.lastNightResult = action.abilityResult;
      addEvent(game, {
        type: 'ability',
        actorId: actor.id,
        targetId: action.targetId,
        description: `${actor.name} (${charDef.name}) learned: ${action.abilityResult}`,
        descriptionCN: `${actor.name}（${charDef.nameCN}）得知：${action.abilityResult}`,
        isPublic: false,
      });
    }
  }

  // Check win conditions
  const winner = checkWinCondition(game);
  if (winner) {
    game.winner = winner;
    game.phase = 'ended';
    addEvent(game, {
      type: 'game-end',
      actorId: 'system',
      targetId: null,
      description: `The ${winner} team wins!`,
      descriptionCN: `${winner === 'good' ? '好人' : '邪恶'}阵营获胜！`,
      isPublic: true,
    });
  } else {
    // Transition to day discussion
    game.phase = 'day-discussion';
    addEvent(game, {
      type: 'phase-change',
      actorId: 'system',
      targetId: null,
      description: 'Dawn breaks. The village gathers to discuss...',
      descriptionCN: '天亮了。村民们聚集在一起讨论...',
      isPublic: true,
    });
  }

  game.updatedAt = Date.now();
  return game;
}

/** Transition to nomination phase */
export function startNominationPhase(gameId: string): GameState {
  const game = activeGames.get(gameId);
  if (!game) throw new Error('Game not found');

  game.phase = 'day-nomination';
  addEvent(game, {
    type: 'phase-change',
    actorId: 'system',
    targetId: null,
    description: 'The nomination phase begins. Who stands accused?',
    descriptionCN: '提名阶段开始。谁被指控？',
    isPublic: true,
  });

  game.updatedAt = Date.now();
  return game;
}

/** Process a nomination */
export function processNomination(gameId: string, nominatorId: string, nomineeId: string): GameState {
  const game = activeGames.get(gameId);
  if (!game) throw new Error('Game not found');

  const nominator = game.players.find(p => p.id === nominatorId);
  const nominee = game.players.find(p => p.id === nomineeId);

  if (!nominator || !nominee) throw new Error('Player not found');
  if (!nominator.isAlive) throw new Error('Dead players cannot nominate');
  if (!nominee.isAlive) throw new Error('Cannot nominate a dead player');

  // Virgin ability check
  const nomineeChar = CHARACTERS[nominee.characterId];
  if (nomineeChar?.id === 'virgin' && CHARACTERS[nominator.characterId]?.faction === 'townsfolk') {
    addEvent(game, {
      type: 'ability',
      actorId: nominee.id,
      targetId: nominator.id,
      description: `${nominator.name} nominated the Virgin! ${nominator.name} is executed.`,
      descriptionCN: `${nominator.name} 提名了处女！${nominator.name} 被处决。`,
      isPublic: true,
    });
    nominator.isAlive = false;
    nominator.status = 'dead';
    nominator.ghostVote = true;

    // Check win condition
    const winner = checkWinCondition(game);
    if (winner) {
      game.winner = winner;
      game.phase = 'ended';
    }
    return game;
  }

  game.currentNominee = nomineeId;
  game.phase = 'day-vote';

  addEvent(game, {
    type: 'nomination',
    actorId: nominatorId,
    targetId: nomineeId,
    description: `${nominator.name} nominates ${nominee.name} for execution.`,
    descriptionCN: `${nominator.name} 提名处决 ${nominee.name}。`,
    isPublic: true,
  });

  game.updatedAt = Date.now();
  return game;
}

/** Process voting on a nomination */
export function processVote(gameId: string, votes: { voterId: string; vote: boolean }[]): GameState {
  const game = activeGames.get(gameId);
  if (!game) throw new Error('Game not found');

  const nominee = game.players.find(p => p.id === game.currentNominee);
  if (!nominee) throw new Error('No current nominee');

  // Count votes
  let yesCount = 0;
  let noCount = 0;
  const voteRecords: VoteResult['votes'] = [];

  for (const v of votes) {
    const voter = game.players.find(p => p.id === v.voterId);
    if (!voter) continue;

    // Only alive players and ghost voters can vote
    if (!voter.isAlive && !voter.ghostVote) continue;

    const effectiveVote = v.vote;
    if (effectiveVote) yesCount++;
    else noCount++;

    voteRecords.push({
      voterId: v.voterId,
      voterName: voter.name,
      voted: effectiveVote,
    });
  }

  const passed = yesCount > noCount;
  const voteResult: VoteResult = {
    nomineeId: nominee.id,
    nomineeName: nominee.name,
    votes: voteRecords,
    totalYes: yesCount,
    totalNo: noCount,
    passed,
  };

  game.voteResults.push(voteResult);

  addEvent(game, {
    type: 'vote',
    actorId: 'system',
    targetId: nominee.id,
    description: `Vote on ${nominee.name}: ${yesCount} for, ${noCount} against. ${passed ? 'EXECUTED!' : 'Survives.'}`,
    descriptionCN: `对 ${nominee.name} 的投票：${yesCount} 票赞成，${noCount} 票反对。${passed ? '处决！' : '幸存。'}`,
    isPublic: true,
  });

  if (passed) {
    // Execute the nominee
    nominee.isAlive = false;
    nominee.status = 'dead';
    nominee.ghostVote = true;

    addEvent(game, {
      type: 'execution',
      actorId: 'system',
      targetId: nominee.id,
      description: `${nominee.name} was executed. They were the ${CHARACTERS[nominee.characterId]?.name || 'Unknown'}.`,
      descriptionCN: `${nominee.name} 被处决。其角色是${CHARACTERS[nominee.characterId]?.nameCN || '未知'}。`,
      isPublic: true,
    });

    // Saint check
    if (CHARACTERS[nominee.characterId]?.id === 'saint') {
      game.winner = 'evil';
      game.phase = 'ended';
      addEvent(game, {
        type: 'game-end',
        actorId: 'system',
        targetId: null,
        description: 'The Saint was executed! Evil wins!',
        descriptionCN: '圣徒被处决！邪恶阵营获胜！',
        isPublic: true,
      });
      return game;
    }

    // Scarlet Woman check
    if (CHARACTERS[nominee.characterId]?.faction === 'demon') {
      const aliveCount = game.players.filter(p => p.isAlive).length;
      if (aliveCount >= 5) {
        const scarletWoman = game.players.find(
          p => p.isAlive && CHARACTERS[p.characterId]?.id === 'scarlet_woman'
        );
        if (scarletWoman) {
          scarletWoman.characterId = 'imp';
          scarletWoman.team = 'evil';
          addEvent(game, {
            type: 'ability',
            actorId: scarletWoman.id,
            targetId: null,
            description: 'The Scarlet Woman becomes the new Imp!',
            descriptionCN: '猩红女人变成了新的小恶魔！',
            isPublic: true,
          });
        }
      }
    }
  }

  // Check win conditions
  const winner = checkWinCondition(game);
  if (winner) {
    game.winner = winner;
    game.phase = 'ended';
  } else {
    game.phase = 'day-nomination';
    game.currentNominee = null;
  }

  game.updatedAt = Date.now();
  return game;
}

/** End the day phase and start the next night */
export function endDayPhase(gameId: string): GameState {
  const game = activeGames.get(gameId);
  if (!game) throw new Error('Game not found');

  game.round++;
  game.phase = 'night';
  game.nightActions = [];
  game.currentNominee = null;

  addEvent(game, {
    type: 'phase-change',
    actorId: 'system',
    targetId: null,
    description: `Night ${game.round} falls...`,
    descriptionCN: `第${game.round}夜降临...`,
    isPublic: true,
  });

  game.updatedAt = Date.now();
  return game;
}

/** Add a discussion message */
export function addDiscussion(gameId: string, playerId: string, content: string): GameState {
  const game = activeGames.get(gameId);
  if (!game) throw new Error('Game not found');

  const player = game.players.find(p => p.id === playerId);
  if (!player) throw new Error('Player not found');

  const message: DiscussionMessage = {
    id: generateId(),
    playerId,
    playerName: player.name,
    content,
    isHuman: player.isHuman,
    round: game.round,
    timestamp: Date.now(),
  };

  game.discussions.push(message);
  game.updatedAt = Date.now();
  return game;
}

/** Process storyteller action */
export function processStorytellerAction(
  gameId: string,
  action: string,
  targetId?: string,
  _characterId?: string
): GameState {
  const game = activeGames.get(gameId);
  if (!game) throw new Error('Game not found');
  if (game.mode !== 'storyteller') throw new Error('Not in storyteller mode');

  const target = targetId ? game.players.find(p => p.id === targetId) : null;

  switch (action) {
    case 'kill':
      if (target && target.isAlive) {
        target.isAlive = false;
        target.status = 'dead';
        target.ghostVote = true;
        addEvent(game, {
          type: 'death',
          actorId: 'storyteller',
          targetId: target.id,
          description: `The Storyteller kills ${target.name}.`,
          descriptionCN: `说书人杀死了 ${target.name}。`,
          isPublic: true,
        });
      }
      break;
    case 'revive':
      if (target && !target.isAlive) {
        target.isAlive = true;
        target.status = 'normal';
        target.ghostVote = false;
        addEvent(game, {
          type: 'ability',
          actorId: 'storyteller',
          targetId: target.id,
          description: `The Storyteller revives ${target.name}.`,
          descriptionCN: `说书人复活了 ${target.name}。`,
          isPublic: true,
        });
      }
      break;
    case 'poison':
      if (target) {
        target.status = 'poisoned';
        addEvent(game, {
          type: 'ability',
          actorId: 'storyteller',
          targetId: target.id,
          description: `The Storyteller poisons ${target.name}.`,
          descriptionCN: `说书人投毒了 ${target.name}。`,
          isPublic: false,
        });
      }
      break;
    case 'sober':
      if (target) {
        target.status = 'normal';
        addEvent(game, {
          type: 'ability',
          actorId: 'storyteller',
          targetId: target.id,
          description: `The Storyteller sobers ${target.name}.`,
          descriptionCN: `说书人使 ${target.name} 恢复清醒。`,
          isPublic: false,
        });
      }
      break;
    case 'advance-phase':
      if (game.phase === 'night') {
        return resolveNightPhase(gameId);
      } else if (game.phase === 'day-discussion') {
        return startNominationPhase(gameId);
      } else if (game.phase === 'day-nomination' || game.phase === 'day-vote') {
        return endDayPhase(gameId);
      }
      break;
  }

  // Check win conditions after storyteller action
  const winner = checkWinCondition(game);
  if (winner) {
    game.winner = winner;
    game.phase = 'ended';
  }

  game.updatedAt = Date.now();
  return game;
}

/** Submit a night action */
export function submitNightAction(
  gameId: string,
  playerId: string,
  targetIds: string[],
  result?: string
): GameState {
  const game = activeGames.get(gameId);
  if (!game) throw new Error('Game not found');

  game.nightActions.push({
    playerId,
    targetId: targetIds[0] || null,
    abilityResult: result || null,
  });

  game.updatedAt = Date.now();
  return game;
}

/** Check win conditions */
function checkWinCondition(game: GameState): Team | null {
  const alivePlayers = game.players.filter(p => p.isAlive);

  // Good wins if the Demon is dead
  const demonAlive = alivePlayers.some(p => CHARACTERS[p.characterId]?.faction === 'demon');
  if (!demonAlive) return 'good';

  // Evil wins if only 2 players remain alive
  if (alivePlayers.length <= 2) return 'evil';

  // Mayor check - if 3 players alive and no execution
  // This is checked during the vote phase

  return null;
}

/** Add event to game log */
function addEvent(
  game: GameState,
  params: {
    type: EventType;
    actorId: string;
    targetId: string | null;
    description: string;
    descriptionCN: string;
    isPublic: boolean;
  }
): void {
  game.events.push({
    id: generateId(),
    round: game.round,
    phase: game.phase,
    ...params,
    timestamp: Date.now(),
  });
}

/** Get all active games */
export function getAllGames(): GameState[] {
  return Array.from(activeGames.values());
}

/** Delete a game */
export function deleteGame(gameId: string): boolean {
  return activeGames.delete(gameId);
}
