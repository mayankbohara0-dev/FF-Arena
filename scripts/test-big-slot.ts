/**
 * Automated Verification Script for "Big Slot – Battle Royale (Squad Only)"
 * Tests:
 * 1. Creation of Big Slot tournament with exact params.
 * 2. 12 squad joins with atomic wallet balance deductions (300 * 12 = 3600).
 * 3. Validation: 13th team blocked (slots = 0).
 * 4. Validation: Duplicate team blocked.
 * 5. Match result submission with 48 total kills.
 * 6. Leaderboard retrieval with calculated rewards.
 * 7. Payout execution with atomic wallet credits.
 * 8. Strict Assertion: App profit == 1440.
 * 9. Duplicate payout blocked.
 */
import { app } from '../server/app';
import { db } from '../server/db';
import http from 'node:http';

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 TESTING "BIG SLOT – BATTLE ROYALE (SQUAD ONLY)" API');
  console.log('======================================================\n');

  // Start local test server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Create Big Slot Tournament
    console.log('1️⃣ Testing POST /tournaments (Create Big Slot)...');
    const createRes = await fetch(`${baseUrl}/tournaments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Big Slot',
        mode: 'Battle Royale',
        teamType: 'Squad',
        totalSlots: 12,
        entryFee: 300,
        perKillReward: 20,
        prizePool: { first: 600, second: 400, third: 200 },
        startTime: '9:30 PM',
        map: 'Bermuda',
        roomId: '8492019',
        roomPassword: 'BIGFF',
      }),
    });
    const createData = await createRes.json();
    if (!createData.success) throw new Error(`Create failed: ${JSON.stringify(createData)}`);
    const tourneyId = createData.tournament.id;
    console.log(`   ✅ Created Tournament: ${createData.tournament.name} (ID: ${tourneyId})`);
    console.log(`      Slots: ${createData.tournament.totalSlots}, Entry: ₹${createData.tournament.entryFee}, Per Kill: ₹${createData.tournament.perKillReward}`);
    console.log(`      Prizes: 1st: ₹${createData.tournament.prizePool.first}, 2nd: ₹${createData.tournament.prizePool.second}, 3rd: ₹${createData.tournament.prizePool.third}`);

    // 2. Fetch Tournament Details
    console.log('\n2️⃣ Testing GET /tournaments/:id...');
    const getRes = await fetch(`${baseUrl}/tournaments/${tourneyId}`);
    const getData = await getRes.json();
    if (!getData.success || getData.tournament.availableSlots !== 12) {
      throw new Error(`GET failed: ${JSON.stringify(getData)}`);
    }
    console.log(`   ✅ Tournament verified. Available slots: ${getData.tournament.availableSlots}/12`);

    // 3. Register 12 Squads (Fully Booked)
    console.log('\n3️⃣ Testing POST /tournaments/:id/join (Booking all 12 Squads)...');
    const teams = [
      { teamId: 'tm-1', name: 'Alpha Strikers', userId: 'user-cap-1' },
      { teamId: 'tm-2', name: 'Bravo Wolves', userId: 'user-cap-2' },
      { teamId: 'tm-3', name: 'Charlie Predators', userId: 'user-cap-3' },
      { teamId: 'tm-4', name: 'Delta Force', userId: 'user-cap-4' },
      { teamId: 'tm-5', name: 'Echo Titans', userId: 'user-cap-5' },
      { teamId: 'tm-6', name: 'Foxtrot Kings', userId: 'user-cap-6' },
      { teamId: 'tm-7', name: 'Golf Warriors', userId: 'user-cap-7' },
      { teamId: 'tm-8', name: 'Hotel Phantoms', userId: 'user-cap-8' },
      { teamId: 'tm-9', name: 'India Gliders', userId: 'user-cap-9' },
      { teamId: 'tm-10', name: 'Juliet Vipers', userId: 'user-cap-10' },
      { teamId: 'tm-11', name: 'Kilo Elites', userId: 'user-cap-11' },
      { teamId: 'tm-12', name: 'Lima Reapers', userId: 'user-cap-12' },
    ];

    for (let i = 0; i < teams.length; i++) {
      const t = teams[i];
      // Seed wallet with 1000 balance for this test user
      db.prepare('INSERT OR REPLACE INTO wallets (userId, balance, winnings, updatedAt) VALUES (?, 1000, 0, ?)').run(
        t.userId,
        new Date().toISOString()
      );

      const joinRes = await fetch(`${baseUrl}/tournaments/${tourneyId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: t.userId,
          teamId: t.teamId,
          teamName: t.name,
          players: [
            { name: `${t.name} Cap`, uid: `91028300${i}1` },
            { name: `${t.name} P2`, uid: `91028300${i}2` },
            { name: `${t.name} P3`, uid: `91028300${i}3` },
            { name: `${t.name} P4`, uid: `91028300${i}4` },
          ],
        }),
      });

      const joinData = await joinRes.json();
      if (!joinData.success) throw new Error(`Join failed for ${t.name}: ${JSON.stringify(joinData)}`);
      if (joinData.walletBalance !== 700) throw new Error(`Wallet balance deduction mismatch. Expected 700, got ${joinData.walletBalance}`);
    }
    console.log(`   ✅ All 12 squads successfully registered. Total collection: ₹${12 * 300} = ₹3,600`);

    // 4. Test Edge Case: 13th Squad Blocked (Slots Full)
    console.log('\n4️⃣ Testing Edge Case: 13th team join blocked (Slots = 0)...');
    db.prepare('INSERT OR REPLACE INTO wallets (userId, balance, winnings, updatedAt) VALUES (?, 1000, 0, ?)').run(
      'user-cap-13',
      new Date().toISOString()
    );
    const fullRes = await fetch(`${baseUrl}/tournaments/${tourneyId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-cap-13',
        teamId: 'tm-13',
        teamName: 'Overflow Team',
      }),
    });
    const fullData = await fullRes.json();
    if (fullRes.status !== 400 || !fullData.error.includes('full')) {
      throw new Error(`Expected slot full error, got: ${JSON.stringify(fullData)}`);
    }
    console.log(`   ✅ Correctly blocked 13th team: "${fullData.error}"`);

    // 5. Test Edge Case: Duplicate Team Entry Blocked
    console.log('\n5️⃣ Testing Edge Case: Duplicate team entry blocked...');
    const dupRes = await fetch(`${baseUrl}/tournaments/${tourneyId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-cap-1',
        teamId: 'tm-1',
        teamName: 'Alpha Strikers',
      }),
    });
    const dupData = await dupRes.json();
    if (dupRes.status !== 400) {
      throw new Error(`Expected duplicate error, got: ${JSON.stringify(dupData)}`);
    }
    console.log(`   ✅ Correctly blocked duplicate team: "${dupData.error}"`);

    // 6. Submit Match Results
    // In a 48-player lobby (12 squads), let's distribute kills summing to exactly 48 kills
    // Kills breakdown:
    // Rank 1: 14 kills
    // Rank 2: 9 kills
    // Rank 3: 7 kills
    // Rank 4: 5 kills
    // Rank 5: 4 kills
    // Rank 6: 3 kills
    // Rank 7: 2 kills
    // Rank 8: 2 kills
    // Rank 9: 1 kill
    // Rank 10: 1 kill
    // Rank 11: 0 kills
    // Rank 12: 0 kills
    // Total kills = 14 + 9 + 7 + 5 + 4 + 3 + 2 + 2 + 1 + 1 + 0 + 0 = 48 kills!
    console.log('\n6️⃣ Testing POST /tournaments/:id/result (Submitting 12 ranks with 48 total kills)...');
    const killDist = [14, 9, 7, 5, 4, 3, 2, 2, 1, 1, 0, 0];
    const totalKillsExpected = killDist.reduce((a, b) => a + b, 0);

    const matchResultsPayload = teams.map((t, idx) => ({
      teamId: t.teamId,
      teamName: t.name,
      rank: idx + 1,
      kills: killDist[idx],
    }));

    const resultRes = await fetch(`${baseUrl}/tournaments/${tourneyId}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results: matchResultsPayload }),
    });
    const resultData = await resultRes.json();
    if (!resultData.success || resultData.totalKillsRecorded !== 48) {
      throw new Error(`Result submission failed: ${JSON.stringify(resultData)}`);
    }
    console.log(`   ✅ Match results submitted. Total kills recorded: ${resultData.totalKillsRecorded} kills`);

    // 7. Test Leaderboard
    console.log('\n7️⃣ Testing GET /tournaments/:id/leaderboard...');
    const lbRes = await fetch(`${baseUrl}/tournaments/${tourneyId}/leaderboard`);
    const lbData = await lbRes.json();
    if (!lbData.success || lbData.count !== 12) {
      throw new Error(`Leaderboard failed: ${JSON.stringify(lbData)}`);
    }
    console.log('   ✅ Leaderboard top 3 teams:');
    lbData.leaderboard.slice(0, 3).forEach((r: any) => {
      console.log(`      Rank #${r.rank}: ${r.teamName} — Kills: ${r.kills} (Reward: ₹${r.killReward}) + Place: ₹${r.placementPrize} = Total: ₹${r.totalReward}`);
    });

    // 8. Process Payout & Test Specific User Requirement: Profit == ₹1,440
    console.log('\n8️⃣ Testing POST /tournaments/:id/payout (Executing atomic payout & verifying profit = ₹1440)...');
    const payoutRes = await fetch(`${baseUrl}/tournaments/${tourneyId}/payout`, {
      method: 'POST',
    });
    const payoutData = await payoutRes.json();
    if (!payoutData.success) {
      throw new Error(`Payout failed: ${JSON.stringify(payoutData)}`);
    }

    console.log('\n   📊 Financial Summary for Big Slot:');
    console.log(`      Total Collection (300 × 12): ₹${payoutData.totalCollection}`);
    console.log(`      Fixed Placement Payout (600 + 400 + 200): ₹${payoutData.fixedPlacementPayout}`);
    console.log(`      Kill Payouts (48 kills × ₹20): ₹${payoutData.killPayouts}`);
    console.log(`      Total Payout: ₹${payoutData.totalPayout}`);
    console.log(`      --------------------------------------------------`);
    console.log(`      🏆 Tournament Platform Profit: ₹${payoutData.tournamentProfit}`);

    // STRICT USER TEST CASE ASSERTION:
    if (payoutData.tournamentProfit !== 1440) {
      throw new Error(`❌ PROFIT TEST CASE FAILED: Expected ₹1440, got ₹${payoutData.tournamentProfit}`);
    }
    console.log('   🎯 USER TEST CASE PASSED: Total Profit is EXACTLY ₹1,440!');

    // 9. Verify Wallet Credits
    console.log('\n9️⃣ Verifying team captain wallet credits after payout...');
    const winnerWallet = db.prepare('SELECT * FROM wallets WHERE userId = ?').get('user-cap-1') as any;
    // user-cap-1 entered with 1000, paid 300 (balance 700), won 1st place (600) + 14 kills (280) = 880 total reward
    // Expected new balance = 700 + 880 = 1580
    console.log(`   Rank 1 Captain Wallet Balance: ₹${winnerWallet.balance}, Winnings: ₹${winnerWallet.winnings}`);
    if (winnerWallet.balance !== 1580 || winnerWallet.winnings !== 880) {
      throw new Error(`Wallet balance credit mismatch. Expected 1580, got ${winnerWallet.balance}`);
    }
    console.log('   ✅ Rank 1 Captain wallet atomically credited with ₹880 (600 placement + 280 kills).');

    // 10. Verify Duplicate Payout Blocked
    console.log('\n🔟 Testing Duplicate Payout Prevention...');
    const dupPayoutRes = await fetch(`${baseUrl}/tournaments/${tourneyId}/payout`, { method: 'POST' });
    const dupPayoutData = await dupPayoutRes.json();
    if (dupPayoutRes.status !== 400 || !dupPayoutData.error.includes('already')) {
      throw new Error(`Expected duplicate payout error, got: ${JSON.stringify(dupPayoutData)}`);
    }
    console.log(`   ✅ Correctly blocked duplicate payout: "${dupPayoutData.error}"`);

    console.log('\n======================================================');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY (10/10)!');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
