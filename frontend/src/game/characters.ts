/**
 * Blood on the Clocktower - Character Definitions
 * All character roles with their abilities and properties
 */

export type Faction = 'townsfolk' | 'outsider' | 'minion' | 'demon';
export type AbilityType = 'information' | 'protection' | 'offensive' | 'passive' | 'revenge' | 'modifier';
export type Team = 'good' | 'evil';

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

export const CHARACTERS: Record<string, CharacterDef> = {
  // ==================== Townsfolk (Good) ====================
  washerwoman: {
    id: 'washerwoman', name: 'Washerwoman', nameCN: '洗衣妇',
    faction: 'townsfolk', team: 'good',
    ability: 'You start knowing that 1 of 2 players is a particular Townsfolk.',
    abilityCN: '你开始时知道两名玩家中有一名是特定的城镇居民。',
    abilityType: 'information', nightAction: true, firstNight: true, otherNights: false,
    icon: '🧺', description: 'An information role that learns about Townsfolk on the first night.',
    descriptionCN: '信息角色，在首个夜晚得知关于城镇居民的信息。',
    promptHint: 'You know two players, one of whom is a specific Townsfolk. Share this information wisely during the day.',
  },
  librarian: {
    id: 'librarian', name: 'Librarian', nameCN: '图书管理员',
    faction: 'townsfolk', team: 'good',
    ability: 'You start knowing that 1 of 2 players is a particular Outsider.',
    abilityCN: '你开始时知道两名玩家中有一名是特定的外来者。',
    abilityType: 'information', nightAction: true, firstNight: true, otherNights: false,
    icon: '📚', description: 'An information role that learns about Outsiders on the first night.',
    descriptionCN: '信息角色，在首个夜晚得知关于外来者的信息。',
    promptHint: 'You know two players, one of whom is a specific Outsider. This helps identify the game setup.',
  },
  investigator: {
    id: 'investigator', name: 'Investigator', nameCN: '调查员',
    faction: 'townsfolk', team: 'good',
    ability: 'You start knowing that 1 of 2 players is a particular Minion.',
    abilityCN: '你开始时知道两名玩家中有一名是特定的爪牙。',
    abilityType: 'information', nightAction: true, firstNight: true, otherNights: false,
    icon: '🔍', description: 'An information role that learns about Minions on the first night.',
    descriptionCN: '信息角色，在首个夜晚得知关于爪牙的信息。',
    promptHint: 'You know two players, one of whom is a Minion. This is crucial for finding evil early.',
  },
  chef: {
    id: 'chef', name: 'Chef', nameCN: '厨师',
    faction: 'townsfolk', team: 'good',
    ability: 'You start knowing how many pairs of evil players there are.',
    abilityCN: '你开始时知道有多少对邪恶玩家相邻。',
    abilityType: 'information', nightAction: true, firstNight: true, otherNights: false,
    icon: '👨‍🍳', description: 'An information role that learns about evil player adjacency.',
    descriptionCN: '信息角色，在首个夜晚得知邪恶玩家的相邻情况。',
    promptHint: 'You know how many pairs of evil players sit next to each other.',
  },
  empath: {
    id: 'empath', name: 'Empath', nameCN: '共情者',
    faction: 'townsfolk', team: 'good',
    ability: 'Each night, you learn how many of your 2 alive neighbors are evil.',
    abilityCN: '每晚你得知你的两名存活邻居中有多少名是邪恶的。',
    abilityType: 'information', nightAction: true, firstNight: true, otherNights: true,
    icon: '💫', description: 'An information role that learns about neighboring evil players.',
    descriptionCN: '信息角色，每晚得知邻居中邪恶玩家的数量。',
    promptHint: 'Each night you learn how many of your 2 alive neighbors are evil.',
  },
  fortune_teller: {
    id: 'fortune_teller', name: 'Fortune Teller', nameCN: '占卜师',
    faction: 'townsfolk', team: 'good',
    ability: 'Each night, choose 2 players: you learn if either is a Demon.',
    abilityCN: '每晚选择两名玩家：你得知其中是否有恶魔。',
    abilityType: 'information', nightAction: true, firstNight: true, otherNights: true,
    icon: '🔮', description: 'An information role that can investigate for the Demon.',
    descriptionCN: '信息角色，每晚可以调查恶魔身份。',
    promptHint: 'Each night choose 2 players to investigate for the Demon.',
  },
  undertaker: {
    id: 'undertaker', name: 'Undertaker', nameCN: '殡葬师',
    faction: 'townsfolk', team: 'good',
    ability: 'Each night*, you learn which character died by execution today.',
    abilityCN: '每晚*你得知今天被处决的是哪个角色。',
    abilityType: 'information', nightAction: true, firstNight: false, otherNights: true,
    icon: '⚰️', description: 'An information role that learns executed players\' characters.',
    descriptionCN: '信息角色，得知被处决玩家的角色。',
    promptHint: 'You learn the character of executed players.',
  },
  monk: {
    id: 'monk', name: 'Monk', nameCN: '僧侣',
    faction: 'townsfolk', team: 'good',
    ability: 'Each night*, choose a player (not yourself): they are protected from the Demon.',
    abilityCN: '每晚*选择一名玩家（非自己）：该玩家受到保护免受恶魔侵害。',
    abilityType: 'protection', nightAction: true, firstNight: false, otherNights: true,
    icon: '🛡️', description: 'A protection role that shields one player each night.',
    descriptionCN: '保护角色，每晚可以保护一名玩家免受恶魔侵害。',
    promptHint: 'Each night choose a player to protect from the Demon.',
  },
  ravenkeeper: {
    id: 'ravenkeeper', name: 'Ravenkeeper', nameCN: '渡鸦饲养员',
    faction: 'townsfolk', team: 'good',
    ability: 'If you die at night, you learn 1 player of your choice is not the Demon.',
    abilityCN: '如果你在夜晚死亡，你可以选择一名玩家得知其不是恶魔。',
    abilityType: 'revenge', nightAction: true, firstNight: false, otherNights: true,
    icon: '🐦‍⬛', description: 'A revenge role that gains information upon death at night.',
    descriptionCN: '复仇角色，夜晚死亡时可以获得信息。',
    promptHint: 'If killed at night, choose a player to learn they are not the Demon.',
  },
  virgin: {
    id: 'virgin', name: 'Virgin', nameCN: '处女',
    faction: 'townsfolk', team: 'good',
    ability: 'The 1st Townsfolk to nominate you is executed, then you learn their character.',
    abilityCN: '第一个提名你的城镇居民会被处决，然后你得知其角色。',
    abilityType: 'protection', nightAction: false, firstNight: false, otherNights: false,
    icon: '✨', description: 'A protection role that punishes nominating Townsfolk.',
    descriptionCN: '保护角色，惩罚第一个提名自己的城镇居民。',
    promptHint: 'If a Townsfolk nominates you, they are executed.',
  },
  slayer: {
    id: 'slayer', name: 'Slayer', nameCN: '猎手',
    faction: 'townsfolk', team: 'good',
    ability: 'Once per game, choose a player: if they are the Demon, they die.',
    abilityCN: '每局一次，选择一名玩家：如果该玩家是恶魔，则其死亡。',
    abilityType: 'offensive', nightAction: false, firstNight: false, otherNights: false,
    icon: '⚔️', description: 'An offensive role that can attempt to kill the Demon once.',
    descriptionCN: '进攻角色，每局可以尝试一次击杀恶魔。',
    promptHint: 'Once per game, choose a player. If Demon, they die.',
  },
  soldier: {
    id: 'soldier', name: 'Soldier', nameCN: '士兵',
    faction: 'townsfolk', team: 'good',
    ability: 'You are safe from the Demon.',
    abilityCN: '你不会受到恶魔的侵害。',
    abilityType: 'protection', nightAction: false, firstNight: false, otherNights: false,
    icon: '🗡️', description: 'A passive protection role immune to the Demon.',
    descriptionCN: '被动保护角色，不会被恶魔杀死。',
    promptHint: 'You cannot be killed by the Demon.',
  },
  mayor: {
    id: 'mayor', name: 'Mayor', nameCN: '市长',
    faction: 'townsfolk', team: 'good',
    ability: 'If only 3 players live & no execution occurs, your team wins.',
    abilityCN: '如果仅剩3名玩家且未发生处决，你的阵营获胜。',
    abilityType: 'modifier', nightAction: false, firstNight: false, otherNights: false,
    icon: '👑', description: 'A win condition modifier for Good.',
    descriptionCN: '胜利条件修改者，为好人阵营提供替代胜利路径。',
    promptHint: 'If 3 players remain and no execution, Good wins.',
  },
  // ==================== Outsiders (Good) ====================
  butler: {
    id: 'butler', name: 'Butler', nameCN: '管家',
    faction: 'outsider', team: 'good',
    ability: 'Each night, choose a player (not yourself): their vote counts twice tomorrow.',
    abilityCN: '每晚选择一名玩家（非自己）：明天该玩家的票数计算两次。',
    abilityType: 'modifier', nightAction: true, firstNight: true, otherNights: true,
    icon: '🤵', description: 'A modifier role that empowers another player\'s vote.',
    descriptionCN: '修改者角色，增强另一名玩家的投票权。',
    promptHint: 'Each night choose a player whose vote counts twice.',
  },
  saint: {
    id: 'saint', name: 'Saint', nameCN: '圣徒',
    faction: 'outsider', team: 'good',
    ability: 'If you die by execution, your team loses.',
    abilityCN: '如果你被处决，你的阵营失败。',
    abilityType: 'passive', nightAction: false, firstNight: false, otherNights: false,
    icon: '⛪', description: 'An Outsider whose execution causes Good to lose.',
    descriptionCN: '危险的外来者，被处决会导致好人阵营失败。',
    promptHint: 'If executed, Evil wins. Stay quiet.',
  },
  recluse: {
    id: 'recluse', name: 'Recluse', nameCN: '隐士',
    faction: 'outsider', team: 'good',
    ability: 'You might register as evil & as a Minion or Demon.',
    abilityCN: '你可能被检测为邪恶阵营以及爪牙或恶魔。',
    abilityType: 'passive', nightAction: false, firstNight: false, otherNights: false,
    icon: '🕷️', description: 'A confusing Outsider who can register as evil.',
    descriptionCN: '令人困惑的外来者，可能被信息角色检测为邪恶。',
    promptHint: 'You might register as evil or as Minion/Demon.',
  },
  drunk: {
    id: 'drunk', name: 'Drunk', nameCN: '醉鬼',
    faction: 'outsider', team: 'good',
    ability: 'You do not know you are the Drunk. You think you are a Townsfolk but your ability does not work.',
    abilityCN: '你不知道自己是醉鬼。你以为自己是城镇居民但你的能力无效。',
    abilityType: 'passive', nightAction: false, firstNight: true, otherNights: false,
    icon: '🍺', description: 'A deceptive Outsider with a non-functional ability.',
    descriptionCN: '欺骗性外来者，相信自己拥有无效的能力。',
    promptHint: 'You are the Drunk but don\'t know it. Your ability gives false info.',
  },
  // ==================== Minions (Evil) ====================
  poisoner: {
    id: 'poisoner', name: 'Poisoner', nameCN: '投毒者',
    faction: 'minion', team: 'evil',
    ability: 'Each night, choose a player: their ability is poisoned today and tonight.',
    abilityCN: '每晚选择一名玩家：今天和今晚其能力被投毒。',
    abilityType: 'offensive', nightAction: true, firstNight: true, otherNights: true,
    icon: '☠️', description: 'An evil support role that disables abilities.',
    descriptionCN: '邪恶支援角色，使另一名玩家的能力失效。',
    promptHint: 'Each night, poison a player to disable their ability.',
  },
  spy: {
    id: 'spy', name: 'Spy', nameCN: '间谍',
    faction: 'minion', team: 'evil',
    ability: 'Each night, you see the Grimoire. You might register as good.',
    abilityCN: '每晚你查看暗典。你可能被检测为好人。',
    abilityType: 'information', nightAction: true, firstNight: true, otherNights: true,
    icon: '👁️', description: 'An evil information role that sees all game info.',
    descriptionCN: '邪恶信息角色，可以查看所有游戏信息。',
    promptHint: 'You see the Grimoire each night. Use this to make convincing claims.',
  },
  baron: {
    id: 'baron', name: 'Baron', nameCN: '男爵',
    faction: 'minion', team: 'evil',
    ability: 'There are extra Outsiders in play. [+2 Outsiders]',
    abilityCN: '场上有额外的外来者。[+2外来者]',
    abilityType: 'modifier', nightAction: false, firstNight: false, otherNights: false,
    icon: '🎩', description: 'A setup modifier that adds 2 Outsiders.',
    descriptionCN: '设置修改者，在游戏中增加2名外来者。',
    promptHint: 'Your presence means 2 extra Outsiders are in play.',
  },
  scarlet_woman: {
    id: 'scarlet_woman', name: 'Scarlet Woman', nameCN: '猩红女人',
    faction: 'minion', team: 'evil',
    ability: 'If there are 5+ players alive & the Demon dies, you become the Demon.',
    abilityCN: '如果5名或以上玩家存活且恶魔死亡，你变成恶魔。',
    abilityType: 'modifier', nightAction: true, firstNight: false, otherNights: true,
    icon: '💃', description: 'An evil backup that becomes the Demon.',
    descriptionCN: '邪恶后备角色，如果恶魔过早死亡则变成恶魔。',
    promptHint: 'If the Demon dies while 5+ players live, you become the Demon.',
  },
  // ==================== Demons (Evil) ====================
  imp: {
    id: 'imp', name: 'Imp', nameCN: '小恶魔',
    faction: 'demon', team: 'evil',
    ability: 'Each night*, choose a player: they die. If you kill yourself, a Minion becomes the Imp.',
    abilityCN: '每晚*选择一名玩家：其死亡。如果你以此方式杀死自己，一名爪牙变成小恶魔。',
    abilityType: 'offensive', nightAction: true, firstNight: false, otherNights: true,
    icon: '😈', description: 'The primary Demon that kills a player each night.',
    descriptionCN: '主要恶魔角色，每晚杀死一名玩家。',
    promptHint: 'You kill a player each night. Avoid suspicion during the day.',
  },
};

export function getCharactersByFaction(): Record<Faction, CharacterDef[]> {
  const result: Record<Faction, CharacterDef[]> = { townsfolk: [], outsider: [], minion: [], demon: [] };
  for (const char of Object.values(CHARACTERS)) {
    result[char.faction].push(char);
  }
  return result;
}

export function getDefaultSetup(playerCount: number): string[] {
  const setups: Record<number, { townsfolk: number; outsider: number; minion: number; demon: number }> = {
    5:  { townsfolk: 3, outsider: 0, minion: 1, demon: 1 },
    6:  { townsfolk: 3, outsider: 1, minion: 1, demon: 1 },
    7:  { townsfolk: 5, outsider: 0, minion: 1, demon: 1 },
    8:  { townsfolk: 5, outsider: 1, minion: 1, demon: 1 },
    9:  { townsfolk: 5, outsider: 2, minion: 1, demon: 1 },
    10: { townsfolk: 7, outsider: 0, minion: 2, demon: 1 },
    11: { townsfolk: 7, outsider: 1, minion: 2, demon: 1 },
    12: { townsfolk: 7, outsider: 2, minion: 2, demon: 1 },
    13: { townsfolk: 9, outsider: 0, minion: 3, demon: 1 },
    14: { townsfolk: 9, outsider: 1, minion: 3, demon: 1 },
    15: { townsfolk: 9, outsider: 2, minion: 3, demon: 1 },
  };
  const setup = setups[playerCount] || setups[7];
  const characters: string[] = [];
  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
  const townsfolkIds = Object.values(CHARACTERS).filter(c => c.faction === 'townsfolk').map(c => c.id);
  const outsiderIds = Object.values(CHARACTERS).filter(c => c.faction === 'outsider').map(c => c.id);
  const minionIds = Object.values(CHARACTERS).filter(c => c.faction === 'minion').map(c => c.id);
  const demonIds = Object.values(CHARACTERS).filter(c => c.faction === 'demon').map(c => c.id);
  characters.push(...shuffle(townsfolkIds).slice(0, setup.townsfolk));
  characters.push(...shuffle(outsiderIds).slice(0, setup.outsider));
  characters.push(...shuffle(minionIds).slice(0, setup.minion));
  characters.push(...shuffle(demonIds).slice(0, setup.demon));
  return characters;
}
