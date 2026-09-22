import { Request, Response } from 'express';
import { db, runTransaction } from '../db';

interface PrizePool {
  first: number;
  second: number;
  third: number;
  [key: string]: number;
}

// 1. Create a new tournament (POST /tournaments)
export const createTournament = (req: Request, res: Response) => {
  try {
    const {
      name,
      mode = 'Battle Royale',
      teamType = 'Squad',
      totalSlots = 12,
      entryFee = 300,
      perKillReward = 20,
      prizePool = { first: 600, second: 400, third: 200 },
      startTime,
      map = 'Bermuda',
      roomId,
      roomPassword,
    } = req.body;

    if (!name || !startTime) {
      return res.status(400).json({ error: 'Name and startTime are required' });
    }

    const id = `tourney-${Date.now()}`;
    const prizePoolStr = typeof prizePool === 'string' ? prizePool : JSON.stringify(prizePool);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO tournaments (
        id, name, mode, teamType, totalSlots, availableSlots, entryFee,
        perKillReward, prizePool, status, startTime, map, roomId, roomPassword,
        totalCollection, totalPayout, tournamentProfit, payoutStatus, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name,
      mode,
      teamType,
      Number(totalSlots),
      Number(totalSlots),
      Number(entryFee),
      Number(perKillReward),
      prizePoolStr,
      'upcoming',
      startTime,
      map,
      roomId || null,
      roomPassword || null,
      0,
      0,
      0,
      'pending',
      now
    );

    const created = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id);
    return res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      tournament: {
        ...(created as any),
        prizePool: JSON.parse((created as any).prizePool),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create tournament' });
  }
};

// 2. Get all tournaments (GET /tournaments)
export const getAllTournaments = (req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM tournaments ORDER BY createdAt DESC').all() as any[];
    const parsed = rows.map(r => ({
      ...r,
      prizePool: JSON.parse(r.prizePool),
    }));
    return res.json({ success: true, count: parsed.length, tournaments: parsed });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch tournaments' });
  }
};

// 3. Get tournament details (GET /tournaments/:id)
export const getTournamentById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tourney = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id) as any;
    if (!tourney) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const registrations = db.prepare('SELECT * FROM tournament_registrations WHERE tournamentId = ? ORDER BY slotNumber ASC').all(id) as any[];
    const parsedRegs = registrations.map(r => ({
      ...r,
      players: r.players ? JSON.parse(r.players) : [],
    }));

    return res.json({
      success: true,
      tournament: {
        ...tourney,
        prizePool: JSON.parse(tourney.prizePool),
        registeredTeams: parsedRegs.length,
        registrations: parsedRegs,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch tournament' });
  }
};

// 4. Team joins tournament (POST /tournaments/:id/join)
export const joinTournament = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, teamId, teamName, players } = req.body;

    if (!userId || !teamId || !teamName) {
      return res.status(400).json({ error: 'userId, teamId, and teamName are required' });
    }

    const result = runTransaction(() => {
      // 1. Fetch tournament
      const tourney = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id) as any;
      if (!tourney) {
        throw new Error('Tournament not found');
      }

      if (tourney.status !== 'upcoming') {
        throw new Error(`Cannot join match with status: ${tourney.status}`);
      }

      if (tourney.availableSlots <= 0) {
        throw new Error('Tournament slots are full');
      }

      // 2. Prevent duplicate entries
      const existingTeam = db.prepare('SELECT id FROM tournament_registrations WHERE tournamentId = ? AND teamId = ?').get(id, teamId);
      if (existingTeam) {
        throw new Error('This team is already registered in this tournament');
      }

      const existingUser = db.prepare('SELECT id FROM tournament_registrations WHERE tournamentId = ? AND userId = ?').get(id, userId);
      if (existingUser) {
        throw new Error('User has already registered a team for this tournament');
      }

      // 3. Check user wallet balance
      let wallet = db.prepare('SELECT * FROM wallets WHERE userId = ?').get(userId) as any;
      if (!wallet) {
        // Initialize wallet with default balance if first time
        db.prepare('INSERT INTO wallets (userId, balance, winnings, updatedAt) VALUES (?, 1500, 500, ?)').run(
          userId,
          new Date().toISOString()
        );
        wallet = { balance: 1500, winnings: 500 };
      }

      if (wallet.balance < tourney.entryFee) {
        throw new Error(`Insufficient wallet balance. Required: ₹${tourney.entryFee}, Available: ₹${wallet.balance}`);
      }

      // 4. Atomic deduction
      const newBalance = wallet.balance - tourney.entryFee;
      const now = new Date().toISOString();

      db.prepare('UPDATE wallets SET balance = ?, updatedAt = ? WHERE userId = ?').run(
        newBalance,
        now,
        userId
      );

      // 5. Transaction log
      const txId = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      db.prepare(`
        INSERT INTO wallet_transactions (id, userId, type, amount, tournamentId, description, createdAt)
        VALUES (?, ?, 'tournament_entry', ?, ?, ?, ?)
      `).run(
        txId,
        userId,
        -tourney.entryFee,
        id,
        `Entry fee for ${tourney.name}`,
        now
      );

      // 6. Decrement available slots & increment totalCollection
      const slotNumber = tourney.totalSlots - tourney.availableSlots + 1;
      const newAvailableSlots = tourney.availableSlots - 1;
      const newTotalCollection = tourney.totalCollection + tourney.entryFee;

      db.prepare(`
        UPDATE tournaments
        SET availableSlots = ?, totalCollection = ?
        WHERE id = ?
      `).run(newAvailableSlots, newTotalCollection, id);

      // 7. Insert registration
      const regId = `reg-${Date.now()}`;
      db.prepare(`
        INSERT INTO tournament_registrations (id, tournamentId, userId, teamId, teamName, players, slotNumber, entryFee, joinedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        regId,
        id,
        userId,
        teamId,
        teamName,
        players ? JSON.stringify(players) : null,
        slotNumber,
        tourney.entryFee,
        now
      );

      return {
        slotNumber,
        availableSlots: newAvailableSlots,
        walletBalance: newBalance,
        totalCollection: newTotalCollection,
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Successfully joined tournament',
      ...result,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to join tournament' });
  }
};

// 5. Admin submits match results (POST /tournaments/:id/result)
export const submitMatchResult = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { results } = req.body; // Array of { teamId, teamName, rank, kills }

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: 'Results array is required' });
    }

    const output = runTransaction(() => {
      const tourney = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id) as any;
      if (!tourney) {
        throw new Error('Tournament not found');
      }

      // Check if results already submitted
      const existingResults = db.prepare('SELECT id FROM tournament_results WHERE tournamentId = ?').all(id);
      if (existingResults && existingResults.length > 0) {
        throw new Error('Match results have already been submitted for this tournament');
      }

      const prizePool: PrizePool = JSON.parse(tourney.prizePool);
      const perKillReward = tourney.perKillReward || 20;
      const now = new Date().toISOString();

      let totalKillsRecorded = 0;
      const insertedResults: any[] = [];

      for (const item of results) {
        const { teamId, teamName, rank, kills } = item;

        if (!teamId || !teamName || rank === undefined || kills === undefined) {
          throw new Error('Each result item must have teamId, teamName, rank, and kills');
        }

        const killCount = Number(kills);
        const rankNum = Number(rank);

        if (killCount < 0 || !Number.isInteger(killCount)) {
          throw new Error(`Invalid kill count for team ${teamName}: must be an integer >= 0`);
        }
        if (rankNum <= 0 || !Number.isInteger(rankNum)) {
          throw new Error(`Invalid rank for team ${teamName}: must be an integer > 0`);
        }

        totalKillsRecorded += killCount;

        // Calculate placement prize
        let placementPrize = 0;
        if (rankNum === 1) placementPrize = prizePool.first || 0;
        else if (rankNum === 2) placementPrize = prizePool.second || 0;
        else if (rankNum === 3) placementPrize = prizePool.third || 0;

        const killReward = killCount * perKillReward;
        const totalReward = placementPrize + killReward;

        const resId = `res-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        db.prepare(`
          INSERT INTO tournament_results (
            id, tournamentId, teamId, teamName, rank, kills,
            placementPrize, killReward, totalReward, payoutStatus, submittedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        `).run(
          resId,
          id,
          teamId,
          teamName,
          rankNum,
          killCount,
          placementPrize,
          killReward,
          totalReward,
          now
        );

        insertedResults.push({
          teamId,
          teamName,
          rank: rankNum,
          kills: killCount,
          placementPrize,
          killReward,
          totalReward,
        });
      }

      // Mark tournament as completed
      db.prepare('UPDATE tournaments SET status = ? WHERE id = ?').run('completed', id);

      return {
        totalKillsRecorded,
        resultsCount: insertedResults.length,
        results: insertedResults.sort((a, b) => a.rank - b.rank),
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Match results submitted successfully',
      ...output,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to submit match results' });
  }
};

// 6. Get tournament leaderboard (GET /tournaments/:id/leaderboard)
export const getLeaderboard = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tourney = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id) as any;
    if (!tourney) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const leaderboard = db.prepare(`
      SELECT * FROM tournament_results
      WHERE tournamentId = ?
      ORDER BY rank ASC
    `).all(id) as any[];

    return res.json({
      success: true,
      tournamentId: id,
      tournamentName: tourney.name,
      status: tourney.status,
      count: leaderboard.length,
      leaderboard,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch leaderboard' });
  }
};

// 7. Process tournament payouts and compute profit (POST /tournaments/:id/payout)
export const processPayout = (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const payoutSummary = runTransaction(() => {
      const tourney = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id) as any;
      if (!tourney) {
        throw new Error('Tournament not found');
      }

      if (tourney.payoutStatus === 'paid') {
        throw new Error('Payouts have already been processed for this tournament');
      }

      const results = db.prepare('SELECT * FROM tournament_results WHERE tournamentId = ? ORDER BY rank ASC').all(id) as any[];
      if (!results || results.length === 0) {
        throw new Error('Cannot process payout: No results found for this tournament');
      }

      // Fetch team registrations to find corresponding user/captain IDs to credit
      const registrations = db.prepare('SELECT * FROM tournament_registrations WHERE tournamentId = ?').all(id) as any[];
      const teamUserMap: Record<string, string> = {};
      for (const reg of registrations) {
        teamUserMap[reg.teamId] = reg.userId;
      }

      let totalPlacementPayout = 0;
      let totalKillPayout = 0;
      const now = new Date().toISOString();

      for (const row of results) {
        const reward = row.totalReward;
        totalPlacementPayout += row.placementPrize;
        totalKillPayout += row.killReward;

        // Find user to credit
        const targetUserId = teamUserMap[row.teamId] || 'usr-default';

        if (reward > 0) {
          // Ensure wallet exists
          let wallet = db.prepare('SELECT * FROM wallets WHERE userId = ?').get(targetUserId) as any;
          if (!wallet) {
            db.prepare('INSERT INTO wallets (userId, balance, winnings, updatedAt) VALUES (?, ?, ?, ?)').run(
              targetUserId,
              reward,
              reward,
              now
            );
          } else {
            db.prepare('UPDATE wallets SET balance = balance + ?, winnings = winnings + ?, updatedAt = ? WHERE userId = ?').run(
              reward,
              reward,
              now,
              targetUserId
            );
          }

          // Transaction log
          const txId = `tx-win-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          db.prepare(`
            INSERT INTO wallet_transactions (id, userId, type, amount, tournamentId, description, createdAt)
            VALUES (?, ?, 'tournament_winning', ?, ?, ?, ?)
          `).run(
            txId,
            targetUserId,
            reward,
            id,
            `Prize payout for ${tourney.name} (Rank #${row.rank}, ${row.kills} Kills)`,
            now
          );
        }

        // Mark individual result as paid
        db.prepare('UPDATE tournament_results SET payoutStatus = ? WHERE id = ?').run('paid', row.id);
      }

      // Business Logic Calculation:
      // Total collection = entryFee × teamsJoined
      // Fixed payout = placement prizes
      // Kill payouts = perKillReward × total kills
      // App profit = Total collection − Fixed payout − Kill payouts
      const teamsCount = registrations.length;
      const totalCollection = tourney.entryFee * teamsCount;
      const totalPayout = totalPlacementPayout + totalKillPayout;
      const tournamentProfit = totalCollection - totalPayout;

      // Update tournament record
      db.prepare(`
        UPDATE tournaments
        SET totalCollection = ?, totalPayout = ?, tournamentProfit = ?, payoutStatus = 'paid'
        WHERE id = ?
      `).run(totalCollection, totalPayout, tournamentProfit, id);

      return {
        tournamentId: id,
        teamsCount,
        totalCollection,
        fixedPlacementPayout: totalPlacementPayout,
        killPayouts: totalKillPayout,
        totalPayout,
        tournamentProfit,
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Payout processed and credited to team wallets successfully',
      ...payoutSummary,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to process payout' });
  }
};
