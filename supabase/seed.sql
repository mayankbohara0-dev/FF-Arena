-- =========================================================
-- FF ARENA - SEED DATA FOR FREE FIRE ESPORTS
-- =========================================================

-- Sample Achievements
INSERT INTO public.achievements (id, code, name, description, icon, badge_color, criteria) VALUES
('a0000000-0000-0000-0000-000000000001', 'CHAMPION', 'Champion', 'Win your first tournament title', 'Trophy', 'amber', 'Win first tournament'),
('a0000000-0000-0000-0000-000000000002', 'SERIAL_WINNER', 'Serial Winner', 'Win five tournaments in FF Arena', 'Crown', 'purple', 'Win five tournaments'),
('a0000000-0000-0000-0000-000000000003', 'TOP_FRAGGER', 'Top Fragger', 'Achieve highest kill count in a tournament', 'Flame', 'orange', 'Highest tournament kills'),
('a0000000-0000-0000-0000-000000000004', 'SHARPSHOOTER', 'Sharpshooter', 'Score 10 or more kills in a single match', 'Crosshair', 'red', '10+ kills in one match'),
('a0000000-0000-0000-0000-000000000005', 'UNSTOPPABLE', 'Unstoppable', 'Win three tournaments consecutively', 'Zap', 'yellow', '3 consecutive tournament wins'),
('a0000000-0000-0000-0000-000000000006', 'VETERAN', 'Veteran', 'Participate in 50 esports tournaments', 'Shield', 'cyan', 'Participate in 50 tournaments'),
('a0000000-0000-0000-0000-000000000007', 'TEAM_PLAYER', 'Team Player', 'Participate in 25 squad tournaments', 'Users', 'green', 'Participate in 25 squad tournaments')
ON CONFLICT (code) DO NOTHING;

-- Sample Colleges
INSERT INTO public.colleges (id, name, short_code, logo_url, city, state, is_verified, total_points) VALUES
('c0000000-0000-0000-0000-000000000001', 'Indian Institute of Technology Bombay', 'IIT Bombay', 'https://images.unsplash.com/photo-1562774053-701939374585?w=100&auto=format&fit=crop&q=80', 'Mumbai', 'Maharashtra', TRUE, 4280),
('c0000000-0000-0000-0000-000000000002', 'Delhi Technological University', 'DTU Delhi', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100&auto=format&fit=crop&q=80', 'New Delhi', 'Delhi', TRUE, 3850),
('c0000000-0000-0000-0000-000000000003', 'National Institute of Technology Trichy', 'NIT Trichy', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=100&auto=format&fit=crop&q=80', 'Tiruchirappalli', 'Tamil Nadu', TRUE, 3420),
('c0000000-0000-0000-0000-000000000004', 'Vellore Institute of Technology', 'VIT Vellore', 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=100&auto=format&fit=crop&q=80', 'Vellore', 'Tamil Nadu', TRUE, 3100)
ON CONFLICT (id) DO NOTHING;
