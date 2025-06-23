-- Create the database schema for the Multiplayer AI Coding Arena

-- Users table (Clerk handles auth, we store additional data)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    clerk_id TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    total_score INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    password TEXT,
    max_players INTEGER DEFAULT 4,
    current_players INTEGER DEFAULT 0,
    status TEXT DEFAULT 'waiting', -- waiting, in_progress, finished
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES rooms(id),
    challenge_title TEXT NOT NULL,
    challenge_description TEXT NOT NULL,
    challenge_examples TEXT NOT NULL,
    difficulty TEXT DEFAULT 'medium', -- easy, medium, hard
    status TEXT DEFAULT 'active', -- active, finished
    winner_id TEXT REFERENCES users(id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INTEGER DEFAULT 300 -- 5 minutes default
);

-- Game participants
CREATE TABLE IF NOT EXISTS game_participants (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL REFERENCES games(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, user_id)
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL REFERENCES games(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    code TEXT NOT NULL,
    language TEXT DEFAULT 'javascript',
    is_correct BOOLEAN DEFAULT FALSE,
    ai_feedback TEXT,
    time_complexity TEXT,
    space_complexity TEXT,
    score INTEGER DEFAULT 0,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leaderboards table
CREATE TABLE IF NOT EXISTS leaderboards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    game_id TEXT NOT NULL REFERENCES games(id),
    rank INTEGER NOT NULL,
    score INTEGER NOT NULL,
    submission_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_games_room_id ON games(room_id);
CREATE INDEX IF NOT EXISTS idx_submissions_game_user ON submissions(game_id, user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_game ON leaderboards(game_id, rank);
