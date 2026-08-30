import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { MobileAppLayout } from './components/mobile/MobileAppLayout';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { OnboardingFlow } from './components/mobile/OnboardingFlow';
import { LoginScreen } from './components/mobile/LoginScreen';

type AppState = 'LOADING' | 'ONBOARDING' | 'LOGIN' | 'APP';

// Global error boundary to catch JS crashes on Android WebView
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: String(error) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#050507', color: '#FFE600', padding: 24,
          height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 8 }}>FF</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>FF ARENA</div>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>App encountered an error. Please restart.</div>
          <div style={{ fontSize: 9, color: '#555', maxWidth: 280, wordBreak: 'break-all' }}>
            {this.state.error}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20, padding: '10px 24px', background: '#FFE600',
              color: '#000', fontWeight: 900, border: 'none', borderRadius: 12,
              fontSize: 12, cursor: 'pointer'
            }}
          >
            RESTART APP
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainAppContent: React.FC = () => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [appState, setAppState] = useState<AppState>('LOADING');

  useEffect(() => {
    // Small delay to let the WebView fully initialize on Android
    const timer = setTimeout(() => {
      try {
        const onboarded = localStorage.getItem('ff_onboarded');
        const user      = localStorage.getItem('ff_user');

        if (!onboarded) {
          setAppState('ONBOARDING');
        } else if (!user) {
          setAppState('LOGIN');
        } else {
          // Bridge: if ff_arena_user is missing but ff_user exists, seed it
          // This handles users who logged in before the fix was deployed
          const arenaUser = localStorage.getItem('ff_arena_user');
          if (!arenaUser) {
            try {
              const parsed = JSON.parse(user);
              const bridged = {
                id: parsed.uid || `usr-${Date.now()}`,
                email: parsed.email || '',
                username: (parsed.gameName || 'PLAYER').toLowerCase().replace(/\s+/g, '_'),
                displayName: parsed.gameName || 'PLAYER',
                gamerProfile: {
                  id: `gp-${parsed.uid}`,
                  userId: parsed.uid || '',
                  gameUid: parsed.gameUid || '',
                  gameName: parsed.gameName || 'PLAYER',
                  region: 'IND',
                  rating: 1200,
                  tier: 'Gold',
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
                walletBalance: 0,
                winningsBalance: 0,
                role: 'PLAYER',
                status: 'Active',
                createdAt: new Date().toISOString(),
              };
              localStorage.setItem('ff_arena_user', JSON.stringify(bridged));
            } catch {
              // ignore, AppContext falls back to mock data
            }
          }
          setAppState('APP');
        }
      } catch {
        setAppState('ONBOARDING');
      }
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  /* Loading splash */
  if (appState === 'LOADING') {
    return (
      <div className="w-full h-full bg-[#050507] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#FFE600] flex items-center justify-center mx-auto shadow-glow-yellow">
            <span className="font-display font-black text-black text-2xl">FF</span>
          </div>
          <p className="text-xs text-zinc-500 font-bold tracking-widest uppercase">FF ARENA</p>
          <div className="w-8 h-0.5 bg-[#FFE600] rounded-full mx-auto animate-pulse" />
        </div>
      </div>
    );
  }

  if (appState === 'ONBOARDING') {
    return <OnboardingFlow onComplete={() => setAppState('LOGIN')} />;
  }

  if (appState === 'LOGIN') {
    return <LoginScreen onLogin={() => setAppState('APP')} />;
  }

  return (
    <>
      <MobileAppLayout onOpenNotifications={() => setIsNotifOpen(true)} />
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
