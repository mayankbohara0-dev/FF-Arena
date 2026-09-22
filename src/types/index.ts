export type UserRole = 'PLAYER' | 'TEAM_CAPTAIN' | 'ORGANIZER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';

export type TierName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Grandmaster';

export type TournamentMode = 
  | 'Battle Royale'
  | 'Clash Squad'
  | 'Lone Wolf'
  | '1v1'
  | 'Duo'
  | 'Squad'
  | 'Scrims'
  | 'League'
  | 'College'
  | 'Community';

export type TournamentStatus = 
  | 'Draft'
  | 'Pending Approval'
  | 'Published'
  | 'Registration Open'
  | 'Registration Closed'
  | 'Live'
  | 'Completed'
  | 'Cancelled';

export type MatchStatus = 
  | 'UPCOMING'
  | 'ROOM_READY'
  | 'LIVE'
  | 'FINISHED'
  | 'RESULT_PROCESSING'
  | 'VERIFICATION'
  | 'COMPLETED';

export type VerificationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Manual Review';

export type DisputeStatus = 'Open' | 'Under Review' | 'Approved' | 'Rejected' | 'Closed';

export interface GamerProfile {
  id: string;
  userId: string;
  gameUid: string;       // Free Fire UID
  gameName: string;      // In-game name (IGN)
  region: string;
  rating: number;        // e.g. 1680 (Diamond)
  tier: TierName;
  rank: number;
  totalMatches: number;
  totalTournaments: number;
  totalWins: number;
  top3Finishes: number;
  top10Finishes: number;
  totalKills: number;
  avgKills: number;
  avgPlacement: number;
  winRate: number;       // percentage, e.g. 34.5%
  headshotRate: number;  // percentage, e.g. 42.1%
  verified: boolean;
}

export interface WalletTransaction {
  id: string;
  type: 'DEPOSIT' | 'ENTRY' | 'WINNING' | 'WITHDRAW';
  title: string;
  amount: number;
  date: string;
  status: 'SUCCESS' | 'CREDITED' | 'PAID' | 'PROCESSING';
  utrRef?: string;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  dateOfBirth: string;
  role: UserRole;
  status: 'Active' | 'Suspended' | 'Banned' | 'Pending Verification';
  gamerProfile?: GamerProfile;
  walletBalance: number;
  winningsBalance: number;
  teamId?: string;
  collegeId?: string;
  collegeCourse?: string;
  collegeYear?: number;
  instagram?: string;
  youtube?: string;
  discord?: string;
  upiId?: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  user: {
    displayName: string;
    username: string;
    avatarUrl: string;
    gamerProfile?: {
      gameUid: string;
      gameName: string;
      tier: TierName;
      rating: number;
    };
  };
  role: 'CAPTAIN' | 'CO_CAPTAIN' | 'MEMBER' | 'SUBSTITUTE';
  status: 'CONFIRMED' | 'INVITED' | 'REJECTED';
  joinedAt: string;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  logoUrl: string;
  captainId: string;
  captainName: string;
  rating: number;
  tier: TierName;
  wins: number;
  matchesPlayed: number;
  inviteCode: string;
  members: TeamMember[];
  collegeId?: string;
  collegeName?: string;
  createdAt: string;
}

export interface ScoringRules {
  placementPoints: Record<number, number>;
  killPoint: number;
  customBonus?: {
    firstBloodBonus?: number;
    mostKillsBonus?: number;
  };
}

export interface PrizeBreakdown {
  rank: string;
  prize: string;
}

export interface Tournament {
  id: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar?: string;
  organizerVerified?: boolean;
  name: string;
  slug: string;
  description: string;
  game: string;
  gameVersion: string;
  mode: TournamentMode;
  format: string;
  teamSize: number;
  map: 'Bermuda' | 'Purgatory' | 'Kalahari' | 'Alpine' | 'NexTerra' | 'All Maps';
  entryFee: number;
  perKillReward: number;
  prizePool: number;
  prizes?: PrizeBreakdown[];
  maxParticipants: number;
  currentParticipants: number;
  registrationDeadline: string;
  startTime: string;
  endTime?: string;
  status: TournamentStatus;
  rules: string[];
  scoringSystem: ScoringRules;
  rewardDescription: string;
  bannerUrl: string;
  sponsorName?: string;
  sponsorLogoUrl?: string;
  isCollegeOnly?: boolean;
  minRatingRequirement?: number;
  roomId?: string;
  roomPassword?: string;
  isRoomReleased?: boolean;
  matches?: Match[];
  matchMode?: 'SOLO' | 'DUO' | 'SQUAD';
}

export interface Registration {
  id: string;
  tournamentId: string;
  userId: string;
  teamId?: string;
  teamName?: string;
  playerName: string;
  gameUid: string;
  upiId?: string;
  email?: string;
  status: 'Pending' | 'Confirmed' | 'Rejected' | 'Cancelled' | 'Waitlisted';
  slotNumber: number;
  registeredAt: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  matchNumber: number;
  title: string;
  map: string;
  roomId?: string;
  roomPassword?: string;
  roomReleaseTime: string;
  startTime: string;
  status: MatchStatus;
  isRoomReleased?: boolean;
}

export interface AIOCRResult {
  detectedIgn: string;
  detectedKills: number;
  detectedPlacement: number;
  detectedDamage?: number;
  confidenceScore: number;
  fraudFlags: string[];
  ocrTextRaw: string;
}

export interface MatchResult {
  id: string;
  matchId: string;
  tournamentId: string;
  userId: string;
  teamId?: string;
  playerName: string;
  gameUid: string;
  kills: number;
  placement: number;
  totalPoints: number;
  rewardCashWon?: number;
  screenshotUrl: string;
  aiOcrData?: AIOCRResult;
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  submittedAt: string;
  notes?: string;
  teamName?: string;
  placementPoints?: number;
  killPoints?: number;
  ratingChange?: number;
  createdAt?: string;
}

export interface Dispute {
  id: string;
  resultId: string;
  matchId: string;
  tournamentId: string;
  filedByUserId: string;
  filedByName: string;
  againstUserId?: string;
  againstName?: string;
  reasonCategory: 'FALSE_KILLS' | 'WRONG_PLACEMENT' | 'ROOM_CHEATING' | 'UNREGISTERED_PLAYER' | 'OTHER';
  description: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  organizerNotes?: string;
  createdAt: string;
  resolvedAt?: string;
  // Aliases for compatibility
  reason?: string;
  userName?: string;
  userGameUid?: string;
  tournamentName?: string;
  evidenceUrl?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'MATCH' | 'KILL' | 'RATING' | 'COLLEGE' | 'SPECIAL';
  badgeTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  requirementCount: number;
  unlockedAt?: string;
  code?: string;
  name?: string;
  badgeColor?: string;
  criteria?: string;
}

export interface College {
  id: string;
  name: string;
  shortCode: string;
  city: string;
  state: string;
  logoUrl: string;
  bannerUrl: string;
  studentCount: number;
  activeTeamsCount: number;
  totalPoints: number;
  leaderboardRank: number;
  isVerified: boolean;
  rank?: number;
}

export interface CertificateRecord {
  id: string;
  certificateNumber: string;
  tournamentId: string;
  tournamentName: string;
  userId: string;
  recipientName: string;
  recipientGameUid: string;
  recipientIgn: string;
  teamName?: string;
  rankAchieved: number;
  achievementTitle: string;
  killsCount: number;
  issueDate: string;
  qrPayloadUrl: string;
  organizerName: string;
  digitalSignatureHash: string;
  // Aliases
  certificateId?: string;
  participantName?: string;
  gameUid?: string;
  position?: string;
  issuedAt?: string;
}

export type Certificate = CertificateRecord;

export interface PushNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'ROOM_DETAILS' | 'ROOM_RELEASED' | 'MATCH_START' | 'RESULT_VERIFIED' | 'DISPUTE_UPDATE' | 'COLLEGE_ALERT' | 'WALLET_CREDIT';
  dataPayload?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  // Aliases
  read?: boolean;
  linkUrl?: string;
}

export type NotificationItem = PushNotification;

export type ViewMode = 'MOBILE' | 'ORGANIZER' | 'ADMIN' | 'CERT_VERIFY' | 'FLUTTER_SPEC' | 'WALLET';

// ─── FIREBASE FIRESTORE DATA MODELS (STEP 1) ──────────────────────────────────

export type AppUserRole = 'player' | 'admin';

export interface UserDocument {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: AppUserRole;
  createdAt: any;
  updatedAt: any;
}

export type TournamentDocStatus = 'upcoming' | 'live' | 'completed' | 'FULL';

export interface TournamentDocument {
  tournamentId: string;
  name: string;
  game: string;
  category: 'Battle Royale' | 'Clash Squad';
  format: 'SOLO' | 'DUO' | 'SQUAD' | 'BIG_SLOT' | 'CLASH_SQUAD';
  entryFee: number;
  capacity: number;
  occupiedSlots: number;
  availableSlots: number;
  perKillReward: number;
  prizePool: {
    first?: number;
    second?: number;
    third?: number;
    winner?: number;
    [key: string]: any;
  };
  status: TournamentDocStatus;
  startTime: string;
  roomId?: string;
  roomPassword?: string;
  createdAt: any;
  updatedAt: any;
}

export type RegistrationStatus = 'PAYMENT_PENDING' | 'PENDING_PAYMENT' | 'CONFIRMED' | 'REJECTED' | 'PAYMENT_REJECTED';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'VERIFIED';

export interface RegistrationDocument {
  registrationId: string;
  userId: string;
  tournamentId: string;
  playerName: string;
  playerUid: string;
  teamName?: string;
  teammates?: Array<{ name: string; uid: string }>;
  paymentId: string;
  paymentStatus: PaymentStatus;
  registrationStatus: RegistrationStatus;
  createdAt: any;
  updatedAt: any;
}

export interface PaymentDocument {
  paymentId: string;
  userId: string;
  tournamentId: string;
  tournamentName: string;
  playerName: string;
  amount: number;
  utr: string;
  screenshotUrl?: string;
  registrationId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string;
  submittedAt: any;
  verifiedAt?: any;
  verifiedBy?: string;
}

export interface PaymentVerificationLogDocument {
  logId: string;
  paymentId: string;
  registrationId?: string;
  tournamentId: string;
  userId: string;
  adminUid: string;
  action: 'APPROVED' | 'REJECTED';
  amount: number;
  utr: string;
  reason?: string;
  timestamp: any;
}

export interface PaymentSettingsDocument {
  upiId?: string;
  qrImageUrl?: string;
  instructions: string;
  enabled: boolean;
  merchantUpiId?: string;
  merchantName?: string;
  qrCodeUrl?: string;
  updatedAt?: any;
  updatedBy?: string;
}

export interface NotificationDocument {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: any;
}

// ─── STEP 5: MATCH RESULTS & LEADERBOARD DATA MODELS ──────────────────────────

export type MatchDocStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED';

export interface MatchDocument {
  matchId: string;
  tournamentId: string;
  tournamentName: string;
  matchNumber: number;
  scheduledAt: any;
  status: MatchDocStatus;
  roomId?: string;
  roomPassword?: string;
  createdAt: any;
  updatedAt: any;
}

export type MatchResultStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TournamentScoringConfig {
  killPointValue: number;
  placementPoints: Record<string, number>;
}

export interface MatchResultDocument {
  resultId: string;
  matchId: string;
  tournamentId: string;
  tournamentName?: string;
  matchNumber?: number;
  userId: string;
  playerName: string;
  playerUid?: string;
  teamId?: string;
  teamName?: string;
  placement: number;
  kills: number;
  calculatedScore: number;
  playerSubmittedScore?: number;
  proofImageUrl: string;
  status: MatchResultStatus;
  adminNote?: string;
  submittedAt: any;
  verifiedAt?: any;
  verifiedBy?: string;
  createdAt: any;
  updatedAt: any;
}

export interface LeaderboardMatchStat {
  resultId: string;
  kills: number;
  placement: number;
  score: number;
  approvedAt?: any;
}

export interface LeaderboardEntryDocument {
  userId: string;
  tournamentId: string;
  playerName: string;
  playerUid?: string;
  teamId?: string;
  teamName?: string;
  matchesPlayed: number;
  totalKills: number;
  totalPoints: number;
  bestPlacement: number;
  matchBreakdown: Record<string, LeaderboardMatchStat>;
  updatedAt: any;
}

export interface MatchResultVerificationLogDocument {
  logId: string;
  resultId: string;
  matchId: string;
  tournamentId: string;
  action: 'APPROVED' | 'REJECTED' | 'CORRECTED';
  oldStatus?: string;
  newStatus: string;
  oldPlacement?: number;
  newPlacement: number;
  oldKills?: number;
  newKills: number;
  oldScore?: number;
  newScore: number;
  adminUid: string;
  adminNote?: string;
  createdAt: any;
}

