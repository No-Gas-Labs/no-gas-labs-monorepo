// Unit Tests for Slap Engine
const { calculateTrajectory, checkCollision, updateGameState } = require('../frontend/game.js');

describe('Slap Engine Tests', () => {
  test('calculateTrajectory should compute correct physics', () => {
    // Test with standard values
    const params = {
      power: 75,
      angle: 45,
      gravity: 9.8
    };
    
    const result = calculateTrajectory(params);
    
    // We expect a valid trajectory object with x, y, vx, vy properties
    expect(result).toHaveProperty('x');
    expect(result).toHaveProperty('y');
    expect(result).toHaveProperty('vx');
    expect(result).toHaveProperty('vy');
    expect(typeof result.x).toBe('number');
    expect(typeof result.y).toBe('number');
    expect(typeof result.vx).toBe('number');
    expect(typeof result.vy).toBe('number');
  });

  test('checkCollision should detect object collisions', () => {
    // Test collision detection
    const object1 = { x: 100, y: 100, width: 50, height: 50 };
    const object2 = { x: 120, y: 120, width: 50, height: 50 };
    const object3 = { x: 200, y: 200, width: 50, height: 50 };
    
    // These should collide
    expect(checkCollision(object1, object2)).toBe(true);
    
    // These should not collide
    expect(checkCollision(object1, object3)).toBe(false);
  });

  test('updateGameState should manage game state transitions', () => {
    // Test initial game state
    const initialState = {
      score: 0,
      combo: 0,
      gameState: 'menu'
    };
    
    // Test transition to playing state
    const playingState = updateGameState(initialState, 'startGame');
    expect(playingState.gameState).toBe('playing');
    
    // Test score update
    const scoredState = updateGameState(playingState, 'successfulSlap');
    expect(scoredState.score).toBeGreaterThan(0);
    expect(scoredState.combo).toBeGreaterThan(0);
  });
});