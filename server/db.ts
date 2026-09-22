import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = path.join(process.cwd(), 'server', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'ffarena.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys for speed and data integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'Battle Royale',
      teamType TEXT NOT NULL DEFAULT 'Squad',
      totalSlots INTEGER NOT NULL DEFAULT 12,
      availableSlots INTEGER NOT NULL DEFAULT 12,
      entryFee INTEGER NOT NULL DEFAULT 300,
      perKillReward INTEGER NOT NULL DEFAULT 20,
      prizePool TEXT NOT NULL, -- JSON { first: 600, second: 400, third: 200 }
      status TEXT NOT NULL DEFAULT 'upcoming', -- upcoming, live, completed
      startTime TEXT NOT NULL,
      map TEXT NOT NULL DEFAULT 'Bermuda',
      roomId TEXT,
      roomPassword TEXT,
      totalCollection REAL NOT NULL DEFAULT 0,
      totalPayout REAL NOT NULL DEFAULT 0,
      tournamentProfit REAL NOT NULL DEFAULT 0,
      payoutStatus TEXT NOT NULL DEFAULT 'pending', -- pending, paid
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wallets (
      userId TEXT PRIMARY KEY,
      balance REAL NOT NULL DEFAULT 0,
      winnings REAL NOT NULL DEFAULT 0,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL, -- tournament_entry, tournament_winning, deposit, withdrawal
      amount REAL NOT NULL,
      tournamentId TEXT,
      description TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES wallets(userId)
    );

    CREATE TABLE IF NOT EXISTS tournament_registrations (
      id TEXT PRIMARY KEY,
      tournamentId TEXT NOT NULL,
      userId TEXT NOT NULL,
      teamId TEXT NOT NULL,
      teamName TEXT NOT NULL,
      players TEXT, -- JSON array of player names/UIDs
      slotNumber INTEGER NOT NULL,
      entryFee INTEGER NOT NULL,
      joinedAt TEXT NOT NULL,
      FOREIGN KEY (tournamentId) REFERENCES tournaments(id),
      UNIQUE(tournamentId, teamId),
      UNIQUE(tournamentId, userId)
    );

    CREATE TABLE IF NOT EXISTS tournament_results (
      id TEXT PRIMARY KEY,
      tournamentId TEXT NOT NULL,
      teamId TEXT NOT NULL,
      teamName TEXT NOT NULL,
      rank INTEGER NOT NULL,
      kills INTEGER NOT NULL DEFAULT 0,
      placementPrize REAL NOT NULL DEFAULT 0,
      killReward REAL NOT NULL DEFAULT 0,
      totalReward REAL NOT NULL DEFAULT 0,
      payoutStatus TEXT NOT NULL DEFAULT 'pending', -- pending, paid
      submittedAt TEXT NOT NULL,
      FOREIGN KEY (tournamentId) REFERENCES tournaments(id),
      UNIQUE(tournamentId, teamId)
    );
  `);

  // Seed default test user wallet if not exists
  const userCheck = db.prepare('SELECT userId FROM wallets WHERE userId = ?').get('usr-default');
  if (!userCheck) {
    db.prepare('INSERT INTO wallets (userId, balance, winnings, updatedAt) VALUES (?, ?, ?, ?)').run(
      'usr-default',
      2500,
      1200,
      new Date().toISOString()
    );
  }

  // Also seed Mayank's wallet
  const mayankCheck = db.prepare('SELECT userId FROM wallets WHERE userId = ?').get('usr-mayank');
  if (!mayankCheck) {
    db.prepare('INSERT INTO wallets (userId, balance, winnings, updatedAt) VALUES (?, ?, ?, ?)').run(
      'usr-mayank',
      3500,
      1500,
      new Date().toISOString()
    );
  }

  // Seed initial Big Slot tournament if not exists
  const bigSlotCheck = db.prepare('SELECT id FROM tournaments WHERE id = ?').get('big-slot-official-1');
  if (!bigSlotCheck) {
    db.prepare(`
      INSERT INTO tournaments (
        id, name, mode, teamType, totalSlots, availableSlots, entryFee,
        perKillReward, prizePool, status, startTime, map, roomId, roomPassword,
        totalCollection, totalPayout, tournamentProfit, payoutStatus, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'big-slot-official-1',
      'Big Slot – Battle Royale (Squad Only)',
      'Battle Royale',
      'Squad',
      12,
      12,
      300,
      20,
      JSON.stringify({ first: 600, second: 400, third: 200 }),
      'upcoming',
      'Today • 9:30 PM',
      'Bermuda',
      '9284102',
      'BIG300',
      0,
      0,
      0,
      'pending',
      new Date().toISOString()
    );
  }
}

// Transaction runner utility for guaranteed ACID operations
export function runTransaction<T>(callback: () => T): T {
  db.exec('BEGIN IMMEDIATE TRANSACTION;');
  try {
    const result = callback();
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}
