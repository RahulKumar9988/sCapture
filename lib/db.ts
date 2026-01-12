
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'srecorder.db');
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    title TEXT,
    filename TEXT,
    duration REAL,
    views INTEGER DEFAULT 0,
    completion_rate REAL DEFAULT 0,
    created_at INTEGER
  )
`);

export default db;
