/**
 * Blood on the Clocktower - AI Player Engine
 * Powered by Tencent Hunyuan LLM
 */

import { CHARACTERS } from './characters.js';
import type { GameState, Player, DiscussionMessage } from './types.js';

interface HunyuanMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface HunyuanResponse {
  choices: { message: { content: string } }[];
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

/** Build system prompt for an AI player based on their role */
function buildSystemPrompt(player: Player, game: GameState): string {
  const charDef = CHARACTERS[player.characterId];
  if (!charDef) return 'You are a player in a social deduction game.';

  const alivePlayers = game.players.filter(p => p.isAlive && p.id !== player.id);
  const deadPlayers = game.players.filter(p => !p.isAlive);
  const isEvil = player.team === 'evil';

  let prompt = `你正在参加一场"血染钟楼"社交推理游戏。

## 你的身份
- 你的名字：${player.name}
- 你的角色：${charDef.nameCN}（${charDef.name}）
- 你的阵营：${player.team === 'good' ? '好人' : '邪恶'}
- 你的能力：${charDef.abilityCN}

## 角色策略提示
${charDef.promptHint}

## 当前游戏状态
- 第 ${game.round} 回合
- 当前阶段：${phaseToCN(game.phase)}
- 存活玩家：${alivePlayers.map(p => p.name).join('、')}
- 已死亡玩家：${deadPlayers.map(p => `${p.name}（${CHARACTERS[p.characterId]?.nameCN || '未知'}）`).join('、')}

## 行为规则
- 以${player.name}的身份发言，使用第一人称
- 保持角色一致性，你的发言要符合你的角色和阵营
- ${isEvil
    ? '你是邪恶阵营！你需要伪装成好人，误导其他玩家，保护恶魔不被发现。不要暴露自己的真实角色。'
    : '你是好人阵营！你需要分享信息，推理谁是恶魔，但要谨慎——不是所有信息都可靠。'
}
- 发言简洁有力，像真实玩家一样自然
- 每次发言控制在2-4句话
- 可以质疑其他玩家的说法，也可以为自己辩护
- 如果有人指控你，你要合理地反驳`;

  // Add evil team information
  if (isEvil) {
    const evilTeammates = game.players.filter(
      p => p.id !== player.id && p.team === 'evil' && p.isAlive
    );
    if (evilTeammates.length > 0) {
      prompt += `\n\n## 邪恶队友（保密！）\n${evilTeammates.map(p => `- ${p.name}（${CHARACTERS[p.characterId]?.nameCN}）`).join('\n')}`;
    }
  }

  // Add night result
  if (player.lastNightResult) {
    prompt += `\n\n## 昨晚你得知的信息\n${player.lastNightResult}`;
  }

  return prompt;
}

/** Convert phase to Chinese */
function phaseToCN(phase: string): string {
  const map: Record<string, string> = {
    'night': '夜晚',
    'day-discussion': '白天讨论',
    'day-nomination': '白天提名',
    'day-vote': '白天投票',
    'day-execution': '处决',
    'ended': '游戏结束',
  };
  return map[phase] || phase;
}

/** Generate AI discussion message */
export async function generateDiscussion(
  player: Player,
  game: GameState,
  recentMessages: DiscussionMessage[]
): Promise<string> {
  const systemPrompt = buildSystemPrompt(player, game);

  const conversationHistory: HunyuanMessage[] = recentMessages.slice(-10).map(msg => ({
    role: msg.isHuman ? 'user' as const : 'assistant' as const,
    content: msg.isHuman ? `${msg.playerName}：${msg.content}` : msg.content,
  }));

  const userMessage: HunyuanMessage = {
    role: 'user',
    content: `现在是讨论阶段，请以${player.name}的身份发表你的看法。你可以说出你掌握的信息，质疑其他玩家，或者为自己辩护。请直接输出你的发言内容（不需要角色名前缀）。`,
  };

  try {
    const response = await callHunyuan([{
      role: 'system',
      content: systemPrompt,
    }, ...conversationHistory, userMessage]);

    return response.trim();
  } catch (error) {
    console.error('Hunyuan API error:', error);
    // Fallback: generate a simple response
    return generateFallbackDiscussion(player, game);
  }
}

/** Generate AI night action decision */
export async function generateNightAction(
  player: Player,
  game: GameState
): Promise<{ targetIds: string[]; reasoning: string }> {
  const charDef = CHARACTERS[player.characterId];
  if (!charDef) return { targetIds: [], reasoning: '' };

  const systemPrompt = buildSystemPrompt(player, game);

  const alivePlayers = game.players.filter(p => p.isAlive && p.id !== player.id);
  const targetList = alivePlayers.map(p => `${p.name}（ID: ${p.id}）`).join('\n');

  const userMessage: HunyuanMessage = {
    role: 'user',
    content: `现在是夜晚阶段，你需要使用你的能力"${charDef.abilityCN}"。
请选择目标玩家并说明你的理由。

可选目标：
${targetList}

请按以下JSON格式回复：
{"targetName": "玩家名", "reasoning": "你的理由"}`,
  };

  try {
    const response = await callHunyuan([{
      role: 'system',
      content: systemPrompt,
    }, userMessage]);

    const parsed = JSON.parse(response.replace(/```json\n?|```\n?/g, '').trim());
    const target = alivePlayers.find(p => p.name === parsed.targetName);
    return {
      targetIds: target ? [target.id] : [alivePlayers[0]?.id || ''],
      reasoning: parsed.reasoning || '',
    };
  } catch (error) {
    console.error('Hunyuan night action error:', error);
    // Fallback: random target
    const randomTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    return {
      targetIds: randomTarget ? [randomTarget.id] : [],
      reasoning: `基于当前局势选择目标。`,
    };
  }
}

/** Generate AI vote decision */
export async function generateVoteDecision(
  player: Player,
  game: GameState,
  nomineeName: string,
  nomineeId: string
): Promise<{ vote: boolean; reasoning: string }> {
  // Character definition available via CHARACTERS[player.characterId] if needed

  const systemPrompt = buildSystemPrompt(player, game);

  const userMessage: HunyuanMessage = {
    role: 'user',
    content: `现在需要对 ${nomineeName} 的提名进行投票。
${player.team === 'evil' ? `注意：${nomineeName}是${CHARACTERS[game.players.find(p => p.id === nomineeId)?.characterId || '']?.faction === 'demon' ? '你的恶魔队友！你应该投反对票。' : '不是你的队友，你可以投赞成票来伪装。'}` : '请根据你的判断投票。'}

请按以下JSON格式回复：
{"vote": true/false, "reasoning": "你的理由"}`,
  };

  try {
    const response = await callHunyuan([{
      role: 'system',
      content: systemPrompt,
    }, userMessage]);

    const parsed = JSON.parse(response.replace(/```json\n?|```\n?/g, '').trim());
    return {
      vote: Boolean(parsed.vote),
      reasoning: parsed.reasoning || '',
    };
  } catch (error) {
    console.error('Hunyuan vote error:', error);
    return {
      vote: player.team === 'evil' ? (CHARACTERS[game.players.find(p => p.id === nomineeId)?.characterId || '']?.faction !== 'demon') : Math.random() > 0.5,
      reasoning: '基于局势判断。',
    };
  }
}

/** Generate AI nomination decision */
export async function generateNominationDecision(
  player: Player,
  game: GameState
): Promise<{ nomineeId: string | null; reasoning: string }> {
  const charDef = CHARACTERS[player.characterId];
  if (!charDef) return { nomineeId: null, reasoning: '' };

  const systemPrompt = buildSystemPrompt(player, game);

  const alivePlayers = game.players.filter(p => p.isAlive && p.id !== player.id);
  const targetList = alivePlayers.map(p => `${p.name}（ID: ${p.id}）`).join('\n');

  const userMessage: HunyuanMessage = {
    role: 'user',
    content: `现在是提名阶段，你可以选择提名一名玩家进行处决，或者选择不提名。

可选目标：
${targetList}

请按以下JSON格式回复：
{"nomineeName": "玩家名或null", "reasoning": "你的理由"}`,
  };

  try {
    const response = await callHunyuan([{
      role: 'system',
      content: systemPrompt,
    }, userMessage]);

    const parsed = JSON.parse(response.replace(/```json\n?|```\n?/g, '').trim());
    if (parsed.nomineeName === null || parsed.nomineeName === 'null') {
      return { nomineeId: null, reasoning: parsed.reasoning || '' };
    }
    const target = alivePlayers.find(p => p.name === parsed.nomineeName);
    return {
      nomineeId: target?.id || null,
      reasoning: parsed.reasoning || '',
    };
  } catch (error) {
    console.error('Hunyuan nomination error:', error);
    return { nomineeId: null, reasoning: '' };
  }
}

/** Call Hunyuan API */
async function callHunyuan(messages: HunyuanMessage[]): Promise<string> {
  const apiKey = process.env.HUNYUAN_API_KEY;
  if (!apiKey) {
    throw new Error('HUNYUAN_API_KEY not configured');
  }

  const response = await fetch('https://api.hunyuan.cloud.tencent.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'hunyuan-lite',
      messages,
      temperature: 0.8,
      max_tokens: 300,
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hunyuan API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as HunyuanResponse;
  return data.choices[0]?.message?.content || '';
}

/** Fallback discussion generator when API is unavailable */
function generateFallbackDiscussion(player: Player, game: GameState): string {
  const isEvil = player.team === 'evil';
  const aliveOthers = game.players.filter(p => p.isAlive && p.id !== player.id);
  const randomOther = aliveOthers[Math.floor(Math.random() * aliveOthers.length)];

  if (isEvil) {
    const evilLines = [
      `我觉得${randomOther?.name}的发言很可疑，大家要注意。`,
      `我是好人，我掌握了一些信息，但现在还不是公开的时候。`,
      `我认为我们需要更仔细地分析目前的局面。`,
      `有没有人能提供更多关于昨晚的信息？`,
    ];
    return evilLines[Math.floor(Math.random() * evilLines.length)];
  }

  const goodLines = [
    `根据我掌握的信息，我觉得${randomOther?.name}值得怀疑。`,
    `我倾向于相信目前大多数人的判断，但我们不能掉以轻心。`,
    `我的能力告诉我一些信息，但我需要更多证据。`,
    `让我们冷静分析，不要被情绪左右。`,
  ];
  return goodLines[Math.floor(Math.random() * goodLines.length)];
}
