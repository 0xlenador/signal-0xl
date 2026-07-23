DROP TABLE IF EXISTS users;
CREATE TABLE users (
    address TEXT PRIMARY KEY,
    points INTEGER NOT NULL,
    forkLevel INTEGER NOT NULL,
    lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_points ON users(points DESC);

DROP TABLE IF EXISTS sync_state;
CREATE TABLE sync_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    lastProcessedBlock INTEGER NOT NULL
);
