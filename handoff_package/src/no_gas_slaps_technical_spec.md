# No_Gas_Slaps™ Technical Specification

## 1. Overview

No_Gas_Slaps™ is a physics-based play-to-earn (P2E) game implemented as a Telegram mini-app. Players launch "slaps" with varying force and trajectory, earning points, XP, and blockchain rewards based on their performance. The game features gasless NFT rewards, a progression system, and viral mechanics to drive engagement.

## 2. Technical Architecture

### 2.1 Frontend Architecture

#### Technology Stack
- **Framework**: React 18.3.0+
- **Styling**: Tailwind CSS
- **Build Tool**: Vite 5.3.4+
- **Telegram Integration**: Telegram Web App SDK
- **Animation**: GSAP for smooth animations
- **State Management**: React Context API + useReducer

#### Component Structure
```
src/
├── components/
│   ├── core/
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── game/
│   │   ├── Arena.tsx
│   │   ├── SlapControls.tsx
│   │   ├── SlapTrajectory.tsx
│   │   ├── Scoreboard.tsx
│   │   └── ...
│   ├── ui/
│   │   ├── Leaderboard.tsx
│   │   ├── Profile.tsx
│   │   ├── Inventory.tsx
│   │   └── ...
│   └── blockchain/
│       ├── WalletConnect.tsx
│       ├── NFTDisplay.tsx
│       └── ...
├── hooks/
│   ├── usePhysics.ts
│   ├── useGameState.ts
│   ├── useBlockchain.ts
│   └── ...
├── contexts/
│   ├── GameContext.tsx
│   ├── UserContext.tsx
│   ├── BlockchainContext.tsx
│   └── ...
├── services/
│   ├── api.ts
│   ├── telegram.ts
│   ├── blockchain.ts
│   └── ...
└── utils/
    ├── physics.ts
    ├── animation.ts
    ├── formatting.ts
    └── ...
```

### 2.2 Backend Architecture

#### Technology Stack
- **Runtime**: Node.js 20.x+
- **Framework**: Express
- **Database**: PostgreSQL with Drizzle ORM
- **Cloud Database**: NeonDB
- **Authentication**: JWT + Telegram authentication
- **Caching**: Redis for leaderboards and high-frequency data

#### API Structure
```
/api/
├── auth/
│   ├── GET  /verify         # Verify Telegram authentication
│   └── POST /login          # Login with Telegram
├── user/
│   ├── GET  /profile        # Get user profile
│   ├── PUT  /profile        # Update user profile
│   └── GET  /inventory      # Get user inventory
├── game/
│   ├── POST /slap           # Record a slap action
│   ├── GET  /arenas         # Get available arenas
│   ├── GET  /leaderboard    # Get leaderboard data
│   └── POST /challenge      # Create or accept a challenge
└── blockchain/
    ├── POST /claim-reward   # Claim blockchain rewards
    ├── GET  /nfts           # Get user's NFTs
    └── GET  /balance        # Get token balance
```

#### Database Schema
```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255),
  wallet_address VARCHAR(255),
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Slaps table
CREATE TABLE slaps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  arena_id INTEGER REFERENCES arenas(id),
  force FLOAT NOT NULL,
  angle FLOAT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Arenas table
CREATE TABLE arenas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty INTEGER DEFAULT 1,
  min_level INTEGER DEFAULT 1,
  image_url VARCHAR(255),
  enabled BOOLEAN DEFAULT true
);

-- Inventory table
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  item_type VARCHAR(50) NOT NULL, -- 'relic', 'nft', 'token'
  item_id VARCHAR(255) NOT NULL,
  quantity INTEGER DEFAULT 1,
  metadata JSONB,
  acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leaderboard table
CREATE TABLE leaderboard (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  score INTEGER NOT NULL,
  period VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'all-time'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3 Blockchain Integration

#### Technology Stack
- **Blockchain**: TON (The Open Network)
- **Wallet Integration**: TON Connect SDK
- **Smart Contracts**: FunC for TON contracts
- **NFT Standard**: TON NFT Standard (TEP-62)
- **Token Standard**: TON Jetton Standard (TEP-74)

#### Smart Contract Architecture
- **NFT Collection Contract**: Manages the collection of No_Gas_Slaps™ NFTs
- **NFT Item Contracts**: Individual NFT items representing achievements or rewards
- **Token Contract**: Manages the game's token economy
- **Gasless Transaction Contract**: Handles gasless transactions for users

## 3. Game Mechanics

### 3.1 Physics Engine

The slap physics engine is the core gameplay mechanic, calculating trajectories, collisions, and scores.

#### Key Components
- **Force Calculation**: Based on user input (swipe speed or button press duration)
- **Trajectory Calculation**: Determines the path of the slap based on force and angle
- **Collision Detection**: Identifies when a slap hits targets or obstacles
- **Score Calculation**: Computes points based on targets hit, force applied, and combos

#### Physics Implementation
```typescript
// Example physics calculation for slap trajectory
interface SlapParams {
  force: number;      // 0-100
  angle: number;      // 0-360 degrees
  gravity: number;    // Downward acceleration
  windResistance: number; // Air resistance factor
}

interface Position {
  x: number;
  y: number;
}

function calculateSlapTrajectory(params: SlapParams, timeStep: number, maxSteps: number): Position[] {
  const { force, angle, gravity, windResistance } = params;
  
  // Convert angle to radians
  const angleRad = (angle * Math.PI) / 180;
  
  // Initial velocity components
  const velocityX = force * Math.cos(angleRad);
  const velocityY = force * Math.sin(angleRad);
  
  let currentX = 0;
  let currentY = 0;
  let currentVelocityX = velocityX;
  let currentVelocityY = velocityY;
  
  const positions: Position[] = [{ x: currentX, y: currentY }];
  
  for (let step = 1; step <= maxSteps; step++) {
    // Apply wind resistance
    currentVelocityX *= (1 - windResistance);
    currentVelocityY *= (1 - windResistance);
    
    // Apply gravity
    currentVelocityY -= gravity * timeStep;
    
    // Update position
    currentX += currentVelocityX * timeStep;
    currentY += currentVelocityY * timeStep;
    
    positions.push({ x: currentX, y: currentY });
    
    // Stop if we hit the ground
    if (currentY < 0) {
      break;
    }
  }
  
  return positions;
}
```

### 3.2 Arena System

Arenas provide different environments and challenges for players, each with unique themes from the No_Gas_Labs™ universe.

#### Arena Properties
- **Theme**: Visual style and background elements
- **Difficulty**: Affects target placement and scoring multipliers
- **Special Effects**: Unique visual and gameplay effects
- **Rewards**: Arena-specific rewards and bonuses

#### Arena Types
1. **Novice Grounds**: Beginner-friendly arena with simple targets
2. **Glitch Valley**: Targets occasionally teleport or glitch
3. **Myth Caverns**: Darkness effects with illuminated targets
4. **Relic Ruins**: Ancient temple with moving obstacles
5. **Quantum Field**: Physics behaves unpredictably

### 3.3 Progression System

The progression system rewards players for continued engagement and skill development.

#### XP System
- Players earn XP for each slap based on score
- XP accumulates to increase player level
- Higher levels unlock new arenas and abilities

#### Relic System
- Relics are collectible items that provide bonuses
- Relics can be equipped to modify slap properties
- Rare relics provide stronger bonuses
- Relics can be combined to create more powerful versions

## 4. Blockchain Integration

### 4.1 Gasless NFT Implementation

No_Gas_Slaps™ uses TON blockchain's gasless transaction capabilities to provide a seamless experience for users.

#### Implementation Details
- **Wallet Version**: TON Wallet V5 (W5) for gasless transactions
- **Transaction Relay**: Server-side relay service for handling gas fees
- **Batch Processing**: Grouping multiple rewards for efficient processing

```typescript
// Example gasless transaction implementation
async function sendGaslessTransaction(
  userWalletAddress: string,
  nftContractAddress: string,
  metadata: object
): Promise<string> {
  // Create the transaction payload
  const payload = {
    to: nftContractAddress,
    value: "0",
    dataType: "nft_mint",
    data: {
      recipient: userWalletAddress,
      metadata: metadata
    }
  };
  
  // Sign the transaction with the relay service key
  const signedPayload = await relayService.signTransaction(payload);
  
  // Send the transaction through the relay service
  const txHash = await relayService.sendTransaction(signedPayload);
  
  return txHash;
}
```

### 4.2 NFT Rewards

Players earn NFTs as rewards for achievements, high scores, and special events.

#### NFT Types
1. **Achievement NFTs**: Awarded for completing specific challenges
2. **Rarity-Tiered NFTs**: Common, Uncommon, Rare, Epic, Legendary
3. **Seasonal NFTs**: Limited-time rewards for seasonal events
4. **Collaborative NFTs**: Earned through team challenges

#### NFT Metadata Structure
```json
{
  "name": "Legendary Slapper",
  "description": "Awarded for achieving a perfect score in the Quantum Field arena",
  "image": "ipfs://QmXyZ123...",
  "attributes": [
    {
      "trait_type": "Rarity",
      "value": "Legendary"
    },
    {
      "trait_type": "Arena",
      "value": "Quantum Field"
    },
    {
      "trait_type": "Score",
      "value": "10000+"
    },
    {
      "trait_type": "Season",
      "value": "Genesis"
    }
  ],
  "animation_url": "ipfs://QmAbc456..."
}
```

### 4.3 Token Economy

The token economy provides incentives for players and supports the game's ecosystem.

#### Token Utility
- **Upgrades**: Purchase upgrades for slap abilities
- **Customization**: Buy cosmetic items for personalization
- **Arena Access**: Unlock premium arenas
- **Staking**: Stake tokens for passive bonuses

#### Token Distribution
- **Gameplay Rewards**: Earned through regular play
- **Achievement Bonuses**: Special rewards for milestones
- **Referral System**: Rewards for bringing new players
- **Leaderboard Prizes**: Weekly and monthly competitions

## 5. Telegram Integration

### 5.1 Mini-App Setup

The Telegram mini-app is configured to provide a seamless experience within the Telegram ecosystem.

#### Configuration
- **Bot Setup**: Registered with BotFather
- **Mini-App URL**: Configured in bot settings
- **Permissions**: Requested for user data access
- **Deep Linking**: Configured for referral system

#### Initialization
```typescript
// Example Telegram Web App initialization
import { WebApp } from '@twa-dev/sdk';

function initializeTelegramWebApp() {
  // Initialize the WebApp
  WebApp.ready();
  
  // Configure theme
  const isDarkMode = WebApp.colorScheme === 'dark';
  applyTheme(isDarkMode);
  
  // Get user data
  const user = WebApp.initDataUnsafe?.user;
  if (user) {
    // Authenticate user with backend
    authenticateUser(user);
  }
  
  // Listen for back button
  WebApp.BackButton.onClick(() => {
    navigateBack();
  });
  
  // Enable main button when needed
  WebApp.MainButton.setText('PLAY NOW');
  WebApp.MainButton.onClick(() => {
    startGame();
  });
  
  // Handle viewport changes
  WebApp.onEvent('viewportChanged', handleViewportChange);
}
```

### 5.2 Bot Integration

The Telegram bot serves as the entry point and support system for the mini-app.

#### Bot Commands
- `/start`: Introduction and mini-app link
- `/play`: Direct link to start the game
- `/profile`: View player profile and stats
- `/leaderboard`: Check current rankings
- `/help`: Get assistance and instructions

#### Notifications
- **Achievement Alerts**: Notify users of earned rewards
- **Challenge Invites**: Alert users to new challenges
- **Leaderboard Updates**: Inform users of ranking changes
- **Event Announcements**: Promote special events and tournaments

## 6. Viral Mechanics

### 6.1 Leaderboard System

The leaderboard system drives competition and engagement.

#### Leaderboard Types
- **Daily Rankings**: Reset every 24 hours
- **Weekly Champions**: Reset weekly with special rewards
- **Monthly Masters**: Monthly competition with premium rewards
- **All-Time Legends**: Persistent ranking of top players

#### Implementation
```typescript
// Example leaderboard query
async function getLeaderboard(
  period: 'daily' | 'weekly' | 'monthly' | 'all-time',
  limit: number = 100,
  userTelegramId?: string
): Promise<LeaderboardEntry[]> {
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'daily':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'weekly':
      startDate = new Date(now.setDate(now.getDate() - now.getDay()));
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      startDate = new Date(now.setDate(1));
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'all-time':
      startDate = new Date(0); // Beginning of time
      break;
  }
  
  const leaderboard = await db.query(`
    SELECT 
      u.username,
      u.telegram_id,
      MAX(l.score) as best_score,
      SUM(l.score) as total_score,
      COUNT(l.id) as slap_count
    FROM leaderboard l
    JOIN users u ON l.user_id = u.id
    WHERE l.created_at >= $1
    GROUP BY u.id, u.username, u.telegram_id
    ORDER BY best_score DESC
    LIMIT $2
  `, [startDate, limit]);
  
  // If userTelegramId is provided, get their rank
  if (userTelegramId) {
    const userRank = await getUserRank(userTelegramId, period);
    return { entries: leaderboard, userRank };
  }
  
  return { entries: leaderboard };
}
```

### 6.2 Challenge System

The challenge system allows players to compete directly and share results.

#### Challenge Types
- **Friend Challenges**: Direct competition with friends
- **Daily Challenges**: Rotating challenges for all players
- **Community Challenges**: Large-scale events with collective goals
- **Tournament Challenges**: Structured competitions with brackets

#### Implementation
```typescript
// Example challenge creation
async function createChallenge(
  creatorId: number,
  challengeType: 'friend' | 'tournament',
  params: {
    targetScore?: number,
    timeLimit?: number,
    arenaId?: number,
    invitedUsers?: number[]
  }
): Promise<Challenge> {
  const challenge = await db.query(`
    INSERT INTO challenges (
      creator_id,
      challenge_type,
      target_score,
      time_limit,
      arena_id,
      status,
      created_at,
      expires_at
    ) VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW() + interval '1 day' * $6)
    RETURNING id
  `, [
    creatorId,
    challengeType,
    params.targetScore || null,
    params.timeLimit || null,
    params.arenaId || null,
    params.timeLimit || 1
  ]);
  
  // If friend challenge, add invitations
  if (challengeType === 'friend' && params.invitedUsers?.length) {
    await Promise.all(params.invitedUsers.map(userId => 
      db.query(`
        INSERT INTO challenge_invitations (challenge_id, user_id, status)
        VALUES ($1, $2, 'pending')
      `, [challenge.id, userId])
    ));
    
    // Send notifications to invited users
    await sendChallengeInvitations(challenge.id, params.invitedUsers);
  }
  
  return getChallengeById(challenge.id);
}
```

### 6.3 Referral System

The referral system incentivizes players to bring friends to the game.

#### Referral Features
- **Unique Referral Links**: Generated for each player
- **Reward Tiers**: Increasing rewards for more referrals
- **Dual Rewards**: Both referrer and referee receive bonuses
- **Milestone Bonuses**: Special rewards for reaching referral targets

#### Implementation
```typescript
// Example referral link generation
function generateReferralLink(telegramId: string): string {
  // Create a unique referral code
  const referralCode = generateUniqueCode(telegramId);
  
  // Store the referral code in the database
  storeReferralCode(telegramId, referralCode);
  
  // Generate the deep link for Telegram
  return `https://t.me/NoGasSlapsBot?start=ref_${referralCode}`;
}

// Example referral processing
async function processReferral(referralCode: string, newUserTelegramId: string): Promise<void> {
  // Find the referrer
  const referrer = await findReferrerByCode(referralCode);
  
  if (!referrer) {
    return;
  }
  
  // Check if the new user is actually new
  const isNewUser = await isFirstTimeUser(newUserTelegramId);
  
  if (!isNewUser) {
    return;
  }
  
  // Record the referral
  await recordReferral(referrer.telegramId, newUserTelegramId);
  
  // Grant rewards to both users
  await grantReferralReward(referrer.telegramId, 'referrer');
  await grantReferralReward(newUserTelegramId, 'referee');
  
  // Check for milestone bonuses
  const referralCount = await getReferralCount(referrer.telegramId);
  await checkAndGrantMilestoneBonus(referrer.telegramId, referralCount);
}
```

## 7. Performance Optimization

### 7.1 Frontend Optimization

- **Asset Loading**: Progressive loading of assets
- **Code Splitting**: Lazy loading of components
- **Animation Optimization**: GPU-accelerated animations
- **Memory Management**: Proper cleanup of event listeners and resources

### 7.2 Backend Optimization

- **Caching Strategy**: Redis caching for frequently accessed data
- **Database Indexing**: Optimized indexes for common queries
- **Connection Pooling**: Efficient database connection management
- **Rate Limiting**: Protection against abuse

### 7.3 Blockchain Optimization

- **Batch Processing**: Grouping transactions for efficiency
- **Lazy Minting**: Defer actual minting until necessary
- **Proof Generation**: Efficient cryptographic operations
- **State Caching**: Minimize on-chain state reads

## 8. Security Considerations

### 8.1 Authentication Security

- **Telegram Authentication**: Secure verification of Telegram user data
- **JWT Implementation**: Secure token generation and validation
- **Session Management**: Proper handling of user sessions
- **Rate Limiting**: Protection against brute force attacks

### 8.2 Smart Contract Security

- **Access Control**: Proper permission management
- **Input Validation**: Thorough validation of all inputs
- **Gas Optimization**: Efficient contract design
- **Upgrade Mechanism**: Safe contract upgrade pattern

### 8.3 Data Security

- **Encryption**: Sensitive data encryption at rest and in transit
- **Input Sanitization**: Protection against injection attacks
- **Error Handling**: Secure error messages without leaking information
- **Audit Logging**: Comprehensive logging of security events

## 9. Monitoring and Analytics

### 9.1 Performance Monitoring

- **API Response Times**: Tracking of API performance
- **Error Rates**: Monitoring of application errors
- **Resource Utilization**: Tracking of server resources
- **Client Performance**: Monitoring of frontend metrics

### 9.2 User Analytics

- **Engagement Metrics**: Session duration, retention, etc.
- **Funnel Analysis**: Conversion through game stages
- **Feature Usage**: Tracking of feature popularity
- **Cohort Analysis**: Performance of different user groups

### 9.3 Blockchain Analytics

- **Transaction Success Rate**: Monitoring of blockchain operations
- **Gas Usage**: Tracking of gas consumption
- **Token Economics**: Monitoring of token supply and circulation
- **NFT Activity**: Tracking of NFT minting and transfers

## 10. Deployment and Operations

### 10.1 Deployment Pipeline

- **CI/CD Integration**: Automated testing and deployment
- **Environment Management**: Dev, staging, and production environments
- **Versioning Strategy**: Semantic versioning for releases
- **Rollback Procedures**: Safe rollback mechanisms

### 10.2 Operations

- **Backup Strategy**: Regular database backups
- **Disaster Recovery**: Procedures for system recovery
- **Scaling Plan**: Horizontal and vertical scaling strategies
- **Maintenance Windows**: Scheduled maintenance procedures

## 11. Future Enhancements

### 11.1 Gameplay Expansions

- **New Arena Types**: Additional themed environments
- **Special Events**: Limited-time events with unique mechanics
- **Multiplayer Modes**: Real-time multiplayer competitions
- **Custom Slap Designer**: Tools for creating custom slaps

### 11.2 Blockchain Enhancements

- **Cross-Chain Integration**: Support for additional blockchains
- **DAO Governance**: Community governance mechanisms
- **Advanced NFT Functionality**: NFT evolution and breeding
- **DeFi Integration**: Yield farming and liquidity provision

### 11.3 Platform Expansion

- **Web Version**: Standalone web application
- **Mobile App**: Native mobile applications
- **API Ecosystem**: Developer APIs for third-party integration
- **Metaverse Integration**: Connection to virtual worlds