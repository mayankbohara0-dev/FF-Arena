// FF Arena — Free Fire Tournament System Mock Data
// Strictly restricted to:
// 1. Battle Royale — Solo (₹15/player, 48 players, ₹10/kill, 1st ₹20, 2nd ₹15, 3rd ₹10)
// 2. Battle Royale — Duo (₹40/team, 24 teams/48 players, ₹10/kill, 1st ₹50, 2nd ₹30, 3rd ₹15)
// 3. Battle Royale — Squad (₹100/team, 12 teams/48 players, ₹10/kill, 1st ₹100, 2nd ₹50, 3rd ₹36)
// 4. Clash Squad — Slot Wise:
//    - Slot 1: ₹70/team, 2 teams, Winner ₹110, Profit ₹30
//    - Slot 2: ₹100/team, 2 teams, Winner ₹150, Profit ₹50
//    - Slot 3: ₹150/team, 2 teams, Winner ₹220, Profit ₹80

export type TournamentCategory = 'Battle Royale' | 'Clash Squad';
export type TournamentFormat = 'SOLO' | 'DUO' | 'SQUAD' | 'BIG_SLOT' | 'CLASH_SQUAD';
export type ClashSquadSlot = 70 | 100 | 150;
export type FreeFireMap = 'Bermuda' | 'Kalahari' | 'Purgatory' | 'Alpine' | 'Bermuda CS' | 'Kalahari CS' | 'Purgatory CS' | 'Alpine CS';
export type TournamentStatus = 'LIVE' | 'UPCOMING' | 'FULL' | 'COMPLETED';

export interface RegisteredPlayer {
  name: string;
  uid: string;
}

export interface TournamentRegistrationItem {
  id: string;
  userId: string;
  playerName: string;
  playerUid: string;
  teamName?: string;
  teammates?: RegisteredPlayer[];
  slotNumber: number;
  registeredAt: string;
}

export interface TournamentResultItem {
  id: string;
  position: number;
  playerName?: string;
  teamName?: string;
  gameUid?: string;
  kills: number;
  prizeAmount: number;
  isWinner: boolean;
  status: 'VERIFIED' | 'PENDING';
}

export interface MockTournament {
  id: string;
  name: string;
  subtitle: string;
  category: TournamentCategory;
  format: TournamentFormat;
  csSlotTier?: ClashSquadSlot;
  status: TournamentStatus;
  map: FreeFireMap;
  mode: 'Solo' | 'Duo' | 'Squad' | 'Clash Squad';
  entryFee: number;
  maxPlayers: number;
  currentPlayers: number;
  maxTeams?: number;
  currentTeams?: number;
  killReward: number;
  placementRewards: { rank: string; prize: number }[];
  winnerPrize?: number;
  prizePool: number;
  startTime: string;
  startDate: string;
  registrationClosingTime: string;
  banner: string;
  isRegistered?: boolean;
  isPaymentPending?: boolean;
  paymentId?: string;
  registeredSlotNumber?: number;
  roomId?: string;
  roomPassword?: string;
  isRoomUnlocked?: boolean;
  registrationsList: TournamentRegistrationItem[];
  resultsList: TournamentResultItem[];
  totalKillsRecorded?: number;
}

export const MOCK_PLAYER = {
  name: 'Mayank',
  username: 'MayankOP',
  id: '#28491',
  uid: '8271849201',
  tier: 'DIAMOND',
  badge: 'ESPORTS WARRIOR',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  walletBalance: 1250,
  winningsBalance: 920,
  upiId: 'mayank@upi',
  matches: 24,
  wins: 8,
  kills: 126,
  winRate: 33,
  rank: 128,
  rankChange: 14,
  points: 4820,
};

export const MOCK_PLAYERS = [
  { rank: 1, name: 'ShadowX', kills: 12, points: 145, matches: 18, wins: 11, avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80', tier: 'GRANDMASTER', uid: '8192018274' },
  { rank: 2, name: 'ViperYT', kills: 10, points: 132, matches: 15, wins: 9, avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=80', tier: 'MASTER', uid: '4531209381' },
  { rank: 3, name: 'NovaOP', kills: 8, points: 118, matches: 14, wins: 7, avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&auto=format&fit=crop&q=80', tier: 'DIAMOND', uid: '7829311029' },
  { rank: 4, name: 'Mayank', kills: 7, points: 105, matches: 24, wins: 8, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80', tier: 'DIAMOND', uid: '8271849201', isMe: true },
  { rank: 5, name: 'ClutchKing', kills: 6, points: 98, matches: 12, wins: 5, avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=100&auto=format&fit=crop&q=80', tier: 'PLATINUM', uid: '3318299102' },
  { rank: 6, name: 'DarkHunter', kills: 6, points: 94, matches: 11, wins: 4, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80', tier: 'PLATINUM', uid: '1920188291' },
  { rank: 7, name: 'RxVenom', kills: 5, points: 87, matches: 10, wins: 4, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', tier: 'GOLD', uid: '5092100293' },
  { rank: 8, name: 'LegendOP', kills: 5, points: 82, matches: 9, wins: 3, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80', tier: 'GOLD', uid: '6740199201' },
  { rank: 9, name: 'StormX', kills: 4, points: 76, matches: 8, wins: 3, avatar: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=100&auto=format&fit=crop&q=80', tier: 'SILVER', uid: '8320199281' },
  { rank: 10, name: 'AceShot', kills: 4, points: 71, matches: 7, wins: 2, avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&auto=format&fit=crop&q=80', tier: 'SILVER', uid: '9284019283' },
];

export const MOCK_TOURNAMENTS: MockTournament[] = [
  // 1. BATTLE ROYALE — SOLO (₹15/player, 48 players, ₹10/kill, 1st ₹20, 2nd ₹15, 3rd ₹10)
  {
    id: 'br-solo-1',
    name: 'Free Fire BR Solo Championship',
    subtitle: 'Solo Survival • Kill Bounty ₹10 • 48 Players',
    category: 'Battle Royale',
    format: 'SOLO',
    mode: 'Solo',
    status: 'LIVE',
    map: 'Bermuda',
    entryFee: 15,
    maxPlayers: 48,
    currentPlayers: 36,
    killReward: 10,
    placementRewards: [
      { rank: '1st Place', prize: 20 },
      { rank: '2nd Place', prize: 15 },
      { rank: '3rd Place', prize: 10 },
    ],
    prizePool: 45, // Placement pool base (20+15+10) + kill rewards
    startTime: '8:00 PM',
    startDate: 'Today',
    registrationClosingTime: '7:45 PM',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    isRegistered: true,
    registeredSlotNumber: 14,
    roomId: '8492019',
    roomPassword: 'FF80',
    isRoomUnlocked: true,
    totalKillsRecorded: 28,
    registrationsList: [
      { id: 'reg-s1', userId: 'usr-1', playerName: 'ShadowX', playerUid: '8192018274', slotNumber: 1, registeredAt: '6:30 PM' },
      { id: 'reg-s2', userId: 'usr-2', playerName: 'ViperYT', playerUid: '4531209381', slotNumber: 2, registeredAt: '6:35 PM' },
      { id: 'reg-s3', userId: 'usr-3', playerName: 'Mayank', playerUid: '8271849201', slotNumber: 14, registeredAt: '7:00 PM' },
      { id: 'reg-s4', userId: 'usr-4', playerName: 'NovaOP', playerUid: '7829311029', slotNumber: 4, registeredAt: '7:05 PM' },
    ],
    resultsList: [
      { id: 'res-s1', position: 1, playerName: 'ShadowX', gameUid: '8192018274', kills: 8, prizeAmount: 100, isWinner: true, status: 'VERIFIED' }, // 20 + 8*10
      { id: 'res-s2', position: 2, playerName: 'Mayank', gameUid: '8271849201', kills: 5, prizeAmount: 65, isWinner: false, status: 'VERIFIED' },  // 15 + 5*10
      { id: 'res-s3', position: 3, playerName: 'ViperYT', gameUid: '4531209381', kills: 4, prizeAmount: 50, isWinner: false, status: 'VERIFIED' }, // 10 + 4*10
    ],
  },

  // 2. BATTLE ROYALE — DUO (₹40/team, 24 teams/48 players, ₹10/kill, 1st ₹50, 2nd ₹30, 3rd ₹15)
  {
    id: 'br-duo-1',
    name: 'Free Fire BR Duo Warfare',
    subtitle: '24 Teams • Duo Synergy • Kill Bounty ₹10',
    category: 'Battle Royale',
    format: 'DUO',
    mode: 'Duo',
    status: 'UPCOMING',
    map: 'Purgatory',
    entryFee: 40,
    maxTeams: 24,
    currentTeams: 18,
    maxPlayers: 48,
    currentPlayers: 36,
    killReward: 10,
    placementRewards: [
      { rank: '1st Place', prize: 50 },
      { rank: '2nd Place', prize: 30 },
      { rank: '3rd Place', prize: 15 },
    ],
    prizePool: 95, // 50 + 30 + 15 placement base
    startTime: '9:00 PM',
    startDate: 'Today',
    registrationClosingTime: '8:45 PM',
    banner: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=80',
    isRegistered: false,
    registrationsList: [
      {
        id: 'reg-d1',
        userId: 'usr-1',
        playerName: 'AlphaCaptain',
        playerUid: '9102837192',
        teamName: 'Team Alpha',
        teammates: [{ name: 'AlphaSniper', uid: '9102837193' }],
        slotNumber: 1,
        registeredAt: '5:10 PM',
      },
      {
        id: 'reg-d2',
        userId: 'usr-2',
        playerName: 'BravoLeader',
        playerUid: '8201928374',
        teamName: 'Team Bravo',
        teammates: [{ name: 'BravoRusher', uid: '8201928375' }],
        slotNumber: 2,
        registeredAt: '5:25 PM',
      },
    ],
    resultsList: [],
  },

  // 3. BATTLE ROYALE — SQUAD (₹100/team, 12 teams/48 players, ₹10/kill, 1st ₹100, 2nd ₹50, 3rd ₹36)
  {
    id: 'br-squad-1',
    name: 'Free Fire BR Squad Showdown',
    subtitle: '12 Squads • Full Lobby • ₹10/Kill Bounty',
    category: 'Battle Royale',
    format: 'SQUAD',
    mode: 'Squad',
    status: 'UPCOMING',
    map: 'Kalahari',
    entryFee: 100,
    maxTeams: 12,
    currentTeams: 9,
    maxPlayers: 48,
    currentPlayers: 36,
    killReward: 10,
    placementRewards: [
      { rank: '1st Place', prize: 100 },
      { rank: '2nd Place', prize: 50 },
      { rank: '3rd Place', prize: 36 },
    ],
    prizePool: 186, // 100 + 50 + 36 placement base
    startTime: '10:00 PM',
    startDate: 'Today',
    registrationClosingTime: '9:45 PM',
    banner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    isRegistered: false,
    registrationsList: [
      {
        id: 'reg-sq1',
        userId: 'usr-1',
        playerName: 'DarkVortex',
        playerUid: '8910293810',
        teamName: 'Vortex Elite',
        teammates: [
          { name: 'VortexRusher', uid: '8910293811' },
          { name: 'VortexFlanker', uid: '8910293812' },
          { name: 'VortexMedic', uid: '8910293813' },
        ],
        slotNumber: 1,
        registeredAt: '4:00 PM',
      },
    ],
    resultsList: [],
  },

  // 4. BIG SLOT — BATTLE ROYALE (SQUAD ONLY) (₹300/team, 12 teams, ₹20/kill, 1st ₹600, 2nd ₹400, 3rd ₹200)
  {
    id: 'br-big-slot-1',
    name: 'Big Slot',
    subtitle: 'Battle Royale (Squad Only) • 12 Teams • ₹20/Kill',
    category: 'Battle Royale',
    format: 'BIG_SLOT',
    mode: 'Squad',
    status: 'UPCOMING',
    map: 'Bermuda',
    entryFee: 300,
    maxTeams: 12,
    currentTeams: 8,
    maxPlayers: 48,
    currentPlayers: 32,
    killReward: 20,
    placementRewards: [
      { rank: '1st Place', prize: 600 },
      { rank: '2nd Place', prize: 400 },
      { rank: '3rd Place', prize: 200 },
    ],
    prizePool: 1200, // 600 + 400 + 200 fixed base
    startTime: '9:30 PM',
    startDate: 'Today',
    registrationClosingTime: '9:15 PM',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    isRegistered: false,
    roomId: '8492019',
    roomPassword: 'BIGFF',
    isRoomUnlocked: false,
    totalKillsRecorded: 0,
    registrationsList: [
      {
        id: 'reg-bs1',
        userId: 'usr-1',
        playerName: 'ApexCaptain',
        playerUid: '9102837190',
        teamName: 'Apex Predators',
        teammates: [
          { name: 'ApexSniper', uid: '9102837191' },
          { name: 'ApexRusher', uid: '9102837192' },
          { name: 'ApexCover', uid: '9102837193' },
        ],
        slotNumber: 1,
        registeredAt: '5:00 PM',
      },
    ],
    resultsList: [],
  },

  // 4. CLASH SQUAD — SLOT 1 (₹70/team, 2 teams, Winner ₹110, Profit ₹30)
  {
    id: 'cs-slot-70',
    name: 'Clash Squad — Slot 1 (₹70)',
    subtitle: '2 Teams Faceoff • Winner Takes ₹110',
    category: 'Clash Squad',
    format: 'CLASH_SQUAD',
    csSlotTier: 70,
    mode: 'Clash Squad',
    status: 'UPCOMING',
    map: 'Bermuda CS',
    entryFee: 70,
    maxTeams: 2,
    currentTeams: 1,
    maxPlayers: 8, // 4 vs 4
    currentPlayers: 4,
    killReward: 0,
    placementRewards: [],
    winnerPrize: 110,
    prizePool: 110,
    startTime: '8:30 PM',
    startDate: 'Today',
    registrationClosingTime: '8:15 PM',
    banner: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&auto=format&fit=crop&q=80',
    isRegistered: false,
    registrationsList: [
      {
        id: 'reg-cs1',
        userId: 'usr-cs1',
        playerName: 'HydraLeader',
        playerUid: '8291029381',
        teamName: 'Hydra Strikers',
        teammates: [
          { name: 'Hydra2', uid: '8291029382' },
          { name: 'Hydra3', uid: '8291029383' },
          { name: 'Hydra4', uid: '8291029384' },
        ],
        slotNumber: 1,
        registeredAt: '6:40 PM',
      },
    ],
    resultsList: [],
  },

  // 5. CLASH SQUAD — SLOT 2 (₹100/team, 2 teams, Winner ₹150, Profit ₹50)
  {
    id: 'cs-slot-100',
    name: 'Clash Squad — Slot 2 (₹100)',
    subtitle: '2 Teams Faceoff • Winner Takes ₹150',
    category: 'Clash Squad',
    format: 'CLASH_SQUAD',
    csSlotTier: 100,
    mode: 'Clash Squad',
    status: 'LIVE',
    map: 'Kalahari CS',
    entryFee: 100,
    maxTeams: 2,
    currentTeams: 2,
    maxPlayers: 8,
    currentPlayers: 8,
    killReward: 0,
    placementRewards: [],
    winnerPrize: 150,
    prizePool: 150,
    startTime: '7:45 PM',
    startDate: 'Today',
    registrationClosingTime: '7:30 PM',
    banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    isRegistered: true,
    registeredSlotNumber: 2,
    roomId: '9920192',
    roomPassword: 'CS100',
    isRoomUnlocked: true,
    registrationsList: [
      {
        id: 'reg-cs2a',
        userId: 'usr-cs2a',
        playerName: 'OmegaCaptain',
        playerUid: '7718291029',
        teamName: 'Team Omega',
        teammates: [
          { name: 'Omega2', uid: '7718291030' },
          { name: 'Omega3', uid: '7718291031' },
          { name: 'Omega4', uid: '7718291032' },
        ],
        slotNumber: 1,
        registeredAt: '6:15 PM',
      },
      {
        id: 'reg-cs2b',
        userId: 'usr-cs2b',
        playerName: 'Mayank',
        playerUid: '8271849201',
        teamName: 'Arena Wolves',
        teammates: [
          { name: 'WolfRusher', uid: '8271849202' },
          { name: 'WolfCover', uid: '8271849203' },
          { name: 'WolfSniper', uid: '8271849204' },
        ],
        slotNumber: 2,
        registeredAt: '6:30 PM',
      },
    ],
    resultsList: [],
  },

  // 6. CLASH SQUAD — SLOT 3 (₹150/team, 2 teams, Winner ₹220, Profit ₹80)
  {
    id: 'cs-slot-150',
    name: 'Clash Squad — Slot 3 (₹150)',
    subtitle: '2 Teams Faceoff • Winner Takes ₹220',
    category: 'Clash Squad',
    format: 'CLASH_SQUAD',
    csSlotTier: 150,
    mode: 'Clash Squad',
    status: 'UPCOMING',
    map: 'Alpine CS',
    entryFee: 150,
    maxTeams: 2,
    currentTeams: 0,
    maxPlayers: 8,
    currentPlayers: 0,
    killReward: 0,
    placementRewards: [],
    winnerPrize: 220,
    prizePool: 220,
    startTime: '10:30 PM',
    startDate: 'Today',
    registrationClosingTime: '10:15 PM',
    banner: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=800&auto=format&fit=crop&q=80',
    isRegistered: false,
    registrationsList: [],
    resultsList: [],
  },
];

export const MOCK_MY_MATCHES = [
  {
    id: 'm1',
    tournamentId: 'br-solo-1',
    tournament: 'Free Fire BR Solo Championship',
    status: 'LIVE',
    roomId: '8492019',
    roomPassword: 'FF80',
    isRoomUnlocked: true,
    players: '36/48',
    matchTimer: '18:42',
    map: 'Bermuda',
    mode: 'Solo',
    format: 'SOLO',
    entryFee: 15,
    registeredAt: '7:00 PM',
    slotNumber: 14,
  },
  {
    id: 'm2',
    tournamentId: 'cs-slot-100',
    tournament: 'Clash Squad — Slot 2 (₹100)',
    status: 'LIVE',
    roomId: '9920192',
    roomPassword: 'CS100',
    isRoomUnlocked: true,
    players: '2/2 Teams',
    matchTimer: 'LIVE NOW',
    map: 'Kalahari CS',
    mode: 'Clash Squad',
    format: 'CLASH_SQUAD',
    entryFee: 100,
    registeredAt: '6:30 PM',
    slotNumber: 2,
  },
];

export const MOCK_WALLET_TRANSACTIONS = [
  { id: 'tx1', type: 'CREDIT', title: 'Solo Kill Bounty', subtitle: 'BR Solo • 5 kills \u00d7 \u20b910', amount: 50, date: '1 hr ago', status: 'CREDITED' },
  { id: 'tx2', type: 'DEBIT', title: 'Tournament Entry', subtitle: 'Clash Squad Slot 2', amount: -100, date: 'Today, 6:30 PM', status: 'PAID' },
  { id: 'tx3', type: 'DEBIT', title: 'Tournament Entry', subtitle: 'BR Solo Championship', amount: -15, date: 'Today, 7:00 PM', status: 'PAID' },
  { id: 'tx4', type: 'CREDIT', title: 'Booyah Winner Prize', subtitle: 'Clash Squad Slot 1 Winner', amount: 110, date: 'Yesterday', status: 'CREDITED' },
  { id: 'tx5', type: 'CREDIT', title: 'Deposit', subtitle: 'UPI Wallet Top-up', amount: 500, date: 'Sat, Sep 20', status: 'CREDITED' },
];

export const MOCK_NOTIFICATIONS = [
  { id: 'n1', type: 'ROOM_UNLOCKED', title: 'Room Credentials Ready', body: 'BR Solo Championship Room ID & Password are now unlocked.', time: '10 min ago', isRead: false, icon: '🔑' },
  { id: 'n2', type: 'REMINDER', title: 'Match Starting Soon', body: 'Clash Squad Slot 2 begins in 15 minutes. Prepare your team.', time: '40 min ago', isRead: false, icon: '⏰' },
  { id: 'n3', type: 'REWARD', title: 'Kill Bounty Credited', body: '\u20b950 credited for 5 kills in BR Solo match.', time: '2 hrs ago', isRead: true, icon: '💰' },
  { id: 'n4', type: 'VERIFIED', title: 'Winner Published', body: 'Official match results published for Sunday Squad tournament.', time: '1 day ago', isRead: true, icon: '✅' },
];

export const TOURNAMENT_RULES = [
  'Strictly Free Fire MAX and Free Fire standard mobile clients only. No emulators unless explicitly declared.',
  'Hacks, scripts, config edits, and teaming with opponent squads will result in an immediate permanent ban.',
  'Room ID and Password will be provided inside the app once registration is confirmed.',
  'Take a clear screenshot of the end-game result/scoreboard for kill and placement verification.',
  'Results and prize distributions are processed immediately upon admin verification.',
  'Admin decisions regarding disputes and fair play are final and binding.',
];

// Helper calculations based on user specification
export const calculateSoloFinances = (registeredPlayers: number, totalKills: number = 0) => {
  const collection = 15 * registeredPlayers;
  const placementRewards = 20 + 15 + 10; // ₹45
  const killRewards = 10 * totalKills;
  const totalPayout = placementRewards + killRewards;
  const expectedProfit = collection - totalPayout;
  return { collection, placementRewards, killRewards, totalPayout, expectedProfit };
};

export const calculateDuoFinances = (registeredTeams: number, totalKills: number = 0) => {
  const collection = 40 * registeredTeams;
  const placementRewards = 50 + 30 + 15; // ₹95
  const killRewards = 10 * totalKills;
  const totalPayout = placementRewards + killRewards;
  const expectedProfit = collection - totalPayout;
  return { collection, placementRewards, killRewards, totalPayout, expectedProfit };
};

export const calculateSquadFinances = (registeredTeams: number, totalKills: number = 0) => {
  const collection = 100 * registeredTeams;
  const placementRewards = 100 + 50 + 36; // ₹186
  const killRewards = 10 * totalKills;
  const totalPayout = placementRewards + killRewards;
  const expectedProfit = collection - totalPayout;
  return { collection, placementRewards, killRewards, totalPayout, expectedProfit };
};

export const calculateBigSlotFinances = (registeredTeams: number, totalKills: number = 0) => {
  const collection = 300 * registeredTeams;
  const placementRewards = 600 + 400 + 200; // ₹1,200
  const killRewards = 20 * totalKills;
  const totalPayout = placementRewards + killRewards;
  const expectedProfit = collection - totalPayout;
  return { collection, placementRewards, killRewards, totalPayout, expectedProfit };
};

export const calculateClashSquadFinances = (slotTier: ClashSquadSlot, registeredTeams: number) => {
  const collection = slotTier * registeredTeams;
  const winnerPrize = slotTier === 70 ? 110 : slotTier === 100 ? 150 : 220;
  const expectedProfit = registeredTeams >= 2 ? collection - winnerPrize : 0;
  return { collection, winnerPrize, expectedProfit };
};

export const ADMIN_STATS = {
  totalTournaments: 6,
  totalPlayers: 184,
  activePlayers: 44,
  totalRevenue: 3420,
  pendingPayouts: 360,
  activeMatches: 2,
};

export const ADMIN_PLAYERS = [
  { name: 'ShadowX', id: '#28491', status: 'ACTIVE', kills: 12, rank: 1, avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80', upi: 'shadowx@upi', uid: '8192018274' },
  { name: 'ViperYT', id: '#12982', status: 'ACTIVE', kills: 10, rank: 2, avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=80', upi: 'viperyt@upi', uid: '4531209381' },
  { name: 'NovaOP', id: '#48321', status: 'ACTIVE', kills: 8, rank: 3, avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&auto=format&fit=crop&q=80', upi: 'novaop@upi', uid: '7829311029' },
  { name: 'Mayank', id: '#28491', status: 'ACTIVE', kills: 7, rank: 4, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80', upi: 'mayank@upi', uid: '8271849201' },
  { name: 'ClutchKing', id: '#33182', status: 'ACTIVE', kills: 6, rank: 5, avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=100&auto=format&fit=crop&q=80', upi: 'clutch@upi', uid: '3318299102' },
];
