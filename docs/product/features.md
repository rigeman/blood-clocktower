# Blood on the Clocktower - AI Social Deduction Game

## Product Overview

A web-based Blood on the Clocktower social deduction game where a human player can join with multiple AI players powered by Tencent Hunyuan LLM. The game faithfully recreates the tabletop experience with dark gothic atmosphere, featuring complete day/night cycles, strategic role abilities, and AI-driven social deduction gameplay.

## Core Features

### 1. Dual Game Modes
- **Storyteller Mode**: The human player acts as the Storyteller, controlling night phase actions, managing game flow, and narrating the story. AI players discuss, accuse, and vote.
- **Player Mode**: The human plays as a character alongside AI players. The system manages night phases automatically. The human participates in discussions, votes, and uses their character ability.

### 2. Complete Day/Night Cycle
- **Night Phase**: Characters with night abilities act in sequence. Demon kills, Fortune Teller investigates, Poisoner poisons, etc.
- **Day Phase - Discussion**: All alive players discuss, share information, bluff, and accuse in a chat-like interface.
- **Day Phase - Nomination**: Players nominate others for execution, and voting occurs.
- **Day Phase - Execution**: The nominated player with the most votes is executed (killed).

### 3. Role System (4 Factions)
- **Townsfolk** (Good, with abilities): Washerwoman, Librarian, Investigator, Chef, Empath, Fortune Teller, Undertaker, Monk, Ravenkeeper, Virgin, Slayer, Soldier, Mayor
- **Outsiders** (Good, usually hindering): Butler, Saint, Recluse, Drunk
- **Minions** (Evil, support the Demon): Poisoner, Spy, Baron, Scarlet Woman
- **Demons** (Evil, kills at night): Imp

### 4. AI Social Deduction Engine
- Each AI player receives role-specific prompts and makes strategic decisions
- Evil players actively deceive and bluff; Good players deduce and share information
- AI adapts strategy based on game state, deaths, and revealed information
- Powered by Tencent Hunyuan LLM with cost tracking

### 5. Game Lobby & Configuration
- Choose game mode (Storyteller / Player)
- Select player count (5-15 players)
- Configure character distribution
- View character reference guide

### 6. Game Log & Replay
- Real-time game event log with timestamps
- Detailed record of all actions, votes, and ability triggers
- Post-game summary with key moments highlighted

## User Stories

1. As a Storyteller, I want to control night phase actions so that I can run the game with dramatic pacing and fair judgment.
2. As a Player, I want to discuss with AI players during the day phase so that I can deduce who the Demon is.
3. As a Player, I want to use my character ability at night so that I can gain information or protect others.
4. As either role, I want to see a visual game board showing all players and their status so I can track the game state.
5. As either role, I want to vote on nominations during the day so that we can execute suspected evil players.
6. As a Storyteller, I want to see all hidden information (evil team, abilities) so I can narrate the game properly.

## Page Structure

### `/` - Home / Landing
Atmospheric landing page with game introduction, mode selection, and "Start Game" CTA.

### `/lobby` - Game Lobby
Configure game settings: player count, character distribution, mode selection. Preview character roster.

### `/game` - Game Board
Main game interface with:
- Circular player arrangement (clocktower style)
- Phase indicator (Night/Day)
- Chat/discussion panel
- Action panel (ability use, nomination, voting)
- Game event log
- Role information panel (your role, ability description)

### `/game/:id/log` - Game Log
Detailed chronological event log for the current game.

### `/characters` - Character Guide
Browsable reference of all characters with abilities, faction, and strategy tips.

## Data Models

### Game
```
Game {
  id: string
  mode: "storyteller" | "player"
  status: "lobby" | "night" | "day-discussion" | "day-nomination" | "day-vote" | "day-execution" | "ended"
  phase: number
  round: number
  players: Player[]
  events: GameEvent[]
  config: GameConfig
  winner: "good" | "evil" | null
  createdAt: Date
}
```

### Player
```
Player {
  id: string
  name: string
  isHuman: boolean
  isAlive: boolean
  position: number
  character: Character
  team: "good" | "evil"
  status: "normal" | "poisoned" | "drunk" | "dead"
  ghostVote: boolean
  nomination: string | null
  votes: number
}
```

### Character
```
Character {
  id: string
  name: string
  faction: "townsfolk" | "outsider" | "minion" | "demon"
  ability: string
  abilityType: "information" | "protection" | "offensive" | "passive" | "revenge" | "modifier"
  nightAction: boolean
  firstNight: boolean
  otherNights: boolean
  icon: string
  description: string
}
```

### GameEvent
```
GameEvent {
  id: string
  round: number
  phase: string
  type: "death" | "ability" | "nomination" | "vote" | "execution" | "discussion" | "game-start" | "game-end"
  actorId: string
  targetId: string | null
  description: string
  isPublic: boolean
  timestamp: Date
}
```

### GameConfig
```
GameConfig {
  playerCount: number
  characters: string[]  // character IDs
  mode: "storyteller" | "player"
  aiModel: string
  discussionRounds: number
}
```

## API Endpoints

### Game Management
- `POST /api/game/create` - Create a new game with configuration
- `GET /api/game/:id` - Get current game state
- `POST /api/game/:id/start` - Start the game (assign roles)
- `POST /api/game/:id/end` - End the game

### Game Actions
- `POST /api/game/:id/night-action` - Perform a night ability action
- `POST /api/game/:id/discuss` - Generate AI discussion messages
- `POST /api/game/:id/nominate` - Nominate a player for execution
- `POST /api/game/:id/vote` - Vote on a nomination
- `POST /api/game/:id/execute` - Execute the nominated player

### AI & Storyteller
- `POST /api/game/:id/ai-action` - Trigger AI player actions for current phase
- `POST /api/game/:id/storyteller-action` - Storyteller performs action (override/resolve)

### Reference
- `GET /api/characters` - Get all character definitions
- `GET /api/characters/:id` - Get specific character details
