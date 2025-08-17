// Progression System Component for No_Gas_Labs™
import React, { useState, useEffect } from 'react';

const ProgressionSystem = ({ userId, gameState, onUpdateGameState }) => {
  const [level, setLevel] = useState(gameState.level || 1);
  const [xp, setXp] = useState(gameState.xp || 0);
  const [totalXp, setTotalXp] = useState(gameState.totalXp || 1000);
  const [completedArenas, setCompletedArenas] = useState(gameState.completedArenas || []);
  const [achievements, setAchievements] = useState(gameState.achievements || []);

  // XP requirements for levels
  const xpRequirements = [
    { level: 1, xpRequired: 1000 },
    { level: 2, xpRequired: 2500 },
    { level: 3, xpRequired: 4500 },
    { level: 4, xpRequired: 7000 },
    { level: 5, xpRequired: 10000 },
    { level: 6, xpRequired: 14000 },
    { level: 7, xpRequired: 19000 },
    { level: 8, xpRequired: 25000 },
    { level: 9, xpRequired: 32000 },
    { level: 10, xpRequired: 40000 }
  ];

  // Check for level ups
  useEffect(() => {
    const currentLevelData = xpRequirements.find(req => req.level === level);
    if (currentLevelData && xp >= currentLevelData.xpRequired) {
      // Level up
      const nextLevel = level + 1;
      setLevel(nextLevel);
      
      // Update game state
      const updatedGameState = {
        ...gameState,
        level: nextLevel,
        xp: xp,
        totalXp: xpRequirements.find(req => req.level === nextLevel)?.xpRequired || totalXp
      };
      
      onUpdateGameState(updatedGameState);
    }
  }, [xp, level, totalXp, gameState, onUpdateGameState]);

  // Award XP
  const awardXP = (amount) => {
    setXp(prevXp => prevXp + amount);
  };

  // Complete arena
  const completeArena = (arenaId) => {
    if (!completedArenas.includes(arenaId)) {
      setCompletedArenas(prev => [...prev, arenaId]);
      
      // Award achievement for completing arena
      const arenaNames = {
        1: 'Novice Grounds',
        2: 'Glitch Valley',
        3: 'Myth Caverns',
        4: 'Quantum Field'
      };
      
      const achievementName = `Master of ${arenaNames[arenaId]}`;
      if (!achievements.includes(achievementName)) {
        setAchievements(prev => [...prev, achievementName]);
      }
    }
  };

  // Get XP progress percentage
  const getXpProgress = () => {
    const currentLevelData = xpRequirements.find(req => req.level === level);
    const nextLevelData = xpRequirements.find(req => req.level === level + 1);
    
    if (!currentLevelData) return 0;
    
    if (!nextLevelData) {
      // Max level
      return 100;
    }
    
    const levelXpRange = nextLevelData.xpRequired - currentLevelData.xpRequired;
    const currentXpProgress = xp - currentLevelData.xpRequired;
    
    return Math.min(100, Math.max(0, (currentXpProgress / levelXpRange) * 100));
  };

  return {
    level,
    xp,
    totalXp,
    completedArenas,
    achievements,
    awardXP,
    completeArena,
    getXpProgress
  };
};

export default ProgressionSystem;