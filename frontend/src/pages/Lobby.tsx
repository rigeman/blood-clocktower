import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FadeIn, Stagger } from '@/components/MotionPrimitives';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Skull, Users, Swords, Eye, Play, ArrowLeft } from 'lucide-react';
import { gameApi } from '@/lib/game-api';
import type { GameMode } from '@/types/game';

export default function Lobby() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialMode = (location.state as { mode?: GameMode })?.mode || 'player';

  const [mode, setMode] = useState<GameMode>(initialMode);
  const [playerCount, setPlayerCount] = useState(7);
  const [playerName, setPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleStartGame = async () => {
    setIsCreating(true);
    try {
      const game = await gameApi.create({
        playerCount,
        mode,
        humanPlayerName: playerName || undefined,
      });
      const startedGame = await gameApi.start(game.id);
      navigate('/game', { state: { gameId: startedGame.id } });
    } catch (error) {
      console.error('Failed to create game:', error);
      setIsCreating(false);
    }
  };

  const setupInfo: Record<number, { townsfolk: number; outsider: number; minion: number; demon: number }> = {
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

  const setup = setupInfo[playerCount];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1
          style={{
            fontFamily: 'var(--font-family-display)',
            fontSize: 'var(--font-size-headline)',
            color: 'var(--foreground)',
            letterSpacing: 'var(--letter-spacing-wide)',
          }}
        >
          游戏大厅
        </h1>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <Stagger>
            {/* Mode Selection */}
            <FadeIn>
              <div
                className="p-6 rounded-lg mb-6"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <h2
                  className="mb-4"
                  style={{
                    fontFamily: 'var(--font-family-display)',
                    fontSize: 'var(--font-size-title)',
                    color: 'var(--foreground)',
                    letterSpacing: 'var(--letter-spacing-wide)',
                  }}
                >
                  选择模式
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setMode('player')}
                    className="p-4 rounded-lg border-2 transition-all cursor-pointer"
                    style={{
                      borderColor: mode === 'player' ? 'var(--primary)' : 'var(--border)',
                      background: mode === 'player' ? 'oklch(0.55 0.2 25 / 0.1)' : 'transparent',
                    }}
                  >
                    <Swords className="w-6 h-6 mb-2" style={{ color: 'var(--primary)' }} />
                    <div
                      style={{
                        fontFamily: 'var(--font-family-display)',
                        fontSize: 'var(--font-size-body)',
                        color: 'var(--foreground)',
                      }}
                    >
                      玩家模式
                    </div>
                    <div style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)' }}>
                      与AI一起对战
                    </div>
                  </button>
                  <button
                    onClick={() => setMode('storyteller')}
                    className="p-4 rounded-lg border-2 transition-all cursor-pointer"
                    style={{
                      borderColor: mode === 'storyteller' ? 'var(--theme-gold)' : 'var(--border)',
                      background: mode === 'storyteller' ? 'oklch(0.75 0.17 75 / 0.1)' : 'transparent',
                    }}
                  >
                    <Eye className="w-6 h-6 mb-2" style={{ color: 'var(--theme-gold)' }} />
                    <div
                      style={{
                        fontFamily: 'var(--font-family-display)',
                        fontSize: 'var(--font-size-body)',
                        color: 'var(--foreground)',
                      }}
                    >
                      说书人模式
                    </div>
                    <div style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)' }}>
                      主持整场游戏
                    </div>
                  </button>
                </div>
              </div>
            </FadeIn>

            {/* Player Name */}
            {mode === 'player' && (
              <FadeIn>
                <div
                  className="p-6 rounded-lg mb-6"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <h2
                    className="mb-4"
                    style={{
                      fontFamily: 'var(--font-family-display)',
                      fontSize: 'var(--font-size-title)',
                      color: 'var(--foreground)',
                      letterSpacing: 'var(--letter-spacing-wide)',
                    }}
                  >
                    你的名字
                  </h2>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="输入你在游戏中的名字"
                    className="w-full px-4 py-3 rounded-lg"
                    style={{
                      background: 'var(--input)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                      fontSize: 'var(--font-size-body)',
                      outline: 'none',
                    }}
                  />
                </div>
              </FadeIn>
            )}

            {/* Player Count */}
            <FadeIn>
              <div
                className="p-6 rounded-lg mb-6"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <h2
                  className="mb-4"
                  style={{
                    fontFamily: 'var(--font-family-display)',
                    fontSize: 'var(--font-size-title)',
                    color: 'var(--foreground)',
                    letterSpacing: 'var(--letter-spacing-wide)',
                  }}
                >
                  玩家数量: {playerCount}
                </h2>
                <Slider
                  value={[playerCount]}
                  onValueChange={(v) => setPlayerCount(v[0])}
                  min={5}
                  max={15}
                  step={1}
                  className="mb-6"
                />

                {/* Setup Breakdown */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-lg" style={{ background: 'oklch(0.55 0.15 250 / 0.1)' }}>
                    <Users className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--faction-good)' }} />
                    <div style={{ fontSize: 'var(--font-size-display)', fontFamily: 'var(--font-family-display)', color: 'var(--faction-good)' }}>
                      {setup?.townsfolk || 0}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)' }}>城镇居民</div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ background: 'oklch(0.65 0.12 75 / 0.1)' }}>
                    <Users className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--faction-neutral)' }} />
                    <div style={{ fontSize: 'var(--font-size-display)', fontFamily: 'var(--font-family-display)', color: 'var(--faction-neutral)' }}>
                      {setup?.outsider || 0}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)' }}>外来者</div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ background: 'oklch(0.50 0.18 300 / 0.1)' }}>
                    <Skull className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--theme-purple)' }} />
                    <div style={{ fontSize: 'var(--font-size-display)', fontFamily: 'var(--font-family-display)', color: 'var(--theme-purple)' }}>
                      {setup?.minion || 0}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)' }}>爪牙</div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ background: 'oklch(0.55 0.25 25 / 0.1)' }}>
                    <Skull className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--faction-evil)' }} />
                    <div style={{ fontSize: 'var(--font-size-display)', fontFamily: 'var(--font-family-display)', color: 'var(--faction-evil)' }}>
                      {setup?.demon || 0}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)' }}>恶魔</div>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* Start Button */}
            <FadeIn>
              <Button
                onClick={handleStartGame}
                disabled={isCreating}
                size="lg"
                className="w-full py-6 text-lg cursor-pointer"
                style={{
                  fontFamily: 'var(--font-family-display)',
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  letterSpacing: 'var(--letter-spacing-wide)',
                }}
              >
                {isCreating ? (
                  '正在创建...'
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    开始游戏
                  </>
                )}
              </Button>
            </FadeIn>
          </Stagger>
        </div>
      </div>
    </div>
  );
}
