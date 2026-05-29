/**
 * Blood on the Clocktower - AI Agent Configuration System
 * 
 * Each AI player is an independent agent with customizable personality,
 * strategy, and API endpoint. The Storyteller is also an agent that
 * dynamically balances the game.
 */

// ==================== AI Provider System ====================

export type AIProviderType = 'hunyuan' | 'openai' | 'custom';

export interface AIProvider {
  id: string;
  name: string;
  type: AIProviderType;
  /** API endpoint URL */
  endpoint: string;
  /** API key (stored locally, never sent to server) */
  apiKey: string;
  /** Model name to use */
  model: string;
  /** Temperature for generation */
  temperature: number;
  /** Max tokens per response */
  maxTokens: number;
}

// ==================== AI Agent Personality ====================

export type PersonalityArchetype =
  | 'aggressive'     // 攻击型：主动指控、强势发言
  | 'analytical'     // 分析型：冷静推理、注重逻辑
  | 'deceptive'      // 欺骗型：擅长伪装、误导对手
  | 'quiet'          // 沉默型：少发言、关键时刻才表态
  | 'charismatic'    // 魅力型：说服力强、善于拉拢
  | 'paranoid'       // 多疑型：怀疑所有人、容易指控
  | 'loyal'          // 忠诚型：坚定立场、不易动摇
  | 'opportunistic'; // 投机型：见风使舵、随大流

export interface AIAgentConfig {
  /** Unique ID for this agent */
  id: string;
  /** Display name in game */
  name: string;
  /** Avatar emoji */
  avatar: string;
  
  // === Personality ===
  /** Personality archetype - determines base behavior */
  archetype: PersonalityArchetype;
  /** Custom personality description (overrides archetype if provided) */
  personalityPrompt: string;
  /** Speaking style description */
  speakingStyle: string;
  /** How aggressive this agent is (0-1) */
  aggressiveness: number;
  /** How likely to bluff (0-1) */
  bluffTendency: number;
  /** How much info to share (0-1) */
  informationSharing: number;
  
  // === Strategy ===
  /** Strategy description for the agent */
  strategyPrompt: string;
  /** How much this agent trusts other players (affects voting) */
  trustLevels: Record<string, number>;
  
  // === AI Provider ===
  /** Which AI provider to use (by ID) */
  providerId: string;
  /** System prompt template - {personality}, {role}, {gameState} placeholders */
  systemPromptTemplate: string;
}

// ==================== Storyteller Agent ====================

export interface StorytellerAgentConfig {
  /** Whether the storyteller is AI or human */
  isAI: boolean;
  
  // === AI Storyteller Settings (only if isAI) ===
  /** AI provider for storyteller */
  providerId: string;
  
  /** Balance philosophy */
  balanceStyle: 'narrative' | 'competitive' | 'chaotic';
  
  /** Custom storyteller prompt */
  storytellerPrompt: string;
  
  /** How much the storyteller intervenes (0=passive, 1=active) */
  interventionLevel: number;
  
  /** Whether to give subtle hints to struggling players */
  giveHints: boolean;
  
  /** Whether to add dramatic twists */
  dramaticTwists: boolean;
}

// ==================== Default Configs ====================

export const DEFAULT_PROVIDERS: AIProvider[] = [
  {
    id: 'hunyuan',
    name: '腾讯混元',
    type: 'hunyuan',
    endpoint: 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions',
    apiKey: '',
    model: 'hunyuan-lite',
    temperature: 0.8,
    maxTokens: 300,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    model: 'gpt-4o-mini',
    temperature: 0.8,
    maxTokens: 300,
  },
  {
    id: 'custom',
    name: '自定义 API',
    type: 'custom',
    endpoint: '',
    apiKey: '',
    model: '',
    temperature: 0.8,
    maxTokens: 300,
  },
];

export const ARCHETYPE_DESCRIPTIONS: Record<PersonalityArchetype, { label: string; description: string; icon: string }> = {
  aggressive:   { label: '攻击型', description: '主动指控他人，强势发言，喜欢主导讨论', icon: '🔥' },
  analytical:   { label: '分析型', description: '冷静推理，注重逻辑，发言有条理', icon: '🧠' },
  deceptive:    { label: '欺骗型', description: '擅长伪装和误导，发言真假混杂', icon: '🎭' },
  quiet:        { label: '沉默型', description: '少发言，观察为主，关键时刻才表态', icon: '🤫' },
  charismatic:  { label: '魅力型', description: '说服力强，善于拉拢盟友，发言有感染力', icon: '✨' },
  paranoid:     { label: '多疑型', description: '怀疑所有人，容易指控，不轻易信任', icon: '😱' },
  loyal:        { label: '忠诚型', description: '坚定立场，不易动摇，守护盟友', icon: '🛡️' },
  opportunistic:{ label: '投机型', description: '见风使舵，随大流，审时度势', icon: '🦊' },
};

export const AVATARS = ['🧛', '🧙', '🧝', '🧟', '👻', '🦇', '🐺', '🦉', '🐍', '🕷️', '🦊', '🐱', '🦅', '🐉', '🦂'];

export function createDefaultAgent(index: number): AIAgentConfig {
  const archetypes: PersonalityArchetype[] = [
    'aggressive', 'analytical', 'deceptive', 'quiet',
    'charismatic', 'paranoid', 'loyal', 'opportunistic',
  ];
  const archetype = archetypes[index % archetypes.length];
  const desc = ARCHETYPE_DESCRIPTIONS[archetype];
  
  return {
    id: `agent-${index}`,
    name: '',
    avatar: AVATARS[index % AVATARS.length],
    archetype,
    personalityPrompt: '',
    speakingStyle: `${desc.label}风格：${desc.description}`,
    aggressiveness: archetype === 'aggressive' ? 0.9 : archetype === 'quiet' ? 0.2 : 0.5,
    bluffTendency: archetype === 'deceptive' ? 0.9 : archetype === 'loyal' ? 0.1 : 0.4,
    informationSharing: archetype === 'analytical' ? 0.8 : archetype === 'quiet' ? 0.3 : 0.5,
    strategyPrompt: '',
    trustLevels: {},
    providerId: 'hunyuan',
    systemPromptTemplate: `你是一名"血染钟楼"社交推理游戏的AI玩家。

## 你的身份
- 名字：{name}
- 性格：{personality}
- 说话风格：{speakingStyle}

## 你的角色
- 角色：{roleName}（{roleNameCN}）
- 阵营：{team}
- 能力：{abilityCN}

## 当前游戏状态
{gameState}

## 行为准则
- 以{name}的身份发言，使用第一人称
- 严格按照你的性格和策略行动
- 发言简洁有力，2-4句话
- {strategyHint}`,
  };
}

export function createDefaultStoryteller(): StorytellerAgentConfig {
  return {
    isAI: false,
    providerId: 'hunyuan',
    balanceStyle: 'narrative',
    storytellerPrompt: '',
    interventionLevel: 0.5,
    giveHints: false,
    dramaticTwists: true,
  };
}

// ==================== AI Agent Runtime ====================

export interface AIAgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Call the configured AI provider */
export async function callAI(
  provider: AIProvider,
  messages: AIAgentMessage[],
): Promise<string> {
  if (!provider.apiKey) {
    throw new Error(`API Key not configured for provider: ${provider.name}`);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Different auth headers per provider
  if (provider.type === 'hunyuan') {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
  } else {
    headers['Authorization'] = `Bearer ${provider.apiKey}`;
  }

  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: provider.temperature,
      max_tokens: provider.maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/** Build system prompt for an AI player */
export function buildAgentSystemPrompt(
  agent: AIAgentConfig,
  roleName: string,
  roleNameCN: string,
  team: string,
  abilityCN: string,
  gameState: string,
  strategyHint: string,
): string {
  let prompt = agent.systemPromptTemplate
    .replace('{name}', agent.name)
    .replace('{personality}', agent.personalityPrompt || ARCHETYPE_DESCRIPTIONS[agent.archetype].description)
    .replace('{speakingStyle}', agent.speakingStyle)
    .replace('{roleName}', roleName)
    .replace('{roleNameCN}', roleNameCN)
    .replace('{team}', team === 'good' ? '好人' : '邪恶')
    .replace('{abilityCN}', abilityCN)
    .replace('{gameState}', gameState)
    .replace('{strategyHint}', strategyHint);

  return prompt;
}

/** Build storyteller system prompt */
export function buildStorytellerPrompt(
  config: StorytellerAgentConfig,
  gameState: string,
): string {
  const balanceStyleDesc: Record<string, string> = {
    narrative: '叙事优先：注重故事的戏剧性和趣味性，让游戏体验更精彩',
    competitive: '竞技优先：严格公正，不偏袒任何一方，让技术决定胜负',
    chaotic: '混乱优先：制造意外和反转，让游戏充满不确定性',
  };

  return `你是一名"血染钟楼"的说书人（游戏主持人）。

## 你的职责
- 主持游戏进程，控制夜晚和白天的流程
- 根据局势做出公正或戏剧性的裁决
- 平衡游戏体验，确保双方都有机会获胜

## 你的风格
${balanceStyleDesc[config.balanceStyle]}

${config.storytellerPrompt ? `## 自定义指令\n${config.storytellerPrompt}\n` : ''}
## 介入程度
${config.interventionLevel < 0.3 ? '尽量少干预，让玩家自由发挥' :
  config.interventionLevel < 0.7 ? '适度干预，在关键节点引导节奏' :
  '积极干预，主动创造戏剧性时刻'}

${config.giveHints ? '## 提示规则\n当某一方明显处于劣势时，可以给出微妙的暗示帮助其翻盘\n' : ''}
${config.dramaticTwists ? '## 戏剧性反转\n在适当时机制造意外事件，如关键角色突然死亡、看似稳赢的局面被翻盘\n' : ''}

## 当前游戏状态
${gameState}

## 你的行动
请根据当前局势决定你的下一步行动。以JSON格式回复：
{"action": "kill/protect/hint/advance/narrate", "target": "玩家ID或null", "narration": "你的旁白描述", "reasoning": "你的决策理由"}`;
}
