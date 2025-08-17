# No_Gas_Labs™ Technical Specification

## Overview

No_Gas_Labs™ is a core RPG platform that serves as the foundation for the No_Gas_Slaps™ Telegram mini-app ecosystem. It features exploration, training, questing, and resting gameplay loops, a relic-based economy, and a rich mythological narrative with absurdist themes. The platform integrates with blockchain technology to provide gasless NFT minting and token rewards.

## Core Technologies

### Frontend
- **Framework**: React 18.3.0+
- **Styling**: Tailwind CSS
- **Build Tool**: Vite 5.3.4+
- **State Management**: Redux Toolkit
- **Animation**: Framer Motion
- **3D Rendering**: Three.js (for special effects and visualizations)

### Backend
- **Runtime**: Node.js 20.x
- **Framework**: Express 4.x
- **Database**: PostgreSQL with Drizzle ORM
- **Cloud Database**: NeonDB
- **API**: RESTful architecture with GraphQL for complex queries
- **Authentication**: JWT with multiple auth providers

### Blockchain
- **Network**: TON (The Open Network)
- **Wallet Integration**: TON Connect SDK
- **Smart Contracts**: FunC language for TON contracts
- **Gasless Transactions**: Wallet abstraction with W5 standard

## Game Mechanics

### RPG Core Loop

No_Gas_Labs™ features four primary gameplay loops that form the core RPG experience:

#### 1. Explore
Players navigate through the No_Gas_Labs™ universe, discovering new locations, encountering NPCs, and finding resources.

```typescript
interface ExplorationZone {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  requiredLevel: number;
  backgroundImage: string;
  ambientSound: string;
  encounters: Encounter[];
  discoveries: Discovery[];
  connections: {
    zoneId: string;
    unlockRequirement?: UnlockRequirement;
  }[];
}

interface Encounter {
  id: string;
  type: 'npc' | 'enemy' | 'puzzle' | 'resource';
  data: NPC | Enemy | Puzzle | Resource;
  probability: number; // 0-100
  cooldown: number; // in seconds
}

interface Discovery {
  id: string;
  name: string;
  description: string;
  rewardType: 'item' | 'relic' | 'xp' | 'token' | 'quest';
  rewardData: any;
  isHidden: boolean;
  discoveryCondition?: DiscoveryCondition;
}
```

#### 2. Train
Players develop their character's abilities through various training activities, improving stats and learning new skills.

```typescript
interface TrainingActivity {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  energyCost: number;
  statImprovements: {
    statId: string;
    baseAmount: number;
    scalingFactor: number; // scales with player level
  }[];
  skillProgress?: {
    skillId: string;
    progressAmount: number;
  };
  cooldown: number; // in seconds
  location: string;
}

interface Stat {
  id: string;
  name: string;
  description: string;
  baseValue: number;
  currentValue: number;
  maxValue: number;
  growthRate: number;
  affectsSkills: string[]; // skill IDs
}

interface Skill {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  progressCurrent: number;
  progressRequired: number;
  effects: SkillEffect[];
  prerequisites?: {
    skillId: string;
    requiredLevel: number;
  }[];
}
```

#### 3. Quest
Players undertake missions and challenges to earn rewards and advance the narrative.

```typescript
interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'main' | 'side' | 'daily' | 'event';
  difficulty: number;
  requiredLevel: number;
  steps: QuestStep[];
  rewards: {
    xp: number;
    tokens?: {
      type: string;
      amount: number;
    }[];
    relics?: string[];
    items?: {
      itemId: string;
      quantity: number;
    }[];
    nfts?: string[];
  };
  timeLimit?: number; // in seconds, undefined means no limit
  cooldown?: number; // for repeatable quests
  prerequisites?: {
    questId: string;
    status: 'completed' | 'active' | 'failed';
  }[];
  isRepeatable: boolean;
}

interface QuestStep {
  id: string;
  description: string;
  type: 'explore' | 'interact' | 'collect' | 'defeat' | 'craft' | 'train';
  targetId: string;
  targetQuantity: number;
  currentProgress: number;
  location?: string;
  timeLimit?: number; // in seconds
}
```

#### 4. Rest
Players recover energy and gain passive bonuses through various resting activities.

```typescript
interface RestActivity {
  id: string;
  name: string;
  description: string;
  duration: number; // in seconds
  energyRecovery: number;
  passiveBonuses: {
    type: 'stat' | 'skill' | 'resource' | 'xp';
    targetId: string;
    amount: number;
    duration: number; // in seconds
  }[];
  location: string;
  cost?: {
    currency: string;
    amount: number;
  };
}

interface Energy {
  current: number;
  max: number;
  recoveryRate: number; // per minute
  lastUpdated: number; // timestamp
}
```

### Relic Economy

The Relic Economy is a core system that drives progression, customization, and the blockchain integration.

```typescript
interface Relic {
  id: string;
  name: string;
  description: string;
  lore: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  type: 'passive' | 'active' | 'cosmetic' | 'quest' | 'key';
  effects: RelicEffect[];
  imageUrl: string;
  model3dUrl?: string;
  animationUrl?: string;
  isNFT: boolean;
  tokenId?: string;
  contractAddress?: string;
  soulbound: boolean; // Cannot be traded if true
  expiresAt?: number; // Timestamp, undefined means permanent
  usageLimit?: number; // Number of uses, undefined means unlimited
  usageCount: number;
  cooldown?: {
    duration: number; // in seconds
    lastUsed: number; // timestamp
  };
}

interface RelicEffect {
  type: string; // Various effect types
  value: number | string | boolean;
  condition?: EffectCondition;
  duration?: number; // in seconds, undefined means permanent
  probability?: number; // 0-100, chance to trigger
}

interface RelicSet {
  id: string;
  name: string;
  description: string;
  relics: string[]; // Relic IDs
  bonuses: {
    requiredCount: number;
    effects: RelicEffect[];
  }[];
}
```

#### Relic Acquisition
Relics can be acquired through various methods:
- Quest rewards
- Exploration discoveries
- Training milestones
- Crafting
- Trading with other players
- Special events
- Blockchain rewards (NFT relics)

#### Relic Crafting
```typescript
interface RelicRecipe {
  id: string;
  resultRelicId: string;
  ingredients: {
    type: 'relic' | 'resource' | 'token';
    id: string;
    quantity: number;
  }[];
  requiredLevel: number;
  craftingTime: number; // in seconds
  successProbability: number; // 0-100
  failureResult?: {
    relicId: string;
    probability: number; // 0-100
  }[];
}
```

### Myth-Lore System

The Myth-Lore System provides the narrative framework for No_Gas_Labs™, featuring absurdist themes and symbolic elements.

```typescript
interface MythElement {
  id: string;
  name: string;
  description: string;
  type: 'character' | 'location' | 'artifact' | 'event' | 'concept';
  symbolism: string[];
  connections: {
    elementId: string;
    relationshipType: string;
    strength: number; // 0-100
  }[];
  visualRepresentations: string[]; // URLs to images
  discoveryStatus: 'undiscovered' | 'partial' | 'complete';
  loreFragments: LoreFragment[];
}

interface LoreFragment {
  id: string;
  title: string;
  content: string;
  discoveryLocation?: string;
  discoveryCondition?: DiscoveryCondition;
  revealedByNPC?: string;
  isHidden: boolean;
  unlocksElements?: string[]; // IDs of MythElements unlocked by this fragment
}

interface Dialogue {
  id: string;
  npcId: string;
  lines: {
    speaker: 'npc' | 'player';
    text: string;
    emotion?: string;
    animation?: string;
    unlocksLoreFragment?: string;
  }[];
  choices?: {
    text: string;
    nextDialogueId: string;
    requirement?: {
      type: 'stat' | 'skill' | 'quest' | 'relic' | 'lore';
      id: string;
      value?: number;
    };
  }[];
  conditions: {
    type: 'quest' | 'lore' | 'time' | 'location' | 'relic';
    data: any;
  }[];
}
```

## Character System

### Character Profile
```typescript
interface Character {
  id: string;
  userId: string;
  name: string;
  level: number;
  xp: {
    current: number;
    requiredForNextLevel: number;
  };
  stats: {
    [statId: string]: Stat;
  };
  skills: {
    [skillId: string]: Skill;
  };
  inventory: {
    relics: {
      [relicId: string]: {
        quantity: number;
        equipped: boolean;
      };
    };
    resources: {
      [resourceId: string]: number;
    };
    items: {
      [itemId: string]: number;
    };
  };
  equipment: {
    [slotId: string]: string; // Relic ID
  };
  quests: {
    active: {
      [questId: string]: {
        startedAt: number;
        progress: {
          [stepId: string]: number;
        };
      };
    };
    completed: string[]; // Quest IDs
    failed: string[]; // Quest IDs
  };
  discoveries: {
    zones: string[]; // Zone IDs
    loreFragments: string[]; // LoreFragment IDs
    mythElements: {
      [elementId: string]: 'partial' | 'complete';
    };
  };
  energy: Energy;
  wallet?: {
    address: string;
    connected: boolean;
    lastConnected: number;
  };
  createdAt: number;
  lastActive: number;
}
```

### Progression System
The progression system is designed to provide a sense of achievement and growth:

```typescript
// XP required for each level follows a curve
function calculateXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.8));
}

// Stat growth based on level and activities
function calculateStatGrowth(
  baseStat: number,
  level: number,
  growthRate: number,
  trainingFactor: number
): number {
  return baseStat + (level * growthRate * trainingFactor);
}

// Skill progression based on usage and training
function calculateSkillProgress(
  currentProgress: number,
  baseAmount: number,
  skillLevel: number,
  relevantStatValue: number
): number {
  const statBonus = Math.sqrt(relevantStatValue) / 10;
  const levelPenalty = 1 / (1 + skillLevel * 0.1);
  return currentProgress + (baseAmount * levelPenalty * (1 + statBonus));
}
```

## Blockchain Integration

### NFT Implementation

No_Gas_Labs™ uses the TON blockchain for NFT implementation, focusing on gasless transactions for a seamless user experience.

#### NFT Collection Contract
```
contract NoGasLabsCollection {
    // Collection data
    owner_address: Address;
    next_item_index: Int;
    collection_content: Cell;
    common_content: Cell;
    
    // Royalty parameters
    royalty_params: Cell;
    
    // Initialize collection
    init(owner_address: Address, collection_content: Cell, common_content: Cell, royalty_params: Cell) {
        self.owner_address = owner_address;
        self.next_item_index = 0;
        self.collection_content = collection_content;
        self.common_content = common_content;
        self.royalty_params = royalty_params;
    }
    
    // Mint new NFT
    mint(item_owner: Address, item_content: Cell) {
        // Only owner can mint
        require(sender() == self.owner_address, "Not authorized");
        
        // Create NFT item with next index
        let nft_item = self.create_nft_item(self.next_item_index, item_owner, item_content);
        self.next_item_index += 1;
        
        return nft_item;
    }
    
    // Get NFT address by index
    get_nft_address_by_index(index: Int): Address {
        // Calculate NFT address based on index
        return calculate_nft_item_address(index);
    }
}
```

#### NFT Relic Contract
```
contract NoGasLabsRelic {
    // Item data
    owner_address: Address;
    collection_address: Address;
    item_index: Int;
    item_content: Cell;
    
    // Initialize item
    init(collection_address: Address, item_index: Int, owner_address: Address, item_content: Cell) {
        self.collection_address = collection_address;
        self.item_index = item_index;
        self.owner_address = owner_address;
        self.item_content = item_content;
    }
    
    // Transfer ownership
    transfer(new_owner: Address) {
        // Only current owner can transfer
        require(sender() == self.owner_address, "Not authorized");
        
        self.owner_address = new_owner;
        
        return true;
    }
    
    // Get item data
    get_item_data(): (Address, Address, Int, Cell) {
        return (self.owner_address, self.collection_address, self.item_index, self.item_content);
    }
}
```

### Token Economy

The token economy is built around the native RELIC token, which serves multiple purposes in the ecosystem:

```typescript
interface TokenEconomy {
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  totalSupply: string; // Big number as string
  circulatingSupply: string; // Big number as string
  distribution: {
    gameplay: number; // percentage
    staking: number; // percentage
    development: number; // percentage
    marketing: number; // percentage
    community: number; // percentage
  };
  emissionSchedule: {
    initialRelease: string; // Big number as string
    periodicRelease: {
      amount: string; // Big number as string
      period: number; // in seconds
      decayRate: number; // percentage decrease per period
      totalPeriods: number;
    };
  };
  useCases: {
    training: {
      costMultiplier: number;
      maxDiscount: number;
    };
    crafting: {
      costMultiplier: number;
      successBoost: number;
    };
    exploration: {
      costMultiplier: number;
      discoveryBoost: number;
    };
    staking: {
      rewardRate: number; // per day
      lockPeriods: {
        duration: number; // in seconds
        multiplier: number;
      }[];
    };
    governance: {
      proposalThreshold: string; // Big number as string
      votingPower: number; // multiplier per token
    };
  };
}
```

### Gasless Transaction Implementation

No_Gas_Labs™ implements gasless transactions using the W5 wallet standard on TON:

```typescript
interface GaslessTransactionService {
  // Initialize the service with user's wallet
  initialize(userAddress: string): Promise<boolean>;
  
  // Send a gasless transaction
  sendGaslessTransaction(
    to: string,
    amount: string,
    payload: Cell,
    tokenType?: 'TON' | 'RELIC'
  ): Promise<{ transactionId: string, status: 'pending' | 'completed' | 'failed' }>;
  
  // Check transaction status
  checkTransactionStatus(transactionId: string): Promise<'pending' | 'completed' | 'failed'>;
  
  // Get estimated fee for a transaction
  estimateFee(to: string, amount: string, payload: Cell): Promise<string>;
}
```

## User Interface

### Main Screens
1. **Home**: Dashboard with character status, active quests, and notifications
2. **Explore**: World map with discoverable zones and locations
3. **Train**: Training activities and skill development
4. **Quest**: Available and active quests
5. **Rest**: Resting activities and energy management
6. **Inventory**: Character equipment, relics, and resources
7. **Codex**: Discovered lore and myth elements
8. **Profile**: Character details and achievements
9. **Marketplace**: Trading platform for relics and resources

### UI Components
```typescript
// Main game screen components
interface GameScreenProps {
  character: Character;
  zone: ExplorationZone;
  onZoneChange: (zoneId: string) => void;
  onEncounter: (encounter: Encounter) => void;
  onDiscovery: (discovery: Discovery) => void;
}

// Character status component
interface CharacterStatusProps {
  character: Character;
  onLevelUp: () => void;
  onStatUpdate: (statId: string, newValue: number) => void;
  onEnergyUpdate: (newEnergy: Energy) => void;
}

// Quest log component
interface QuestLogProps {
  activeQuests: {
    quest: Quest;
    progress: {
      [stepId: string]: number;
    };
    startedAt: number;
  }[];
  availableQuests: Quest[];
  completedQuests: string[];
  onQuestAccept: (questId: string) => void;
  onQuestAbandon: (questId: string) => void;
  onQuestTrack: (questId: string) => void;
}
```

### Responsive Design
- Adaptive layouts for different screen sizes
- Mobile-first approach for core gameplay
- Enhanced desktop experience with additional UI elements
- Accessibility features for diverse user needs

## Data Models

### User Model
```typescript
interface User {
  id: string;
  username: string;
  email?: string;
  authProvider: 'email' | 'google' | 'facebook' | 'telegram' | 'apple';
  authProviderId?: string;
  characters: string[]; // Character IDs
  activeCharacterId?: string;
  wallet?: {
    address: string;
    connected: boolean;
    lastConnected: number;
  };
  settings: {
    language: string;
    soundEnabled: boolean;
    musicEnabled: boolean;
    notificationsEnabled: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  createdAt: number;
  lastActive: number;
}
```

### World Model
```typescript
interface World {
  id: string;
  name: string;
  description: string;
  zones: {
    [zoneId: string]: ExplorationZone;
  };
  npcs: {
    [npcId: string]: NPC;
  };
  quests: {
    [questId: string]: Quest;
  };
  events: {
    active: WorldEvent[];
    scheduled: {
      event: WorldEvent;
      startTime: number;
      endTime: number;
    }[];
    past: {
      event: WorldEvent;
      startTime: number;
      endTime: number;
    }[];
  };
  mythLore: {
    elements: {
      [elementId: string]: MythElement;
    };
    fragments: {
      [fragmentId: string]: LoreFragment;
    };
  };
}

interface WorldEvent {
  id: string;
  name: string;
  description: string;
  type: 'quest' | 'exploration' | 'combat' | 'crafting' | 'special';
  affectedZones: string[]; // Zone IDs
  effects: {
    type: string;
    value: any;
    duration?: number; // in seconds
  }[];
  rewards: {
    type: 'xp' | 'token' | 'relic' | 'resource';
    id?: string;
    amount: number;
    probability?: number; // 0-100
  }[];
  requirements?: {
    type: 'level' | 'quest' | 'item' | 'stat';
    id?: string;
    value: number;
  }[];
}
```

### Activity Log Model
```typescript
interface ActivityLog {
  id: string;
  characterId: string;
  timestamp: number;
  type: 'exploration' | 'training' | 'quest' | 'rest' | 'combat' | 'discovery' | 'transaction';
  data: any;
  rewards?: {
    type: 'xp' | 'token' | 'relic' | 'resource' | 'skill';
    id?: string;
    amount: number;
  }[];
  location?: string; // Zone ID
}
```

## API Endpoints

### Character API
- `GET /api/characters/:id` - Get character details
- `POST /api/characters` - Create new character
- `PUT /api/characters/:id` - Update character
- `GET /api/characters/:id/inventory` - Get character inventory
- `GET /api/characters/:id/quests` - Get character quests
- `GET /api/characters/:id/stats` - Get character statistics
- `GET /api/characters/:id/skills` - Get character skills
- `POST /api/characters/:id/level-up` - Process level up

### World API
- `GET /api/world/zones` - Get all exploration zones
- `GET /api/world/zones/:id` - Get zone details
- `GET /api/world/npcs` - Get all NPCs
- `GET /api/world/npcs/:id` - Get NPC details
- `GET /api/world/events` - Get active world events
- `GET /api/world/lore` - Get discovered lore elements

### Activity API
- `POST /api/activities/explore` - Start exploration activity
- `POST /api/activities/train` - Start training activity
- `POST /api/activities/quest` - Start or update quest activity
- `POST /api/activities/rest` - Start rest activity
- `GET /api/activities/log/:characterId` - Get activity log for character

### Relic API
- `GET /api/relics` - Get all available relics
- `GET /api/relics/:id` - Get relic details
- `POST /api/relics/craft` - Craft a new relic
- `POST /api/relics/equip` - Equip a relic
- `POST /api/relics/unequip` - Unequip a relic
- `POST /api/relics/use` - Use an active relic

### Blockchain API
- `POST /api/blockchain/connect` - Connect wallet
- `GET /api/blockchain/relics` - Get blockchain relics
- `POST /api/blockchain/mint` - Mint a relic as NFT
- `GET /api/blockchain/transactions` - Get transaction history
- `POST /api/blockchain/claim-rewards` - Claim token rewards

## Security Considerations

### Authentication
- Multi-factor authentication options
- Secure token handling
- Session management
- Rate limiting for authentication attempts

### Data Protection
- Encryption for sensitive user data
- Input validation and sanitization
- CSRF protection
- XSS prevention

### Blockchain Security
- Smart contract auditing
- Transaction verification
- Secure key management
- Fraud detection systems

## Performance Optimization

### Frontend Optimization
- Code splitting and lazy loading
- Asset preloading for critical resources
- Efficient state management
- Optimized rendering with memoization

### Backend Optimization
- Database query optimization
- Caching strategies
- Horizontal scaling
- Connection pooling

### Blockchain Optimization
- Batched transactions
- Optimized smart contract code
- Off-chain computation where possible
- Efficient data structures

## Integration with No_Gas_Slaps™

### Shared Economy
- Relics earned in No_Gas_Labs™ can be used in No_Gas_Slaps™
- XP and progression is synchronized between platforms
- Achievements unlock content across both platforms

### Cross-Platform Features
- Shared inventory system
- Unified wallet connection
- Consistent visual and narrative themes
- Complementary gameplay mechanics

### Data Synchronization
```typescript
interface SyncService {
  // Sync character data between platforms
  syncCharacterData(characterId: string): Promise<boolean>;
  
  // Sync inventory items
  syncInventory(characterId: string): Promise<boolean>;
  
  // Sync achievements and progress
  syncProgress(characterId: string): Promise<boolean>;
  
  // Sync blockchain assets
  syncBlockchainAssets(walletAddress: string): Promise<boolean>;
}
```

## Analytics and Monitoring

### Game Analytics
- Player engagement metrics
- Progression analysis
- Economy balance monitoring
- Feature usage statistics

### Performance Monitoring
- API response times
- Client-side performance metrics
- Database query performance
- Blockchain transaction metrics

### Business Metrics
- User acquisition and retention
- Monetization metrics
- Viral coefficient
- Community growth

## Future Expansion

### Planned Features
- Guild system for cooperative gameplay
- PvP arenas with competitive rankings
- Seasonal events with unique rewards
- Expanded myth-lore with interactive storylines

### Technical Roadmap
- Enhanced 3D visualization for exploration
- Advanced AI for NPC interactions
- Procedurally generated quests and content
- Cross-platform expansion beyond Telegram

### Economy Evolution
- Governance mechanisms for community input
- Dynamic token utility based on ecosystem growth
- Advanced staking and yield mechanisms
- Cross-game asset interoperability