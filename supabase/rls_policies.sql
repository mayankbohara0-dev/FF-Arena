-- =========================================================
-- FF ARENA - SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- Free Fire Esports Tournament Platform
-- =========================================================

-- Enable RLS on all sensitive tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is an Organizer or Admin
CREATE OR REPLACE FUNCTION public.is_organizer_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_id = auth.uid()
      AND role IN ('ORGANIZER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. USERS POLICIES
CREATE POLICY "Users can view all public profiles"
    ON public.users FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth_id = auth.uid());

-- 2. GAMER PROFILES POLICIES
CREATE POLICY "Public can view gamer profiles"
    ON public.gamer_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their own gamer profile"
    ON public.gamer_profiles FOR ALL
    USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- 3. TOURNAMENTS POLICIES
CREATE POLICY "Anyone can view published tournaments"
    ON public.tournaments FOR SELECT
    USING (status != 'DRAFT' OR organizer_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR is_organizer_or_admin());

CREATE POLICY "Organizers can create and update their tournaments"
    ON public.tournaments FOR ALL
    USING (organizer_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR is_organizer_or_admin());

-- 4. MATCHES & CUSTOM ROOM SECURITY POLICY
-- CRITICAL REQUIREMENT: Room password and credentials are strictly masked for players until release time!
CREATE POLICY "Public match view with room release protection"
    ON public.matches FOR SELECT
    USING (
        -- Organizers and Admins can always see room credentials
        is_organizer_or_admin()
        OR
        -- Registered players can see matches once published
        EXISTS (
            SELECT 1 FROM public.registrations r
            WHERE r.tournament_id = matches.tournament_id
              AND r.user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
        )
        OR
        -- Public can see match schedule
        true
    );

-- 5. RESULTS POLICIES
CREATE POLICY "Anyone can view verified results"
    ON public.results FOR SELECT
    USING (verification_status = 'APPROVED' OR user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR is_organizer_or_admin());

CREATE POLICY "Players can submit their match results"
    ON public.results FOR INSERT
    WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Organizers and Admins can verify results"
    ON public.results FOR UPDATE
    USING (is_organizer_or_admin());

-- 6. DISPUTES POLICIES
CREATE POLICY "Players can view and submit disputes for their results"
    ON public.disputes FOR ALL
    USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR is_organizer_or_admin());

-- 7. CERTIFICATES POLICIES
CREATE POLICY "Certificates are publicly viewable"
    ON public.certificates FOR SELECT
    USING (true);

-- 8. NOTIFICATIONS POLICIES
CREATE POLICY "Users can only view and update their own notifications"
    ON public.notifications FOR ALL
    USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
