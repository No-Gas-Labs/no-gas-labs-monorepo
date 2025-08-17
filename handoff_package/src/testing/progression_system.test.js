// Unit Tests for Progression System
const ProgressionSystem = require('../frontend/components/ProgressionSystem.js');

describe('Progression System Tests', () => {
  test('awardXP should correctly increase XP', () => {
    // Initialize with level 1 and 0 XP
    const progressionSystem = new ProgressionSystem('user123', { level: 1, xp: 0, totalXp: 1000 });
    
    // Award 500 XP
    progressionSystem.awardXP(500);
    
    // Check that XP increased correctly
    expect(progressionSystem.xp).toBe(500);
  });

  test('getXpProgress should calculate correct percentage', () => {
    // Initialize with level 1 and 500/1000 XP
    const progressionSystem = new ProgressionSystem('user123', { level: 1, xp: 500, totalXp: 1000 });
    
    // Check progress percentage
    const progress = progressionSystem.getXpProgress();
    expect(progress).toBe(50);
  });

  test('completeArena should track completed arenas', () => {
    // Initialize with no completed arenas
    const progressionSystem = new ProgressionSystem('user123', { completedArenas: [] });
    
    // Complete arena 1
    progressionSystem.completeArena(1);
    
    // Check that arena 1 is now completed
    expect(progressionSystem.completedArenas.includes(1)).toBe(true);
  });
});