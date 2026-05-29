import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FadeIn } from '@/components/MotionPrimitives';
import { Button } from '@/components/ui/button';
import { Skull, Eye, Users, Swords, BookOpen, ChevronRight, Settings } from 'lucide-react';
import type { GameMode } from '@/game/types';

export default function Index() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<GameMode>('player');

  const handleStart = () => {
    navigate('/setup', { state: { mode: selectedMode } });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Hero Section */}
      <div
        className="relative flex flex-col items-center justify-center py-24 px-4 overflow-hidden"
        style={{ background: 'var(--hero)', minHeight: '70vh' }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(ellipse at center, oklch(0.55 0.2 25 / 0.3), transparent 70%)',
          }}
        />

        <FadeIn delay={0}>
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Skull className="w-10 h-10" style={{ color: 'var(--theme-crimson)' }} />
            </div>
            <h1
              className="font-bold mb-4 glow-crimson"
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: 'clamp(2rem, 5vw, var(--font-size-display))',
                color: 'var(--foreground)',
                letterSpacing: 'var(--letter-spacing-wide)',
              }}
            >
              Blood on the Clocktower
            </h1>
            <p
              className="max-w-xl mx-auto mb-2"
              style={{
                fontFamily: 'var(--font-family)',
                fontSize: 'var(--font-size-headline)',
                color: 'var(--theme-gold)',
              }}
            >
              血染钟楼
            </p>
            <p
              className="max-w-lg mx-auto"
              style={{
                fontFamily: 'var(--font-family)',
                fontSize: 'var(--font-size-body)',
                color: 'var(--muted-foreground)',
              }}
            >
              与AI玩家一同踏入这场谎言与逻辑的社交推理之旅
            </p>
          </div>
        </FadeIn>

        {/* Mode Selection */}
        <FadeIn delay={0.3}>
          <div className="relative z-10 mt-12 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setSelectedMode('player')}
              className="group px-8 py-6 rounded-lg border-2 transition-all cursor-pointer"
              style={{
                borderColor: selectedMode === 'player' ? 'var(--primary)' : 'var(--border)',
                background: selectedMode === 'player' ? 'oklch(0.55 0.2 25 / 0.1)' : 'transparent',
                color: 'var(--foreground)',
                minWidth: '220px',
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Swords className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                <span
                  style={{
                    fontFamily: 'var(--font-family-display)',
                    fontSize: 'var(--font-size-title)',
                    letterSpacing: 'var(--letter-spacing-wide)',
                  }}
                >
                  玩家模式
                </span>
              </div>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)', textAlign: 'left' }}>
                作为角色与AI对战，系统自动管理夜晚
              </p>
            </button>

            <button
              onClick={() => setSelectedMode('storyteller')}
              className="group px-8 py-6 rounded-lg border-2 transition-all cursor-pointer"
              style={{
                borderColor: selectedMode === 'storyteller' ? 'var(--theme-gold)' : 'var(--border)',
                background: selectedMode === 'storyteller' ? 'oklch(0.75 0.17 75 / 0.1)' : 'transparent',
                color: 'var(--foreground)',
                minWidth: '220px',
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Eye className="w-5 h-5" style={{ color: 'var(--theme-gold)' }} />
                <span
                  style={{
                    fontFamily: 'var(--font-family-display)',
                    fontSize: 'var(--font-size-title)',
                    letterSpacing: 'var(--letter-spacing-wide)',
                  }}
                >
                  说书人模式
                </span>
              </div>
              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)', textAlign: 'left' }}>
                主持游戏、控制夜晚，AI互相博弈
              </p>
            </button>
          </div>
        </FadeIn>

        <FadeIn delay={0.5}>
          <div className="relative z-10 mt-8">
            <Button
              onClick={handleStart}
              size="lg"
              className="px-12 py-6 text-lg cursor-pointer"
              style={{
                fontFamily: 'var(--font-family-display)',
                background: selectedMode === 'player' ? 'var(--primary)' : 'var(--accent)',
                color: selectedMode === 'player' ? 'var(--primary-foreground)' : 'var(--accent-foreground)',
                letterSpacing: 'var(--letter-spacing-wide)',
              }}
            >
              开始游戏
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </FadeIn>
      </div>

      {/* Features */}
      <div className="py-16 px-4" style={{ background: 'var(--background)' }}>
        <div className="container max-w-5xl">
          <FadeIn>
            <h2
              className="text-center mb-12"
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: 'var(--font-size-headline)',
                color: 'var(--foreground)',
                letterSpacing: 'var(--letter-spacing-wide)',
              }}
            >
              游戏特色
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Users, title: 'AI社交博弈', desc: 'AI玩家具备推理、欺骗、结盟与背叛能力', color: 'var(--primary)' },
              { icon: Skull, title: '完整昼夜循环', desc: '夜晚角色行动、白天讨论投票，忠实还原桌游体验', color: 'var(--theme-gold)' },
              { icon: BookOpen, title: '丰富角色系统', desc: '城镇居民、外来者、爪牙、恶魔四大阵营，22个角色', color: 'var(--theme-purple)' },
            ].map((feature, i) => (
              <FadeIn key={i} delay={0.2 + i * 0.1}>
                <div className="p-6 rounded-lg card-glow" style={{ background: 'var(--card)' }}>
                  <feature.icon className="w-8 h-8 mb-4" style={{ color: feature.color }} />
                  <h3
                    className="mb-2"
                    style={{
                      fontFamily: 'var(--font-family-display)',
                      fontSize: 'var(--font-size-title)',
                      color: 'var(--foreground)',
                      letterSpacing: 'var(--letter-spacing-wide)',
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-label)', color: 'var(--muted-foreground)' }}>
                    {feature.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>

      {/* Character Guide Link */}
      <div className="pb-16 text-center">
        <Button
          onClick={() => navigate('/characters')}
          variant="outline"
          className="px-8 py-4 cursor-pointer"
          style={{
            fontFamily: 'var(--font-family-display)',
            letterSpacing: 'var(--letter-spacing-wide)',
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
          }}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          查看角色图鉴
        </Button>
      </div>

      {/* Footer */}
      <div className="py-8 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)' }}>
          Blood on the Clocktower - AI Social Deduction Game
        </p>
      </div>
    </div>
  );
}
