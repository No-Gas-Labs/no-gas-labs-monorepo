// User Acceptance Testing Scenarios
const uatScenarios = {
  noGasSlaps: [
    {
      id: 1,
      name: "New User Onboarding",
      description: "Test the initial experience for new users starting No_Gas_Slaps™",
      steps: [
        "Open No_Gas_Slaps™ mini-app in Telegram",
        "View welcome screen and instructions",
        "Create new profile",
        "Start first game session"
      ],
      expectedOutcome: "User successfully onboarded with clear understanding of game mechanics"
    },
    {
      id: 2,
      name: "First Slap Execution",
      description: "Test the core slapping mechanic in the Novice Grounds arena",
      steps: [
        "Navigate to Novice Grounds arena",
        "Adjust power and angle sliders",
        "Execute slap",
        "Observe trajectory and collision",
        "Check score update"
      ],
      expectedOutcome: "Slap executes correctly with visible trajectory and accurate scoring"
    },
    {
      id: 3,
      name: "Arena Progression",
      description: "Test unlocking and playing in different arenas",
      steps: [
        "Complete Novice Grounds arena",
        "Attempt to access Glitch Valley",
        "Unlock Glitch Valley through progression",
        "Play in Glitch Valley arena",
        "Experience unique physics and visual effects"
      ],
      expectedOutcome: "Arenas unlock correctly and provide distinct gameplay experiences"
    },
    {
      id: 4,
      name: "NFT Collection",
      description: "Test collecting and viewing NFT relics",
      steps: [
        "Complete slap challenges to earn relics",
        "Mint NFT relic through gasless transaction",
        "View NFT in collection",
        "Verify NFT metadata"
      ],
      expectedOutcome: "Users can successfully collect and view NFT relics with accurate metadata"
    },
    {
      id: 5,
      name: "Token Earning",
      description: "Test earning and viewing RELIC tokens",
      steps: [
        "Complete successful slaps",
        "Earn tokens through gameplay",
        "View token balance in profile",
        "Check token earnings history"
      ],
      expectedOutcome: "Tokens are accurately earned and displayed in user profile"
    },
    {
      id: 6,
      name: "Profile Access",
      description: "Test accessing and navigating user profile",
      steps: [
        "Navigate to profile screen",
        "View player statistics",
        "Check progression status",
        "View NFT collection",
        "View achievements",
        "Return to game screen"
      ],
      expectedOutcome: "Profile provides comprehensive user data and navigation works correctly"
    }
  ],
  
  noGasLabs: [
    {
      id: 1,
      name: "User Registration",
      description: "Test the registration process for No_Gas_Labs™ RPG platform",
      steps: [
        "Visit No_Gas_Labs™ web platform",
        "Click registration button",
        "Connect Telegram account",
        "Create user profile",
        "Verify registration completion"
      ],
      expectedOutcome: "User successfully registers and connects Telegram account"
    },
    {
      id: 2,
      name: "Character Creation",
      description: "Test creating and customizing player character",
      steps: [
        "Navigate to character creation",
        "Select character class",
        "Customize appearance",
        "Save character",
        "View character in profile"
      ],
      expectedOutcome: "Character creation works smoothly with customization options"
    },
    {
      id: 3,
      name: "Quest System",
      description: "Test accepting and completing quests",
      steps: [
        "View available quests",
        "Accept a quest",
        "Complete quest requirements (through No_Gas_Slaps™)",
        "Submit quest completion",
        "Receive quest rewards",
        "View completed quests"
      ],
      expectedOutcome: "Quest system functions correctly with proper reward distribution"
    },
    {
      id: 4,
      name: "NFT Management",
      description: "Test viewing and managing NFT collection",
      steps: [
        "Navigate to NFT collection",
        "View all collected relics",
        "Check NFT details and metadata",
        "Verify ownership on blockchain",
        "Test NFT transfer functionality"
      ],
      expectedOutcome: "Users can view and manage their NFT collections with blockchain verification"
    },
    {
      id: 5,
      name: "Token Economy",
      description: "Test the RELIC token economy system",
      steps: [
        "View token balance",
        "Check token earning history",
        "View token spending options",
        "Test token spending functionality",
        "Verify token balance updates"
      ],
      expectedOutcome: "Token economy is clear and functional with accurate balance tracking"
    },
    {
      id: 6,
      name: "Progression Tracking",
      description: "Test RPG progression system",
      steps: [
        "View current level and XP",
        "Check XP requirements for next level",
        "Complete XP earning activities",
        "Level up character",
        "Unlock new abilities or content"
      ],
      expectedOutcome: "Progression system works correctly with visible advancement and unlocks"
    }
  ],
  
  crossPlatform: [
    {
      id: 1,
      name: "Seamless Transition",
      description: "Test transitioning gameplay between Telegram mini-app and web platform",
      steps: [
        "Start game session on Telegram",
        "Play for 10 minutes",
        "Access web platform",
        "Continue same session on web",
        "Verify game state consistency"
      ],
      expectedOutcome: "Game sessions transfer seamlessly between platforms with consistent state"
    },
    {
      id: 2,
      name: "Unified Token Economy",
      description: "Test earning and spending tokens across both platforms",
      steps: [
        "Earn tokens on Telegram mini-app",
        "View updated balance on web platform",
        "Spend tokens on web platform",
        "Verify balance on Telegram mini-app",
        "Check transaction history"
      ],
      expectedOutcome: "Token economy functions uniformly across both platforms"
    },
    {
      id: 3,
      name: "Shared NFT Collection",
      description: "Test viewing and managing NFTs across both platforms",
      steps: [
        "Mint NFT on Telegram mini-app",
        "View NFT collection on web platform",
        "View same NFT details on both platforms",
        "Check blockchain verification on both platforms"
      ],
      expectedOutcome: "NFT collections are synchronized and verifiable across both platforms"
    },
    {
      id: 4,
      name: "Consistent Progression",
      description: "Test progression system consistency across platforms",
      steps: [
        "Complete arena on Telegram mini-app",
        "Check progression on web platform",
        "Unlock new content on web platform",
        "Verify unlocks on Telegram mini-app",
        "Check achievement synchronization"
      ],
      expectedOutcome: "Progression is consistent and synchronized across both platforms"
    }
  ]
};

module.exports = uatScenarios;