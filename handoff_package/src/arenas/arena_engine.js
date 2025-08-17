// Arena Engine Implementation for No_Gas_Slaps™
class ArenaEngine {
  constructor() {
    this.arenas = [
      {
        id: 1,
        name: "Novice Grounds",
        difficulty: 1,
        unlocked: true,
        physics: {
          gravity: 9.8,
          bounceDamping: 0.8,
          friction: 0.1
        },
        features: []
      },
      {
        id: 2,
        name: "Glitch Valley",
        difficulty: 2,
        unlocked: false,
        physics: {
          gravity: [5, 15],
          bounceDamping: 0.6,
          friction: 0.2
        },
        features: ["gravityChanges", "screenGlitches", "movingPlatforms"]
      },
      {
        id: 3,
        name: "Myth Caverns",
        difficulty: 3,
        unlocked: false,
        physics: {
          gravity: [-5, 20],
          bounceDamping: 0.4,
          friction: 0.3
        },
        features: ["quantumTunneling", "gravityDirectionChanges", "hiddenRelics"]
      },
      {
        id: 4,
        name: "Quantum Field",
        difficulty: 4,
        unlocked: false,
        physics: {
          gravity: "chaotic",
          bounceDamping: [0.2, 0.8],
          friction: 0.05
        },
        features: ["schrodingersCat", "quantumSuperposition", "entanglementEffects", "multipleOutcomes"]
      }
    ];
  }

  // Get all arenas
  getArenas() {
    return this.arenas;
  }

  // Get specific arena by ID
  getArena(arenaId) {
    return this.arenas.find(arena => arena.id === arenaId);
  }

  // Unlock arena for user
  unlockArena(arenaId) {
    const arena = this.getArena(arenaId);
    if (arena) {
      arena.unlocked = true;
      return arena;
    }
    return null;
  }

  // Check if user can access arena
  canAccessArena(userProgress, arenaId) {
    const arena = this.getArena(arenaId);
    if (!arena) return false;
    
    // Novice Grounds is always accessible
    if (arenaId === 1) return true;
    
    // Check if previous arena is completed
    const previousArena = this.getArena(arenaId - 1);
    if (!previousArena) return false;
    
    return previousArena.unlocked && userProgress.completedArenas.includes(arenaId - 1);
  }

  // Apply arena-specific physics
  applyPhysics(arenaId, gameState) {
    const arena = this.getArena(arenaId);
    if (!arena) return gameState;
    
    // Apply physics parameters
    gameState.physics = { ...arena.physics };
    
    // Apply special features
    gameState.features = [...arena.features];
    
    return gameState;
  }

  // Get arena background theme
  getArenaTheme(arenaId) {
    const arena = this.getArena(arenaId);
    if (!arena) return "novice-grounds"; // default theme
    
    return arena.name.toLowerCase().replace(/\s+/g, '-');
  }

  // Update game state with arena-specific mechanics
  updateGameState(arenaId, gameState) {
    const arena = this.getArena(arenaId);
    if (!arena) return gameState;
    
    // Apply arena-specific modifications to game state
    gameState.currentArena = arenaId;
    gameState.arenaName = arena.name;
    gameState = this.applyPhysics(arenaId, gameState);
    
    return gameState;
  }
}

module.exports = ArenaEngine;