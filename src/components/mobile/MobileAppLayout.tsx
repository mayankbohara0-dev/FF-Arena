import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  Trophy,
  User as UserIcon,
  Bell,
  Gamepad2,
  Menu,
  ArrowLeft,
  Wallet,
  LayoutDashboard,
  Users,
  Shield,
  IndianRupee,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Tournament, Match } from '../../types';
import { HomeTab } from './tabs/HomeTab';
import { TournamentsTab } from './tabs/TournamentsTab';
import { MyMatchesTab } from './tabs/MyMatchesTab';
import { RankingsTab } from './tabs/RankingsTab';
import { ProfileTab } from './tabs/ProfileTab';
import { WalletTab } from './tabs/WalletTab';
import { CollegeEsportsTab } from './tabs/CollegeEsportsTab';
import { TournamentDetailModal } from './modals/TournamentDetailModal';
import { MatchSubmissionModal } from './modals/MatchSubmissionModal';
import { DisputeModal } from './modals/DisputeModal';
import { TeamManagementModal } from './modals/TeamManagementModal';
import { MobileDrawer } from './MobileDrawer';
import { OrganizerDashboard } from '../organizer/OrganizerDashboard';
import { AdminDashboard } from '../admin/AdminDashboard';
import { CertificateVerificationPage } from '../certificates/CertificateVerificationPage';
import { RoomUnlockToast } from './RoomUnlockToast';
import { tapFeedback } from '../../services/soundService';
import { isWhitelistedAdmin } from '../../services/adminAuth';

type TabName = 'HOME' | 'TOURNAMENTS' | 'MY_MATCHES' | 'WALLET' | 'RANKINGS' | 'PROFILE' | 'COLLEGE';

const NAV_ITEMS: { tab: TabName; icon: React.FC<any>; label: string }[] = [
  { tab: 'HOME',        icon: Home,       label: 'Home' },
  { tab: 'TOURNAMENTS', icon: Trophy,     label: 'Tourneys' },
  { tab: 'MY_MATCHES',  icon: Gamepad2,   label: 'Matches' },
  { tab: 'WALLET',      icon: Wallet,     label: 'Wallet' },
  { tab: 'PROFILE',     icon: UserIcon,   label: 'Profile' },
];

export const MobileAppLayout: React.FC<{ onOpenNotifications: () => void }> = ({
  onOpenNotifications,
}) => {
  const {
    currentUser,
    unreadNotifCount,
    tournaments,
    viewMode,
    setViewMode,
  } = useApp();
  const { registrations } = useApp() as any;

  const [activeTab, setActiveTab]           = useState<TabName>('HOME');
  const [adminTab, setAdminTab]             = useState<'DASHBOARD' | 'PLAYERS' | 'TOURNAMENTS' | 'PAYOUTS' | 'FRAUD'>('DASHBOARD');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [submissionMatch, setSubmissionMatch]       = useState<Match | null>(null);
  const [disputeResultId, setDisputeResultId]       = useState<string | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen]       = useState(false);
  const [isDrawerOpen, setIsDrawerOpen]             = useState(false);
  const [roomToast, setRoomToast]           = useState<{ roomId: string; roomPassword: string; tournamentName: string } | null>(null);
  const [installPrompt, setInstallPrompt]   = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner]   = useState(false);
  const prevParticipants = useRef<Record<string, number>>({});

  const safeBalance = currentUser.walletBalance ?? 0;
  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || isWhitelistedAdmin(currentUser.email);

  // Auto-route admin users to admin view on first load
  useEffect(() => {
    if (isAdmin && viewMode === 'MOBILE') {
      setViewMode('ADMIN');
    }
  }, [isAdmin]);

  /* Room-unlock detection ------------------------------------------------- */
  useEffect(() => {
    tournaments.forEach((t: any) => {
      const joined = registrations?.some((r: any) => r.tournamentId === t.id && r.userId === currentUser.id);
      if (!joined) return;
      const prev = prevParticipants.current[t.id] || 0;
      const curr = t.currentParticipants;
      const max  = t.maxParticipants || 48;
      if (prev < max && curr >= max && t.matches?.[0]?.roomId) {
        setRoomToast({ roomId: t.matches[0].roomId, roomPassword: t.matches[0].roomPassword || '', tournamentName: t.name });
      }
      prevParticipants.current[t.id] = curr;
    });
  }, [tournaments]);

  /* PWA install prompt ---------------------------------------------------- */
  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); setShowInstallBanner(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    tapFeedback();
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
    setShowInstallBanner(false);
  };



  const handleNav = (tab: TabName) => {
    tapFeedback();
    if (viewMode !== 'MOBILE') setViewMode('MOBILE');
    setActiveTab(tab);
  };

  const ADMIN_NAV_ITEMS = [
    { tab: 'DASHBOARD' as const, icon: LayoutDashboard, label: 'Dashboard' },
    { tab: 'PLAYERS'   as const, icon: Users,            label: 'Players' },
    { tab: 'TOURNAMENTS' as const, icon: Trophy,         label: 'Matches' },
    { tab: 'PAYOUTS'   as const, icon: IndianRupee,      label: 'Payouts' },
    { tab: 'FRAUD'     as const, icon: ShieldAlert,      label: 'Anti-Cheat' },
  ];

  return (
    /**
     * OUTER: fills the full #root (which is height:100% from CSS).
     * We use flex + h-full so the inner frame can flex-grow.
     * On desktop we center a phone-shaped card; on mobile we go edge-to-edge.
     */
    <div className="w-full h-full bg-[#050507] flex items-center justify-center overflow-hidden">

      {/* ── App frame ── */}
      <div
        className="
          relative flex flex-col
          w-full h-full
          sm:w-[400px] sm:h-[820px] sm:max-h-[96vh]
          sm:rounded-[40px] sm:border sm:border-zinc-800/60
          sm:shadow-2xl sm:overflow-hidden
          bg-[#050507]
        "
        style={{ isolation: 'isolate' }}
      >

        {/* ── Safe area top spacer ── */}
        <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} />

        {/* ── Top app bar ── */}
        <div className="shrink-0 flex items-center justify-between px-3 py-2 bg-[#08080A]/95 border-b border-zinc-900 backdrop-blur-md z-20 gap-2 select-none">
          {/* Left */}
          <div className="flex items-center gap-2 min-w-0">
            {viewMode !== 'MOBILE' ? (
              <button
                onClick={() => setViewMode('MOBILE')}
                className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 text-xs font-bold shrink-0 text-zinc-300"
              >
                <ArrowLeft className="w-4 h-4 text-[#FFE600]" />
              </button>
            ) : (
              <button
                onClick={() => { tapFeedback(); setIsDrawerOpen(true); }}
                className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-300 active:scale-95 transition shrink-0"
                aria-label="Menu"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            {/* Avatar */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full border-2 border-[#FFE600] overflow-hidden shrink-0 shadow-glow-yellow-sm">
                <img src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 hidden xs:block">
                <p className="font-display font-black text-[11px] text-white leading-none truncate">
                  {currentUser.gamerProfile?.gameName || currentUser.displayName || 'Player'}
                </p>
                <span className="text-[8px] text-[#FFE600] font-bold tracking-wider">
                  {viewMode === 'ADMIN' ? '🛡️ ADMIN' : 'PRO LEAGUE'}
                </span>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isAdmin && (
              <button
                onClick={() => {
                  tapFeedback();
                  setViewMode(viewMode === 'ADMIN' ? 'MOBILE' : 'ADMIN');
                }}
                className={`px-2 py-1 rounded-xl text-[10px] font-black uppercase font-mono transition border ${
                  viewMode === 'ADMIN'
                    ? 'bg-purple-600 border-purple-400 text-white shadow-glow-purple'
                    : 'bg-purple-950/40 border-purple-500/40 text-purple-300 hover:bg-purple-900/50'
                }`}
              >
                🛡️ ADMIN
              </button>
            )}

            <button
              onClick={() => handleNav('WALLET')}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#FFE600]/10 border border-[#FFE600]/30 text-[#FFE600] font-mono text-[11px] font-black active:scale-95 transition"
            >
              <Wallet className="w-3 h-3" />
              <span className="hidden xs:inline">₹{safeBalance.toFixed(0)}</span>
            </button>

            <button
              onClick={onOpenNotifications}
              className="relative p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 active:scale-95 transition"
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#FFE600] text-black text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Scrollable content area ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none px-3 pt-3">
          {viewMode === 'ORGANIZER' ? (
            <OrganizerDashboard />
          ) : viewMode === 'ADMIN' ? (
            <AdminDashboard activeTab={adminTab} onTabChange={setAdminTab} />
          ) : viewMode === 'CERT_VERIFY' ? (
            <CertificateVerificationPage />
          ) : (
            <>
              {activeTab === 'HOME' && (
                <HomeTab
                  onSelectTournament={setSelectedTournament}
                  onOpenSubmitResult={setSubmissionMatch}
                  onOpenTeamModal={() => setIsTeamModalOpen(true)}
                  onOpenCollegeTab={() => setActiveTab('COLLEGE')}
                />
              )}
              {activeTab === 'TOURNAMENTS' && (
                <TournamentsTab onSelectTournament={setSelectedTournament} />
              )}
              {activeTab === 'MY_MATCHES' && (
                <MyMatchesTab
                  onSelectTournament={setSelectedTournament}
                  onOpenSubmitResult={setSubmissionMatch}
                  onNavigateToTourneys={() => setActiveTab('TOURNAMENTS')}
                />
              )}
              {activeTab === 'WALLET'   && <WalletTab />}
              {activeTab === 'RANKINGS' && <RankingsTab />}
              {activeTab === 'PROFILE'  && <ProfileTab />}
              {activeTab === 'COLLEGE'  && (
                <CollegeEsportsTab
                  onSelectTournament={setSelectedTournament}
                  onOpenTeamModal={() => setIsTeamModalOpen(true)}
                />
              )}
            </>
          )}
        </div>

        {/* ── Bottom navigation bar ── */}
        {viewMode === 'ADMIN' ? (
          /* Admin bottom nav — purple theme */
          <div
            className="shrink-0 bg-[#0A0712]/98 border-t border-purple-900/60 flex items-stretch z-20 select-none"
            style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom, 6px))' }}
          >
            {ADMIN_NAV_ITEMS.map(({ tab, icon: Icon, label }) => {
              const isActive = adminTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => { tapFeedback(); setAdminTab(tab); }}
                  className={`flex-1 flex flex-col items-center justify-center pt-2 pb-1 gap-0.5 min-w-0 transition active:scale-95 ${
                    isActive ? 'text-purple-400' : 'text-zinc-600'
                  }`}
                  aria-label={label}
                >
                  <Icon className={`w-[19px] h-[19px] shrink-0 ${isActive ? 'filter drop-shadow-[0_0_6px_rgba(167,139,250,0.7)]' : ''}`} />
                  <span className="text-[9px] font-bold leading-none">{label}</span>
                  {isActive && <div className="w-3.5 h-[2px] rounded-full bg-purple-400 mt-0.5" />}
                </button>
              );
            })}
          </div>
        ) : (
          /* Player bottom nav — yellow theme */
          <div
            className="shrink-0 bg-[#08080A]/98 border-t border-zinc-900 flex items-stretch z-20 select-none"
            style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom, 6px))' }}
          >
            {NAV_ITEMS.map(({ tab, icon: Icon, label }) => {
              const isActive = viewMode === 'MOBILE' && activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleNav(tab)}
                  className={`flex-1 flex flex-col items-center justify-center pt-2 pb-1 gap-0.5 min-w-0 transition active:scale-95 ${
                    isActive ? 'text-[#FFE600]' : 'text-zinc-500'
                  }`}
                  aria-label={label}
                >
                  <Icon className={`w-[19px] h-[19px] shrink-0 ${isActive ? 'filter drop-shadow-[0_0_6px_rgba(255,230,0,0.6)]' : ''}`} />
                  <span className="text-[9px] font-bold leading-none">{label}</span>
                  {isActive && <div className="w-3.5 h-[2px] rounded-full bg-[#FFE600] mt-0.5" />}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Room Unlock Toast ── */}
        {roomToast && (
          <RoomUnlockToast
            roomId={roomToast.roomId}
            roomPassword={roomToast.roomPassword}
            tournamentName={roomToast.tournamentName}
            onDismiss={() => setRoomToast(null)}
          />
        )}

        {/* ── PWA Install Banner ── */}
        {showInstallBanner && (
          <div className="absolute bottom-20 left-3 right-3 z-40 bg-[#0E0E12] border border-[#FFE600]/30 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-glow-yellow-sm animate-slide-in-up">
            <div className="min-w-0">
              <p className="text-xs font-black text-white">Install FF Arena</p>
              <p className="text-[10px] text-zinc-500">Add to Home Screen</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setShowInstallBanner(false)} className="text-zinc-500 text-[10px] px-2 py-1">Later</button>
              <button onClick={handleInstall} className="px-3 py-1.5 rounded-xl bg-[#FFE600] text-black font-black text-[10px] active:scale-95 transition">INSTALL</button>
            </div>
          </div>
        )}

        {/* ── Drawer ── */}
        <MobileDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onOpenTeamModal={() => setIsTeamModalOpen(true)}
        />

        {/* ── Modals ── */}
        {selectedTournament && (
          <TournamentDetailModal
            tournament={selectedTournament}
            onClose={() => setSelectedTournament(null)}
            onOpenSubmitResult={(m) => { setSelectedTournament(null); setSubmissionMatch(m); }}
          />
        )}
        {submissionMatch && (
          <MatchSubmissionModal match={submissionMatch} onClose={() => setSubmissionMatch(null)} />
        )}
        {disputeResultId && (
          <DisputeModal resultId={disputeResultId} onClose={() => setDisputeResultId(null)} />
        )}
        {isTeamModalOpen && (
          <TeamManagementModal onClose={() => setIsTeamModalOpen(false)} />
        )}
      </div>
    </div>
  );
};
