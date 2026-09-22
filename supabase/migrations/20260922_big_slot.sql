-- =========================================================
-- FF ARENA - BIG SLOT (BATTLE ROYALE SQUAD ONLY) MIGRATION
-- Schema & Stored Procedures for Big Slot Tournament Payouts
-- =========================================================

-- 1. Ensure Big Slot tournament mode exists
ALTER TYPE tournament_mode ADD VALUE IF NOT EXISTS 'BIG_SLOT';

-- 2. Add profit calculation and payout status columns if not exist
ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS total_collection NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
ADD COLUMN IF NOT EXISTS total_payout NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
ADD COLUMN IF NOT EXISTS tournament_profit NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
ADD COLUMN IF NOT EXISTS payout_status VARCHAR(32) DEFAULT 'pending' NOT NULL;

-- 3. Stored Procedure for Atomic Payout & Profit Calculation
CREATE OR REPLACE FUNCTION process_big_slot_payout(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tourney RECORD;
    v_teams_count INTEGER;
    v_total_collection NUMERIC(10,2);
    v_fixed_placement NUMERIC(10,2) := 0;
    v_kill_payouts NUMERIC(10,2) := 0;
    v_total_payout NUMERIC(10,2) := 0;
    v_app_profit NUMERIC(10,2) := 0;
    v_res RECORD;
    v_winner_user_id UUID;
BEGIN
    -- Check tournament exists and not already paid
    SELECT * INTO v_tourney FROM public.tournaments WHERE id = p_tournament_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tournament not found';
    END IF;

    IF v_tourney.payout_status = 'paid' THEN
        RAISE EXCEPTION 'Payouts already processed for this tournament';
    END IF;

    -- Count registered squads
    SELECT COUNT(*) INTO v_teams_count FROM public.registrations WHERE tournament_id = p_tournament_id;
    v_total_collection := v_tourney.entry_fee * v_teams_count;

    -- Iterate through verified results
    FOR v_res IN (SELECT * FROM public.results WHERE match_id IN (SELECT id FROM public.matches WHERE tournament_id = p_tournament_id) ORDER BY placement ASC) LOOP
        -- Placement calculation
        DECLARE
            v_placement_prize NUMERIC(10,2) := 0;
            v_kill_prize NUMERIC(10,2) := 0;
            v_team_total NUMERIC(10,2) := 0;
        BEGIN
            IF v_res.placement = 1 THEN v_placement_prize := 600.00;
            ELSIF v_res.placement = 2 THEN v_placement_prize := 400.00;
            ELSIF v_res.placement = 3 THEN v_placement_prize := 200.00;
            END IF;

            v_kill_prize := v_res.kills * v_tourney.per_kill_reward;
            v_team_total := v_placement_prize + v_kill_prize;

            v_fixed_placement := v_fixed_placement + v_placement_prize;
            v_kill_payouts := v_kill_payouts + v_kill_prize;

            -- Credit team captain wallet
            IF v_team_total > 0 THEN
                UPDATE public.wallets
                SET balance = balance + v_team_total,
                    winnings = winnings + v_team_total,
                    updated_at = NOW()
                WHERE user_id = v_res.user_id;

                INSERT INTO public.wallet_transactions (id, user_id, type, amount, status, created_at)
                VALUES (uuid_generate_v4(), v_res.user_id, 'REWARD', v_team_total, 'SUCCESS', NOW());
            END IF;
        END;
    END LOOP;

    v_total_payout := v_fixed_placement + v_kill_payouts;
    v_app_profit := v_total_collection - v_total_payout;

    -- Update tournament stats
    UPDATE public.tournaments
    SET total_collection = v_total_collection,
        total_payout = v_total_payout,
        tournament_profit = v_app_profit,
        payout_status = 'paid',
        status = 'COMPLETED'::tournament_status,
        updated_at = NOW()
    WHERE id = p_tournament_id;

    RETURN jsonb_build_object(
        'success', true,
        'tournament_id', p_tournament_id,
        'total_collection', v_total_collection,
        'fixed_placement', v_fixed_placement,
        'kill_payouts', v_kill_payouts,
        'total_payout', v_total_payout,
        'tournament_profit', v_app_profit
    );
END;
$$;
