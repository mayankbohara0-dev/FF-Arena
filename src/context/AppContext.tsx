import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  User,
  UserRole,
  ViewMode,
  Tournament,
  Team,
  Match,
  Registration,
  MatchResult,
  Dispute,
  Achievement,
  College,
  CertificateRecord,
  PushNotification,
  WalletTransaction,
} from '../types';
import {
  INITIAL_CURRENT_USER,
  INITIAL_TOURNAMENTS,
  INITIAL_TEAMS,
  INITIAL_MATCHES,
  INITIAL_MATCH_RESULTS,
  INITIAL_DISPUTES,
  INITIAL_ACHIEVEMENTS,
  INITIAL_COLLEGES,
  INITIAL_CERTIFICATES,
  INITIAL_NOTIFICATIONS,
  INITIAL_WALLET_TRANSACTIONS,
} from '../services/mockData';
import { simulateAIVerification } from '../services/aiVerificationService';
import { calculateMatchScore, calculateRatingDelta, calculateTierFromRating } from '../services/scoringEngine';
import { createCertificateRecord } from '../services/certificateService';
import { isSupabaseConfigured } from '../supabase/client';
import {
  fetchTournaments as sbFetchTournaments,
  subscribeTournaments as sbSubscribeTournaments,
  createTournament as sbCreateTournament,
  updateTournamentRoom as sbUpdateTournamentRoom,
  registerPlayerForTournament as sbRegisterPlayer,
  subscribeUserRegistrations as sbSubscribeRegistrations,
  submitMatchResult as sbSubmitResult,
  updateWalletBalance as sbUpdateWallet,
  addWalletTransaction as sbAddTransaction,
} from '../supabase/api';

interface AppContextType {
  currentUser: User;
  activeRole: UserRole;
  viewMode: ViewMode;
  isMobileFrame: boolean;
  activeTournamentId: string | null;
  selectedCertificateId: string | null;
  tournaments: Tournament[];
  teams: Team[];
  matches: Match[];
  registrations: Registration[];
  results: MatchResult[];
  disputes: Dispute[];
  achievements: Achievement[];
  colleges: College[];
  certificates: CertificateRecord[];
  notifications: PushNotification[];
  walletTransactions: WalletTransaction[];
  unreadNotifCount: number;

  // Setters & Navigation
  setViewMode: (mode: ViewMode) => void;
  setActiveRole: (role: UserRole) => void;
  setIsMobileFrame: (val: boolean) => void;
  setActiveTournamentId: (id: string | null) => void;
  setSelectedCertificateId: (id: string | null) => void;
  
  // Business logic methods
  addCash: (amount: number) => void;
  withdrawWinnings: (amount: number, upiId: string) => Promise<{ success: boolean; message: string }>;
  payTournamentEntry: (tournamentId: string, teamId?: string, upiId?: string) => Promise<{ success: boolean; message: string; slotNumber?: number }>;
  registerForTournament: (tournamentId: string, teamId?: string, upiId?: string) => Promise<{ success: boolean; message: string }>;
  createTournament: (newTourney: Partial<Tournament>) => Promise<Tournament>;
  createTeam: (name: string, tag: string, collegeId?: string) => Promise<Team>;
  inviteToTeam: (teamId: string, gameUidOrUser: string) => Promise<boolean>;
  updateMatchRoom: (matchId: string, roomId: string, roomPassword: string, roomReleaseTime: string, isRoomReleased: boolean) => void;
  submitMatchResult: (data: { matchId: string; tournamentId: string; kills: number; placement: number; screenshotUrl: string; notes?: string }) => Promise<MatchResult>;
  verifyResult: (resultId: string, status: 'Approved' | 'Rejected' | 'Manual Review', notes?: string) => void;
  createDispute: (resultId: string, reason: string, description: string, evidenceUrl?: string) => Promise<Dispute>;
  resolveDispute: (disputeId: string, status: 'Approved' | 'Rejected', adminNote?: string) => void;
  issueCertificate: (params: { userId: string; participantName: string; gameUid: string; tournamentId: string; tournamentName: string; position: string; organizerName: string }) => CertificateRecord;
  markAllNotificationsRead: () => void;
  addNotification: (title: string, body: string, type: PushNotification['type'], dataPayload?: Record<string, any>) => void;
  triggerConfetti: () => void;
  updateUserProfile: (updates: Partial<User>) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('ff_arena_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_CURRENT_USER,
          ...parsed,
          walletBalance: typeof parsed.walletBalance === 'number' ? parsed.walletBalance : INITIAL_CURRENT_USER.walletBalance,
          winningsBalance: typeof parsed.winningsBalance === 'number' ? parsed.winningsBalance : INITIAL_CURRENT_USER.winningsBalance,
        };
      } catch {
        return INITIAL_CURRENT_USER;
      }
    }
    return INITIAL_CURRENT_USER;
  });

  const [activeRole, setActiveRoleState] = useState<UserRole>(currentUser.role);
  const [viewMode, setViewMode] = useState<ViewMode>('MOBILE');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null);

  const [tournaments, setTournaments] = useState<Tournament[]>(INITIAL_TOURNAMENTS);
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [results, setResults] = useState<MatchResult[]>(INITIAL_MATCH_RESULTS);
  const [disputes, setDisputes] = useState<Dispute[]>(INITIAL_DISPUTES);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [colleges, setColleges] = useState<College[]>(INITIAL_COLLEGES);
  const [certificates, setCertificates] = useState<CertificateRecord[]>(INITIAL_CERTIFICATES);
  const [notifications, setNotifications] = useState<PushNotification[]>(INITIAL_NOTIFICATIONS);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(INITIAL_WALLET_TRANSACTIONS);

  // Sync to local storage & listen for storage changes from login
  useEffect(() => {
    if (currentUser.id !== 'usr-default' && currentUser.email) {
      localStorage.setItem('ff_arena_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('ff_arena_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCurrentUser((prev) => ({ ...prev, ...parsed }));
          if (parsed.role) setActiveRoleState(parsed.role);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // ── SUPABASE REALTIME & DATABASE SYNC ─────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // 1. Initial Tournaments Load & Realtime Sync
    sbFetchTournaments().then((initial) => {
      if (initial && initial.length > 0) {
        setTournaments(initial);
      }
    });

    const unsubTourneys = sbSubscribeTournaments((fresh) => {
      if (fresh && fresh.length > 0) {
        setTournaments(fresh);
      }
    });

    // 2. Realtime Registrations Sync
    const unsubRegs = sbSubscribeRegistrations(currentUser.id, (freshRegs) => {
      if (freshRegs && freshRegs.length > 0) {
        setRegistrations(freshRegs);
      }
    });

    return () => {
      unsubTourneys();
      unsubRegs();
    };
  }, [currentUser.id]);

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    setCurrentUser((prev) => ({ ...prev, role }));
  };

  const updateUserProfile = (updates: Partial<User>) => {
    setCurrentUser((prev) => ({ ...prev, ...updates }));
  };

  const logout = () => {
    localStorage.removeItem('ff_user');
    localStorage.removeItem('ff_arena_user');
    localStorage.removeItem('ff_onboarded');
    localStorage.removeItem('ff_kyc');
    setCurrentUser(INITIAL_CURRENT_USER);
    window.location.href = '/';
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff5e14', '#00e5ff', '#ffb020', '#a855f7', '#10b981'],
      });
    } catch {
      // safe fallback
    }
  };

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const addNotification = (title: string, body: string, type: PushNotification['type'], dataPayload?: Record<string, any>) => {
    const newNotif: PushNotification = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title,
      body,
      type,
      dataPayload,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // 1. WALLET: ADD CASH
  const addCash = (amount: number) => {
    setCurrentUser((prev) => ({
      ...prev,
      walletBalance: (prev.walletBalance ?? 0) + amount,
    }));

    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: 'DEPOSIT',
      title: 'Added Cash via UPI Gateway',
      amount: amount,
      date: 'Just Now',
      status: 'SUCCESS',
      utrRef: `DEP-${Date.now().toString().slice(-8)}`,
    };
    setWalletTransactions((prev) => [tx, ...prev]);

    if (isSupabaseConfigured()) {
      sbUpdateWallet(currentUser.id, amount, 0).catch(console.error);
      sbAddTransaction({
        userId: currentUser.id,
        type: 'DEPOSIT',
        title: 'Added Cash via UPI Gateway',
        amount,
        status: 'SUCCESS',
        utrRef: tx.utrRef,
      }).catch(console.error);
    }

    addNotification('Cash Added! 💳', `₹${amount} added successfully to your wallet.`, 'WALLET_CREDIT');
  };

  // 2. WALLET: WITHDRAW WINNINGS
  const withdrawWinnings = async (amount: number, upiId: string): Promise<{ success: boolean; message: string }> => {
    const available = currentUser.winningsBalance ?? 0;
    if (amount <= 0) return { success: false, message: 'Invalid amount' };
    if (amount > available) return { success: false, message: `Only ₹${available} available in winnings balance.` };
    if (!upiId.includes('@')) return { success: false, message: 'Please enter a valid UPI ID (e.g. name@okaxis).' };

    setCurrentUser((prev) => ({
      ...prev,
      walletBalance: Math.max(0, (prev.walletBalance ?? 0) - amount),
      winningsBalance: Math.max(0, (prev.winningsBalance ?? 0) - amount),
    }));

    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: 'WITHDRAW',
      title: `Instant UPI Withdrawal to ${upiId}`,
      amount: -amount,
      date: 'Just Now',
      status: 'SUCCESS',
      utrRef: `UPI-${Date.now().toString().slice(-8)}`,
    };
    setWalletTransactions((prev) => [tx, ...prev]);

    if (isSupabaseConfigured()) {
      sbUpdateWallet(currentUser.id, -amount, -amount).catch(console.error);
      sbAddTransaction({
        userId: currentUser.id,
        type: 'WITHDRAW',
        title: `Instant UPI Withdrawal to ${upiId}`,
        amount: -amount,
        status: 'SUCCESS',
        utrRef: tx.utrRef,
      }).catch(console.error);
    }

    addNotification('Withdrawal Processed! 💸', `₹${amount} transferred to ${upiId} via Instant UPI.`, 'WALLET_CREDIT');
    triggerConfetti();
    return { success: true, message: `₹${amount} transferred successfully to ${upiId}!` };
  };

  // 3. TOURNAMENT: PAY ENTRY & BOOK SLOT (₹15 Entry Fee, 48 Slots Trigger)
  const payTournamentEntry = async (tournamentId: string, teamId?: string, upiId?: string): Promise<{ success: boolean; message: string; slotNumber?: number }> => {
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) return { success: false, message: 'Tournament not found.' };

    const entryFee = tournament.entryFee || 15;
    const balance = currentUser.walletBalance ?? 0;
    if (balance < entryFee) {
      return { success: false, message: `Insufficient wallet balance. Please add ₹${entryFee - balance} to join.` };
    }

    const alreadyRegistered = registrations.some(
      (r) => r.tournamentId === tournamentId && (r.userId === currentUser.id || (teamId && r.teamId === teamId))
    );
    if (alreadyRegistered) {
      return { success: false, message: 'You have already booked a slot in this tournament!' };
    }

    const maxSlots = tournament.maxParticipants || 48;
    if (tournament.currentParticipants >= maxSlots) {
      return { success: false, message: `All ${maxSlots} tournament slots are full!` };
    }

    // Deduct entry fee
    setCurrentUser((prev) => ({
      ...prev,
      walletBalance: Math.max(0, (prev.walletBalance ?? 0) - entryFee),
    }));

    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: 'ENTRY',
      title: `Entry Fee: ${tournament.name}`,
      amount: -entryFee,
      date: 'Just Now',
      status: 'PAID',
    };
    setWalletTransactions((prev) => [tx, ...prev]);

    const newParticipants = tournament.currentParticipants + 1;
    const isNowFull = newParticipants >= maxSlots;
    const assignedSlot = newParticipants;

    const regTeam = teamId ? teams.find((t) => t.id === teamId) : undefined;
    const newReg: Registration = {
      id: `reg-${Date.now()}`,
      tournamentId,
      userId: currentUser.id,
      teamId,
      teamName: regTeam?.name,
      playerName: currentUser.displayName,
      gameUid: currentUser.gamerProfile?.gameUid || currentUser.username || 'PLAYER',
      upiId: upiId || currentUser.upiId,
      email: currentUser.email,
      status: 'Confirmed',
      slotNumber: assignedSlot,
      registeredAt: new Date().toISOString(),
    };

    // Save UPI ID to user profile for future use
    if (upiId) {
      setCurrentUser((prev) => ({ ...prev, upiId }));
    }

    setRegistrations((prev) => [...prev, newReg]);

    if (isSupabaseConfigured()) {
      sbRegisterPlayer({
        tournamentId,
        userId: currentUser.id,
        slotNumber: assignedSlot,
      }).catch(console.error);
      sbUpdateWallet(currentUser.id, -entryFee, 0).catch(console.error);
      sbAddTransaction({
        userId: currentUser.id,
        type: 'ENTRY',
        title: `Entry Fee: ${tournament.name}`,
        amount: -entryFee,
        status: 'PAID',
      }).catch(console.error);
    }
    setTournaments((prev) =>
      prev.map((t) =>
        t.id === tournamentId
          ? {
              ...t,
              currentParticipants: newParticipants,
              status: isNowFull ? 'Live' : t.status,
            }
          : t
      )
    );

    // If 48/48 filled, release custom room credentials
    if (isNowFull) {
      setMatches((prev) =>
        prev.map((m) =>
          m.tournamentId === tournamentId
            ? { ...m, isRoomReleased: true, status: 'ROOM_READY' }
            : m
        )
      );

      addNotification(
        '🔥 48/48 Filled: Custom Room Unlocked!',
        `All 48 slots filled for ${tournament.name}! Room ID: 8391047 | Pass: arenaff2026. Join match now!`,
        'ROOM_DETAILS'
      );
    } else {
      addNotification(
        'Slot Booked! 🎮',
        `₹${entryFee} entry fee paid! Slot #${assignedSlot} assigned. (${newParticipants}/48 players filled).`,
        'ROOM_DETAILS'
      );
    }

    triggerConfetti();
    return {
      success: true,
      message: `Slot #${assignedSlot}/48 Confirmed for ₹${entryFee}! ${isNowFull ? 'Room details unlocked!' : ''}`,
      slotNumber: assignedSlot,
    };
  };

  const registerForTournament = async (tournamentId: string, teamId?: string, upiId?: string) => {
    return payTournamentEntry(tournamentId, teamId, upiId);
  };

  // Create Tournament (ADMIN ONLY)
  const createTournament = async (newTourney: Partial<Tournament>): Promise<Tournament> => {
    const created: Tournament = {
      id: `tour-${Date.now()}`,
      organizerId: 'admin-001',
      organizerName: 'Official FF Arena Admin',
      organizerAvatar: currentUser.avatarUrl,
      organizerVerified: true,
      name: newTourney.name || 'New 48-Player Tournament',
      slug: (newTourney.name || 'new-tournament').toLowerCase().replace(/\s+/g, '-'),
      description: newTourney.description || 'Official 48-player competitive tournament published by Admin. ₹15 entry, ₹10 per kill, +₹20 Booyah extra.',
      game: 'Free Fire MAX',
      gameVersion: 'OB48 Latest',
      mode: newTourney.mode || 'Battle Royale',
      format: newTourney.format || 'Solo / Squad (48 Slots)',
      teamSize: newTourney.teamSize || 1,
      map: newTourney.map || 'Bermuda',
      entryFee: newTourney.entryFee || 15,
      perKillReward: newTourney.perKillReward || 10,
      prizePool: newTourney.prizePool || 530,
      maxParticipants: 48,
      currentParticipants: 0,
      registrationDeadline: newTourney.registrationDeadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      startTime: newTourney.startTime || new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
      status: 'Registration Open',
      rules: newTourney.rules || ['₹15 entry fee', '48 slots max', 'No emulators', '₹10/kill + ₹20 Booyah / ₹15 2nd & 3rd bonus'],
      scoringSystem: newTourney.scoringSystem || {
        placementPoints: { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1 },
        killPoint: 1,
      },
      rewardDescription: newTourney.rewardDescription || '🏆 ₹10/Kill + ₹20 Booyah Extra + ₹15 (2nd/3rd)',
      bannerUrl: newTourney.bannerUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      sponsorName: newTourney.sponsorName,
      minRatingRequirement: newTourney.minRatingRequirement || 0,
      isCollegeOnly: newTourney.isCollegeOnly || false,
    };

    setTournaments((prev) => [created, ...prev]);

    if (isSupabaseConfigured()) {
      sbCreateTournament(created).catch(console.error);
    }
    addNotification(
      'Official Tournament Published! 🚀',
      `Admin published 48-player tournament "${created.name}" for ₹${created.entryFee} entry!`,
      'ROOM_DETAILS'
    );
    return created;
  };

  // Create Team
  const createTeam = async (name: string, tag: string, collegeId?: string): Promise<Team> => {
    const inviteCode = `${tag.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const college = collegeId ? colleges.find((c) => c.id === collegeId) : undefined;
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name,
      tag: tag.toUpperCase(),
      logoUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=120&auto=format&fit=crop&q=80',
      captainId: currentUser.id,
      captainName: currentUser.displayName,
      rating: 1200,
      tier: 'Gold',
      wins: 0,
      matchesPlayed: 0,
      inviteCode,
      collegeId,
      collegeName: college?.name,
      createdAt: new Date().toISOString(),
      members: [
        {
          id: `tm-${Date.now()}`,
          teamId: `team-${Date.now()}`,
          userId: currentUser.id,
          role: 'CAPTAIN',
          status: 'CONFIRMED',
          joinedAt: new Date().toISOString(),
          user: {
            displayName: currentUser.displayName,
            username: currentUser.username,
            avatarUrl: currentUser.avatarUrl,
            gamerProfile: currentUser.gamerProfile,
          },
        },
      ],
    };

    setTeams((prev) => [newTeam, ...prev]);
    setCurrentUser((prev) => ({ ...prev, teamId: newTeam.id, role: 'TEAM_CAPTAIN' }));
    setActiveRoleState('TEAM_CAPTAIN');
    triggerConfetti();
    return newTeam;
  };

  // Invite to Team
  const inviteToTeam = async (teamId: string, gameUidOrUser: string): Promise<boolean> => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return false;
    if (team.members.length >= 5) return false;

    const newMemberId = `tm-${Date.now()}`;
    const newMember: Team['members'][0] = {
      id: newMemberId,
      teamId,
      userId: `usr-${Date.now()}`,
      role: 'MEMBER',
      status: 'CONFIRMED',
      joinedAt: new Date().toISOString(),
      user: {
        displayName: gameUidOrUser,
        username: gameUidOrUser.toLowerCase().replace(/\s+/g, '_'),
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        gamerProfile: {
          gameUid: gameUidOrUser,
          gameName: gameUidOrUser.toUpperCase(),
          tier: 'Platinum',
          rating: 1450,
        },
      },
    };

    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, members: [...t.members, newMember] } : t))
    );
    return true;
  };

  // Update Match Room (ADMIN Only)
  const updateMatchRoom = (
    matchId: string,
    roomId: string,
    roomPassword: string,
    roomReleaseTime: string,
    isRoomReleased: boolean
  ) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? {
              ...m,
              roomId,
              roomPassword,
              roomReleaseTime,
              isRoomReleased,
              status: isRoomReleased ? 'ROOM_READY' : m.status,
            }
          : m
      )
    );

    if (isRoomReleased) {
      if (isSupabaseConfigured()) {
        const match = matches.find((m) => m.id === matchId);
        if (match) {
          sbUpdateTournamentRoom(match.tournamentId, roomId, roomPassword, isRoomReleased).catch(console.error);
        }
      }
      addNotification(
        'Custom Room Credentials Live! 🔑',
        `Admin released Room ID: ${roomId} | Pass: ${roomPassword}. Enter Free Fire and join now!`,
        'ROOM_DETAILS'
      );
    }
  };

  // Submit match result with AI OCR inspector & Cash Winnings Calculation
  // USER SPEC: ONLY ₹20 extra for Booyah (1st place) and ₹15 extra for 2nd & 3rd place. No extra for other places (4 to 48).
  const submitMatchResult = async (data: {
    matchId: string;
    tournamentId: string;
    kills: number;
    placement: number;
    screenshotUrl: string;
    notes?: string;
  }): Promise<MatchResult> => {
    const tournament = tournaments.find((t) => t.id === data.tournamentId);
    const scoreBreakdown = calculateMatchScore(
      data.placement,
      data.kills,
      tournament?.scoringSystem
    );
    const ratingChange = calculateRatingDelta(data.placement, data.kills);

    // Reward Calculation: (Kills * ₹10) + (1st: ₹20 extra, 2nd/3rd: ₹15 extra)
    const placementBonus = data.placement === 1 ? 20 : (data.placement === 2 || data.placement === 3) ? 15 : 0;
    const killPrize = data.kills * (tournament?.perKillReward || 10);
    const totalWon = placementBonus + killPrize;

    // AI OCR Verification (Google Cloud Vision API + Heuristics)
    const aiOcrData = await simulateAIVerification({
      userIgn: currentUser.gamerProfile?.gameName || currentUser.username,
      claimedKills: data.kills,
      claimedPlacement: data.placement,
      imageSource: data.screenshotUrl,
    });

    const isAutoApproved = aiOcrData.confidenceScore >= 90 && aiOcrData.fraudFlags.length === 0;

    const newResult: MatchResult = {
      id: `res-${Date.now()}`,
      matchId: data.matchId,
      tournamentId: data.tournamentId,
      userId: currentUser.id,
      teamId: currentUser.teamId,
      playerName: currentUser.displayName,
      gameUid: currentUser.gamerProfile?.gameUid || currentUser.username || 'PLAYER',
      kills: data.kills,
      placement: data.placement,
      totalPoints: scoreBreakdown.totalPoints,
      rewardCashWon: totalWon,
      screenshotUrl: data.screenshotUrl,
      aiOcrData,
      verificationStatus: isAutoApproved ? 'Approved' : 'Pending',
      verifiedBy: isAutoApproved ? 'AI_OCR_ENGINE_V2' : undefined,
      submittedAt: new Date().toISOString(),
    };

    setResults((prev) => [newResult, ...prev]);

    // Update wallet and rating if auto approved
    if (isAutoApproved) {
      setCurrentUser((prev) => {
        const newRating = prev.gamerProfile ? Math.max(800, prev.gamerProfile.rating + ratingChange) : 1000;
        const newTier = calculateTierFromRating(newRating);
        return {
          ...prev,
          walletBalance: (prev.walletBalance ?? 0) + totalWon,
          winningsBalance: (prev.winningsBalance ?? 0) + totalWon,
          gamerProfile: prev.gamerProfile
            ? {
                ...prev.gamerProfile,
                rating: newRating,
                tier: newTier,
                totalMatches: prev.gamerProfile.totalMatches + 1,
                totalWins: data.placement === 1 ? prev.gamerProfile.totalWins + 1 : prev.gamerProfile.totalWins,
                totalKills: prev.gamerProfile.totalKills + data.kills,
              }
            : undefined,
        };
      });

      const tx: WalletTransaction = {
        id: `tx-${Date.now()}`,
        type: 'WINNING',
        title: `Match #${data.placement} (${data.kills} Kills + ₹${placementBonus} Bonus)`,
        amount: totalWon,
        date: 'Just Now',
        status: 'CREDITED',
        utrRef: `WIN-${data.matchId}-${Date.now().toString().slice(-4)}`,
      };
      setWalletTransactions((prev) => [tx, ...prev]);

      addNotification(
        '₹' + totalWon + ' Credited to Wallet! 🏆',
        `AI OCR Verified! Booyah #${data.placement}/48 + ${data.kills} Kills. ₹${totalWon} (${data.kills * 10} kill bounty + ₹${placementBonus} bonus) added to your winnings wallet!`,
        'WALLET_CREDIT'
      );
      triggerConfetti();
    } else {
      addNotification(
        'Result Submitted for Verification ⏳',
        `Your match screenshot is being verified by Admin.`,
        'RESULT_VERIFIED'
      );
    }

    return newResult;
  };

  // Verify Result (ADMIN action)
  const verifyResult = (resultId: string, status: 'Approved' | 'Rejected' | 'Manual Review') => {
    setResults((prev) =>
      prev.map((r) =>
        r.id === resultId
          ? {
              ...r,
              verificationStatus: status,
              verifiedBy: 'Official FF Arena Admin',
            }
          : r
      )
    );

    const targetResult = results.find((r) => r.id === resultId);
    if (targetResult && status === 'Approved') {
      addNotification(
        'Result Approved by Admin! ✅',
        `Result for ${targetResult.playerName} (${targetResult.kills} kills, #${targetResult.placement}) approved by Admin.`,
        'RESULT_VERIFIED'
      );
    }
  };

  // Dispute creation
  const createDispute = async (
    resultId: string,
    reason: string,
    description: string,
    evidenceUrl?: string
  ): Promise<Dispute> => {
    const result = results.find((r) => r.id === resultId);

    const newDispute: Dispute = {
      id: `disp-${Date.now()}`,
      resultId,
      matchId: result?.matchId || 'match-001',
      tournamentId: result?.tournamentId || 'tour-001',
      filedByUserId: currentUser.id,
      filedByName: currentUser.displayName,
      reasonCategory: 'WRONG_PLACEMENT',
      description: `${reason}: ${description}`,
      evidenceUrls: evidenceUrl ? [evidenceUrl] : [],
      status: 'Open',
      createdAt: new Date().toISOString(),
    };

    setDisputes((prev) => [newDispute, ...prev]);
    addNotification(
      'Dispute Submitted 🛡️',
      `Dispute regarding match result is opened. Admin will review the evidence.`,
      'DISPUTE_UPDATE'
    );
    return newDispute;
  };

  // Dispute resolution (ADMIN only)
  const resolveDispute = (disputeId: string, status: 'Approved' | 'Rejected') => {
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? {
              ...d,
              status: status === 'Approved' ? 'Approved' : 'Rejected',
              resolvedAt: new Date().toISOString(),
            }
          : d
      )
    );
  };

  // Issue Certificate (ADMIN only)
  const issueCertificate = (params: {
    userId: string;
    participantName: string;
    gameUid: string;
    tournamentId: string;
    tournamentName: string;
    position: string;
    organizerName: string;
  }): CertificateRecord => {
    const cert = createCertificateRecord({
      tournamentId: params.tournamentId,
      tournamentName: params.tournamentName,
      userId: params.userId,
      recipientName: params.participantName,
      recipientGameUid: params.gameUid,
      recipientIgn: currentUser.gamerProfile?.gameName || params.participantName,
      rankAchieved: 1,
      achievementTitle: params.position,
      killsCount: 8,
      organizerName: 'Official FF Arena Admin',
    });

    setCertificates((prev) => [cert, ...prev]);
    addNotification(
      'Official Certificate Issued! 📜',
      `Admin issued Verified Certificate ${cert.certificateNumber} for ${params.participantName}.`,
      'RESULT_VERIFIED'
    );
    return cert;
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activeRole,
        viewMode,
        isMobileFrame,
        activeTournamentId,
        selectedCertificateId,
        tournaments,
        teams,
        matches,
        registrations,
        results,
        disputes,
        achievements,
        colleges,
        certificates,
        notifications,
        walletTransactions,
        unreadNotifCount,
        setViewMode,
        setActiveRole,
        setIsMobileFrame,
        setActiveTournamentId,
        setSelectedCertificateId,
        addCash,
        withdrawWinnings,
        payTournamentEntry,
        registerForTournament,
        createTournament,
        createTeam,
        inviteToTeam,
        updateMatchRoom,
        submitMatchResult,
        verifyResult,
        createDispute,
        resolveDispute,
        issueCertificate,
        markAllNotificationsRead,
        addNotification,
        triggerConfetti,
        updateUserProfile,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
