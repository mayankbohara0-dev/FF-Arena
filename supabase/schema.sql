-- =========================================================
-- FF ARENA - SUPABASE POSTGRESQL DATABASE SCHEMA
-- Free Fire Esports Tournament Platform
-- =========================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES ENUM
CREATE TYPE user_role AS ENUM ('PLAYER', 'TEAM_CAPTAIN', 'ORGANIZER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION');
CREATE TYPE tournament_mode AS ENUM ('BATTLE_ROYALE', 'CLASH_SQUAD', 'LONE_WOLF', '1V1', 'DUO', 'SQUAD', 'SCRIMS', 'LEAGUE', 'COLLEGE', 'COMMUNITY');
CREATE TYPE tournament_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'LIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE match_status AS ENUM ('UPCOMING', 'ROOM_READY', 'LIVE', 'FINISHED', 'RESULT_PROCESSING', 'VERIFICATION', 'COMPLETED');
CREATE TYPE registration_status AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'WAITLISTED');
CREATE TYPE verification_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'MANUAL_REVIEW');
CREATE TYPE dispute_status AS ENUM ('OPEN', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED');
CREATE TYPE tier_name AS ENUM ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster');

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(32),
    username VARCHAR(64) UNIQUE NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    date_of_birth DATE NOT NULL,
    role user_role DEFAULT 'PLAYER'::user_role NOT NULL,
    status user_status DEFAULT 'ACTIVE'::user_status NOT NULL,
    instagram_handle VARCHAR(64),
    youtube_channel VARCHAR(128),
    discord_tag VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. GAMER PROFILES (Free Fire Specific Identity)
CREATE TABLE IF NOT EXISTS public.gamer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    game_uid VARCHAR(32) UNIQUE NOT NULL, -- Free Fire UID (e.g., "982347101")
    game_name VARCHAR(64) NOT NULL,       -- In-Game Name (IGN)
    region VARCHAR(32) DEFAULT 'IND' NOT NULL,
    rating INTEGER DEFAULT 1000 NOT NULL, -- Elo Rating / MMR
    tier tier_name DEFAULT 'Silver'::tier_name NOT NULL,
    rank INTEGER DEFAULT 0,
    total_matches INTEGER DEFAULT 0 NOT NULL,
    total_tournaments INTEGER DEFAULT 0 NOT NULL,
    total_wins INTEGER DEFAULT 0 NOT NULL,
    top_3_finishes INTEGER DEFAULT 0 NOT NULL,
    top_10_finishes INTEGER DEFAULT 0 NOT NULL,
    total_kills INTEGER DEFAULT 0 NOT NULL,
    avg_kills NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    avg_placement NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    win_rate NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    headshot_rate NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. COLLEGES TABLE
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_code VARCHAR(32) NOT NULL,
    logo_url TEXT,
    city VARCHAR(128) NOT NULL,
    state VARCHAR(128) NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE NOT NULL,
    total_points INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. COLLEGE PLAYERS TABLE
CREATE TABLE IF NOT EXISTS public.college_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE NOT NULL,
    course VARCHAR(128) NOT NULL,
    year_of_study INTEGER NOT NULL,
    student_id_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(128) UNIQUE NOT NULL,
    tag VARCHAR(8) NOT NULL,
    logo_url TEXT,
    captain_id UUID REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
    rating INTEGER DEFAULT 1000 NOT NULL,
    tier tier_name DEFAULT 'Silver'::tier_name NOT NULL,
    wins INTEGER DEFAULT 0 NOT NULL,
    matches_played INTEGER DEFAULT 0 NOT NULL,
    invite_code VARCHAR(16) UNIQUE NOT NULL,
    college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. TEAM MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(32) DEFAULT 'MEMBER' NOT NULL, -- CAPTAIN, CO_CAPTAIN, MEMBER, SUBSTITUTE
    status VARCHAR(32) DEFAULT 'CONFIRMED' NOT NULL, -- INVITED, CONFIRMED, REJECTED
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(team_id, user_id)
);

-- 8. TOURNAMENTS TABLE
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    game VARCHAR(64) DEFAULT 'Free Fire MAX' NOT NULL,
    game_version VARCHAR(32) DEFAULT 'Latest' NOT NULL,
    mode tournament_mode DEFAULT 'BATTLE_ROYALE'::tournament_mode NOT NULL,
    format VARCHAR(64) DEFAULT 'Battle Royale Squad' NOT NULL,
    team_size INTEGER DEFAULT 4 NOT NULL, -- 1=Solo, 2=Duo, 4=Squad
    map VARCHAR(64) DEFAULT 'Bermuda' NOT NULL, -- Bermuda, Purgatory, Kalahari, Alpine, NexTerra
    max_participants INTEGER DEFAULT 48 NOT NULL,
    current_participants INTEGER DEFAULT 0 NOT NULL,
    registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    status tournament_status DEFAULT 'REGISTRATION_OPEN'::tournament_status NOT NULL,
    rules JSONB NOT NULL,
    scoring_system JSONB NOT NULL, -- { placement_points: { 1: 12, 2: 9, ... }, kill_point: 1 }
    reward_description TEXT NOT NULL,
    banner_url TEXT,
    sponsor_name VARCHAR(128),
    sponsor_logo_url TEXT,
    is_college_only BOOLEAN DEFAULT FALSE NOT NULL,
    min_rating_requirement INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 9. REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    status registration_status DEFAULT 'CONFIRMED'::registration_status NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    slot_number INTEGER,
    UNIQUE(tournament_id, user_id)
);

-- 10. MATCHES TABLE
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
    match_number INTEGER NOT NULL,
    title VARCHAR(128) NOT NULL,
    map VARCHAR(64) DEFAULT 'Bermuda' NOT NULL,
    room_id VARCHAR(64),
    room_password VARCHAR(64),
    room_release_time TIMESTAMP WITH TIME ZONE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status match_status DEFAULT 'UPCOMING'::match_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 11. MATCH PLAYERS / TEAMS ASSIGNED
CREATE TABLE IF NOT EXISTS public.match_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    slot_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 12. RESULTS TABLE (Result Submissions & OCR Verification)
CREATE TABLE IF NOT EXISTS public.results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    kills INTEGER DEFAULT 0 NOT NULL,
    placement INTEGER DEFAULT 1 NOT NULL,
    placement_points INTEGER DEFAULT 0 NOT NULL,
    kill_points INTEGER DEFAULT 0 NOT NULL,
    total_points INTEGER DEFAULT 0 NOT NULL,
    rating_change INTEGER DEFAULT 0 NOT NULL,
    screenshot_url TEXT NOT NULL,
    video_url TEXT,
    notes TEXT,
    ai_ocr_data JSONB, -- { detected_ign: "VORTEX_REX", detected_kills: 8, detected_placement: 1, confidence: 0.96 }
    verification_status verification_status DEFAULT 'PENDING'::verification_status NOT NULL,
    verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 13. DISPUTES TABLE
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID REFERENCES public.results(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    evidence_url TEXT,
    status dispute_status DEFAULT 'OPEN'::dispute_status NOT NULL,
    admin_note TEXT,
    resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 14. ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(64) NOT NULL,
    badge_color VARCHAR(32) NOT NULL,
    criteria VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 15. USER ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, achievement_id)
);

-- 16. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_id VARCHAR(64) UNIQUE NOT NULL, -- e.g., "FF-2026-8X73KD"
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
    position VARCHAR(64) NOT NULL, -- "1st Place Winner", "Runner-Up", "Top Fragger", "Participation"
    participant_name VARCHAR(128) NOT NULL,
    tournament_name VARCHAR(255) NOT NULL,
    organizer_name VARCHAR(128) NOT NULL,
    qr_code_payload TEXT NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 17. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(64) NOT NULL, -- "ROOM_RELEASED", "MATCH_LIVE", "RESULT_VERIFIED", "TEAM_INVITE", "DISPUTE_UPDATE"
    link_url TEXT,
    read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 18. WALLETS TABLE
CREATE TABLE IF NOT EXISTS public.wallets (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    balance NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
    winnings NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
    kyc_status VARCHAR(32) DEFAULT 'NONE' NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 19. WALLET TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(32) NOT NULL, -- DEPOSIT, WITHDRAW, ENTRY, REWARD
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(32) DEFAULT 'SUCCESS' NOT NULL,
    utr_ref VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_start ON public.tournaments(start_time);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON public.registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_tournament ON public.registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_results_match ON public.results(match_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON public.wallet_transactions(user_id);
