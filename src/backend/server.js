// No_Gas_Labs™ & No_Gas_Slaps™ Backend Server
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/nogaslabs',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus.rows[0]
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
});

// User endpoints
app.get('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user', async (req, res) => {
  try {
    const { telegramId, username, walletAddress } = req.body;
    const result = await pool.query(
      'INSERT INTO users (telegram_id, username, wallet_address, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [telegramId, username, walletAddress]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Game state endpoints
app.get('/api/game-state/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM game_states WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game state not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/game-state', async (req, res) => {
  try {
    const { userId, gameState } = req.body;
    const result = await pool.query(
      'INSERT INTO game_states (user_id, game_state, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (user_id) DO UPDATE SET game_state = $2, updated_at = NOW() RETURNING *',
      [userId, gameState]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Arena endpoints
app.get('/api/arenas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM arenas ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/arena/:arenaId', async (req, res) => {
  try {
    const { arenaId } = req.params;
    const result = await pool.query(
      'SELECT * FROM arenas WHERE id = $1',
      [arenaId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Arena not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NFT endpoints
app.get('/api/nfts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM nfts WHERE owner_id = $1',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/nfts/mint', async (req, res) => {
  try {
    const { userId, nftData } = req.body;
    const result = await pool.query(
      'INSERT INTO nfts (owner_id, metadata, minted_at) VALUES ($1, $2, NOW()) RETURNING *',
      [userId, nftData]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Token endpoints
app.get('/api/tokens/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT SUM(amount) as total_tokens FROM user_tokens WHERE user_id = $1',
      [userId]
    );
    
    res.json({ tokens: result.rows[0].total_tokens || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tokens/earn', async (req, res) => {
  try {
    const { userId, amount, source } = req.body;
    const result = await pool.query(
      'INSERT INTO user_tokens (user_id, amount, source, earned_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [userId, amount, source]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quest endpoints
app.get('/api/quests', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quests ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/quests/complete', async (req, res) => {
  try {
    const { userId, questId } = req.body;
    const result = await pool.query(
      'INSERT INTO user_quests (user_id, quest_id, completed_at) VALUES ($1, $2, NOW()) RETURNING *',
      [userId, questId]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`No_Gas_Labs™ & No_Gas_Slaps™ backend server running on port ${PORT}`);
});

module.exports = app;