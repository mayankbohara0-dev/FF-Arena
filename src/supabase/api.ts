/**
 * Supabase Database, Realtime & Storage Service — FF Arena
 */
import { supabase, isSupabaseConfigured } from './client';
import { Tournament, Match, Registration, MatchResult, User, WalletTransaction } from '../types';

// ── TOURNAMENTS ──────────────────────────────────────────────────────────────

export async function fetchTournaments(): Promise<Tournament[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      console.warn('[Supabase] fetchTournaments notice:', error.message);
      return null;
    }
    if (!data || data.length === 0) return null;

    return data.map((t: any) => ({
      id: t.id,
      organizerId: t.organizer_id || 'admin-001',
      organizerName: 'Official FF Arena Admin',
      organizerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      organizerVerified: true,
      name: t.name,
      slug: t.slug || t.name.toLowerCase().replace(/\s+/g, '-'),
      description: t.description || 'Official 48-player competitive tournament.',
      game: t.game || 'Free Fire MAX',
      gameVersion: t.game_version || 'OB48 Latest',
      mode: t.mode || 'Battle Royale',
      format: t.format || 'Solo (48 Players)',
      matchMode: (t.team_size === 2 ? 'DUO' : t.team_size === 4 ? 'SQUAD' : 'SOLO') as 'SOLO' | 'DUO' | 'SQUAD',
      teamSize: t.team_size || 1,
      map: t.map || 'Bermuda',
      entryFee: t.entry_fee ?? 15,
      perKillReward: t.per_kill_reward ?? 10,
      prizePool: t.prize_pool ?? 530,
      maxParticipants: t.max_participants || 48,
      currentParticipants: t.current_participants || 0,
      registrationDeadline: t.registration_deadline || new Date(Date.now() + 3600000).toISOString(),
      startTime: t.start_time || new Date(Date.now() + 7200000).toISOString(),
      status: (t.status === 'LIVE' ? 'Live' : t.status === 'COMPLETED' ? 'Completed' : 'Registration Open') as any,
      rules: t.rules || ['₹15 Entry Fee', '48 Slots Max', 'No Emulators', '₹10/Kill + ₹20 Booyah Bonus'],
      scoringSystem: t.scoring_system || {
        placementPoints: { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1 },
        killPoint: 1,
      },
      rewardDescription: t.reward_description || '🏆 ₹10/Kill + ₹20 Booyah Extra + ₹15 (2nd/3rd)',
      bannerUrl: t.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      isCollegeOnly: t.is_college_only || false,
    }));
  } catch (err) {
    console.error('[Supabase] fetchTournaments exception:', err);
    return null;
  }
}

export async function fetchLeaderboard(): Promise<any[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('gamer_profiles')
      .select('id, user_id, game_name, game_uid, rating, tier, total_kills, total_wins, total_matches')
      .order('rating', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('[Supabase] fetchLeaderboard notice:', error.message);
      return null;
    }
    return data || [];
  } catch (err) {
    console.error('[Supabase] fetchLeaderboard exception:', err);
    return null;
  }
}

export function subscribeTournaments(onUpdate: (tournaments: Tournament[]) => void) {
  if (!isSupabaseConfigured()) return () => {};

  const channel = supabase
    .channel('public:tournaments')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tournaments' },
      async () => {
        const fresh = await fetchTournaments();
        if (fresh) onUpdate(fresh);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function createTournament(tournament: Partial<Tournament>): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        name: tournament.name,
        slug: (tournament.name || 'tourney').toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4),
        description: tournament.description || 'Admin published tournament',
        game: tournament.game || 'Free Fire MAX',
        mode: tournament.mode === 'Clash Squad' ? 'CLASH_SQUAD' : 'BATTLE_ROYALE',
        format: tournament.format || 'Solo',
        team_size: tournament.matchMode === 'SQUAD' ? 4 : tournament.matchMode === 'DUO' ? 2 : 1,
        map: tournament.map || 'Bermuda',
        entry_fee: tournament.entryFee || 15,
        per_kill_reward: tournament.perKillReward || 10,
        prize_pool: tournament.prizePool || 530,
        max_participants: 48,
        current_participants: 0,
        registration_deadline: tournament.registrationDeadline || new Date(Date.now() + 3600000).toISOString(),
        start_time: tournament.startTime || new Date(Date.now() + 7200000).toISOString(),
        status: 'REGISTRATION_OPEN',
        rules: tournament.rules || ['₹15 Entry Fee', '48 Slots Max', '₹10/Kill + ₹20 Booyah Bonus'],
        scoring_system: tournament.scoringSystem || { placementPoints: { 1: 12, 2: 9, 3: 8 }, killPoint: 1 },
        reward_description: tournament.rewardDescription || '₹10/Kill + ₹20 Booyah Extra + ₹15 (2nd/3rd)',
        banner_url: tournament.bannerUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      })
      .select()
      .single();

    if (error) {
      console.error('[Supabase] createTournament error:', error);
      return null;
    }
    return data?.id || null;
  } catch (err) {
    console.error('[Supabase] createTournament exception:', err);
    return null;
  }
}

export async function updateTournamentRoom(
  tournamentId: string,
  roomId: string,
  roomPassword: string,
  isRoomReleased: boolean
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('matches')
      .update({
        room_id: roomId,
        room_password: roomPassword,
        status: isRoomReleased ? 'ROOM_READY' : 'UPCOMING',
        updated_at: new Date().toISOString(),
      })
      .eq('tournament_id', tournamentId);

    return !error;
  } catch {
    return false;
  }
}

// ── REGISTRATIONS ────────────────────────────────────────────────────────────

export async function registerPlayerForTournament(data: {
  tournamentId: string;
  userId: string;
  slotNumber: number;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error: regError } = await supabase.from('registrations').insert({
      tournament_id: data.tournamentId,
      user_id: data.userId,
      slot_number: data.slotNumber,
      status: 'CONFIRMED',
    });

    if (regError) {
      console.warn('[Supabase] register error:', regError.message);
      return false;
    }

    // Increment current participants
    try {
      await supabase.rpc('increment_tournament_participants', {
        t_id: data.tournamentId,
      });
    } catch {
      // Fallback update if RPC not created
      await supabase
        .from('tournaments')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', data.tournamentId);
    }

    return true;
  } catch (err) {
    console.error('[Supabase] registration exception:', err);
    return false;
  }
}

export function subscribeUserRegistrations(userId: string, onUpdate: (regs: Registration[]) => void) {
  if (!isSupabaseConfigured() || !userId) return () => {};

  const channel = supabase
    .channel(`public:registrations:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'registrations', filter: `user_id=eq.${userId}` },
      async () => {
        const { data } = await supabase
          .from('registrations')
          .select('*')
          .eq('user_id', userId);

        if (data) {
          onUpdate(
            data.map((r: any) => ({
              id: r.id,
              tournamentId: r.tournament_id,
              userId: r.user_id,
              teamId: r.team_id,
              playerName: r.player_name || 'You',
              gameUid: r.game_uid || 'Linked UID',
              status: r.status === 'CONFIRMED' ? 'Confirmed' : 'Pending',
              slotNumber: r.slot_number,
              registeredAt: r.registered_at,
            }))
          );
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ── MATCH RESULTS ─────────────────────────────────────────────────────────────

export async function submitMatchResult(data: {
  matchId: string;
  tournamentId: string;
  userId: string;
  kills: number;
  placement: number;
  screenshotUrl: string;
  notes?: string;
  aiOcrData?: any;
}): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: res, error } = await supabase
      .from('results')
      .insert({
        match_id: data.matchId,
        user_id: data.userId,
        kills: data.kills,
        placement: data.placement,
        screenshot_url: data.screenshotUrl,
        notes: data.notes || '',
        ai_ocr_data: data.aiOcrData || null,
        verification_status: 'PENDING',
      })
      .select()
      .single();

    if (error) {
      console.warn('[Supabase] submitMatchResult notice:', error.message);
      return null;
    }
    return res?.id || null;
  } catch (err) {
    console.error('[Supabase] submitMatchResult exception:', err);
    return null;
  }
}

// ── USER PROFILE & WALLET ─────────────────────────────────────────────────────

export async function upsertUserProfile(user: {
  id?: string;
  email?: string;
  phone?: string;
  displayName: string;
  gameName: string;
  gameUid: string;
}): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    // Upsert into users
    const email = user.email || `${user.phone || Date.now()}@ffarena.in`;
    const username = (user.gameName || 'user').toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4);

    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert(
        {
          phone: user.phone || null,
          email,
          username,
          display_name: user.displayName || user.gameName,
          date_of_birth: '2000-01-01',
          role: 'PLAYER',
          status: 'ACTIVE',
        },
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (userError) {
      console.warn('[Supabase] upsertUserProfile notice:', userError.message);
      return null;
    }

    const userId = userData?.id;
    if (userId) {
      // Upsert into gamer_profiles with real clean starting stats
      await supabase.from('gamer_profiles').upsert(
        {
          user_id: userId,
          game_uid: user.gameUid,
          game_name: user.gameName,
          region: 'IND',
          rating: 1000,
          tier: 'Bronze',
          total_matches: 0,
          total_tournaments: 0,
          total_wins: 0,
          total_kills: 0,
          win_rate: 0.00,
          avg_kills: 0.00,
          verified: false,
        },
        { onConflict: 'user_id' }
      );
    }

    return userId || null;
  } catch (err) {
    console.error('[Supabase] upsertUserProfile exception:', err);
    return null;
  }
}

export async function updateWalletBalance(userId: string, balanceDelta: number, winningsDelta: number): Promise<boolean> {
  if (!isSupabaseConfigured() || !userId) return false;
  try {
    const { data: current } = await supabase
      .from('wallets')
      .select('balance, winnings')
      .eq('user_id', userId)
      .single();

    const newBalance = Math.max(0, (current?.balance || 0) + balanceDelta);
    const newWinnings = Math.max(0, (current?.winnings || 0) + winningsDelta);

    const { error } = await supabase
      .from('wallets')
      .upsert({
        user_id: userId,
        balance: newBalance,
        winnings: newWinnings,
        updated_at: new Date().toISOString(),
      });

    return !error;
  } catch {
    return false;
  }
}

export async function addWalletTransaction(data: {
  userId: string;
  type: string;
  title: string;
  amount: number;
  status: string;
  utrRef?: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured() || !data.userId) return false;
  try {
    const { error } = await supabase.from('wallet_transactions').insert({
      user_id: data.userId,
      type: data.type,
      title: data.title,
      amount: data.amount,
      status: data.status,
      utr_ref: data.utrRef || null,
    });
    return !error;
  } catch {
    return false;
  }
}

// ── STORAGE UPLOAD ────────────────────────────────────────────────────────────

export async function uploadScreenshotEvidence(
  userId: string,
  tournamentId: string,
  file: File
): Promise<{ url: string } | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${userId || 'anon'}/${tournamentId}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('evidence')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('[Supabase Storage] notice:', error.message);
      // Fallback: try screenshots bucket
      const { data: d2, error: e2 } = await supabase.storage
        .from('screenshots')
        .upload(filePath, file, { upsert: true });

      if (e2) return null;
      const { data: publicUrl } = supabase.storage.from('screenshots').getPublicUrl(filePath);
      return { url: publicUrl.publicUrl };
    }

    const { data: publicUrl } = supabase.storage.from('evidence').getPublicUrl(filePath);
    return { url: publicUrl.publicUrl };
  } catch (err) {
    console.error('[Supabase Storage] exception:', err);
    return null;
  }
}
