import {
  User,
  Tournament,
  Team,
  Match,
  MatchResult,
  Dispute,
  Achievement,
  College,
  CertificateRecord,
  PushNotification,
  Registration,
  WalletTransaction,
} from "../types";

export const INITIAL_CURRENT_USER: User = {
  id: "usr-default",
  email: "",
  phone: "",
  username: "player",
  displayName: "Player",
  avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  bio: "Free Fire MAX Competitor",
  dateOfBirth: "2004-01-01",
  role: "PLAYER",
  status: "Active",
  walletBalance: 0,
  winningsBalance: 0,
  createdAt: new Date().toISOString(),
  gamerProfile: {
    id: "gp-default",
    userId: "usr-default",
    gameUid: "",
    gameName: "PLAYER",
    region: "IND",
    rating: 1000,
    tier: "Bronze",
    rank: 0,
    totalMatches: 0,
    totalTournaments: 0,
    totalWins: 0,
    top3Finishes: 0,
    top10Finishes: 0,
    totalKills: 0,
    avgKills: 0,
    avgPlacement: 0,
    winRate: 0,
    headshotRate: 0,
    verified: false,
  },
};

export const INITIAL_WALLET_TRANSACTIONS: WalletTransaction[] = [];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "ach-1",
    title: "First Blood",
    description: "Secure first kill in any tournament match",
    icon: "Sword",
    category: "MATCH",
    badgeTier: "BRONZE",
    requirementCount: 1,
    unlockedAt: "",
  },
  {
    id: "ach-2",
    title: "Booyah Master",
    description: "Win 10 Battle Royale tournament matches",
    icon: "Trophy",
    category: "MATCH",
    badgeTier: "GOLD",
    requirementCount: 10,
    unlockedAt: "",
  },
  {
    id: "ach-3",
    title: "Top Fragger",
    description: "Achieve highest kill count in a tournament",
    icon: "Flame",
    category: "KILL",
    badgeTier: "SILVER",
    requirementCount: 1,
    unlockedAt: "",
  },
  {
    id: "ach-4",
    title: "Sharpshooter",
    description: "Score 10 or more kills in a single match",
    icon: "Crosshair",
    category: "KILL",
    badgeTier: "PLATINUM",
    requirementCount: 10,
    unlockedAt: "",
  },
  {
    id: "ach-5",
    title: "Diamond Challenger",
    description: "Reach 1600+ MMR Rating on National Leaderboard",
    icon: "Award",
    category: "RATING",
    badgeTier: "DIAMOND",
    requirementCount: 1600,
    unlockedAt: "",
  },
];

export const INITIAL_COLLEGES: College[] = [
  {
    id: "col-001",
    name: "Indian Institute of Technology Bombay",
    shortCode: "IIT Bombay",
    logoUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=120&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80",
    city: "Mumbai",
    state: "Maharashtra",
    isVerified: true,
    totalPoints: 0,
    leaderboardRank: 1,
    studentCount: 0,
    activeTeamsCount: 0,
  },
  {
    id: "col-002",
    name: "Delhi Technological University",
    shortCode: "DTU Delhi",
    logoUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=120&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop&q=80",
    city: "New Delhi",
    state: "Delhi",
    isVerified: true,
    totalPoints: 0,
    leaderboardRank: 2,
    studentCount: 0,
    activeTeamsCount: 0,
  },
  {
    id: "col-003",
    name: "National Institute of Technology Trichy",
    shortCode: "NIT Trichy",
    logoUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=120&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=600&auto=format&fit=crop&q=80",
    city: "Tiruchirappalli",
    state: "Tamil Nadu",
    isVerified: true,
    totalPoints: 0,
    leaderboardRank: 3,
    studentCount: 0,
    activeTeamsCount: 0,
  },
];

export const INITIAL_TEAMS: Team[] = [];

export const INITIAL_MATCHES: Match[] = [];


export const INITIAL_TOURNAMENTS: Tournament[] = [];


export const INITIAL_MATCH_RESULTS: MatchResult[] = [];
export const INITIAL_DISPUTES: Dispute[] = [];
export const INITIAL_CERTIFICATES: CertificateRecord[] = [];
export const INITIAL_NOTIFICATIONS: PushNotification[] = [];
