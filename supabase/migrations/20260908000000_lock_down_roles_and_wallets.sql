ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
REVOKE UPDATE (role, auth_id) ON TABLE public.users FROM anon, authenticated;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.wallets FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.wallet_transactions FROM anon, authenticated;
