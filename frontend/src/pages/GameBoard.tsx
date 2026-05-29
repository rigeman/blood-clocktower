import { useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FadeIn } from '@/components/MotionPrimitives';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Skull, Moon, Sun, MessageSquare, Vote as VoteIcon, Sword,
  Send, Clock, Users, Trophy, RotateCcw, BookOpen,
} from 'lucide-react';
import { CHARACTERS } from '@/game/characters';
import type { GameState, GamePhase, DiscussionMessage } from '@/game/types';
import {
  resolveNight, startNomination, nominate, processVote,
  endDay, addDiscussion, generateAiDiscussions,
} from '@/game/engine';

function getCharInfo(charId: string) {
  return CHARACTERS[charId] || { nameCN: '未知', icon: '?', faction: 'unknown', abilityCN: '' };
}

function phaseLabel(phase: GamePhase): string {
  const map: Record<GamePhase, string> = {
    lobby: '准备中', night: '夜晚', 'day-discussion': '白天讨论',
    'day-nomination': '白天提名', 'day-vote': '白天投票',
    'day-execution': '处决', ended: '游戏结束',
  };
  return map[phase] || phase;
}

function factionColor(faction: string): string {
  const map: Record<string, string> = {
    townsfolk: 'var(--faction-good)', outsider: 'var(--faction-neutral)',
    minion: 'var(--theme-purple)', demon: 'var(--faction-evil)',
  };
  return map[faction] || 'var(--muted-foreground)';
}

function factionLabel(faction: string): string {
  const map: Record<string, string> = {
    townsfolk: '城镇居民', outsider: '外来者', minion: '爪牙', demon: '恶魔',
  };
  return map[faction] || '未知';
}

export default function GameBoard() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialState = (location.state as { game?: GameState })?.game;

  const [game, setGame] = useState<GameState | null>(initialState || null);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const updateGame = useCallback((updater: (g: GameState) => GameState) => {
    setGame(prev => prev ? updater({ ...prev }) : prev);
  }, []);

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <p style={{ color: 'var(--muted-foreground)' }}>未找到游戏</p>
          <Button onClick={() => navigate('/')} className="mt-4 cursor-pointer">返回首页</Button>
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

  // Night action
  const handleNightAction = () => {
    setIsLoading(true);
    setTimeout(() => {
      updateGame(g => resolveNight(g, selectedTarget || undefined));
      setIsLoading(false);
      setSelectedTarget(null);
    }, 800);
  };

  // Discussion
  const handleSendMessage = () => {
    if (!chatInput.trim() || !humanPlayer) return;
    updateGame(g => addDiscussion(g, humanPlayer.id, chatInput.trim()));
    setChatInput('');
  };

  const handleAiDiscuss = () => {
    setIsLoading(true);
    setTimeout(() => {
      updateGame(g => {
        const messages = generateAiDiscussions(g);
        for (const msg of messages) {
          g.discussions.push(msg);
        }
        return g;
      });
      setIsLoading(false);
    }, 600);
  };

  // Nomination
  const handleNominate = (nomineeId: string) => {
    if (!humanPlayer) return;
    updateGame(g => nominate(g, humanPlayer.id, nomineeId));
  };

  // Vote
  const handleVote = (voteYes: boolean) => {
    setIsLoading(true);
    setTimeout(() => {
      updateGame(g => processVote(g, voteYes));
      setIsLoading(false);
    }, 800);
  };

  // Advance phase
  const handleStartNomination = () => {
    updateGame(g => startNomination(g));
  };

  const handleEndDay = () => {
    updateGame(g => endDay(g));
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Top Bar */}
      <header
        className="flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          {isNight ? <Moon className="w-5 h-5" style={{ color: 'var(--theme-blue)' }} /> : <Sun className="w-5 h-5" style={{ color: 'var(--theme-gold)' }} />}
          <span style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--font-size-body)', color: 'var(--foreground)', letterSpacing: 'var(--letter-spacing-wide)' }}>
            第 {game.round} 回合
          </span>
          <Badge variant="secondary" style={{
            background: isNight ? 'oklch(0.55 0.15 250 / 0.2)' : 'oklch(0.75 0.17 75 / 0.2)',
            color: isNight ? 'var(--theme-blue)' : 'var(--theme-gold)', border: 'none',
          }}>
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

      {/* Main Area */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left - Players Ring */}
        <div className="lg:w-1/2 p-4 flex items-center justify-center" style={{ minHeight: '380px' }}>
          <FadeIn>
            <div className="relative" style={{ width: '340px', height: '340px' }}>
              {/* Center */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: isNight ? 'oklch(0.55 0.15 250 / 0.2)' : 'oklch(0.75 0.17 75 / 0.15)',
                  border: `2px solid ${isNight ? 'var(--theme-blue)' : 'var(--theme-gold)'}`,
                }}
              >
                {isEnded ? <Trophy className="w-8 h-8" style={{ color: 'var(--theme-gold)' }} /> :
                 isNight ? <Moon className="w-8 h-8" style={{ color: 'var(--theme-blue)' }} /> :
                 <Sun className="w-8 h-8" style={{ color: 'var(--theme-gold)' }} />}
              </div>

              {/* Players */}
              {game.players.map((player, i) => {
                const total = game.players.length;
                const angle = (2 * Math.PI * i) / total - Math.PI / 2;
                const radius = 140;
                const x = 170 + radius * Math.cos(angle) - 28;
                const y = 170 + radius * Math.sin(angle) - 28;
                const charInfo = getCharInfo(player.characterId);
                const canSeeRole = player.isHuman || !player.isAlive || game.mode === 'storyteller';
                const isNominee = game.currentNominee === player.id;
                const isSelected = selectedTarget === player.id;

                return (
                  <div
                    key={player.id}
                    className="absolute w-14 h-14 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all"
                    style={{
                      left: x, top: y,
                      background: !player.isAlive ? 'oklch(0.3 0 0 / 0.5)' : player.isHuman ? 'oklch(0.55 0.2 25 / 0.2)' : 'var(--card)',
                      border: `2px solid ${isNominee ? 'var(--destructive)' : isSelected ? 'var(--theme-gold)' : player.isHuman ? 'var(--primary)' : 'var(--border)'}`,
                      opacity: player.isAlive ? 1 : 0.4,
                    }}
                    onClick={() => {
                      if (player.isAlive && player.id !== humanPlayer?.id) {
                        setSelectedTarget(isSelected ? null : player.id);
                      }
                    }}
                    title={`${player.name}${canSeeRole ? ` - ${charInfo.nameCN}` : ''}`}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{canSeeRole ? charInfo.icon : '❓'}</span>
                    <span style={{ fontSize: '0.5rem', color: player.isAlive ? 'var(--foreground)' : 'var(--muted-foreground)', lineHeight: 1, maxWidth: '50px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {player.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </FadeIn>
        </div>

        {/* Right - Chat & Actions */}
        <div className="lg:w-1/2 flex flex-col" style={{ borderLeft: '1px solid var(--border)', minHeight: '500px' }}>
          {/* Role Card */}
          {humanPlayer && (
            <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="p-3 rounded-lg" style={{ background: 'oklch(0.55 0.2 25 / 0.1)', border: '1px solid oklch(0.55 0.2 25 / 0.3)' }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '1.5rem' }}>{getCharInfo(humanPlayer.characterId).icon}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--font-size-label)', color: 'var(--primary)', letterSpacing: 'var(--letter-spacing-wide)' }}>
                      {humanPlayer.isAlive ? '你的角色' : '你已死亡'}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-label)', color: 'var(--foreground)' }}>
                      {getCharInfo(humanPlayer.characterId).nameCN}
                    </div>
                  </div>
                  <Badge style={{ marginLeft: 'auto', background: factionColor(getCharInfo(humanPlayer.characterId).faction), color: 'white', border: 'none' }}>
                    {factionLabel(getCharInfo(humanPlayer.characterId).faction)}
                  </Badge>
                </div>
                <p className="mt-2" style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)' }}>
                  {getCharInfo(humanPlayer.characterId).abilityCN}
                </p>
                {humanPlayer.lastNightResult && (
                  <div className="mt-2 p-2 rounded" style={{ background: 'oklch(0.55 0.15 250 / 0.1)', fontSize: 'var(--font-size-small)' }}>
                    <span style={{ color: 'var(--info)' }}>昨夜得知: </span>
                    <span style={{ color: 'var(--foreground)' }}>{humanPlayer.lastNightResult}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat */}
          <ScrollArea className="flex-1 p-4">
            {game.discussions.map((msg) => {
              const charInfo = getCharInfo(game.players.find(p => p.id === msg.playerId)?.characterId || '');
              return (
                <div key={msg.id} className="mb-3" style={{ display: 'flex', justifyContent: msg.isHuman ? 'flex-end' : 'flex-start' }}>
                  <div className="max-w-[80%] px-3 py-2 rounded-lg" style={{
                    background: msg.isHuman ? 'oklch(0.55 0.2 25 / 0.15)' : 'var(--card)',
                    border: `1px solid ${msg.isHuman ? 'oklch(0.55 0.2 25 / 0.3)' : 'var(--border)'}`,
                  }}>
                    <div className="flex items-center gap-1 mb-1">
                      <span style={{ fontSize: '0.8rem' }}>{charInfo.icon}</span>
                      <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-display)' }}>{msg.playerName}</span>
                    </div>
                    <p style={{ fontSize: 'var(--font-size-label)', color: 'var(--foreground)' }}>{msg.content}</p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </ScrollArea>

          {/* Actions */}
          <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
            {isNight && !isEnded && (
              <div>
                <p className="mb-3" style={{ fontSize: 'var(--font-size-label)', color: 'var(--muted-foreground)' }}>
                  {selectedTarget
                    ? `选择目标: ${game.players.find(p => p.id === selectedTarget)?.name}`
                    : '选择一名玩家使用你的夜晚能力（可跳过）'}
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleNightAction} disabled={isLoading} className="flex-1 cursor-pointer" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                    {isLoading ? '处理中...' : '使用能力'}
                  </Button>
                  <Button onClick={handleNightAction} disabled={isLoading} variant="outline" className="cursor-pointer">
                    跳过
                  </Button>
                </div>
              </div>
            )}

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
                    style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: 'var(--font-size-label)', outline: 'none' }}
                  />
                  <Button onClick={handleSendMessage} disabled={!chatInput.trim()} size="icon" className="cursor-pointer" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAiDiscuss} disabled={isLoading} variant="outline" className="flex-1 cursor-pointer">
                    <MessageSquare className="w-4 h-4 mr-2" />AI讨论
                  </Button>
                  <Button onClick={handleStartNomination} disabled={isLoading} className="flex-1 cursor-pointer" style={{ background: 'var(--theme-gold)', color: 'var(--accent-foreground)' }}>
                    <VoteIcon className="w-4 h-4 mr-2" />进入提名
                  </Button>
                </div>
              </div>
            )}

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
                    <Sword className="w-4 h-4 mr-2" />提名处决
                  </Button>
                  <Button onClick={handleEndDay} disabled={isLoading} variant="outline" className="cursor-pointer">
                    结束白天
                  </Button>
                </div>
              </div>
            )}

            {isVoting && !isEnded && (
              <div>
                <p className="mb-3" style={{ fontSize: 'var(--font-size-label)', color: 'var(--destructive)' }}>
                  是否处决 {game.players.find(p => p.id === game.currentNominee)?.name}？
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => handleVote(true)} disabled={isLoading} className="flex-1 cursor-pointer" style={{ background: 'var(--destructive)', color: 'white' }}>
                    <Sword className="w-4 h-4 mr-2" />赞成处决
                  </Button>
                  <Button onClick={() => handleVote(false)} disabled={isLoading} variant="outline" className="flex-1 cursor-pointer">
                    反对
                  </Button>
                </div>
              </div>
            )}

            {isEnded && (
              <div className="text-center">
                <Trophy className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--theme-gold)' }} />
                <h3 className="mb-2 glow-gold" style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--font-size-headline)', color: 'var(--theme-gold)', letterSpacing: 'var(--letter-spacing-wide)' }}>
                  {game.winner === 'good' ? '好人阵营胜利' : '邪恶阵营胜利'}
                </h3>
                <p className="mb-4" style={{ fontSize: 'var(--font-size-label)', color: 'var(--muted-foreground)' }}>
                  {game.winner === 'good' ? '恶魔被消灭，村庄恢复了安宁。' : '恶魔仍然潜伏，黑暗笼罩了村庄。'}
                </p>
                <Button onClick={() => navigate('/')} className="cursor-pointer" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                  <RotateCcw className="w-4 h-4 mr-2" />再来一局
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Log */}
      <div className="p-4" style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', maxHeight: '180px', overflow: 'auto' }}>
        <h4 className="mb-2" style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--font-size-label)', color: 'var(--muted-foreground)', letterSpacing: 'var(--letter-spacing-wide)' }}>
          <Clock className="w-4 h-4 inline mr-1" />事件记录
        </h4>
        <div className="space-y-1">
          {game.events.slice(-20).reverse().map(event => (
            <div key={event.id} className="flex items-start gap-2 py-1" style={{ fontSize: 'var(--font-size-small)' }}>
              <span style={{ color: 'var(--muted-foreground)', minWidth: '40px' }}>R{event.round}</span>
              <span style={{
                color: event.type === 'death' || event.type === 'execution' ? 'var(--destructive)'
                  : event.type === 'ability' ? 'var(--theme-purple)'
                  : event.type === 'game-end' ? 'var(--theme-gold)'
                  : 'var(--foreground)',
              }}>
                {event.descriptionCN}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
