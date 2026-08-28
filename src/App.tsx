import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { MobileAppLayout } from './components/mobile/MobileAppLayout';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { OnboardingFlow } from './components/mobile/OnboardingFlow';
import { LoginScreen } from './components/mobile/LoginScreen';

type AppState = 'LOADING' | 'ONBOARDING' | 'LOGIN' | 'APP';

const MainAppContent: React.FC = () => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [appState, setAppState] = useState<AppState>('LOADING');

  useEffect(() => {
    const onboarded = localStorage.getItem('ff_onboarded');
    const user      = localStorage.getItem('ff_user');
    if (!onboarded)  setAppState('ONBOARDING');
    else if (!user)  setAppState('LOGIN');
    else             setAppState('APP');
  }, []);

  /* Loading splash */
  if (appState === 'LOADING') {
    return (
      <div className="w-full h-full bg-[#050507] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#FFE600] flex items-center justify-center mx-auto shadow-glow-yellow">
            <span className="font-display font-black text-black text-2xl">FF</span>
          </div>
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

  /* Main app — NO extra wrapper div needed; #root is already h-full flex */
  return (
    <>
      <MobileAppLayout onOpenNotifications={() => setIsNotifOpen(true)} />
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

export default App;
