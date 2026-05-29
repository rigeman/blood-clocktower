import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FadeIn, Stagger } from '@/components/MotionPrimitives';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Settings, Users, Sparkles, Shield, Play, Eye } from 'lucide-react';
import {
  createDefaultAgent, createDefaultStoryteller, DEFAULT_PROVIDERS,
  ARCHETYPE_DESCRIPTIONS, AVATARS,
  type AIAgentConfig, type StorytellerAgentConfig, type AIProvider, type PersonalityArchetype,
} from '@/game/ai-agent';
import { CHARACTERS } from '@/game/characters';
import type { GameMode } from '@/game/types';
import { createGame, startGame, generateAiDiscussions } from '@/game/engine';

export default function Setup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0=basic, 1=agents, 2=storyteller, 3=ready
  const [mode, setMode] = useState<GameMode>('player');
  const [playerCount, setPlayerCount] = useState(7);
  const [playerName, setPlayerName] = useState('');
  const [agents, setAgents] = useState<AIAgentConfig[]>([]);
  const [storyteller, setStoryteller] = useState<StorytellerAgentConfig>(createDefaultStoryteller());
  const [providers, setProviders] = useState<AIProvider[]>([...DEFAULT_PROVIDERS]);

  // Initialize agents when player count changes
  const initAgents = (count: number, currentAgents: AIAgentConfig[]) => {
    const aiCount = count - 1;
    const newAgents: AIAgentConfig[] = [];
    const gothNames = ['阿德里安', '贝拉特里克斯', '卡桑德拉', '多里安', '埃莉诺', '费利克斯', '格温多林', '赫克托', '伊索尔德', '贾斯珀', '卡特琳娜', '卢修斯', '玛格丽特', '尼科莱塔', '奥菲莉亚'];
    
    for (let i = 0; i < aiCount; i++) {
      newAgents.push(currentAgents[i] || {
        ...createDefaultAgent(i),
        name: gothNames[i] || `AI玩家${i + 1}`,
      });
    }
    return newAgents;
  };

  const handleCountChange = (count: number) => {
    setPlayerCount(count);
    setAgents(initAgents(count, agents));
  };

  const updateAgent = (index: number, updates: Partial<AIAgentConfig>) => {
    setAgents(prev => prev.map((a, i) => i === index ? { ...a, ...updates } : a));
  };

  const updateProvider = (id: string, updates: Partial<AIProvider>) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleStart = () => {
    const game = createGame(playerCount, mode, playerName || '你');
    const started = startGame(game);
    
    // Attach agent configs to game state for runtime use
    (started as any).agentConfigs = agents;
    (started as any).storytellerConfig = storyteller;
    (started as any).providers = providers;

    const aiMessages = generateAiDiscussions(started);
    for (const msg of aiMessages) {
      started.discussions.push(msg);
    }

    navigate('/game', { state: { game: started } });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/')} className="p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors" style={{ color: 'var(--muted-foreground)' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--font-size-headline)', color: 'var(--foreground)', letterSpacing: 'var(--letter-spacing-wide)' }}>
          游戏设置
        </h1>
        <div className="flex gap-1 ml-auto">
          {[0, 1, 2].map(s => (
            <div key={s} className="w-8 h-1 rounded-full" style={{ background: s <= step ? 'var(--primary)' : 'var(--border)' }} />
          ))}
        </div>
      </header>

      <div className="flex-1 p-6 overflow-auto">
        {/* Step 0: Basic Settings */}
        {step === 0 && (
          <Stagger>
            <FadeIn>
              <div className="max-w-2xl mx-auto">
                <h2 className="mb-6" style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--font-size-title)', color: 'var(--foreground)', letterSpacing: 'var(--letter-spacing-wide)' }}>
                  <Settings className="w-5 h-5 inline mr-2" style={{ color: 'var(--theme-gold)' }} />
                  基本设置
                </h2>

                {/* Mode */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button onClick={() => setMode('player')} className="p-4 rounded-lg border-2 transition-all cursor-pointer" style={{ borderColor: mode === 'player' ? 'var(--primary)' : 'var(--border)', background: mode === 'player' ? 'oklch(0.55 0.2 25 / 0.1)' : 'transparent' }}>
                    <Users className="w-5 h-5 mb-1" style={{ color: 'var(--primary)' }} />
                    <div style={{ fontFamily: 'var(--font-family-display)', color: 'var(--foreground)' }}>玩家模式</div>
                    <div style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)' }}>你作为角色参与游戏</div>
                  </button>
                  <button onClick={() => setMode('storyteller')} className="p-4 rounded-lg border-2 transition-all cursor-pointer" style={{ borderColor: mode === 'storyteller' ? 'var(--theme-gold)' : 'var(--border)', background: mode === 'storyteller' ? 'oklch(0.75 0.17 75 / 0.1)' : 'transparent' }}>
                    <Eye className="w-5 h-5 mb-1" style={{ color: 'var(--theme-gold)' }} />
                    <div style={{ fontFamily: 'var(--font-family-display)', color: 'var(--foreground)' }}>说书人模式</div>
                    <div style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)' }}>你主持游戏，AI互相博弈</div>
                  </button>
                </div>

                {/* Player Name */}
                {mode === 'player' && (
                  <div className="mb-6">
                    <label style={{ fontSize: 'var(--font-size-label)', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.5rem' }}>你的名字</label>
                    <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="输入你在游戏中的名字" className="w-full px-4 py-3 rounded-lg" style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: 'var(--font-size-body)', outline: 'none' }} />
                  </div>
                )}

                {/* Player Count */}
                <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <label style={{ fontSize: 'var(--font-size-label)', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.5rem' }}>
                    玩家数量: <strong style={{ color: 'var(--foreground)' }}>{playerCount}</strong>（含你，{playerCount - 1} 个AI）
                  </label>
                  <Slider value={[playerCount]} onValueChange={v => handleCountChange(v[0])} min={5} max={15} step={1} />
                </div>

                {/* API Provider Setup */}
                <div className="mb-6">
                  <h3 className="mb-3" style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--font-size-body)', color: 'var(--foreground)', letterSpacing: 'var(--letter-spacing-wide)' }}>
                    <Sparkles className="w-4 h-4 inline mr-1" style={{ color: 'var(--theme-purple)' }} />
                    AI 服务配置
                  </h3>
                  {providers.map(provider => (
                    <div key={provider.id} className="mb-3 p-4 rounded-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ fontFamily: 'var(--font-family-display)', color: 'var(--foreground)' }}>{provider.name}</span>
                        <span style={{ fontSize: 'var(--font-size-small)', color: provider.apiKey ? 'var(--success)' : 'var(--muted-foreground)' }}>
                          {provider.apiKey ? '已配置' : '未配置'}
                        </span>
                      </div>
                      <input type="password" value={provider.apiKey} onChange={e => updateProvider(provider.id, { apiKey: e.target.value })} placeholder="输入 API Key" className="w-full px-3 py-2 rounded mb-2" style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: 'var(--font-size-small)', outline: 'none' }} />
                      {provider.type === 'custom' && (
                        <input type="text" value={provider.endpoint} onChange={e => updateProvider(provider.id, { endpoint: e.target.value })} placeholder="API Endpoint URL" className="w-full px-3 py-2 rounded mb-2" style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: 'var(--font-size-small)', outline: 'none' }} />
                      )}
                      <div className="flex gap-2">
                        <input type="text" value={provider.model} onChange={e => updateProvider(provider.id, { model: e.target.value })} placeholder="模型名称" className="flex-1 px-3 py-2 rounded" style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: 'var(--font-size-small)', outline: 'none' }} />
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={() => { setAgents(initAgents(playerCount, agents)); setStep(1); }} className="w-full py-4 cursor-pointer" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-display)', letterSpacing: 'var(--letter-spacing-wide)' }}>
                  下一步：配置AI角色
                </Button>
              </div>
            </FadeIn>
          </Stagger>
        )}

        {/* Step 1: Agent Configuration */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="mb-4" style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--font-size-title)', color: 'var(--foreground)', letterSpacing: 'var(--letter-spacing-wide)' }}>
              <Users className="w-5 h-5 inline mr-2" style={{ color: 'var(--primary)' }} />
              AI角色配置
            </h2>
            <p className="mb-4" style={{ fontSize: 'var(--font-size-label)', color: 'var(--muted-foreground)' }}>
              为每个AI玩家定制性格、策略和使用的AI服务。点击展开编辑。
            </p>

            <div className="space-y-3">
              {agents.map((agent, i) => (
                <AgentConfigCard key={agent.id} agent={agent} index={i} onUpdate={updates => updateAgent(i, updates)} providers={providers} />
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={() => setStep(0)} variant="outline" className="flex-1 cursor-pointer">上一步</Button>
              <Button onClick={() => setStep(2)} className="flex-1 cursor-pointer" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-display)', letterSpacing: 'var(--letter-spacing-wide)' }}>
                下一步：说书人设置
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Storyteller */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="mb-4" style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--font-size-title)', color: 'var(--foreground)', letterSpacing: 'var(--letter-spacing-wide)' }}>
              <Shield className="w-5 h-5 inline mr-2" style={{ color: 'var(--theme-gold)' }} />
              说书人设置
            </h2>

            {mode === 'player' ? (
              <div className="mb-4 p-4 rounded-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span style={{ color: 'var(--foreground)' }}>说书人由AI担任</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={storyteller.isAI} onChange={e => setStoryteller({ ...storyteller, isAI: e.target.checked })} className="w-4 h-4" />
                    <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)' }}>启用AI说书人</span>
                  </label>
                </div>
                
                {storyteller.isAI && (
                  <>
                    <div className="mb-3">
                      <label style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.25rem' }}>平衡风格</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['narrative', 'competitive', 'chaotic'] as const).map(style => {
                          const labels = { narrative: '叙事优先', competitive: '竞技优先', chaotic: '混乱优先' };
                          const descs = { narrative: '注重戏剧性', competitive: '严格公正', chaotic: '制造意外' };
                          return (
                            <button key={style} onClick={() => setStoryteller({ ...storyteller, balanceStyle: style })} className="p-2 rounded border cursor-pointer text-center" style={{
                              borderColor: storyteller.balanceStyle === style ? 'var(--theme-gold)' : 'var(--border)',
                              background: storyteller.balanceStyle === style ? 'oklch(0.75 0.17 75 / 0.1)' : 'transparent',
                            }}>
                              <div style={{ fontSize: 'var(--font-size-small)', color: 'var(--foreground)' }}>{labels[style]}</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>{descs[style]}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.25rem' }}>介入程度: {Math.round(storyteller.interventionLevel * 100)}%</label>
                      <Slider value={[storyteller.interventionLevel * 100]} onValueChange={v => setStoryteller({ ...storyteller, interventionLevel: v[0] / 100 })} min={0} max={100} step={10} />
                    </div>

                    <div className="flex gap-4 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={storyteller.giveHints} onChange={e => setStoryteller({ ...storyteller, giveHints: e.target.checked })} className="w-4 h-4" />
                        <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--foreground)' }}>给弱势方暗示</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={storyteller.dramaticTwists} onChange={e => setStoryteller({ ...storyteller, dramaticTwists: e.target.checked })} className="w-4 h-4" />
                        <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--foreground)' }}>戏剧性反转</span>
                      </label>
                    </div>

                    <div>
                      <label style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.25rem' }}>自定义说书人指令（可选）</label>
                      <textarea value={storyteller.storytellerPrompt} onChange={e => setStoryteller({ ...storyteller, storytellerPrompt: e.target.value })} placeholder="例：当好人阵营连续两轮没人被处决时，给一个关键提示..." className="w-full px-3 py-2 rounded" rows={3} style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: 'var(--font-size-small)', outline: 'none', resize: 'vertical' }} />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="mb-4 p-4 rounded-lg" style={{ background: 'oklch(0.75 0.17 75 / 0.1)', border: '1px solid oklch(0.75 0.17 75 / 0.3)' }}>
                <p style={{ color: 'var(--theme-gold)' }}>说书人模式：你将亲自担任说书人，控制游戏进程</p>
                <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
                  你可以查看所有隐藏信息（角色、阵营），控制夜晚行动，决定游戏节奏
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1 cursor-pointer">上一步</Button>
              <Button onClick={handleStart} className="flex-1 py-4 cursor-pointer" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-display)', letterSpacing: 'var(--letter-spacing-wide)' }}>
                <Play className="w-4 h-4 mr-2" />开始游戏
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Agent Config Card ====================

function AgentConfigCard({ agent, index, onUpdate, providers }: {
  agent: AIAgentConfig;
  index: number;
  onUpdate: (updates: Partial<AIAgentConfig>) => void;
  providers: AIProvider[];
}) {
  const [expanded, setExpanded] = useState(false);
  const archetype = ARCHETYPE_DESCRIPTIONS[agent.archetype];

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      {/* Collapsed View */}
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 flex items-center gap-3 cursor-pointer" style={{ color: 'var(--foreground)' }}>
        <span style={{ fontSize: '1.5rem' }}>{agent.avatar}</span>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: 'var(--font-family-display)', color: 'var(--foreground)' }}>{agent.name}</span>
            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'oklch(0.55 0.2 25 / 0.1)', color: 'var(--primary)' }}>{archetype.icon} {archetype.label}</span>
          </div>
          <div style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)' }}>
            使用 {providers.find(p => p.id === agent.providerId)?.name || '未选择'}
          </div>
        </div>
        <span style={{ color: 'var(--muted-foreground)', fontSize: 'var(--font-size-small)' }}>{expanded ? '收起' : '展开'}</span>
      </button>

      {/* Expanded View */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="pt-3 grid grid-cols-2 gap-3">
            <div>
              <label style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.25rem' }}>名字</label>
              <input type="text" value={agent.name} onChange={e => onUpdate({ name: e.target.value })} className="w-full px-3 py-2 rounded" style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: 'var(--font-size-small)', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.25rem' }}>头像</label>
              <div className="flex gap-1 flex-wrap">
                {AVATARS.slice(0, 8).map(av => (
                  <button key={av} onClick={() => onUpdate({ avatar: av })} className="w-8 h-8 rounded cursor-pointer" style={{ background: agent.avatar === av ? 'oklch(0.55 0.2 25 / 0.2)' : 'transparent', border: agent.avatar === av ? '1px solid var(--primary)' : '1px solid transparent' }}>
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.25rem' }}>性格类型</label>
            <div className="grid grid-cols-4 gap-1">
              {(Object.entries(ARCHETYPE_DESCRIPTIONS) as [PersonalityArchetype, typeof archetype][]).map(([key, desc]) => (
                <button key={key} onClick={() => onUpdate({ archetype: key })} className="p-2 rounded cursor-pointer text-center" style={{
                  background: agent.archetype === key ? 'oklch(0.55 0.2 25 / 0.1)' : 'transparent',
                  border: agent.archetype === key ? '1px solid var(--primary)' : '1px solid var(--border)',
                }}>
                  <div>{desc.icon}</div>
                  <div style={{ fontSize: '0.6rem', color: agent.archetype === key ? 'var(--primary)' : 'var(--muted-foreground)' }}>{desc.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.25rem' }}>自定义性格描述（覆盖预设类型）</label>
            <textarea value={agent.personalityPrompt} onChange={e => onUpdate({ personalityPrompt: e.target.value })} placeholder="例：你是一个表面温和但内心狡猾的玩家，擅长用温和的语气暗示他人..." className="w-full px-3 py-2 rounded" rows={2} style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: 'var(--font-size-small)', outline: 'none', resize: 'vertical' }} />
          </div>

          <div>
            <label style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.25rem' }}>AI 服务</label>
            <select value={agent.providerId} onChange={e => onUpdate({ providerId: e.target.value })} className="w-full px-3 py-2 rounded cursor-pointer" style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: 'var(--font-size-small)', outline: 'none' }}>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.apiKey ? '(已配置)' : '(未配置)'}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.25rem' }}>攻击性 {Math.round(agent.aggressiveness * 100)}%</label>
              <Slider value={[agent.aggressiveness * 100]} onValueChange={v => onUpdate({ aggressiveness: v[0] / 100 })} min={0} max={100} step={10} />
            </div>
            <div>
              <label style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.25rem' }}>欺骗倾向 {Math.round(agent.bluffTendency * 100)}%</label>
              <Slider value={[agent.bluffTendency * 100]} onValueChange={v => onUpdate({ bluffTendency: v[0] / 100 })} min={0} max={100} step={10} />
            </div>
            <div>
              <label style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '0.25rem' }}>信息分享 {Math.round(agent.informationSharing * 100)}%</label>
              <Slider value={[agent.informationSharing * 100]} onValueChange={v => onUpdate({ informationSharing: v[0] / 100 })} min={0} max={100} step={10} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
