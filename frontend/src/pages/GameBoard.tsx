import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FadeIn, Stagger } from '@/components/MotionPrimitives';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Skull, Moon, Sun, MessageSquare, Vote, Sword,
  Eye, ArrowRight, Send, Clock, Users, Ghost,
  ChevronDown, AlertTriangle, Trophy, RotateCcw,
  BookOpen
} from 'lucide-react';
import { gameApi } from '@/lib/game-api';
import type { GameState, Player, DiscussionMessage, GamePhase } from '@/types/game';

const CHARACTER_DATA: Record<string, { nameCN: string; icon: string; faction: string; abilityCN: string }> = {
  washerwoman: { nameCN: '洗衣妇', icon: '🧺', faction: 'townsfolk', abilityCN: '你开始时知道两名玩家中有一名是特定的城镇居民。' },
  librarian: { nameCN: '图书管理员', icon: '📚', faction: 'townsfolk', abilityCN: '你开始时知道两名玩家中有一名是特定的外来者。' },
  investigator: { nameCN: '调查员', icon: '🔍', faction: 'townsfolk', abilityCN: '你开始时知道两名玩家中有一名是特定的爪牙。' },
  chef: { nameCN: '厨师', icon: '👨‍🍳', faction: 'townsfolk', abilityCN: '你开始时知道有多少对邪恶玩家相邻。' },
  empath: { nameCN: '共情者', icon: '💫', faction: 'townsfolk', abilityCN: '每晚你得知你的两名存活邻居中有多少名是邪恶的。' },
  fortune_teller: { nameCN: '占卜师', icon: '🔮', faction: 'townsfolk', abilityCN: '每晚选择两名玩家：你得知其中是否有恶魔。' },
  undertaker: { nameCN: '殡葬师', icon: '⚰️', faction: 'townsfolk', abilityCN: '每晚*你得知今天被处决的是哪个角色。' },
  monk: { nameCN: '僧侣', icon: '🛡️', faction: 'townsfolk', abilityCN: '每晚*选择一名玩家（非自己）：该玩家受到保护免受恶魔侵害。' },
  ravenkeeper: { nameCN: '渡鸦饲养员', icon: '🐦‍⬛', faction: 'townsfolk', abilityCN: '如果你在夜晚死亡，你可以选择一名玩家得知其不是恶魔。' },
  virgin: { nameCN: '处女', icon: '✨', faction: 'townsfolk', abilityCN: '第一个提名你的城镇居民会被处决，然后你得知其角色。' },
  slayer: { nameCN: '猎手', icon: '⚔️', faction: 'townsfolk', abilityCN: '每局一次，选择一名玩家：如果该玩家是恶魔，则其死亡。' },
  soldier: { nameCN: '士兵', icon: '🗡️', faction: 'townsfolk', abilityCN: '你不会受到恶魔的侵害。' },
  mayor: { nameCN: '市长', icon: '👑', faction: 'townsfolk', abilityCN: '如果仅剩3名玩家且未发生处决，你的阵营获胜。' },
  butler: { nameCN: '管家', icon: '🤵', faction: 'outsider', abilityCN: '每晚选择一名玩家（非自己）：明天该玩家的票数计算两次。' },
  saint: { nameCN: '圣徒', icon: '⛪', faction: 'outsider', abilityCN: '如果你被处决，你的阵营失败。' },
  recluse: { nameCN: '隐士', icon: '🕷️', faction: 'outsider', abilityCN: '你可能被检测为邪恶阵营以及爪牙或恶魔。' },
  drunk: { nameCN: '醉鬼', icon: '🍺', faction: 'outsider', abilityCN: '你不知道自己是醉鬼。你以为自己是城镇居民但你的能力无效。' },
  poisoner: { nameCN: '投毒者', icon: '☠️', faction: 'minion', abilityCN: '每晚选择一名玩家：今天和今晚其能力被投毒。' },
  spy: { nameCN: '间谍', icon: '👁️', faction: 'minion', abilityCN: '每晚你查看暗典。你可能被检测为好人以及城镇居民或外来者。' },
  baron: { nameCN: '男爵', icon: '🎩', faction: 'minion', abilityCN: '场上有额外的外来者。[+2外来者]' },
  scarlet_woman: { nameCN: '猩红女人', icon: '💃', faction: 'minion', abilityCN: '如果5名或以上玩家存活且恶魔死亡，你变成恶魔。' },
  imp: { nameCN: '小恶魔', icon: '😈', faction: 'demon', abilityCN: '每晚*选择一名玩家：其死亡。如果你以此方式杀死自己，一名爪牙变成小恶魔。' },
};

function getCharInfo(charId: string) {
  return CHARACTER_DATA[charId] || { nameCN: '未知', icon: '?', faction: 'unknown', abilityCN: '' };
}

function phaseLabel(phase: GamePhase): string {
  const map: Record<GamePhase, string> = {
    lobby: '准备中',
    night: '夜晚',
    'day-discussion': '白天讨论',
    'day-nomination': '白天提名',
    'day-vote': '白天投票',
    'day-execution': '处决',
    ended: '游戏结束',
  };
  return map[phase] || phase;
}

function factionColor(faction: string): string {
  const map: Record<string, string> = {
    townsfolk: 'var(--faction-good)',
    outsider: 'var(--faction-neutral)',
    minion: 'var(--theme-purple)',
    demon: 'var(--faction-evil)',
  };
  return map[faction] || 'var(--muted-foreground)';
}

export default function GameBoard() {
  const navigate = useNavigate();
  const location = useLocation();
  const gameId = (location.state as { gameId?: string })?.gameId;

  const [game, setGame] = useState<GameState | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadGame = useCallback(async () => {
    if (!gameId) return;
    try {
      const perspective = 'human';
      const state = await gameApi.getState(gameId, perspective);
      setGame(state);
    } catch (err) {
      console.error('Failed to load game:', err);
    }
  }, [gameId]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [game?.discussions]);

  if (!gameId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <p style={{ color: 'var(--muted-foreground)' }}>未找到游戏</p>
          <Button onClick={() => navigate('/lobby')} className="mt-4 cursor-pointer">返回大厅</Button>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="animate-pulse" style={{ color: 'var(--primary)' }}>
            <Skull className="w-12 h-12 mx-auto mb-4" />
          </div>
          <p style={{ color: 'var(--muted-foreground)' }}>正在加载游戏...</p>
        </div>
      </div>
    );
  }

  const humanPlayer = game.players.find(p => p.isHuman);
  const alivePlayers = game.players.filter(p => p.isAlive);
  const isNight = game.phase === 'night';
  const isDiscussion = game.phase === 'day-discussion';
  const isNomination = game.phase === 'day-nomination';
  const isVoting = game.phase === 'day-vote';
  const isEnded = game.phase === 'ended';

  // Night phase handler
  const handleNightAction = async () => {
    if (!selectedTarget || !humanPlayer) return;
    setIsLoading(true);
    try {
      await gameApi.nightAction(gameId, humanPlayer.id, [selectedTarget]);
      // Process AI night actions
      await gameApi.aiNight(gameId);
      // Resolve night
      await gameApi.resolveNight(gameId);
      await loadGame();
    } catch (err) {
      console.error('Night action error:', err);
    }
    setIsLoading(false);
    setSelectedTarget(null);
  };

  // Auto process night in storyteller mode
  const handleStorytellerNight = async () => {
    setIsLoading(true);
    try {
      await gameApi.aiNight(gameId);
      await gameApi.resolveNight(gameId);
      await loadGame();
    } catch (err) {
      console.error('Storyteller night error:', err);
    }
    setIsLoading(false);
  };

  // Discussion handler
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !humanPlayer) return;
    setIsLoading(true);
    try {
      await gameApi.discuss(gameId, humanPlayer.id, chatInput.trim());
      setChatInput('');
      // Then trigger AI discussion
      await gameApi.aiDiscuss(gameId);
      await loadGame();
    } catch (err) {
      console.error('Discussion error:', err);
    }
    setIsLoading(false);
  };

  const handleAiDiscuss = async () => {
    setIsLoading(true);
    try {
      await gameApi.aiDiscuss(gameId);
      await loadGame();
    } catch (err) {
      console.error('AI discuss error:', err);
    }
    setIsLoading(false);
  };

  // Nomination handler
  const handleNominate = async (nomineeId: string) => {
    if (!humanPlayer) return;
    setIsLoading(true);
    try {
      await gameApi.nominate(gameId, humanPlayer.id, nomineeId);
      // Get AI votes
      const { votes: aiVotes } = await gameApi.aiVote(gameId);
      const allVotes = [
        ...aiVotes.map((v: any) => ({ voterId: v.voterId, vote: v.vote })),
      ];
      await gameApi.vote(gameId, allVotes);
      await loadGame();
    } catch (err) {
      console.error('Nomination error:', err);
    }
    setIsLoading(false);
  };

  // Advance to nomination
  const handleStartNomination = async () => {
    setIsLoading(true);
    try {
      await gameApi.startNomination(gameId);
      await loadGame();
    } catch (err) {
      console.error('Start nomination error:', err);
    }
    setIsLoading(false);
  };

  // End day
  const handleEndDay = async () => {
    setIsLoading(true);
    try {
      await gameApi.endDay(gameId);
      await loadGame();
    } catch (err) {
      console.error('End day error:', err);
    }
    setIsLoading(false);
  };

  // Restart
  const handleRestart = () => {
    navigate('/lobby');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Top Bar */}
      <header
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-3">
          {isNight ? (
            <Moon className="w-5 h-5" style={{ color: 'var(--theme-blue)' }} />
          ) : (
            <Sun className="w-5 h-5" style={{ color: 'var(--theme-gold)' }} />
          )}
          <span
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: 'var(--font-size-body)',
              color: 'var(--foreground)',
              letterSpacing: 'var(--letter-spacing-wide)',
            }}
          >
            第 {game.round} 回合
          </span>
          <Badge
            variant={isNight ? 'secondary' : 'default'}
            style={{
              background: isNight ? 'oklch(0.55 0.15 250 / 0.2)' : 'oklch(0.75 0.17 75 / 0.2)',
              color: isNight ? 'var(--theme-blue)' : 'var(--theme-gold)',
              border: 'none',
            }}
          >
            {phaseLabel(game.phase)}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)' }}>
            {alivePlayers.length} 存活
          </span>
        </div>
      </header>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left - Players Ring */}
        <div
          className="lg:w-1/2 p-4 flex items-center justify-center"
          style={{ minHeight: '400px' }}
        >
          <FadeIn>
            <div className="relative" style={{ width: '360px', height: '360px' }}>
              {/* Center circle with phase icon */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: isNight ? 'oklch(0.55 0.15 250 / 0.2)' : 'oklch(0.75 0.17 75 / 0.15)',
                  border: `2px solid ${isNight ? 'var(--theme-blue)' : 'var(--theme-gold)'}`,
                }}
              >
                {isEnded ? (
                  <Trophy className="w-8 h-8" style={{ color: 'var(--theme-gold)' }} />
                ) : isNight ? (
                  <Moon className="w-8 h-8" style={{ color: 'var(--theme-blue)' }} />
                ) : (
                  <Sun className="w-8 h-8" style={{ color: 'var(--theme-gold)' }} />
                )}
              </div>

              {/* Players arranged in a circle */}
              {game.players.map((player, i) => {
                const total = game.players.length;
                const angle = (2 * Math.PI * i) / total - Math.PI / 2;
                const radius = 150;
                const x = 180 + radius * Math.cos(angle) - 28;
                const y = 180 + radius * Math.sin(angle) - 28;
                const charInfo = getCharInfo(player.characterId);
                const canSeeRole = player.isHuman || !player.isAlive || game.mode === 'storyteller';
                const isNominee = game.currentNominee === player.id;
                const isSelected = selectedTarget === player.id;

                return (
                  <div
                    key={player.id}
                    className="absolute w-14 h-14 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all"
                    style={{
                      left: x,
                      top: y,
                      background: !player.isAlive
                        ? 'oklch(0.3 0 0 / 0.5)'
                        : player.isHuman
                        ? 'oklch(0.55 0.2 25 / 0.2)'
                        : 'var(--card)',
                      border: `2px solid ${
                        isNominee
                          ? 'var(--destructive)'
                          : isSelected
                          ? 'var(--theme-gold)'
                          : player.isHuman
                          ? 'var(--primary)'
                          : 'var(--border)'
                      }`,
                      opacity: player.isAlive ? 1 : 0.4,
                    }}
                    onClick={() => {
                      if (player.isAlive && player.id !== humanPlayer?.id) {
                        setSelectedTarget(isSelected ? null : player.id);
                      }
                    }}
                    title={`${player.name}${canSeeRole ? ` - ${charInfo.nameCN}` : ''}`}
                  >
                    <span style={{ fontSize: '1.2rem' }}>
                      {canSeeRole ? charInfo.icon : '❓'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.5rem',
                        color: player.isAlive ? 'var(--foreground)' : 'var(--muted-foreground)',
                        lineHeight: 1,
                        maxWidth: '50px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {player.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </FadeIn>
        </div>

        {/* Right - Chat & Actions Panel */}
        <div
          className="lg:w-1/2 flex flex-col border-l"
          style={{ borderLeft: '1px solid var(--border)', minHeight: '500px' }}
        >
          {/* Your Role Card */}
          {humanPlayer && (
            <div
              className="p-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div
                className="p-3 rounded-lg"
                style={{
                  background: 'oklch(0.55 0.2 25 / 0.1)',
                  border: '1px solid oklch(0.55 0.2 25 / 0.3)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '1.5rem' }}>
                    {getCharInfo(humanPlayer.characterId).icon}
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-display)',
                        fontSize: 'var(--font-size-label)',
                        color: 'var(--primary)',
                        letterSpacing: 'var(--letter-spacing-wide)',
                      }}
                    >
                      {humanPlayer.isAlive ? '你的角色' : '你已死亡'}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-label)', color: 'var(--foreground)' }}>
                      {getCharInfo(humanPlayer.characterId).nameCN}
                      {game.mode === 'storyteller' && (
                        <span style={{ color: 'var(--muted-foreground)', marginLeft: 8 }}>
                          (说书人)
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    style={{
                      marginLeft: 'auto',
                      background: factionColor(getCharInfo(humanPlayer.characterId).faction),
                      color: 'white',
                      border: 'none',
                    }}
                  >
                    {getCharInfo(humanPlayer.characterId).faction === 'townsfolk' ? '城镇居民' :
                     getCharInfo(humanPlayer.characterId).faction === 'outsider' ? '外来者' :
                     getCharInfo(humanPlayer.characterId).faction === 'minion' ? '爪牙' : '恶魔'}
                  </Badge>
                </div>
                <p
                  className="mt-2"
                  style={{
                    fontSize: 'var(--font-size-small)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  {getCharInfo(humanPlayer.characterId).abilityCN}
                </p>
                {humanPlayer.lastNightResult && (
                  <div
                    className="mt-2 p-2 rounded"
                    style={{ background: 'oklch(0.55 0.15 250 / 0.1)', fontSize: 'var(--font-size-small)' }}
                  >
                    <span style={{ color: 'var(--info)' }}>昨夜得知: </span>
                    <span style={{ color: 'var(--foreground)' }}>{humanPlayer.lastNightResult}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
            {game.discussions.map((msg) => {
              const charInfo = getCharInfo(
                game.players.find(p => p.id === msg.playerId)?.characterId || ''
              );
              return (
                <div
                  key={msg.id}
                  className="mb-3"
                  style={{
                    display: 'flex',
                    justifyContent: msg.isHuman ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    className="max-w-[80%] px-3 py-2 rounded-lg"
                    style={{
                      background: msg.isHuman
                        ? 'oklch(0.55 0.2 25 / 0.15)'
                        : 'var(--card)',
                      border: `1px solid ${msg.isHuman ? 'oklch(0.55 0.2 25 / 0.3)' : 'var(--border)'}`,
                    }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <span style={{ fontSize: '0.8rem' }}>{charInfo.icon}</span>
                      <span
                        style={{
                          fontSize: 'var(--font-size-small)',
                          color: 'var(--muted-foreground)',
                          fontFamily: 'var(--font-family-display)',
                        }}
                      >
                        {msg.playerName}
                      </span>
                    </div>
                    <p style={{ fontSize: 'var(--font-size-label)', color: 'var(--foreground)' }}>
                      {msg.content}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </ScrollArea>

          {/* Action Panel */}
          <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
            {/* Night Phase */}
            {isNight && !isEnded && (
              <div>
                {game.mode === 'player' && humanPlayer?.isAlive ? (
                  <div>
                    <p className="mb-3" style={{ fontSize: 'var(--font-size-label)', color: 'var(--muted-foreground)' }}>
                      {selectedTarget
                        ? `选择目标: ${game.players.find(p => p.id === selectedTarget)?.name}`
                        : '选择一名玩家使用你的夜晚能力'}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleNightAction}
                        disabled={!selectedTarget || isLoading}
                        className="flex-1 cursor-pointer"
                        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                      >
                        {isLoading ? '处理中...' : '使用能力'}
                      </Button>
                      <Button
                        onClick={async () => {
                          setIsLoading(true);
                          await gameApi.aiNight(gameId);
                          await gameApi.resolveNight(gameId);
                          await loadGame();
                          setIsLoading(false);
                        }}
                        disabled={isLoading}
                        variant="outline"
                        className="cursor-pointer"
                      >
                        跳过
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="mb-3" style={{ fontSize: 'var(--font-size-label)', color: 'var(--muted-foreground)' }}>
                      说书人：控制夜晚行动
                    </p>
                    <Button
                      onClick={handleStorytellerNight}
                      disabled={isLoading}
                      className="w-full cursor-pointer"
                      style={{ background: 'var(--theme-gold)', color: 'var(--accent-foreground)' }}
                    >
                      {isLoading ? '处理中...' : '推进夜晚'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Discussion Phase */}
            {isDiscussion && !isEnded && (
              <div>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="说出你的想法..."
                    className="flex-1 px-4 py-2 rounded-lg"
                    style={{
                      background: 'var(--input)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                      fontSize: 'var(--font-size-label)',
                      outline: 'none',
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isLoading}
                    size="icon"
                    className="cursor-pointer"
                    style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAiDiscuss}
                    disabled={isLoading}
                    variant="outline"
                    className="flex-1 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    AI讨论
                  </Button>
                  <Button
                    onClick={handleStartNomination}
                    disabled={isLoading}
                    className="flex-1 cursor-pointer"
                    style={{ background: 'var(--theme-gold)', color: 'var(--accent-foreground)' }}
                  >
                    <Vote className="w-4 h-4 mr-2" />
                    进入提名
                  </Button>
                </div>
              </div>
            )}

            {/* Nomination Phase */}
            {isNomination && !isEnded && (
              <div>
                <p className="mb-3" style={{ fontSize: 'var(--font-size-label)', color: 'var(--muted-foreground)' }}>
                  {selectedTarget
                    ? `提名处决: ${game.players.find(p => p.id === selectedTarget)?.name}`
                    : '选择一名玩家进行提名处决'}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => selectedTarget && handleNominate(selectedTarget)}
                    disabled={!selectedTarget || isLoading}
                    className="flex-1 cursor-pointer"
                    style={{ background: 'var(--destructive)', color: 'white' }}
                  >
                    <Sword className="w-4 h-4 mr-2" />
                    提名处决
                  </Button>
                  <Button
                    onClick={handleEndDay}
                    disabled={isLoading}
                    variant="outline"
                    className="cursor-pointer"
                  >
                    结束白天
                  </Button>
                </div>
              </div>
            )}

            {/* Vote Phase */}
            {isVoting && !isEnded && (
              <div>
                <p className="mb-3" style={{ fontSize: 'var(--font-size-label)', color: 'var(--destructive)' }}>
                  正在对 {game.players.find(p => p.id === game.currentNominee)?.name} 进行投票...
                </p>
                <Button
                  onClick={async () => {
                    setIsLoading(true);
                    const { votes: aiVotes } = await gameApi.aiVote(gameId);
                    // Add human vote (default yes for now)
                    const allVotes = [
                      { voterId: 'human', vote: true },
                      ...aiVotes.map((v: any) => ({ voterId: v.voterId, vote: v.vote })),
                    ];
                    await gameApi.vote(gameId, allVotes);
                    await loadGame();
                    setIsLoading(false);
                  }}
                  disabled={isLoading}
                  className="w-full cursor-pointer"
                  style={{ background: 'var(--destructive)', color: 'white' }}
                >
                  {isLoading ? '投票中...' : '确认投票'}
                </Button>
              </div>
            )}

            {/* Game Ended */}
            {isEnded && (
              <div className="text-center">
                <Trophy className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--theme-gold)' }} />
                <h3
                  className="mb-2 glow-gold"
                  style={{
                    fontFamily: 'var(--font-family-display)',
                    fontSize: 'var(--font-size-headline)',
                    color: 'var(--theme-gold)',
                    letterSpacing: 'var(--letter-spacing-wide)',
                  }}
                >
                  {game.winner === 'good' ? '好人阵营胜利' : '邪恶阵营胜利'}
                </h3>
                <p className="mb-4" style={{ fontSize: 'var(--font-size-label)', color: 'var(--muted-foreground)' }}>
                  {game.winner === 'good' ? '恶魔被消灭，村庄恢复了安宁。' : '恶魔仍然潜伏，黑暗笼罩了村庄。'}
                </p>
                <Button onClick={handleRestart} className="cursor-pointer" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  再来一局
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom - Event Log */}
      <div
        className="p-4"
        style={{
          background: 'var(--card)',
          borderTop: '1px solid var(--border)',
          maxHeight: '200px',
          overflow: 'auto',
        }}
      >
        <h4
          className="mb-2"
          style={{
            fontFamily: 'var(--font-family-display)',
            fontSize: 'var(--font-size-label)',
            color: 'var(--muted-foreground)',
            letterSpacing: 'var(--letter-spacing-wide)',
          }}
        >
          <Clock className="w-4 h-4 inline mr-1" />
          事件记录
        </h4>
        <div className="space-y-1">
          {game.events.slice(-20).reverse().map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-2 py-1"
              style={{ fontSize: 'var(--font-size-small)' }}
            >
              <span style={{ color: 'var(--muted-foreground)', minWidth: '50px' }}>
                R{event.round}
              </span>
              <span
                style={{
                  color:
                    event.type === 'death' || event.type === 'execution'
                      ? 'var(--destructive)'
                      : event.type === 'ability'
                      ? 'var(--theme-purple)'
                      : event.type === 'game-end'
                      ? 'var(--theme-gold)'
                      : 'var(--foreground)',
                }}
              >
                {event.descriptionCN}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
