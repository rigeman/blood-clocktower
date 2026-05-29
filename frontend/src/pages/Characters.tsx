import { useNavigate } from 'react-router-dom';
import { FadeIn, Stagger, HoverLift } from '@/components/MotionPrimitives';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { CHARACTERS } from '@/game/characters';
import type { Faction } from '@/game/types';

function factionLabel(faction: string): string {
  const map: Record<string, string> = { townsfolk: '城镇居民', outsider: '外来者', minion: '爪牙', demon: '恶魔' };
  return map[faction] || faction;
}

function factionColor(faction: string): string {
  const map: Record<string, string> = { townsfolk: 'var(--faction-good)', outsider: 'var(--faction-neutral)', minion: 'var(--theme-purple)', demon: 'var(--faction-evil)' };
  return map[faction] || 'var(--muted-foreground)';
}

export default function Characters() {
  const navigate = useNavigate();
  const factions: Faction[] = ['townsfolk', 'outsider', 'minion', 'demon'];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      <header className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors" style={{ color: 'var(--muted-foreground)' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--font-size-headline)', color: 'var(--foreground)', letterSpacing: 'var(--letter-spacing-wide)' }}>
          角色图鉴
        </h1>
      </header>

      <div className="px-6 pt-4">
        <Tabs defaultValue="townsfolk">
          <TabsList className="w-full grid grid-cols-4">
            {factions.map(f => (
              <TabsTrigger key={f} value={f} className="cursor-pointer" style={{ fontFamily: 'var(--font-family-display)', letterSpacing: 'var(--letter-spacing-wide)' }}>
                {factionLabel(f)}
              </TabsTrigger>
            ))}
          </TabsList>

          {factions.map(f => (
            <TabsContent key={f} value={f}>
              <Stagger>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                  {Object.values(CHARACTERS).filter(c => c.faction === f).map(char => (
                    <FadeIn key={char.id}>
                      <HoverLift>
                        <div className="p-5 rounded-lg card-glow" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                          <div className="flex items-start gap-3">
                            <span style={{ fontSize: '2rem' }}>{char.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--font-size-title)', color: factionColor(char.faction), letterSpacing: 'var(--letter-spacing-wide)' }}>
                                  {char.nameCN}
                                </span>
                                <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)' }}>{char.name}</span>
                              </div>
                              <p className="mb-2" style={{ fontSize: 'var(--font-size-label)', color: 'var(--foreground)' }}>{char.abilityCN}</p>
                              <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--muted-foreground)' }}>{char.descriptionCN}</p>
                            </div>
                          </div>
                        </div>
                      </HoverLift>
                    </FadeIn>
                  ))}
                </div>
              </Stagger>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
