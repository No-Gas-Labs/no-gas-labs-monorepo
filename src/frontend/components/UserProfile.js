// User Profile Component for No_Gas_Labs™
import React, { useState, useEffect } from 'react';

const UserProfile = ({ userId, onBack }) => {
  const [user, setUser] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [tokens, setTokens] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would fetch data from the backend
    // For now, we'll use mock data
    const fetchUserData = async () => {
      try {
        // Mock user data
        const mockUser = {
          id: userId,
          telegramId: 'user123',
          username: 'quantum_player',
          walletAddress: 'EQD...user_wallet_address',
          createdAt: '2025-08-15T00:00:00Z'
        };
        
        // Mock game state
        const mockGameState = {
          level: 5,
          xp: 1250,
          totalXp: 2000,
          completedArenas: [1, 2],
          currentArena: 2,
          achievements: ['First Slap', 'Relic Hunter'],
          stats: {
            totalSlaps: 420,
            successfulSlaps: 380,
            failedSlaps: 40,
            highestCombo: 15
          }
        };
        
        // Mock NFTs
        const mockNfts = [
          {
            id: 1,
            name: 'Quantum Fragment',
            description: 'A piece of the quantum realm',
            imageUrl: '/images/nfts/quantum_fragment.jpg'
          },
          {
            id: 2,
            name: 'Glitch Relic',
            description: 'An artifact from the glitch valley',
            imageUrl: '/images/nfts/glitch_relic.jpg'
          }
        ];
        
        // Mock tokens
        const mockTokens = 125.50;
        
        // Mock achievements
        const mockAchievements = [
          { id: 1, name: 'First Slap', description: 'Complete your first slap', unlockedAt: '2025-08-10T00:00:00Z' },
          { id: 2, name: 'Relic Hunter', description: 'Collect your first NFT relic', unlockedAt: '2025-08-12T00:00:00Z' },
          { id: 3, name: 'Combo Master', description: 'Achieve a 10-slap combo', unlockedAt: '2025-08-14T00:00:00Z' }
        ];
        
        setUser(mockUser);
        setGameState(mockGameState);
        setNfts(mockNfts);
        setTokens(mockTokens);
        setAchievements(mockAchievements);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">User Profile</h1>
          <button 
            onClick={onBack}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Back to Game
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Player Info</h2>
            <div className="space-y-2">
              <p><span className="font-semibold">Username:</span> {user.username}</p>
              <p><span className="font-semibold">Level:</span> {gameState.level}</p>
              <p><span className="font-semibold">Wallet:</span> {user.walletAddress.substring(0, 10)}...{user.walletAddress.substring(user.walletAddress.length - 10)}</p>
              <p><span className="font-semibold">Member Since:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Progress</h2>
            <div className="space-y-2">
              <p><span className="font-semibold">XP:</span> {gameState.xp} / {gameState.totalXp}</p>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full" 
                  style={{ width: `${(gameState.xp / gameState.totalXp) * 100}%` }}
                ></div>
              </div>
              <p><span className="font-semibold">RELIC Tokens:</span> {tokens}</p>
              <p><span className="font-semibold">Current Arena:</span> {gameState.arenaName || 'Novice Grounds'}</p>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Statistics</h2>
            <div className="space-y-2">
              <p><span className="font-semibold">Total Slaps:</span> {gameState.stats.totalSlaps}</p>
              <p><span className="font-semibold">Success Rate:</span> {Math.round((gameState.stats.successfulSlaps / gameState.stats.totalSlaps) * 100)}%</p>
              <p><span className="font-semibold">Highest Combo:</span> {gameState.stats.highestCombo}</p>
              <p><span className="font-semibold">Arenas Completed:</span> {gameState.completedArenas.length}/4</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Achievements</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map(achievement => (
              <div key={achievement.id} className="border border-purple-500 rounded p-4">
                <h3 className="font-bold text-lg">{achievement.name}</h3>
                <p className="text-gray-300">{achievement.description}</p>
                <p className="text-sm text-gray-400 mt-2">Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">NFT Collection</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {nfts.map(nft => (
              <div key={nft.id} className="border border-purple-500 rounded-lg overflow-hidden">
                <img src={nft.imageUrl} alt={nft.name} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="font-bold">{nft.name}</h3>
                  <p className="text-gray-300 text-sm">{nft.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;