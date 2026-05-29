/**
 * Blood on the Clocktower - Frontend Game Engine
 * All game logic runs in the browser, no backend needed
 */

import { CHARACTERS, getDefaultSetup } from './characters';
import type { GameState, Player, GameEvent, GameMode, GamePhase, DiscussionMessage, VoteResult, Team, EventType } from './types';

const AI_NAMES = [
  '阿德里安', '贝拉特里克斯', '卡桑德拉', '多里安', '埃莉诺',
  '费利克斯', '格温多林', '赫克托', '伊索尔德', '贾斯珀',
  '卡特琳娜', '卢修斯', '玛格丽特', '尼科莱塔', '奥菲莉亚',
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function addEvent(
  game: GameState,
  params: { type: EventType; actorId: string; targetId: string | null; description: string; descriptionCN: string; isPublic: boolean }
): void {
  game.events.push({ id: generateId(), round: game.round, phase: game.phase, ...params, timestamp: Date.now() });
}

function checkWinCondition(game: GameState): Team | null {
  const alive = game.players.filter(p => p.isAlive);
  if (!alive.some(p => CHARACTERS[p.characterId]?.faction === 'demon')) return 'good';
  if (alive.length <= 2) return 'evil';
  return null;
}

export function createGame(playerCount: number, mode: GameMode, humanName: string): GameState {
  const id = generateId();
  const characters = getDefaultSetup(playerCount);
  const players: Player[] = [];

  players.push({
    id: 'human', name: humanName || '你', isHuman: true, isAlive: true,
    position: 0, characterId: '', team: 'good', status: 'normal',
    ghostVote: false, nomination: null, voteCount: 0, lastNightResult: null,
  });

  const aiCount = playerCount - 1;
  const shuffledNames = [...AI_NAMES].sort(() => Math.random() - 0.5);
  for (let i = 0; i < aiCount; i++) {
    players.push({
      id: `ai-${i + 1}`, name: shuffledNames[i], isHuman: false, isAlive: true,
      position: i + 1, characterId: '', team: 'good', status: 'normal',
      ghostVote: false, nomination: null, voteCount: 0, lastNightResult: null,
    });
  }

  const game: GameState = {
    id, mode, phase: 'lobby', round: 0, players, events: [], discussions: [],
    winner: null, currentNominee: null, nightActions: [], voteResults: [],
    playerCount, createdAt: Date.now(), updatedAt: Date.now(),
  };
  return game;
}

export function startGame(game: GameState): GameState {
  if (game.phase !== 'lobby') return game;

  const characterIds = [...getDefaultSetup(game.playerCount)].sort(() => Math.random() - 0.5);
  game.players.forEach((player, index) => {
    player.characterId = characterIds[index % characterIds.length];
    const charDef = CHARACTERS[player.characterId];
    if (charDef) player.team = charDef.team;
  });

  // In player mode, ensure human is not the Demon
  if (game.mode === 'player') {
    const human = game.players.find(p => p.isHuman);
    if (human && CHARACTERS[human.characterId]?.faction === 'demon') {
      const townsfolk = game.players.find(p => !p.isHuman && CHARACTERS[p.characterId]?.faction === 'townsfolk');
      if (townsfolk) {
        const temp = human.characterId;
        human.characterId = townsfolk.characterId;
        townsfolk.characterId = temp;
        human.team = CHARACTERS[human.characterId]?.team || 'good';
        townsfolk.team = CHARACTERS[townsfolk.characterId]?.team || 'evil';
      }
    }
  }

  game.round = 1;
  game.phase = 'night';

  addEvent(game, { type: 'game-start', actorId: 'system', targetId: null, description: 'The game begins.', descriptionCN: '游戏开始。夜幕降临村庄...', isPublic: true });
  addEvent(game, { type: 'phase-change', actorId: 'system', targetId: null, description: `Night ${game.round}`, descriptionCN: `第${game.round}夜 - 拥有夜晚能力的角色，睁开你的眼睛...`, isPublic: true });

  // Generate first-night information for human player
  generateNightInfo(game);

  game.updatedAt = Date.now();
  return game;
}

function generateNightInfo(game: GameState): void {
  const human = game.players.find(p => p.isHuman);
  if (!human || !human.isAlive) return;

  const charDef = CHARACTERS[human.characterId];
  if (!charDef || !charDef.nightAction) return;
  if (game.round === 1 && !charDef.firstNight) return;

  const aliveOthers = game.players.filter(p => p.isAlive && p.id !== human.id);
  if (aliveOthers.length < 2) return;

  const shuffled = [...aliveOthers].sort(() => Math.random() - 0.5);
  const target1 = shuffled[0];
  const target2 = shuffled[1];
  const targetChar = CHARACTERS[target2.characterId];

  if (charDef.id === 'fortune_teller') {
    const isDemon = CHARACTERS[target1.characterId]?.faction === 'demon' || CHARACTERS[target2.characterId]?.faction === 'demon';
    human.lastNightResult = isDemon
      ? `你调查的 ${target1.name} 和 ${target2.name} 中有恶魔！`
      : `你调查的 ${target1.name} 和 ${target2.name} 中没有恶魔。`;
  } else if (charDef.id === 'empath') {
    const neighborEvil = aliveOthers.filter(p => {
      const posDiff = Math.abs(p.position - human.position);
      return (posDiff <= 1 || posDiff >= game.players.length - 1) && p.team === 'evil';
    }).length;
    human.lastNightResult = `你的存活邻居中有 ${neighborEvil} 名邪恶玩家。`;
  } else if (charDef.abilityType === 'information') {
    human.lastNightResult = `你得知 ${target1.name} 和 ${target2.name} 中，有一名是${targetChar ? CHARACTERS[target2.characterId]?.nameCN : '特定角色'}。`;
  }
}

export function resolveNight(game: GameState, humanTargetId?: string): GameState {
  // AI Demon kills
  const demon = game.players.find(p => p.isAlive && CHARACTERS[p.characterId]?.faction === 'demon');
  if (demon) {
    const aliveTargets = game.players.filter(p => p.isAlive && p.id !== demon.id);
    // AI demon picks a target (avoid soldier, prefer non-evil)
    const preferred = aliveTargets.filter(p => p.team === 'good' && CHARACTERS[p.characterId]?.id !== 'soldier');
    const target = preferred.length > 0
      ? preferred[Math.floor(Math.random() * preferred.length)]
      : aliveTargets[Math.floor(Math.random() * aliveTargets.length)];

    if (target) {
      // Check monk protection
      const monk = game.players.find(p => p.isAlive && CHARACTERS[p.characterId]?.id === 'monk');
      const isProtected = monk && humanTargetId === target.id; // simplified

      if (!isProtected && CHARACTERS[target.characterId]?.id !== 'soldier') {
        target.isAlive = false;
        target.status = 'dead';
        target.ghostVote = true;
        addEvent(game, { type: 'death', actorId: demon.id, targetId: target.id, description: `${target.name} was found dead.`, descriptionCN: `${target.name} 今早被发现死亡。`, isPublic: true });
      }
    }
  }

  // Process human night action
  if (humanTargetId && game.mode === 'player') {
    const human = game.players.find(p => p.isHuman);
    if (human?.isAlive) {
      const charDef = CHARACTERS[human.characterId];
      if (charDef?.id === 'monk') {
        addEvent(game, { type: 'ability', actorId: human.id, targetId: humanTargetId, description: `${human.name} protects someone.`, descriptionCN: `你保护了一名玩家免受恶魔侵害。`, isPublic: false });
      } else if (charDef?.id === 'ravenkeeper' && !human.isAlive) {
        const target = game.players.find(p => p.id === humanTargetId);
        if (target) {
          const isDemon = CHARACTERS[target.characterId]?.faction === 'demon';
          human.lastNightResult = isDemon
            ? `${target.name} 可能是恶魔！`
            : `${target.name} 不是恶魔。`;
        }
      }
    }
  }

  // Poisoner AI action
  const poisoner = game.players.find(p => p.isAlive && CHARACTERS[p.characterId]?.id === 'poisoner');
  if (poisoner) {
    const goodTargets = game.players.filter(p => p.isAlive && p.team === 'good' && !p.isHuman);
    const poisonTarget = goodTargets[Math.floor(Math.random() * goodTargets.length)];
    if (poisonTarget) {
      poisonTarget.status = 'poisoned';
    }
  }

  // Check win
  const winner = checkWinCondition(game);
  if (winner) {
    game.winner = winner;
    game.phase = 'ended';
    addEvent(game, { type: 'game-end', actorId: 'system', targetId: null, description: `${winner} wins!`, descriptionCN: `${winner === 'good' ? '好人' : '邪恶'}阵营获胜！`, isPublic: true });
  } else {
    game.phase = 'day-discussion';
    addEvent(game, { type: 'phase-change', actorId: 'system', targetId: null, description: 'Day breaks.', descriptionCN: '天亮了。村民们聚集在一起讨论...', isPublic: true });
  }

  game.updatedAt = Date.now();
  return game;
}

export function startNomination(game: GameState): GameState {
  game.phase = 'day-nomination';
  addEvent(game, { type: 'phase-change', actorId: 'system', targetId: null, description: 'Nomination phase.', descriptionCN: '提名阶段开始。谁被指控？', isPublic: true });
  game.updatedAt = Date.now();
  return game;
}

export function nominate(game: GameState, nominatorId: string, nomineeId: string): GameState {
  const nominator = game.players.find(p => p.id === nominatorId);
  const nominee = game.players.find(p => p.id === nomineeId);
  if (!nominator || !nominee || !nominator.isAlive || !nominee.isAlive) return game;

  // Virgin check
  if (CHARACTERS[nominee.characterId]?.id === 'virgin' && CHARACTERS[nominator.characterId]?.faction === 'townsfolk') {
    nominator.isAlive = false;
    nominator.status = 'dead';
    nominator.ghostVote = true;
    addEvent(game, { type: 'ability', actorId: nominee.id, targetId: nominator.id, description: `Virgin triggered!`, descriptionCN: `${nominator.name} 提名了处女！${nominator.name} 被处决。`, isPublic: true });
    const winner = checkWinCondition(game);
    if (winner) { game.winner = winner; game.phase = 'ended'; }
    return game;
  }

  game.currentNominee = nomineeId;
  game.phase = 'day-vote';
  addEvent(game, { type: 'nomination', actorId: nominatorId, targetId: nomineeId, description: `${nominator.name} nominates ${nominee.name}.`, descriptionCN: `${nominator.name} 提名处决 ${nominee.name}。`, isPublic: true });
  game.updatedAt = Date.now();
  return game;
}

export function processVote(game: GameState, humanVote: boolean): GameState {
  const nominee = game.players.find(p => p.id === game.currentNominee);
  if (!nominee) return game;

  // Collect votes
  let yesCount = 0;
  let noCount = 0;
  const voteRecords: { voterId: string; voterName: string; voted: boolean }[] = [];

  // Human vote
  if (humanVote) yesCount++; else noCount++;
  const human = game.players.find(p => p.isHuman);
  if (human) voteRecords.push({ voterId: human.id, voterName: human.name, voted: humanVote });

  // AI votes
  const aiVoters = game.players.filter(p => !p.isHuman && (p.isAlive || p.ghostVote));
  for (const ai of aiVoters) {
    const isEvil = ai.team === 'evil';
    const nomineeIsDemon = CHARACTERS[nominee.characterId]?.faction === 'demon';
    // Evil protects demon, good votes to execute suspects
    const vote = isEvil ? !nomineeIsDemon : Math.random() > 0.35;
    if (vote) yesCount++; else noCount++;
    voteRecords.push({ voterId: ai.id, voterName: ai.name, voted: vote });
  }

  const passed = yesCount > noCount;
  const voteResult: VoteResult = { nomineeId: nominee.id, nomineeName: nominee.name, votes: voteRecords, totalYes: yesCount, totalNo: noCount, passed };
  game.voteResults.push(voteResult);

  addEvent(game, { type: 'vote', actorId: 'system', targetId: nominee.id, description: `Vote: ${yesCount}-${noCount}. ${passed ? 'Executed!' : 'Survives.'}`, descriptionCN: `投票结果：${yesCount} 票赞成，${noCount} 票反对。${passed ? '处决！' : '幸存。'}`, isPublic: true });

  if (passed) {
    nominee.isAlive = false;
    nominee.status = 'dead';
    nominee.ghostVote = true;
    const charInfo = CHARACTERS[nominee.characterId];
    addEvent(game, { type: 'execution', actorId: 'system', targetId: nominee.id, description: `${nominee.name} was executed. They were the ${charInfo?.name}.`, descriptionCN: `${nominee.name} 被处决。其角色是${charInfo?.nameCN || '未知'}。`, isPublic: true });

    // Saint check
    if (charInfo?.id === 'saint') {
      game.winner = 'evil';
      game.phase = 'ended';
      addEvent(game, { type: 'game-end', actorId: 'system', targetId: null, description: 'Saint executed! Evil wins!', descriptionCN: '圣徒被处决！邪恶阵营获胜！', isPublic: true });
      return game;
    }

    // Scarlet Woman check
    if (charInfo?.faction === 'demon') {
      const aliveCount = game.players.filter(p => p.isAlive).length;
      if (aliveCount >= 5) {
        const sw = game.players.find(p => p.isAlive && CHARACTERS[p.characterId]?.id === 'scarlet_woman');
        if (sw) {
          sw.characterId = 'imp';
          sw.team = 'evil';
          addEvent(game, { type: 'ability', actorId: sw.id, targetId: null, description: 'Scarlet Woman becomes Imp!', descriptionCN: '猩红女人变成了新的小恶魔！', isPublic: true });
        }
      }
    }
  }

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

export function endDay(game: GameState): GameState {
  game.round++;
  game.phase = 'night';
  game.nightActions = [];
  game.currentNominee = null;

  addEvent(game, { type: 'phase-change', actorId: 'system', targetId: null, description: `Night ${game.round}`, descriptionCN: `第${game.round}夜降临...`, isPublic: true });

  // Generate night info for human
  generateNightInfo(game);

  game.updatedAt = Date.now();
  return game;
}

export function addDiscussion(game: GameState, playerId: string, content: string): GameState {
  const player = game.players.find(p => p.id === playerId);
  if (!player) return game;
  game.discussions.push({
    id: generateId(), playerId, playerName: player.name, content,
    isHuman: player.isHuman, round: game.round, timestamp: Date.now(),
  });
  game.updatedAt = Date.now();
  return game;
}

/** Generate AI discussion messages (local, no API needed) */
export function generateAiDiscussions(game: GameState): DiscussionMessage[] {
  const aiPlayers = game.players.filter(p => !p.isHuman && p.isAlive);
  const messages: DiscussionMessage[] = [];

  const evilBluffs = [
    '我觉得{target}的发言很可疑，大家注意一下。',
    '我是好人，我掌握了一些信息，但现在还不方便公开。',
    '我们需要更仔细地分析目前的局面，不要被带偏了。',
    '有没有人能提供更多关于昨晚的信息？',
    '我倾向于相信大多数人的判断，但我们要保持警惕。',
    '目前的局势很不明朗，我建议我们多讨论一轮再投票。',
  ];

  const goodStatements = [
    '根据我掌握的信息，{target}值得怀疑。',
    '我倾向于相信{ally}的说法，逻辑上说得通。',
    '我的能力告诉我一些信息，但我需要更多证据才能确定。',
    '让我们冷静分析，不要被情绪左右。',
    '我觉得我们应该重点关注最近沉默的玩家。',
    '{target}的说法和我的信息有冲突，我怀疑其在说谎。',
  ];

  for (const ai of aiPlayers) {
    const aliveOthers = game.players.filter(p => p.isAlive && p.id !== ai.id);
    const randomTarget = aliveOthers[Math.floor(Math.random() * aliveOthers.length)];
    const randomAlly = aliveOthers.find(p => p.team === ai.team && p.id !== ai.id) || aliveOthers[0];

    const templates = ai.team === 'evil' ? evilBluffs : goodStatements;
    const template = templates[Math.floor(Math.random() * templates.length)];
    const content = template
      .replace('{target}', randomTarget?.name || '某人')
      .replace('{ally}', randomAlly?.name || '某人');

    messages.push({
      id: generateId(), playerId: ai.id, playerName: ai.name, content,
      isHuman: false, round: game.round, timestamp: Date.now(),
    });
  }

  return messages;
}
