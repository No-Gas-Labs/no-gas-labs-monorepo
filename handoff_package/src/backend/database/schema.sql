-- No_Gas_Labs™ & No_Gas_Slaps™ Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255),
    wallet_address VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game states table
CREATE TABLE IF NOT EXISTS game_states (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    game_state JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Arenas table
CREATE TABLE IF NOT EXISTS arenas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level INTEGER NOT NULL,
    background_image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NFTs table
CREATE TABLE IF NOT EXISTS nfts (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    metadata JSONB NOT NULL,
    minted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User tokens table
CREATE TABLE IF NOT EXISTS user_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    source VARCHAR(255) NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quests table
CREATE TABLE IF NOT EXISTS quests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NOT NULL,
    description TEXT,
    reward_amount DECIMAL(10, 2) NOT NULL,
    reward_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User quests table
CREATE TABLE IF NOT EXISTS user_quests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    quest_id INTEGER REFERENCES quests(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, quest_id)
);

-- Initial arena data
INSERT INTO arenas (name, description, difficulty_level, background_image_url) VALUES
    ('Novice Grounds', 'The training area for new players. Gentle slopes and predictable physics.', 1, '/images/arenas/novice_grounds.jpg'),
    ('Glitch Valley', 'A mysterious valley where the laws of physics bend and twist.', 2, '/images/arenas/glitch_valley.jpg'),
    ('Myth Caverns', 'Dark caverns filled with ancient relics and unpredictable quantum phenomena.', 3, '/images/arenas/myth_caverns.jpg'),
    ('Quantum Field', 'The ultimate arena where reality itself becomes uncertain.', 4, '/images/arenas/quantum_field.jpg')
ON CONFLICT (name) DO NOTHING;

-- Initial quests data
INSERT INTO quests (title, description, reward_amount, reward_type) VALUES
    ('First Slap', 'Complete your first slap in No_Gas_Slaps™', 10.00, 'tokens'),
    ('100 XP', 'Earn 100 XP in No_Gas_Labs™', 25.00, 'tokens'),
    ('Relic Hunter', 'Collect your first NFT relic', 50.00, 'tokens'),
    ('Arena Master', 'Complete all four arenas', 100.00, 'tokens')
ON CONFLICT (title) DO NOTHING;