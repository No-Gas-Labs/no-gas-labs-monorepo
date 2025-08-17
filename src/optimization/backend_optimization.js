// Backend Performance Optimization Techniques

// Database query optimization
const optimizeQueries = (pool) => {
  // Use parameterized queries to prevent SQL injection and improve performance
  const optimizedQueries = {
    getUserProfile: 'SELECT u.id, u.username, u.wallet_address, gs.game_state FROM users u LEFT JOIN game_states gs ON u.id = gs.user_id WHERE u.id = $1',
    getUserNFTs: 'SELECT n.metadata FROM nfts n WHERE n.owner_id = $1 ORDER BY n.minted_at DESC LIMIT 50',
    getUserTokens: 'SELECT SUM(ut.amount) as total_tokens FROM user_tokens ut WHERE ut.user_id = $1',
    getArenaProgress: 'SELECT ua.arena_id, ua.unlocked_at FROM user_arenas ua WHERE ua.user_id = $1 ORDER BY ua.arena_id'
  };
  
  return optimizedQueries;
};

// API response optimization
const optimizeAPIResponses = (app) => {
  // Implement response compression
  const compression = require('compression');
  app.use(compression());
  
  // Implement caching headers
  app.use((req, res, next) => {
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes cache
    next();
  });
  
  // Optimize JSON responses
  app.set('json spaces', 0); // Remove unnecessary spaces
};

// Connection pooling optimization
const optimizeConnectionPooling = () => {
  const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Maximum number of clients in the pool
    min: 5,  // Minimum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  });
  
  return pool;
};

// Caching strategy implementation
const implementCaching = () => {
  const Redis = require('redis');
  const redisClient = Redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  
  // Cache frequently accessed data
  const cache = {
    get: async (key) => {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    },
    
    set: async (key, value, ttl = 300) => {
      await redisClient.setex(key, ttl, JSON.stringify(value));
    },
    
    del: async (key) => {
      await redisClient.del(key);
    }
  };
  
  return cache;
};

// Load balancing setup
const setupLoadBalancing = () => {
  // In a production environment, this would be handled by infrastructure
  // For the application layer, we can implement basic request distribution
  
  const workerCount = process.env.WORKER_COUNT || 4;
  const cluster = require('cluster');
  
  if (cluster.isMaster) {
    // Fork workers
    for (let i = 0; i < workerCount; i++) {
      cluster.fork();
    }
    
    cluster.on('exit', (worker) => {
      console.log(`Worker ${worker.process.pid} died`);
      cluster.fork(); // Restart worker
    });
  }
  
  return cluster;
};

module.exports = {
  optimizeQueries,
  optimizeAPIResponses,
  optimizeConnectionPooling,
  implementCaching,
  setupLoadBalancing
};