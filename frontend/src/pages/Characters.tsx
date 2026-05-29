import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FadeIn, Stagger, HoverLift } from '@/components/MotionPrimitives';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';

const CHARACTER_DATA: Record<string, {
  name: string; nameCN: string; icon: string; faction: string;
  abilityCN: string; descriptionCN: string; abilityType: string;
}> = {
  washerwoman: { name: 'Washerwoman', nameCN: '洗衣妇', icon: '🧺', faction: 'townsfolk', abilityCN: '你开始时知道两名玩家中有一名是特定的城镇居民。', descriptionCN: '信息角色，在首个夜晚得知关于城镇居民的信息。', abilityType: 'information' },
  librarian: { name: 'Librarian', nameCN: '图书管理员', icon: '📚', faction: 'townsfolk', abilityCN: '你开始时知道两名玩家中有一名是特定的外来者。', descriptionCN: '信息角色，在首个夜晚得知关于外来者的信息。', abilityType: 'information' },
  investigator: { name: 'Investigator', nameCN: '调查员', icon: '🔍', faction: 'townsfolk', abilityCN: '你开始时知道两名玩家中有一名是特定的爪牙。', descriptionCN: '信息角色，在首个夜晚得知关于爪牙的信息。', abilityType: 'information' },
  chef: { name: 'Chef', nameCN: '厨师', icon: '👨‍🍳', faction: 'townsfolk', abilityCN: '你开始时知道有多少对邪恶玩家相邻。', descriptionCN: '信息角色，在首个夜晚得知邪恶玩家的相邻情况。', abilityType: 'information' },
  empath: { name: 'Empath', nameCN: '共情者', icon: '💫', faction: 'townsfolk', abilityCN: '每晚你得知你的两名存活邻居中有多少名是邪恶的。', descriptionCN: '信息角色，每晚得知邻居中邪恶玩家的数量。', abilityType: 'information' },
  fortune_teller: { name: 'Fortune Teller', nameCN: '占卜师', icon: '🔮', faction: 'townsfolk', abilityCN: '每晚选择两名玩家：你得知其中是否有恶魔。', descriptionCN: '信息角色，每晚可以调查恶魔身份。', abilityType: 'information' },
  undertaker: { name: 'Undertaker', nameCN: '殡葬师', icon: '⚰️', faction: 'townsfolk', abilityCN: '每晚*你得知今天被处决的是哪个角色。', descriptionCN: '信息角色，得知被处决玩家的角色。', abilityType: 'information' },
  monk: { name: 'Monk', nameCN: '僧侣', icon: '🛡️', faction: 'townsfolk', abilityCN: '每晚*选择一名玩家（非自己）：该玩家受到保护免受恶魔侵害。', descriptionCN: '保护角色，每晚可以保护一名玩家免受恶魔侵害。', abilityType: 'protection' },
  ravenkeeper: { name: 'Ravenkeeper', nameCN: '渡鸦饲养员', icon: '🐦‍⬛', faction: 'townsfolk', abilityCN: '如果你在夜晚死亡，你可以选择一名玩家得知其不是恶魔。', descriptionCN: '复仇角色，夜晚死亡时可以获得信息。', abilityType: 'revenge' },
  virgin: { name: 'Virgin', nameCN: '处女', icon: '✨', faction: 'townsfolk', abilityCN: '第一个提名你的城镇居民会被处决，然后你得知其角色。', descriptionCN: '保护角色，惩罚第一个提名自己的城镇居民。', abilityType: 'protection' },
  slayer: { name: 'Slayer', nameCN: '猎手', icon: '⚔️', faction: 'townsfolk', abilityCN: '每局一次，选择一名玩家：如果该玩家是恶魔，则其死亡。', descriptionCN: '进攻角色，每局可以尝试一次击杀恶魔。', abilityType: 'offensive' },
  soldier: { name: 'Soldier', nameCN: '士兵', icon: '🗡️', faction: 'townsfolk', abilityCN: '你不会受到恶魔的侵害。', descriptionCN: '被动保护角色，不会被恶魔杀死。', abilityType: 'protection' },
  mayor: { name: 'Mayor', nameCN: '市长', icon: '👑', faction: 'townsfolk', abilityCN: '如果仅剩3名玩家且未发生处决，你的阵营获胜。', descriptionCN: '胜利条件修改者，为好人阵营提供替代胜利路径。', abilityType: 'modifier' },
  butler: { name: 'Butler', nameCN: '管家', icon: '🤵', faction: 'outsider', abilityCN: '每晚选择一名玩家（非自己）：明天该玩家的票数计算两次。', descriptionCN: '修改者角色，增强另一名玩家的投票权。', abilityType: 'modifier' },
  saint: { name: 'Saint', nameCN: '圣徒', icon: '⛪', faction: 'outsider', abilityCN: '如果你被处决，你的阵营失败。', descriptionCN: '危险的外来者，被处决会导致好人阵营失败。', abilityType: 'passive' },
  recluse: { name: 'Recluse', nameCN: '隐士', icon: '🕷️', faction: 'outsider', abilityCN: '你可能被检测为邪恶阵营以及爪牙或恶魔。', descriptionCN: '令人困惑的外来者，可能被信息角色检测为邪恶。', abilityType: 'passive' },
  drunk: { name: 'Drunk', nameCN: '醉鬼', icon: '🍺', faction: 'outsider', abilityCN: '你不知道自己是醉鬼。你以为自己是城镇居民但你的能力无效。', descriptionCN: '欺骗性外来者，相信自己拥有无效的能力。', abilityType: 'passive' },
  poisoner: { name: 'Poisoner', nameCN: '投毒者', icon: '☠️', faction: 'minion', abilityCN: '每晚选择一名玩家：今天和今晚其能力被投毒。', descriptionCN: '邪恶支援角色，使另一名玩家的能力失效。', abilityType: 'offensive' },
  spy: { name: 'Spy', nameCN: '间谍', icon: '👁️', faction: 'minion', abilityCN: '每晚你查看暗典。你可能被检测为好人以及城镇居民或外来者。', descriptionCN: '邪恶信息角色，可以查看所有游戏信息。', abilityType: 'information' },
  baron: { name: 'Baron', nameCN: '男爵', icon: '🎩', faction: 'minion', abilityCN: '场上有额外的外来者。[+2外来者]', descriptionCN: '设置修改者，在游戏中增加2名外来者。', abilityType: 'modifier' },
  scarlet_woman: { name: 'Scarlet Woman', nameCN: '猩红女人', icon: '💃', faction: 'minion', abilityCN: '如果5名或以上玩家存活且恶魔死亡，你变成恶魔。', descriptionCN: '邪恶后备角色，如果恶魔过早死亡则变成恶魔。', abilityType: 'modifier' },
  imp: { name: 'Imp', nameCN: '小恶魔', icon: '😈', faction: 'demon', abilityCN: '每晚*选择一名玩家：其死亡。如果你以此方式杀死自己，一名爪牙变成小恶魔。', descriptionCN: '主要恶魔角色，每晚杀死一名玩家。', abilityType: 'offensive' },
};

function factionLabel(faction: string): string {
  const map: Record<string, string> = {
    townsfolk: '城镇居民',
    outsider: '外来者',
    minion: '爪牙',
    demon: '恶魔',
  };
  return map[faction] || faction;
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

function abilityTypeLabel(type: string): string {
  const map: Record<string, string> = {
    information: '信息',
    protection: '保护',
    offensive: '进攻',
    passive: '被动',
    revenge: '复仇',
    modifier: '修改',
  };
  return map[type] || type;
}

export default function Characters() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('townsfolk');

  const factions = ['townsfolk', 'outsider', 'minion', 'demon'];
  const filteredChars = Object.entries(CHARACTER_DATA).filter(
    ([_, char]) => char.faction === activeTab
  );

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
          角色图鉴
        </h1>
      </header>

      {/* Faction Tabs */}
      <div className="px-6 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            {factions.map(f => (
              <TabsTrigger
                key={f}
                value={f}
                className="cursor-pointer"
                style={{ fontFamily: 'var(--font-family-display)', letterSpacing: 'var(--letter-spacing-wide)' }}
              >
                {factionLabel(f)}
              </TabsTrigger>
            ))}
          </TabsList>

          {factions.map(f => (
            <TabsContent key={f} value={f}>
              <Stagger>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                  {Object.entries(CHARACTER_DATA)
                    .filter(([_, char]) => char.faction === f)
                    .map(([id, char]) => (
                      <FadeIn key={id}>
                        <HoverLift>
                          <div
                            className="p-5 rounded-lg card-glow"
                            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                          >
                            <div className="flex items-start gap-3">
                              <span style={{ fontSize: '2rem' }}>{char.icon}</span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    style={{
                                      fontFamily: 'var(--font-family-display)',
                                      fontSize: 'var(--font-size-title)',
                                      color: factionColor(char.faction),
                                      letterSpacing: 'var(--letter-spacing-wide)',
                                    }}
                                  >
                                    {char.nameCN}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 'var(--font-size-small)',
                                      color: 'var(--muted-foreground)',
                                    }}
                                  >
                                    {char.name}
                                  </span>
                                </div>
                                <p
                                  className="mb-2"
                                  style={{
                                    fontSize: 'var(--font-size-label)',
                                    color: 'var(--foreground)',
                                  }}
                                >
                                  {char.abilityCN}
                                </p>
                                <p
                                  style={{
                                    fontSize: 'var(--font-size-small)',
                                    color: 'var(--muted-foreground)',
                                  }}
                                >
                                  {char.descriptionCN}
                                </p>
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
