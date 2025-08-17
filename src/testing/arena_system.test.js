// Unit Tests for Arena System
const ArenaEngine = require('../arenas/arena_engine.js');

describe('Arena System Tests', () => {
  let arenaEngine;

  beforeEach(() => {
    arenaEngine = new ArenaEngine();
  });

  test('getArenas should return all four arenas', () => {
    const arenas = arenaEngine.getArenas();
    expect(arenas.length).toBe(4);
    
    // Check that each arena has the required properties
    arenas.forEach(arena => {
      expect(arena).toHaveProperty('id');
      expect(arena).toHaveProperty('name');
      expect(arena).toHaveProperty('difficulty');
      expect(arena).toHaveProperty('unlocked');
      expect(arena).toHaveProperty('physics');
      expect(arena).toHaveProperty('features');
    });
  });

  test('getArena should return specific arena by ID', () => {
    const arena = arenaEngine.getArena(1);
    expect(arena).not.toBeNull();
    expect(arena.name).toBe('Novice Grounds');
    expect(arena.difficulty).toBe(1);
  });

  test('canAccessArena should validate arena access', () => {
    // Novice Grounds should always be accessible
    expect(arenaEngine.canAccessArena({ completedArenas: [] }, 1)).toBe(true);
    
    // Glitch Valley should be accessible only if Novice Grounds is completed
    expect(arenaEngine.canAccessArena({ completedArenas: [1] }, 2)).toBe(true);
    expect(arenaEngine.canAccessArena({ completedArenas: [] }, 2)).toBe(false);
  });

  test('getArenaTheme should return correct CSS class', () => {
    expect(arenaEngine.getArenaTheme(1)).toBe('novice-grounds');
    expect(arenaEngine.getArenaTheme(2)).toBe('glitch-valley');
    expect(arenaEngine.getArenaTheme(3)).toBe('myth-caverns');
    expect(arenaEngine.getArenaTheme(4)).toBe('quantum-field');
  });
});