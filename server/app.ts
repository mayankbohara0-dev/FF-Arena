import express from 'express';
import cors from 'cors';
import { initDatabase, db } from './db';
import tournamentRoutes from './routes/tournamentRoutes';

export const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite DB tables and initial seeds
initDatabase();

// Mount Routes (supporting both /tournaments and /api/tournaments)
app.use('/tournaments', tournamentRoutes);
app.use('/api/tournaments', tournamentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FF Arena Tournament Backend',
    timestamp: new Date().toISOString(),
  });
});

// Wallet inspection endpoint for testing & frontend syncing
app.get('/api/wallet/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const wallet = db.prepare('SELECT * FROM wallets WHERE userId = ?').get(userId);
    const transactions = db.prepare('SELECT * FROM wallet_transactions WHERE userId = ? ORDER BY createdAt DESC LIMIT 20').all(userId);
    res.json({
      success: true,
      wallet: wallet || { userId, balance: 0, winnings: 0 },
      transactions: transactions || [],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
