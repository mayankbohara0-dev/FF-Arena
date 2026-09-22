import React, { useState, useEffect } from 'react';
import { FFArenaMockUI } from './components/mobile/FFArenaMockUI';
import { LandingPage } from './components/landing/LandingPage';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { Smartphone, Monitor, Globe, Gamepad2, Wifi, Battery, Signal } from 'lucide-react';

// Global error boundary to catch any JS crashes
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

export function App() {
  const [view, setView] = useState<'APP' | 'LANDING'>('APP');
  const [isFramed, setIsFramed] = useState(true);
  const [currentTime, setCurrentTime] = useState('9:41');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  if (view === 'LANDING') {
    return (
      <div className="relative min-h-screen bg-[#050507]">
        {/* Floating Return Button */}
        <button
          onClick={() => setView('APP')}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#FFE600] text-black font-black text-xs uppercase tracking-wider shadow-[0_4px_25px_rgba(255,230,0,0.5)] transition active:scale-95 cursor-pointer hover:bg-[#FFF066]"
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Launch FF Arena App</span>
        </button>
        <LandingPage />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <div className="w-full h-[100dvh] bg-[#050811] flex flex-col items-center justify-center overflow-hidden font-sans text-white select-none">
            {/* Desktop Top Control Bar (Hidden on Mobile viewports) */}
            <header className="hidden md:flex w-full items-center justify-between px-6 py-2 bg-[#080D18]/90 border-b border-[#202B40] flex-shrink-0 z-30">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="FF Arena" className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(255,214,0,0.4)]" />
                <div>
                  <span className="font-black text-xs text-white tracking-widest uppercase">FF ARENA</span>
                  <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FFD600]/15 border border-[#FFD600]/30 text-[#FFD600]">
                    MOBILE ESPORTS UI
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFramed(!isFramed)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                  style={{
                    background: isFramed ? 'rgba(255,214,0,0.15)' : '#111A2C',
                    border: `1px solid ${isFramed ? 'rgba(255,214,0,0.4)' : '#202B40'}`,
                    color: isFramed ? '#FFD600' : '#8B96A8',
                  }}
                >
                  {isFramed ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                  <span>{isFramed ? 'Phone Frame' : 'Full Screen'}</span>
                </button>

                <button
                  onClick={() => setView('LANDING')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer bg-[#111A2C] border border-[#202B40] text-[#8B96A8] hover:text-white"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Landing Page</span>
                </button>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full flex items-center justify-center relative overflow-hidden">
              {/* Subtle Ambient Esports Lighting */}
              <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#FFD600]/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-[#3B82F6]/5 rounded-full blur-3xl pointer-events-none" />

              {isFramed ? (
                /* Framed Smartphone Simulator */
                <div className="relative w-full max-w-[425px] h-full md:h-[94vh] md:max-h-[880px] md:rounded-[44px] md:border-[6px] md:border-[#1F293D] shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(255,214,0,0.08)] bg-[#070707] flex flex-col overflow-hidden">
                  {/* Dynamic Island / Bezel Top Notch (desktop only) */}
                  <div className="hidden md:flex items-center justify-between px-6 pt-3 pb-1 bg-[#080D18] flex-shrink-0">
                    <span className="text-[11px] font-bold tracking-tight text-zinc-300 font-mono">{currentTime}</span>
                    <div className="w-24 h-4 rounded-full bg-black flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-800" />
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Signal className="w-3 h-3" />
                      <Wifi className="w-3 h-3" />
                      <Battery className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  </div>

                  {/* Mobile App Viewport */}
                  <div className="flex-1 w-full overflow-hidden flex flex-col">
                    <FFArenaMockUI />
                  </div>

                  {/* Home Indicator Bar (desktop only) */}
                  <div className="hidden md:block py-1 bg-[#080D18] flex-shrink-0">
                    <div className="w-28 h-1 bg-zinc-700/60 rounded-full mx-auto" />
                  </div>
                </div>
              ) : (
                /* Fullscreen Responsive Layout */
                <div className="w-full h-full flex flex-col bg-[#070707]">
                  <FFArenaMockUI />
                </div>
              )}
            </main>
          </div>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
