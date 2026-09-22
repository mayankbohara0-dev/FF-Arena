import React, { useState, useEffect } from 'react';
import {
  Home, Trophy, Gamepad2, BarChart2, User, Bell, Wallet,
  Search, ChevronRight, ChevronDown, ChevronUp, X,
  Copy, Check, MapPin, Clock, Users, Shield, Zap, Star, Crown,
  TrendingUp, ArrowUpRight, ArrowDownLeft, Plus, Eye, Award,
  AlertTriangle, Play, Lock, Unlock, Settings,
  LogOut, HelpCircle, FileText, Swords, Flag, RefreshCw,
  CheckCircle, XCircle, Send, Share2, Download, Edit3,
  Target, Flame, Hash, Calendar, Timer, ArrowLeft, Gift, Phone, MessageSquare,
  Radio, CheckSquare, Layers, CheckCircle2, ExternalLink, Upload
} from 'lucide-react';

import {
  MOCK_PLAYER, MOCK_PLAYERS, MOCK_TOURNAMENTS, MOCK_MY_MATCHES,
  MOCK_WALLET_TRANSACTIONS, MOCK_NOTIFICATIONS,
  TOURNAMENT_RULES, ADMIN_PLAYERS,
  MockTournament, TournamentFormat, TournamentCategory, ClashSquadSlot, FreeFireMap,
  TournamentRegistrationItem, TournamentResultItem,
  calculateSoloFinances, calculateDuoFinances, calculateSquadFinances, calculateBigSlotFinances, calculateClashSquadFinances
} from './mockData';
import { RealPaymentModal } from './modals/RealPaymentModal';
import { PaymentVerificationPanel } from '../admin/PaymentVerificationPanel';
import { MatchResultVerificationPanel } from '../admin/MatchResultVerificationPanel';
import { MatchSubmissionModal } from './modals/MatchSubmissionModal';
import { useAuth } from '../../context/AuthContext';
import { subscribeUserPayments, subscribeAllPayments } from '../../firebase/paymentService';
import { subscribeUserRegistrations } from '../../firebase/registrationService';
import {
  subscribeUserMatchResults,
  subscribeAllMatchResults,
  subscribeTournamentLeaderboard,
} from '../../firebase/matchResultService';
import type {
  PaymentDocument,
  RegistrationDocument,
  MatchResultDocument,
  LeaderboardEntryDocument,
} from '../../types';

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  bg: '#070707',
  navy: '#080D18',
  card: '#0D1424',
  cardLight: '#111A2C',
  border: '#202B40',
  borderLight: '#2A3650',
  yellow: '#FFD600',
  yellowDim: 'rgba(255,214,0,0.15)',
  yellowBorder: 'rgba(255,214,0,0.3)',
  text: '#FFFFFF',
  textSec: '#8B96A8',
  live: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  blue: '#3B82F6',
  purple: '#A855F7',
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const statusColor = (s: string) => {
  switch (s) {
    case 'LIVE': return { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#EF4444' };
    case 'UPCOMING': return { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', text: '#60A5FA' };
    case 'FULL': return { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: '#F59E0B' };
    case 'REGISTERED': return { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)', text: '#22C55E' };
    case 'COMPLETED': return { bg: 'rgba(139,150,168,0.12)', border: 'rgba(139,150,168,0.3)', text: '#8B96A8' };
    default: return { bg: 'rgba(139,150,168,0.12)', border: 'rgba(139,150,168,0.3)', text: '#8B96A8' };
  }
};

const formatBadge = (f: TournamentFormat) => {
  switch (f) {
    case 'SOLO': return { label: 'SOLO', bg: 'rgba(255,214,0,0.15)', border: 'rgba(255,214,0,0.35)', text: '#FFD600' };
    case 'DUO': return { label: 'DUO', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.35)', text: '#60A5FA' };
    case 'SQUAD': return { label: 'SQUAD', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.35)', text: '#C084FC' };
    case 'BIG_SLOT': return { label: 'BIG SLOT', bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.5)', text: '#F59E0B' };
    case 'CLASH_SQUAD': return { label: 'CLASH SQUAD', bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.35)', text: '#4ADE80' };
  }
};

const slotPct = (cur: number, max: number) => Math.min(100, Math.round((cur / max) * 100));
const slotBarColor = (pct: number) => pct >= 90 ? C.live : pct >= 60 ? C.warning : C.yellow;

// ─── REUSABLE ATOMS ──────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string; pulse?: boolean; size?: 'sm' | 'xs' }> = ({ status, pulse, size = 'sm' }) => {
  const col = statusColor(status);
  const pad = size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]';
  return (
    <span className={`${pad} font-black uppercase rounded-md flex items-center gap-1`}
      style={{ background: col.bg, border: `1px solid ${col.border}`, color: col.text }}>
      {(status === 'LIVE' || pulse) && (
        <span className="w-1.5 h-1.5 rounded-full inline-block bg-current animate-pulse" />
      )}
      {status}
    </span>
  );
};

const SectionHeader: React.FC<{ title: string; action?: string; onAction?: () => void }> = ({ title, action, onAction }) => (
  <div className="flex items-center justify-between px-0.5 mb-3">
    <h3 className="text-[11px] font-black uppercase tracking-widest" style={{ color: C.textSec }}>{title}</h3>
    {action && (
      <button onClick={onAction} className="text-[10px] font-black uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
        style={{ color: C.yellow }}>
        {action} <ChevronRight className="w-3 h-3" />
      </button>
    )}
  </div>
);

const PrimaryBtn: React.FC<{ children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }> = ({ children, onClick, disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition active:scale-95 disabled:opacity-40 cursor-pointer ${className}`}
    style={{ background: C.yellow, color: '#000' }}
  >
    {children}
  </button>
);

const SecondaryBtn: React.FC<{ children: React.ReactNode; onClick?: () => void; className?: string }> = ({ children, onClick, className = '' }) => (
  <button onClick={onClick} className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer ${className}`}
    style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.textSec }}>
    {children}
  </button>
);

const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; glowYellow?: boolean }> = ({ children, className = '', onClick, glowYellow }) => (
  <div
    onClick={onClick}
    className={`rounded-2xl overflow-hidden ${onClick ? 'cursor-pointer active:scale-[0.98] transition' : ''} ${className}`}
    style={{
      background: C.cardLight,
      border: `1px solid ${glowYellow ? C.yellowBorder : C.border}`,
      boxShadow: glowYellow ? `0 0 20px ${C.yellowDim}` : '0 4px 16px rgba(0,0,0,0.5)',
    }}
  >
    {children}
  </div>
);

// ─── COUNTDOWN TIMER ─────────────────────────────────────────────────────────
const useCountdown = (initialSeconds: number) => {
  const [secs, setSecs] = useState(initialSeconds);
  useEffect(() => {
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return { h: String(h).padStart(2, '0'), m: String(m).padStart(2, '0'), s: String(s).padStart(2, '0') };
};

const CountdownDisplay: React.FC<{ seconds: number; label?: string; large?: boolean }> = ({ seconds, label, large }) => {
  const { h, m, s } = useCountdown(seconds);
  const cls = large ? 'text-3xl' : 'text-xl';
  return (
    <div className="text-center">
      {label && <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: C.textSec }}>{label}</p>}
      <div className={`font-black font-mono ${cls} flex items-center justify-center gap-1`} style={{ color: C.yellow }}>
        <span>{h}</span><span className="opacity-60">:</span><span>{m}</span><span className="opacity-60">:</span><span>{s}</span>
      </div>
    </div>
  );
};

// ─── TOURNAMENT CARD COMPONENT (SECTION 10 SPECIFICATION) ────────────────────
const TournamentCard: React.FC<{
  t: MockTournament;
  onClick: () => void;
  horizontal?: boolean;
}> = ({ t, onClick, horizontal }) => {
  const badge = formatBadge(t.format);

  // Capacity & fill calculations based on format
  const isSolo = t.format === 'SOLO';
  const isDuo = t.format === 'DUO';
  const isSquad = t.format === 'SQUAD';
  const isBigSlot = t.format === 'BIG_SLOT';
  const isCS = t.format === 'CLASH_SQUAD';

  const currentSlots = isSolo
    ? t.currentPlayers
    : isDuo || isSquad || isBigSlot || isCS
    ? (t.currentTeams ?? (isDuo ? Math.floor(t.currentPlayers / 2) : Math.floor(t.currentPlayers / 4)))
    : t.currentPlayers;

  const maxSlots = isSolo
    ? 48
    : isDuo
    ? 24
    : isSquad || isBigSlot
    ? 12
    : 2;

  const slotUnit = isSolo ? 'Players' : 'Teams';
  const remainingSlots = Math.max(0, maxSlots - currentSlots);
  const pct = slotPct(currentSlots, maxSlots);
  const barColor = slotBarColor(pct);

  // Dynamic collection calculation
  const totalCollection = isSolo
    ? 15 * t.currentPlayers
    : isDuo
    ? 40 * (t.currentTeams || Math.floor(t.currentPlayers / 2))
    : isSquad
    ? 100 * (t.currentTeams || Math.floor(t.currentPlayers / 4))
    : isBigSlot
    ? 300 * (t.currentTeams || Math.floor(t.currentPlayers / 4))
    : t.entryFee * (t.currentTeams || 0);

  if (horizontal) {
    return (
      <div onClick={onClick} className="cursor-pointer active:scale-95 transition rounded-2xl overflow-hidden flex-shrink-0 w-64"
        style={{ background: C.cardLight, border: `1px solid ${C.border}` }}>
        <div className="relative h-28 overflow-hidden">
          <img src={t.banner} alt={t.name} className="w-full h-full object-cover brightness-50" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 20%, rgba(13,20,36,0.95))' }} />
          <div className="absolute top-2 left-2 flex gap-1.5">
            <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md"
              style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.text }}>
              {badge.label}
            </span>
            <StatusBadge status={t.status} pulse={t.status === 'LIVE'} size="xs" />
          </div>
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 text-[10px] font-black rounded-md"
              style={{ background: C.yellow, color: '#000' }}>
              ₹{t.entryFee}{isSolo ? '' : ' / Team'}
            </span>
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <p className="text-xs font-black text-white line-clamp-1 leading-tight">{t.name}</p>
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span style={{ color: C.textSec }} className="flex items-center gap-1">
              <MapPin className="w-3 h-3" style={{ color: C.yellow }} />{t.map}
            </span>
            <span className="font-bold text-white">
              {currentSlots}/{maxSlots} {slotUnit}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: C.border }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
          </div>
          <div className="flex items-center justify-between pt-1">
            {isCS ? (
              <span className="text-xs font-black" style={{ color: C.yellow }}>Winner: ₹{t.winnerPrize}</span>
            ) : (
              <span className="text-xs font-black" style={{ color: C.yellow }}>₹{t.killReward || (isBigSlot ? 20 : 10)}/Kill</span>
            )}
            <button className="px-3 py-1 rounded-lg text-[10px] font-black uppercase transition active:scale-95 cursor-pointer"
              style={{
                background: t.isRegistered ? 'rgba(34,197,94,0.2)' : t.isPaymentPending ? 'rgba(255,214,0,0.15)' : C.yellow,
                color: t.isRegistered ? '#4ADE80' : t.isPaymentPending ? '#FFD600' : '#000',
                border: t.isRegistered ? '1px solid #22C55E' : t.isPaymentPending ? '1px solid rgba(255,214,0,0.4)' : 'none'
              }}>
              {t.isRegistered ? '✓ JOINED' : t.isPaymentPending ? '⏳ PENDING' : 'JOIN'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card onClick={onClick} className="overflow-hidden">
      {/* Banner */}
      <div className="relative h-32 overflow-hidden">
        <img src={t.banner} alt={t.name} className="w-full h-full object-cover brightness-50" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 20%, rgba(13,20,36,0.98))' }} />
        
        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md tracking-wider"
            style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.text }}>
            {badge.label}
          </span>
          {isCS && t.csSlotTier && (
            <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              SLOT ₹{t.csSlotTier}
            </span>
          )}
          <StatusBadge status={t.status} pulse={t.status === 'LIVE'} size="xs" />
          <span className="px-2 py-0.5 text-[9px] font-black rounded-md flex items-center gap-1"
            style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textSec }}>
            <MapPin className="w-2.5 h-2.5 text-[#FFD600]" />{t.map}
          </span>
        </div>

        {/* Top Right Price Tag */}
        <div className="absolute top-2.5 right-2.5">
          <span className="px-2.5 py-1 text-xs font-black rounded-lg shadow-md"
            style={{ background: C.yellow, color: '#000' }}>
            ₹{t.entryFee} {isSolo ? 'Entry' : '/ Team'}
          </span>
        </div>

        {/* Title */}
        <div className="absolute bottom-2.5 left-3 right-3">
          <p className="text-sm font-black text-white leading-tight line-clamp-1">{t.name}</p>
          <p className="text-[10px] mt-0.5 text-zinc-400 line-clamp-1">{t.subtitle}</p>
        </div>
      </div>

      {/* Card Body with Exact Format Requirements */}
      <div className="p-3.5 space-y-3">
        {/* Stats Strip */}
        {isSolo && (
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div>
              <p className="text-[8px] font-bold uppercase text-zinc-400">ENTRY</p>
              <p className="text-sm font-black text-white">₹15</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase text-zinc-400">PLAYERS</p>
              <p className="text-sm font-black text-white">48 Max</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase text-zinc-400">KILL REWARD</p>
              <p className="text-sm font-black text-[#FFD600]">₹10 / Kill</p>
            </div>
          </div>
        )}

        {isDuo && (
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div>
              <p className="text-[8px] font-bold uppercase text-zinc-400">ENTRY</p>
              <p className="text-sm font-black text-white">₹40 / Team</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase text-zinc-400">TEAMS / PLAYERS</p>
              <p className="text-sm font-black text-white">24 Teams (48)</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase text-zinc-400">KILL REWARD</p>
              <p className="text-sm font-black text-[#FFD600]">₹10 / Kill</p>
            </div>
          </div>
        )}

        {isSquad && (
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div>
              <p className="text-[8px] font-bold uppercase text-zinc-400">ENTRY</p>
              <p className="text-sm font-black text-white">₹100 / Team</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase text-zinc-400">TEAMS / PLAYERS</p>
              <p className="text-sm font-black text-white">12 Teams (48)</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase text-zinc-400">KILL REWARD</p>
              <p className="text-sm font-black text-[#FFD600]">₹10 / Kill</p>
            </div>
          </div>
        )}

        {isBigSlot && (
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl text-center" style={{ background: C.card, border: '1px solid rgba(245,158,11,0.35)' }}>
            <div>
              <p className="text-[8px] font-bold uppercase text-zinc-400">ENTRY</p>
              <p className="text-sm font-black text-amber-400">₹300 / Team</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase text-zinc-400">TEAMS / PLAYERS</p>
              <p className="text-sm font-black text-white">12 Teams (48)</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase text-zinc-400">KILL REWARD</p>
              <p className="text-sm font-black text-[#FFD600]">₹20 / Kill</p>
            </div>
          </div>
        )}

        {isCS && (
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div>
              <p className="text-[8px] font-bold uppercase text-zinc-400">ENTRY</p>
              <p className="text-sm font-black text-white">₹{t.entryFee} / Team</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase text-zinc-400">MATCH TEAMS</p>
              <p className="text-sm font-black text-white">2 Teams</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase text-zinc-400">WINNER PRIZE</p>
              <p className="text-sm font-black text-[#FFD600]">₹{t.winnerPrize}</p>
            </div>
          </div>
        )}

        {/* Placement Reward Pills */}
        {!isCS && t.placementRewards && t.placementRewards.length > 0 && (
          <div className="flex items-center justify-between text-[10px] px-1 font-bold">
            <span className="text-zinc-400 flex items-center gap-1">
              🏆 Placement:
            </span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-[#FFD600] font-black">1st ₹{t.placementRewards[0]?.prize}</span>
              <span className="text-zinc-300">2nd ₹{t.placementRewards[1]?.prize}</span>
              <span className="text-zinc-400">3rd ₹{t.placementRewards[2]?.prize}</span>
            </div>
          </div>
        )}

        {/* Slot Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span style={{ color: C.textSec }} className="flex items-center gap-1 font-mono">
              <Users className="w-3 h-3" />
              {currentSlots} / {maxSlots} {slotUnit} {isDuo || isSquad || isBigSlot ? `(${currentSlots * (isDuo ? 2 : 4)} / 48 Players)` : ''}
            </span>
            <span className="font-bold" style={{ color: remainingSlots <= 3 ? C.live : C.textSec }}>
              {remainingSlots} {slotUnit.toLowerCase()} left
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: C.border }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColor }} />
          </div>
        </div>

        {/* Bottom Row: Total Dynamic Collection + Action CTA */}
        <div className="pt-2 flex items-center justify-between border-t border-zinc-800/80">
          <div>
            <p className="text-[8px] font-bold uppercase text-zinc-400">TOTAL COLLECTION</p>
            <p className="text-xs font-black text-white font-mono">₹{totalCollection.toLocaleString()}</p>
          </div>
          <div>
            {t.status === 'FULL' ? (
              <span className="px-4 py-2 rounded-xl text-xs font-black uppercase text-zinc-500 bg-zinc-800 block">
                FULL
              </span>
            ) : t.isRegistered ? (
              <span className="px-4 py-2 rounded-xl text-xs font-black uppercase text-emerald-400 bg-emerald-500/15 border border-emerald-500/40 block">
                ✓ REGISTERED
              </span>
            ) : t.isPaymentPending ? (
              <span className="px-3 py-2 rounded-xl text-xs font-black uppercase text-[#FFD600] bg-[#FFD600]/15 border border-[#FFD600]/40 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-pulse" /> PENDING
              </span>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md"
                style={{ background: C.yellow, color: '#000' }}
              >
                JOIN TOURNAMENT
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// ─── CHOOSE TOURNAMENT TEMPLATE SELECTOR (SECTION 6) ─────────────────────────
const ChooseTournamentSection: React.FC<{
  onSelectFormat: (format: TournamentFormat, csSlot?: ClashSquadSlot) => void;
}> = ({ onSelectFormat }) => {
  return (
    <div className="space-y-4 mb-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-white tracking-wider flex items-center gap-2">
            <Swords className="w-4 h-4 text-[#FFD600]" />
            CHOOSE TOURNAMENT
          </h2>
          <p className="text-[10px] text-zinc-400 font-medium">Select an official Free Fire tournament format</p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#FFD600]/15 text-[#FFD600] border border-[#FFD600]/30">
          FREE FIRE ESPORTS
        </span>
      </div>

      {/* 1. Battle Royale Category */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <span className="w-2 h-2 rounded-full bg-[#FFD600]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">Battle Royale</h3>
          <span className="text-[10px] text-zinc-400 font-mono">(48 Players Lobby)</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* SOLO */}
          <div
            onClick={() => onSelectFormat('SOLO')}
            className="p-3 rounded-2xl cursor-pointer transition active:scale-95 flex flex-col justify-between"
            style={{ background: C.cardLight, border: `1px solid ${C.yellowBorder}`, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#FFD600]/20 text-[#FFD600] border border-[#FFD600]/40">
                  SOLO
                </span>
                <span className="text-[10px] font-black text-[#FFD600]">₹15</span>
              </div>
              <p className="text-xs font-black text-white">₹15 / Player</p>
              <p className="text-[10px] text-zinc-400 font-mono">48 Players</p>
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-800">
              <p className="text-[9px] font-bold text-[#FFD600]">₹10 / Kill</p>
              <p className="text-[8px] text-zinc-400 font-mono">1st ₹20 • 2nd ₹15</p>
            </div>
          </div>

          {/* DUO */}
          <div
            onClick={() => onSelectFormat('DUO')}
            className="p-3 rounded-2xl cursor-pointer transition active:scale-95 flex flex-col justify-between"
            style={{ background: C.cardLight, border: '1px solid rgba(59,130,246,0.35)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/40">
                  DUO
                </span>
                <span className="text-[10px] font-black text-blue-400">₹40</span>
              </div>
              <p className="text-xs font-black text-white">₹40 / Team</p>
              <p className="text-[10px] text-zinc-400 font-mono">24 Teams (48)</p>
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-800">
              <p className="text-[9px] font-bold text-[#FFD600]">₹10 / Kill</p>
              <p className="text-[8px] text-zinc-400 font-mono">1st ₹50 • 2nd ₹30</p>
            </div>
          </div>

          {/* SQUAD */}
          <div
            onClick={() => onSelectFormat('SQUAD')}
            className="p-3 rounded-2xl cursor-pointer transition active:scale-95 flex flex-col justify-between"
            style={{ background: C.cardLight, border: '1px solid rgba(168,85,247,0.35)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/40">
                  SQUAD
                </span>
                <span className="text-[10px] font-black text-purple-400">₹100</span>
              </div>
              <p className="text-xs font-black text-white">₹100 / Team</p>
              <p className="text-[10px] text-zinc-400 font-mono">12 Teams (48)</p>
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-800">
              <p className="text-[9px] font-bold text-[#FFD600]">₹10 / Kill</p>
              <p className="text-[8px] text-zinc-400 font-mono">1st ₹100 • 2nd ₹50</p>
            </div>
          </div>
        </div>

        {/* BIG SLOT — BATTLE ROYALE (SQUAD ONLY) */}
        <div
          onClick={() => onSelectFormat('BIG_SLOT')}
          className="p-3.5 rounded-2xl cursor-pointer transition active:scale-[0.99] border relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(17,26,44,0.95) 100%)',
            border: '1px solid rgba(245,158,11,0.45)',
            boxShadow: '0 4px 20px rgba(245,158,11,0.12)',
          }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-500/25 text-amber-400 border border-amber-500/50">
                  BIG SLOT
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-zinc-800 text-zinc-300 border border-zinc-700">
                  SQUAD ONLY
                </span>
                <span className="text-[10px] text-amber-400/90 font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" /> HIGH STAKES
                </span>
              </div>
              <h4 className="text-sm font-black text-white">Big Slot — Battle Royale (Squad Only)</h4>
              <p className="text-[10px] text-zinc-400">12 Teams (48 Players) • Room ID & Pwd released before match</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[9px] font-black uppercase text-zinc-400">ENTRY FEE</span>
              <p className="text-base font-black text-amber-400 font-mono">₹300 <span className="text-[10px] text-zinc-400">/ Team</span></p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-zinc-800/80 text-center">
            <div className="bg-black/30 p-1.5 rounded-lg border border-zinc-800/60">
              <p className="text-[8px] font-bold uppercase text-zinc-400">KILL BOUNTY</p>
              <p className="text-xs font-black text-[#FFD600]">₹20 / Kill</p>
            </div>
            <div className="bg-black/30 p-1.5 rounded-lg border border-zinc-800/60">
              <p className="text-[8px] font-bold uppercase text-zinc-400">PLACEMENT POOL</p>
              <p className="text-[10px] font-black text-white font-mono">1st ₹600 • 2nd ₹400 • 3rd ₹200</p>
            </div>
            <div className="bg-black/30 p-1.5 rounded-lg border border-zinc-800/60">
              <p className="text-[8px] font-bold uppercase text-zinc-400">PLATFORM PROFIT</p>
              <p className="text-xs font-black text-emerald-400 font-mono">₹1,440</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Clash Squad Category — Slot Wise */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">Clash Squad</h3>
            <span className="text-[10px] text-zinc-400 font-mono">[ SLOT WISE ]</span>
          </div>
          <span className="text-[9px] text-emerald-400 font-bold">2 TEAMS SHOWDOWN</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Slot 1: ₹70 */}
          <div
            onClick={() => onSelectFormat('CLASH_SQUAD', 70)}
            className="p-3 rounded-2xl cursor-pointer transition active:scale-95 flex flex-col justify-between"
            style={{ background: C.cardLight, border: '1px solid rgba(34,197,94,0.35)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  SLOT 1
                </span>
                <span className="text-[10px] font-black text-emerald-400">₹70</span>
              </div>
              <p className="text-xs font-black text-white">₹70 / Team</p>
              <p className="text-[10px] text-zinc-400 font-mono">2 Teams</p>
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-800">
              <p className="text-[10px] font-black text-[#FFD600]">Winner ₹110</p>
              <p className="text-[8px] text-zinc-400 font-mono">Profit ₹30</p>
            </div>
          </div>

          {/* Slot 2: ₹100 */}
          <div
            onClick={() => onSelectFormat('CLASH_SQUAD', 100)}
            className="p-3 rounded-2xl cursor-pointer transition active:scale-95 flex flex-col justify-between"
            style={{ background: C.cardLight, border: '1px solid rgba(34,197,94,0.35)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  SLOT 2
                </span>
                <span className="text-[10px] font-black text-emerald-400">₹100</span>
              </div>
              <p className="text-xs font-black text-white">₹100 / Team</p>
              <p className="text-[10px] text-zinc-400 font-mono">2 Teams</p>
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-800">
              <p className="text-[10px] font-black text-[#FFD600]">Winner ₹150</p>
              <p className="text-[8px] text-zinc-400 font-mono">Profit ₹50</p>
            </div>
          </div>

          {/* Slot 3: ₹150 */}
          <div
            onClick={() => onSelectFormat('CLASH_SQUAD', 150)}
            className="p-3 rounded-2xl cursor-pointer transition active:scale-95 flex flex-col justify-between"
            style={{ background: C.cardLight, border: '1px solid rgba(34,197,94,0.35)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  SLOT 3
                </span>
                <span className="text-[10px] font-black text-emerald-400">₹150</span>
              </div>
              <p className="text-xs font-black text-white">₹150 / Team</p>
              <p className="text-[10px] text-zinc-400 font-mono">2 Teams</p>
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-800">
              <p className="text-[10px] font-black text-[#FFD600]">Winner ₹220</p>
              <p className="text-[8px] text-zinc-400 font-mono">Profit ₹80</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── HOME TAB ─────────────────────────────────────────────────────────────────
const HomeTab: React.FC<{
  player: typeof MOCK_PLAYER;
  tournaments: MockTournament[];
  onSelectTournament: (t: MockTournament) => void;
  onTabChange: (tab: string) => void;
  onFilterFormat: (format: TournamentFormat, csSlot?: ClashSquadSlot) => void;
}> = ({ player, tournaments, onSelectTournament, onTabChange, onFilterFormat }) => {
  const liveTournaments = tournaments.filter(t => t.status === 'LIVE');
  const upcomingTournaments = tournaments.filter(t => t.status === 'UPCOMING');
  const featured = liveTournaments[0] || upcomingTournaments[0];

  return (
    <div className="space-y-5 pb-24 animate-fade-in">
      {/* Featured Banner */}
      {featured && (
        <div className="rounded-2xl overflow-hidden relative cursor-pointer active:scale-[0.99] transition"
          onClick={() => onSelectTournament(featured)}
          style={{ border: `1px solid ${C.yellowBorder}`, boxShadow: `0 0 30px rgba(255,214,0,0.12)` }}>
          <div className="relative h-48 overflow-hidden">
            <img src={featured.banner} alt={featured.name} className="w-full h-full object-cover brightness-40" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 20%, rgba(8,13,24,0.95) 100%)' }} />
            
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md"
                    style={{ background: C.yellow, color: '#000' }}>
                    {featured.format}
                  </span>
                  <StatusBadge status={featured.status} pulse={featured.status === 'LIVE'} />
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black uppercase text-zinc-400">ENTRY</p>
                  <p className="text-base font-black text-[#FFD600]">₹{featured.entryFee}</p>
                </div>
              </div>

              <div>
                <p className="text-base font-black text-white leading-tight">{featured.name}</p>
                <div className="flex items-center justify-between mt-2 text-[11px] text-zinc-300">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#FFD600]" /> {featured.map}
                  </span>
                  {featured.format === 'CLASH_SQUAD' ? (
                    <span className="text-[#FFD600] font-black">Winner: ₹{featured.winnerPrize}</span>
                  ) : (
                    <span className="text-[#FFD600] font-black">₹10 / Kill</span>
                  )}
                  <span>{featured.startTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHOOSE TOURNAMENT SECTION ON HOME */}
      <ChooseTournamentSection
        onSelectFormat={(fmt, slot) => {
          onFilterFormat(fmt, slot);
          onTabChange('TOURNAMENTS');
        }}
      />

      {/* Live Matches */}
      {liveTournaments.length > 0 && (
        <div>
          <SectionHeader title="Live Free Fire Tournaments" action="VIEW ALL" onAction={() => onTabChange('TOURNAMENTS')} />
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none -mx-0.5 px-0.5">
            {liveTournaments.map(t => (
              <TournamentCard key={t.id} t={t} onClick={() => onSelectTournament(t)} horizontal />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Matches */}
      <div>
        <SectionHeader title="Upcoming Matches" action="VIEW ALL" onAction={() => onTabChange('TOURNAMENTS')} />
        <div className="space-y-3">
          {upcomingTournaments.slice(0, 3).map(t => (
            <TournamentCard key={t.id} t={t} onClick={() => onSelectTournament(t)} />
          ))}
        </div>
      </div>

      {/* Esports Player Card */}
      <Card>
        <div className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ border: `2px solid ${C.yellow}` }}>
            <img src={player.avatarUrl} alt="Me" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-black text-white">{player.name}</p>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: C.yellowDim, color: C.yellow, border: `1px solid ${C.yellowBorder}` }}>{player.tier}</span>
            </div>
            <p className="text-[11px] mt-0.5 text-zinc-400">UID: {player.uid} • {player.kills} kills</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-black text-white">#{player.rank}</p>
            <p className="text-[10px] font-bold flex items-center justify-end gap-0.5 text-emerald-400">
              <TrendingUp className="w-3 h-3" />↑{player.rankChange}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ─── TOURNAMENTS TAB (CHOOSE TOURNAMENT & LISTING) ───────────────────────────
const TournamentsTab: React.FC<{
  tournaments: MockTournament[];
  onSelectTournament: (t: MockTournament) => void;
  activeFormatFilter: string;
  setActiveFormatFilter: (f: string) => void;
}> = ({ tournaments, onSelectTournament, activeFormatFilter, setActiveFormatFilter }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'LIVE' | 'COMPLETED'>('ALL');

  const filters = ['ALL', 'SOLO', 'DUO', 'SQUAD', 'BIG_SLOT', 'CLASH_SQUAD'];

  const filtered = tournaments.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.map.toLowerCase().includes(q) || t.format.toLowerCase().includes(q);
    const matchFormat = activeFormatFilter === 'ALL' || t.format === activeFormatFilter;
    const matchStatus = statusFilter === 'ALL' || (statusFilter === 'OPEN' && t.status === 'UPCOMING') || (statusFilter === 'LIVE' && t.status === 'LIVE') || (statusFilter === 'COMPLETED' && t.status === 'COMPLETED');
    return matchSearch && matchFormat && matchStatus;
  });

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* 1. CHOOSE TOURNAMENT SCREEN AT TOP */}
      <ChooseTournamentSection
        onSelectFormat={(format) => {
          setActiveFormatFilter(format);
        }}
      />

      {/* 2. Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500" />
        <input
          type="text"
          placeholder="Search Free Fire tournaments or maps..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none transition"
          style={{ background: C.cardLight, border: `1px solid ${search ? C.yellow : C.border}`, color: '#fff' }}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. Format Filter Chips (Only Supported Formats) */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none -mx-0.5 px-0.5">
        {filters.map(f => {
          const isSel = activeFormatFilter === f;
          return (
            <button key={f} onClick={() => setActiveFormatFilter(f)}
              className="px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap uppercase tracking-wider transition active:scale-95 flex-shrink-0 cursor-pointer"
              style={{
                background: isSel ? C.yellow : C.cardLight,
                color: isSel ? '#000' : C.textSec,
                border: `1px solid ${isSel ? C.yellow : C.border}`,
              }}>
              {f === 'CLASH_SQUAD' ? '⚔️ CLASH SQUAD' : f === 'SOLO' ? '🤺 SOLO' : f === 'DUO' ? '👥 DUO' : f === 'SQUAD' ? '🛡️ SQUAD' : f === 'BIG_SLOT' ? '👑 BIG SLOT' : '⚡ ALL'}
            </button>
          );
        })}
      </div>

      {/* 4. Status Sub-tabs & Counts */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex gap-3 text-xs font-bold">
          {(['ALL', 'OPEN', 'LIVE', 'COMPLETED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`transition cursor-pointer ${statusFilter === st ? 'text-[#FFD600] font-black border-b-2 border-[#FFD600] pb-1' : 'text-zinc-500'}`}
            >
              {st}
            </button>
          ))}
        </div>
        <p className="text-[10px] font-mono text-zinc-400">{filtered.length} matches found</p>
      </div>

      {/* 5. Tournament Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-[#0D1424] rounded-2xl border border-zinc-800 p-6">
            <Trophy className="w-10 h-10 mx-auto opacity-20 text-[#FFD600]" />
            <p className="font-bold text-white text-sm">No tournaments matching filters</p>
            <p className="text-xs text-zinc-400">Check back later or browse all formats</p>
            <button
              onClick={() => { setActiveFormatFilter('ALL'); setStatusFilter('ALL'); setSearch(''); }}
              className="px-4 py-2 rounded-xl text-xs font-black bg-[#FFD600] text-black uppercase"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filtered.map(t => (
            <TournamentCard key={t.id} t={t} onClick={() => onSelectTournament(t)} />
          ))
        )}
      </div>
    </div>
  );
};

// ─── TOURNAMENT DETAILS MODAL (SECTION 11) ───────────────────────────────────
const TournamentDetailModal: React.FC<{
  t: MockTournament;
  onClose: () => void;
  player: typeof MOCK_PLAYER;
  onConfirmRegistration: (tId: string, reg: Partial<TournamentRegistrationItem>) => void;
  onOpenPaymentModal: (
    t: MockTournament,
    reg: { playerName: string; playerUid: string; teamName?: string; teammates?: Array<{ name: string; uid: string }> }
  ) => void;
  isRegistered?: boolean;
  isPaymentPending?: boolean;
  isAuthenticated?: boolean;
  showToast?: (m: string) => void;
}> = ({
  t,
  onClose,
  player,
  onConfirmRegistration,
  onOpenPaymentModal,
  isRegistered,
  isPaymentPending,
  isAuthenticated = true,
  showToast,
}) => {
  const [showRegisterSheet, setShowRegisterSheet] = useState(false);
  const [ign, setIgn] = useState(player.name);
  const [uid, setUid] = useState(player.uid);
  const [teamName, setTeamName] = useState('Arena Legends');
  const [teammate1, setTeammate1] = useState({ name: 'VortexSniper', uid: '8102910291' });
  const [teammate2, setTeammate2] = useState({ name: 'VortexRusher', uid: '8102910292' });
  const [teammate3, setTeammate3] = useState({ name: 'VortexCover', uid: '8102910293' });
  const [agreed, setAgreed] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntryDocument[]>([]);

  useEffect(() => {
    if (!t.id) return;
    const unsub = subscribeTournamentLeaderboard(t.id, (entries) => {
      setLeaderboardEntries(entries);
    });
    return () => unsub();
  }, [t.id]);

  const badge = formatBadge(t.format);
  const isSolo = t.format === 'SOLO';
  const isDuo = t.format === 'DUO';
  const isSquad = t.format === 'SQUAD';
  const isBigSlot = t.format === 'BIG_SLOT';
  const isCS = t.format === 'CLASH_SQUAD';

  const currentSlots = isSolo
    ? t.currentPlayers
    : isDuo || isSquad || isBigSlot || isCS
    ? (t.currentTeams ?? (isDuo ? Math.floor(t.currentPlayers / 2) : Math.floor(t.currentPlayers / 4)))
    : t.currentPlayers;

  const maxSlots = isSolo ? 48 : isDuo ? 24 : (isSquad || isBigSlot) ? 12 : 2;
  const slotUnit = isSolo ? 'Players' : 'Teams';
  const remainingSlots = Math.max(0, maxSlots - currentSlots);
  const pct = slotPct(currentSlots, maxSlots);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRegisterSubmit = () => {
    if (!agreed) return;
    const teammatesList = isDuo
      ? [teammate1]
      : (isSquad || isBigSlot || isCS)
      ? [teammate1, teammate2, teammate3]
      : undefined;

    setShowRegisterSheet(false);
    onOpenPaymentModal(t, {
      playerName: ign.trim() || player.name,
      playerUid: uid.trim() || player.uid,
      teamName: isSolo ? undefined : teamName.trim() || 'Arena Team',
      teammates: teammatesList,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: C.bg }}>
      {/* Top Header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: C.navy, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
          style={{ background: C.cardLight, border: `1px solid ${C.border}` }}>
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-[#FFD600]">TOURNAMENT DETAILS</p>
          <p className="font-black text-white text-sm truncate">{t.name}</p>
        </div>
        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase"
          style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.text }}>
          {badge.label}
        </span>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-4">
        {/* Banner */}
        <div className="relative h-40 rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          <img src={t.banner} alt={t.name} className="w-full h-full object-cover brightness-50" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(8,13,24,0.98) 100%)' }} />
          <div className="absolute top-3 left-3 flex gap-2">
            <StatusBadge status={t.status} pulse={t.status === 'LIVE'} />
            <span className="px-2 py-0.5 rounded text-[9px] font-black bg-black/60 text-white border border-zinc-700">
              {t.map}
            </span>
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <h1 className="text-lg font-black text-white leading-tight">{t.name}</h1>
            <p className="text-xs text-zinc-300 mt-0.5">{t.subtitle}</p>
          </div>
        </div>

        {/* Quick Specs Grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'ENTRY FEE', value: `₹${t.entryFee}` },
            { label: 'CAPACITY', value: `${maxSlots} ${slotUnit}` },
            { label: 'MAP', value: t.map },
            { label: isCS ? 'WINNER' : 'KILL BOUNTY', value: isCS ? `₹${t.winnerPrize}` : `₹${t.killReward}` },
          ].map(({ label, value }) => (
            <div key={label} className="p-2.5 rounded-xl text-center" style={{ background: C.cardLight, border: `1px solid ${C.border}` }}>
              <p className="text-sm font-black text-white leading-tight">{value}</p>
              <p className="text-[8px] font-bold uppercase mt-1 text-zinc-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Live Slot Registration Counter (Section 11) */}
        <div className="p-4 rounded-2xl space-y-2.5" style={{ background: C.cardLight, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase text-zinc-400">REGISTRATION STATUS</p>
            <p className="text-xs font-bold" style={{ color: remainingSlots <= 2 ? C.live : C.textSec }}>
              {remainingSlots} {slotUnit.toLowerCase()} remaining
            </p>
          </div>
          <div className="flex items-center justify-between text-base font-black">
            <span className="text-white font-mono">
              {currentSlots} / {maxSlots} {slotUnit} Registered
            </span>
            <span style={{ color: C.yellow }}>{pct}%</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: C.border }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: slotBarColor(pct) }} />
          </div>
        </div>

        {/* Room Information Status */}
        <div className="p-4 rounded-2xl space-y-2" style={{ background: C.cardLight, border: `1px solid ${t.isRoomUnlocked || t.isRegistered ? C.yellowBorder : C.border}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {t.isRoomUnlocked || t.isRegistered ? (
                <Unlock className="w-4 h-4 text-[#FFD600]" />
              ) : (
                <Lock className="w-4 h-4 text-zinc-500" />
              )}
              <h4 className="text-xs font-black uppercase tracking-wider text-white">CUSTOM ROOM CREDENTIALS</h4>
            </div>
            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${t.isRoomUnlocked || t.isRegistered ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
              {t.isRoomUnlocked || t.isRegistered ? 'CREDENTIALS UNLOCKED' : 'LOCKED'}
            </span>
          </div>

          {t.isRoomUnlocked || t.isRegistered ? (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase">ROOM ID</p>
                  <p className="text-sm font-black font-mono text-[#FFD600]">{t.roomId || '8492019'}</p>
                </div>
                <button onClick={() => handleCopy(t.roomId || '8492019', 'rid')} className="p-1.5 rounded bg-zinc-800 text-zinc-300">
                  {copiedKey === 'rid' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-bold text-zinc-400 uppercase">ROOM PASSWORD</p>
                  <p className="text-sm font-black font-mono text-[#FFD600]">{t.roomPassword || 'FF80'}</p>
                </div>
                <button onClick={() => handleCopy(t.roomPassword || 'FF80', 'rpwd')} className="p-1.5 rounded bg-zinc-800 text-zinc-300">
                  {copiedKey === 'rpwd' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
              Room ID and Password are released only to registered participants before the match begins.
            </p>
          )}
        </div>

        {/* Prize Breakdown (Section 11) */}
        <div className="p-4 rounded-2xl space-y-3" style={{ background: C.cardLight, border: `1px solid ${C.border}` }}>
          <h4 className="text-xs font-black uppercase tracking-wider text-white">PRIZE DISTRIBUTION</h4>
          
          {isCS ? (
            <div className="p-3.5 rounded-xl flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30">
              <div>
                <p className="text-xs font-black text-white">WINNER PRIZE</p>
                <p className="text-[10px] text-zinc-400">Winner takes all in 2-teams showdown</p>
              </div>
              <p className="text-xl font-black text-[#FFD600]">₹{t.winnerPrize}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {t.placementRewards.map((pr, idx) => (
                  <div key={pr.rank} className="p-2.5 rounded-xl text-center bg-black/40 border border-zinc-800">
                    <span className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                    <p className="text-sm font-black text-[#FFD600]">₹{pr.prize}</p>
                    <p className="text-[9px] text-zinc-400 font-bold">{pr.rank}</p>
                  </div>
                ))}
              </div>
              <div className="p-2.5 rounded-xl flex items-center justify-between bg-zinc-900 border border-zinc-800 text-xs">
                <span className="text-zinc-300 flex items-center gap-1.5 font-bold">
                  💀 Kill Bounty Reward:
                </span>
                <span className="font-black text-[#FFD600]">₹{t.killReward || (isBigSlot ? 20 : 10)} / Kill</span>
              </div>
            </div>
          )}
        </div>

        {/* Official Verified Leaderboard */}
        <div className="p-4 rounded-2xl space-y-3" style={{ background: C.cardLight, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#FFD600]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">OFFICIAL LEADERBOARD</h4>
            </div>
            <span className="text-[9px] font-mono text-[#FFD600] bg-[#FFD600]/10 px-2 py-0.5 rounded border border-[#FFD600]/25">
              VERIFIED SCORES ONLY
            </span>
          </div>

          {leaderboardEntries.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800 text-center space-y-1">
              <p className="text-xs text-zinc-400 font-bold">No verified results published yet</p>
              <p className="text-[10px] text-zinc-500">
                Official standings calculate in real-time as admins review and approve match proofs.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {leaderboardEntries.map((entry, idx) => (
                <div
                  key={entry.userId}
                  className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      idx === 0
                        ? 'bg-[#FFD600] text-black'
                        : idx === 1
                        ? 'bg-zinc-300 text-black'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-black text-white text-xs truncate">{entry.playerName}</p>
                      <p className="text-[9px] text-zinc-400">
                        {entry.matchesPlayed} Matches • {entry.totalKills} Kills • Best: #{entry.bestPlacement}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black font-mono text-[#FFD600] text-sm">{entry.totalPoints} PTS</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule & Rules */}
        <div className="p-4 rounded-2xl space-y-2.5" style={{ background: C.cardLight, border: `1px solid ${C.border}` }}>

          <h4 className="text-xs font-black uppercase tracking-wider text-white">MATCH TIMINGS</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800">
              <p className="text-[8px] font-bold text-zinc-400 uppercase">START TIME</p>
              <p className="font-black text-white mt-0.5">{t.startDate} • {t.startTime}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800">
              <p className="text-[8px] font-bold text-zinc-400 uppercase">CLOSING TIME</p>
              <p className="font-black text-[#FFD600] mt-0.5">{t.registrationClosingTime}</p>
            </div>
          </div>
        </div>

        {/* Official Rules */}
        <div className="p-4 rounded-2xl space-y-2" style={{ background: C.cardLight, border: `1px solid ${C.border}` }}>
          <h4 className="text-xs font-black uppercase tracking-wider text-white">FREE FIRE TOURNAMENT RULES</h4>
          <ul className="space-y-1.5 text-[11px] text-zinc-400">
            {TOURNAMENT_RULES.slice(0, 4).map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[#FFD600] font-black">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="p-4 flex-shrink-0" style={{ background: C.navy, borderTop: `1px solid ${C.border}` }}>
        {(isPaymentPending || t.isPaymentPending) ? (
          <button disabled className="w-full py-3.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 bg-[#FFD600]/15 text-[#FFD600] border border-[#FFD600]/40">
            <Clock className="w-4 h-4 animate-pulse" /> PAYMENT SUBMITTED • AWAITING ADMIN VERIFICATION
          </button>
        ) : (isRegistered || t.isRegistered) ? (
          <button disabled className="w-full py-3.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle className="w-4 h-4" /> YOU ARE REGISTERED FOR THIS MATCH
          </button>
        ) : t.status === 'FULL' || remainingSlots <= 0 ? (
          <button disabled className="w-full py-3.5 rounded-xl font-black text-xs uppercase bg-zinc-800 text-zinc-500">
            SLOTS FULL
          </button>
        ) : (
          <PrimaryBtn onClick={() => {
            if (!isAuthenticated) {
              showToast?.('Please sign in or continue as guest to join tournaments.');
              return;
            }
            if ((t.status as string) === 'COMPLETED' || (t.status as string) === 'CANCELLED') {
              showToast?.('This tournament is not active.');
              return;
            }
            if (t.status === 'FULL' || remainingSlots <= 0) {
              showToast?.('Tournament slots are full.');
              return;
            }
            if (isRegistered || t.isRegistered) {
              showToast?.('You are already registered for this tournament.');
              return;
            }
            if (isPaymentPending || t.isPaymentPending) {
              showToast?.('You already submitted payment proof. Awaiting admin verification.');
              return;
            }
            setShowRegisterSheet(true);
          }}>
            JOIN TOURNAMENT • ₹{t.entryFee}
          </PrimaryBtn>
        )}
      </div>

      {/* REGISTRATION BOTTOM SHEET (SECTION 9 LOGIC) */}
      {showRegisterSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm">
          <div className="rounded-t-3xl p-5 space-y-4 animate-slide-in-up max-h-[85vh] overflow-y-auto" style={{ background: C.navy, border: `1px solid ${C.border}` }}>
            <div className="w-12 h-1 rounded-full bg-zinc-700 mx-auto" />
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-white text-base">TOURNAMENT REGISTRATION</h3>
                <p className="text-xs text-zinc-400">{t.name} ({t.format})</p>
              </div>
              <button onClick={() => setShowRegisterSheet(false)} className="p-1 rounded-lg bg-zinc-800 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inputs based on format */}
            <div className="space-y-3">
              {/* Solo registration */}
              {isSolo && (
                <>
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">IN-GAME NAME (IGN)</label>
                    <input
                      type="text"
                      value={ign}
                      onChange={e => setIgn(e.target.value)}
                      placeholder="Enter Free Fire IGN"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#0D1424] border border-zinc-700 text-white focus:outline-none focus:border-[#FFD600]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">FREE FIRE UID (10 DIGITS)</label>
                    <input
                      type="text"
                      value={uid}
                      onChange={e => setUid(e.target.value)}
                      placeholder="e.g. 8271849201"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#0D1424] border border-zinc-700 text-white focus:outline-none focus:border-[#FFD600]"
                    />
                  </div>
                </>
              )}

              {/* Duo Registration */}
              {isDuo && (
                <>
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">TEAM NAME</label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                      placeholder="Enter Duo Team Name"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#0D1424] border border-zinc-700 text-white focus:outline-none focus:border-[#FFD600]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 block mb-1">CAPTAIN IGN</label>
                      <input type="text" value={ign} onChange={e => setIgn(e.target.value)} className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#0D1424] border border-zinc-700 text-white" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 block mb-1">CAPTAIN UID</label>
                      <input type="text" value={uid} onChange={e => setUid(e.target.value)} className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#0D1424] border border-zinc-700 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 block mb-1">PLAYER 2 IGN</label>
                      <input type="text" value={teammate1.name} onChange={e => setTeammate1({ ...teammate1, name: e.target.value })} className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#0D1424] border border-zinc-700 text-white" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 block mb-1">PLAYER 2 UID</label>
                      <input type="text" value={teammate1.uid} onChange={e => setTeammate1({ ...teammate1, uid: e.target.value })} className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#0D1424] border border-zinc-700 text-white" />
                    </div>
                  </div>
                </>
              )}

              {/* Squad, Big Slot & Clash Squad Registration */}
              {(isSquad || isBigSlot || isCS) && (
                <>
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">SQUAD / TEAM NAME</label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                      placeholder="Enter Squad Name"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#0D1424] border border-zinc-700 text-white focus:outline-none focus:border-[#FFD600]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 block mb-1">CAPTAIN IGN</label>
                      <input type="text" value={ign} onChange={e => setIgn(e.target.value)} className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#0D1424] border border-zinc-700 text-white" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 block mb-1">CAPTAIN UID</label>
                      <input type="text" value={uid} onChange={e => setUid(e.target.value)} className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#0D1424] border border-zinc-700 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 block mb-1">PLAYER 2 IGN</label>
                      <input type="text" value={teammate1.name} onChange={e => setTeammate1({ ...teammate1, name: e.target.value })} className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#0D1424] border border-zinc-700 text-white" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 block mb-1">PLAYER 2 UID</label>
                      <input type="text" value={teammate1.uid} onChange={e => setTeammate1({ ...teammate1, uid: e.target.value })} className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#0D1424] border border-zinc-700 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 block mb-1">PLAYER 3 IGN</label>
                      <input type="text" value={teammate2.name} onChange={e => setTeammate2({ ...teammate2, name: e.target.value })} className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#0D1424] border border-zinc-700 text-white" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 block mb-1">PLAYER 3 UID</label>
                      <input type="text" value={teammate2.uid} onChange={e => setTeammate2({ ...teammate2, uid: e.target.value })} className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#0D1424] border border-zinc-700 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 block mb-1">PLAYER 4 IGN</label>
                      <input type="text" value={teammate3.name} onChange={e => setTeammate3({ ...teammate3, name: e.target.value })} className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#0D1424] border border-zinc-700 text-white" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-zinc-400 block mb-1">PLAYER 4 UID</label>
                      <input type="text" value={teammate3.uid} onChange={e => setTeammate3({ ...teammate3, uid: e.target.value })} className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#0D1424] border border-zinc-700 text-white" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Direct UPI Payment Overview */}
            <div className="p-3.5 rounded-xl space-y-2 bg-[#0D1424] border border-zinc-800 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Tournament Format:</span>
                <span className="font-bold text-white">{t.name} ({t.format})</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Entry Fee ({isSolo ? '1 Player' : '1 Team'}):</span>
                <span className="font-black text-[#FFD600] font-mono text-sm">₹{t.entryFee}.00</span>
              </div>
              <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-400 leading-relaxed">
                ⚡ <strong>0% Fee Real UPI Transfer</strong>: In the next step, you will view the official UPI QR code & UPI ID from Firebase, submit your 12-digit UTR and payment screenshot.
              </div>
            </div>

            {/* Agreement checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 rounded text-[#FFD600] focus:ring-0"
              />
              <span className="text-[11px] text-zinc-400 leading-tight">
                I confirm that all player Free Fire UIDs are accurate. I agree to fair-play & anti-cheat rules.
              </span>
            </label>

            {/* Submit */}
            <PrimaryBtn
              disabled={!agreed}
              onClick={handleRegisterSubmit}
            >
              PROCEED TO UPI PAYMENT • ₹{t.entryFee} →
            </PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── ADMIN TOURNAMENT DASHBOARD (SECTION 12, 13, 14) ──────────────────────────
const AdminDashboard: React.FC<{
  tournaments: MockTournament[];
  setTournaments: React.Dispatch<React.SetStateAction<MockTournament[]>>;
  onClose: () => void;
  showToast: (m: string) => void;
  adminUid?: string;
}> = ({ tournaments, setTournaments, onClose, showToast, adminUid }) => {
  const { user: authUser, firebaseUser } = useAuth();
  const effectiveAdminUid = adminUid || authUser?.uid || firebaseUser?.uid || 'admin-master';

  const [adminView, setAdminView] = useState<'PAYMENT_VERIFICATION' | 'MATCH_RESULTS' | 'TOURNAMENTS'>('PAYMENT_VERIFICATION');
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [pendingResultsCount, setPendingResultsCount] = useState(0);

  useEffect(() => {
    const unsubPay = subscribeAllPayments((allList) => {
      setPendingPaymentsCount(allList.filter((p) => p.status === 'PENDING').length);
    }, 'ALL');
    const unsubRes = subscribeAllMatchResults((allList) => {
      setPendingResultsCount(allList.filter((r) => r.status === 'PENDING').length);
    }, 'ALL');
    return () => {
      unsubPay();
      unsubRes();
    };
  }, []);

  const [tab, setTab] = useState<'ALL' | 'UPCOMING' | 'LIVE' | 'COMPLETED'>('ALL');
  const [formatFilter, setFormatFilter] = useState<'ALL' | 'SOLO' | 'DUO' | 'SQUAD' | 'BIG_SLOT' | 'CLASH_SQUAD'>('ALL');
  
  // Modals inside Admin
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState<MockTournament | null>(null);
  const [viewingRegistrationsTourney, setViewingRegistrationsTourney] = useState<MockTournament | null>(null);
  const [managingRoomTourney, setManagingRoomTourney] = useState<MockTournament | null>(null);
  const [publishingResultsTourney, setPublishingResultsTourney] = useState<MockTournament | null>(null);

  // Room modal form state
  const [roomModalId, setRoomModalId] = useState('');
  const [roomModalPwd, setRoomModalPwd] = useState('');

  // Results form state for BR
  const [resPlayerName, setResPlayerName] = useState('');
  const [resUid, setResUid] = useState('');
  const [resPosition, setResPosition] = useState(1);
  const [resKills, setResKills] = useState(6);

  // Results form state for CS
  const [csWinningTeam, setCsWinningTeam] = useState('Team Alpha');
  const [csLosingTeam, setCsLosingTeam] = useState('Team Omega');

  // Create tournament form state (STRICTLY PREDEFINED FORMATS ONLY)
  const [newFormat, setNewFormat] = useState<TournamentFormat>('SOLO');
  const [newCsSlot, setNewCsSlot] = useState<ClashSquadSlot>(70);
  const [newMap, setNewMap] = useState<FreeFireMap>('Bermuda');
  const [newDate, setNewDate] = useState('Today');
  const [newTime, setNewTime] = useState('9:30 PM');
  const [newClosingTime, setNewClosingTime] = useState('9:15 PM');
  const [newRoomId, setNewRoomId] = useState('');
  const [newRoomPwd, setNewRoomPwd] = useState('');

  // Dynamic Financial Calculations across tournaments
  const financialTotals = tournaments.reduce((acc, tourney) => {
    let coll = 0;
    let prize = 0;

    if (tourney.format === 'SOLO') {
      const f = calculateSoloFinances(tourney.currentPlayers, tourney.totalKillsRecorded || 0);
      coll = f.collection;
      prize = f.totalPayout;
    } else if (tourney.format === 'DUO') {
      const f = calculateDuoFinances(tourney.currentTeams || Math.floor(tourney.currentPlayers / 2), tourney.totalKillsRecorded || 0);
      coll = f.collection;
      prize = f.totalPayout;
    } else if (tourney.format === 'SQUAD') {
      const f = calculateSquadFinances(tourney.currentTeams || Math.floor(tourney.currentPlayers / 4), tourney.totalKillsRecorded || 0);
      coll = f.collection;
      prize = f.totalPayout;
    } else if (tourney.format === 'BIG_SLOT') {
      const f = calculateBigSlotFinances(tourney.currentTeams || Math.floor(tourney.currentPlayers / 4), tourney.totalKillsRecorded || 0);
      coll = f.collection;
      prize = f.totalPayout;
    } else if (tourney.format === 'CLASH_SQUAD') {
      const f = calculateClashSquadFinances(tourney.csSlotTier || 70, tourney.currentTeams || 0);
      coll = f.collection;
      prize = f.winnerPrize;
    }

    acc.totalCollection += coll;
    acc.totalPrizePayout += prize;
    acc.totalProfit += (coll - prize);
    return acc;
  }, { totalCollection: 0, totalPrizePayout: 0, totalProfit: 0 });

  // Filter tournaments
  const filtered = tournaments.filter(t => {
    const matchTab = tab === 'ALL' || (tab === 'UPCOMING' && t.status === 'UPCOMING') || (tab === 'LIVE' && t.status === 'LIVE') || (tab === 'COMPLETED' && t.status === 'COMPLETED');
    const matchFormat = formatFilter === 'ALL' || t.format === formatFilter;
    return matchTab && matchFormat;
  });

  // Action handlers
  const handleStartTournament = (id: string) => {
    setTournaments(prev => prev.map(t => t.id === id ? { ...t, status: 'LIVE' } : t));
    showToast('Match marked as LIVE!');
  };

  const handleCompleteTournament = (id: string) => {
    setTournaments(prev => prev.map(t => t.id === id ? { ...t, status: 'COMPLETED' } : t));
    showToast('Tournament marked as COMPLETED!');
  };

  const handleSaveRoom = (tId: string) => {
    setTournaments(prev => prev.map(t => t.id === tId ? {
      ...t,
      roomId: roomModalId.trim(),
      roomPassword: roomModalPwd.trim(),
      isRoomUnlocked: true,
    } : t));
    setManagingRoomTourney(null);
    showToast('Room details updated & released to participants!');
  };

  const handlePublishResults = (tourney: MockTournament) => {
    if (tourney.format === 'CLASH_SQUAD') {
      const winnerPrize = tourney.winnerPrize || 110;
      const resItem: TournamentResultItem = {
        id: `res-${Date.now()}`,
        position: 1,
        teamName: csWinningTeam,
        kills: 0,
        prizeAmount: winnerPrize,
        isWinner: true,
        status: 'VERIFIED',
      };
      setTournaments(prev => prev.map(t => t.id === tourney.id ? {
        ...t,
        status: 'COMPLETED',
        resultsList: [resItem, {
          id: `res-${Date.now()}-2`,
          position: 2,
          teamName: csLosingTeam,
          kills: 0,
          prizeAmount: 0,
          isWinner: false,
          status: 'VERIFIED',
        }],
      } : t));
      showToast(`Published Clash Squad Winner: ${csWinningTeam} (₹${winnerPrize})`);
    } else {
      // Battle Royale
      let placementPrize = 0;
      if (resPosition === 1) placementPrize = tourney.placementRewards[0]?.prize || (tourney.format === 'BIG_SLOT' ? 600 : 20);
      else if (resPosition === 2) placementPrize = tourney.placementRewards[1]?.prize || (tourney.format === 'BIG_SLOT' ? 400 : 15);
      else if (resPosition === 3) placementPrize = tourney.placementRewards[2]?.prize || (tourney.format === 'BIG_SLOT' ? 200 : 10);

      const killRewardRate = tourney.killReward || (tourney.format === 'BIG_SLOT' ? 20 : 10);
      const totalPrize = placementPrize + (resKills * killRewardRate);
      const resItem: TournamentResultItem = {
        id: `res-${Date.now()}`,
        position: resPosition,
        playerName: resPlayerName.trim() || 'WinnerPlayer',
        gameUid: resUid.trim() || '8291029102',
        kills: resKills,
        prizeAmount: totalPrize,
        isWinner: resPosition === 1,
        status: 'VERIFIED',
      };

      setTournaments(prev => prev.map(t => t.id === tourney.id ? {
        ...t,
        status: 'COMPLETED',
        resultsList: [resItem, ...(t.resultsList || [])],
        totalKillsRecorded: (t.totalKillsRecorded || 0) + resKills,
      } : t));
      showToast(`Results published! Prize: ₹${totalPrize}`);
    }
    setPublishingResultsTourney(null);
  };

  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    let name = '';
    let subtitle = '';
    let entryFee = 15;
    let maxPlayers = 48;
    let maxTeams = 48;
    let killReward = 10;
    let placementRewards: { rank: string; prize: number }[] = [];
    let winnerPrize: number | undefined = undefined;

    if (newFormat === 'SOLO') {
      name = `FF Battle Royale Solo — ${newMap}`;
      subtitle = '48 Players • ₹10/Kill Bounty';
      entryFee = 15;
      maxPlayers = 48;
      killReward = 10;
      placementRewards = [
        { rank: '1st Place', prize: 20 },
        { rank: '2nd Place', prize: 15 },
        { rank: '3rd Place', prize: 10 },
      ];
    } else if (newFormat === 'DUO') {
      name = `FF Battle Royale Duo — ${newMap}`;
      subtitle = '24 Teams (48 Players) • ₹10/Kill Bounty';
      entryFee = 40;
      maxPlayers = 48;
      maxTeams = 24;
      killReward = 10;
      placementRewards = [
        { rank: '1st Place', prize: 50 },
        { rank: '2nd Place', prize: 30 },
        { rank: '3rd Place', prize: 15 },
      ];
    } else if (newFormat === 'SQUAD') {
      name = `FF Battle Royale Squad — ${newMap}`;
      subtitle = '12 Squads (48 Players) • ₹10/Kill Bounty';
      entryFee = 100;
      maxPlayers = 48;
      maxTeams = 12;
      killReward = 10;
      placementRewards = [
        { rank: '1st Place', prize: 100 },
        { rank: '2nd Place', prize: 50 },
        { rank: '3rd Place', prize: 36 },
      ];
    } else if (newFormat === 'BIG_SLOT') {
      name = `Big Slot — ${newMap}`;
      subtitle = 'Battle Royale (Squad Only) • 12 Teams • ₹20/Kill';
      entryFee = 300;
      maxPlayers = 48;
      maxTeams = 12;
      killReward = 20;
      placementRewards = [
        { rank: '1st Place', prize: 600 },
        { rank: '2nd Place', prize: 400 },
        { rank: '3rd Place', prize: 200 },
      ];
    } else if (newFormat === 'CLASH_SQUAD') {
      entryFee = newCsSlot;
      winnerPrize = newCsSlot === 70 ? 110 : newCsSlot === 100 ? 150 : 220;
      name = `Clash Squad — Slot ${newCsSlot === 70 ? '1' : newCsSlot === 100 ? '2' : '3'} (₹${newCsSlot})`;
      subtitle = `2 Teams Showdown • Winner ₹${winnerPrize}`;
      maxPlayers = 8;
      maxTeams = 2;
      killReward = 0;
      placementRewards = [];
    }

    const created: MockTournament = {
      id: `tourney-${Date.now()}`,
      name,
      subtitle,
      category: newFormat === 'CLASH_SQUAD' ? 'Clash Squad' : 'Battle Royale',
      format: newFormat,
      csSlotTier: newFormat === 'CLASH_SQUAD' ? newCsSlot : undefined,
      mode: newFormat === 'SOLO' ? 'Solo' : newFormat === 'DUO' ? 'Duo' : (newFormat === 'SQUAD' || newFormat === 'BIG_SLOT') ? 'Squad' : 'Clash Squad',
      status: 'UPCOMING',
      map: newMap,
      entryFee,
      maxPlayers,
      currentPlayers: 0,
      maxTeams: newFormat !== 'SOLO' ? maxTeams : undefined,
      currentTeams: 0,
      killReward,
      placementRewards,
      winnerPrize,
      prizePool: winnerPrize || (placementRewards[0]?.prize || 45),
      startDate: newDate,
      startTime: newTime,
      registrationClosingTime: newClosingTime,
      banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      roomId: newRoomId.trim() || undefined,
      roomPassword: newRoomPwd.trim() || undefined,
      isRoomUnlocked: Boolean(newRoomId.trim()),
      registrationsList: [],
      resultsList: [],
    };

    setTournaments(prev => [created, ...prev]);
    setShowCreateModal(false);
    showToast(`Published official Free Fire ${newFormat} tournament!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: C.bg }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: C.navy, borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ background: C.cardLight, border: `1px solid ${C.border}` }}>
            <X className="w-4 h-4 text-white" />
          </button>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#FFD600]">ADMIN GOVERNANCE</p>
            <p className="font-black text-white text-sm">
              {adminView === 'PAYMENT_VERIFICATION' ? 'Payment Verification & Approval' : 'Tournament Management'}
            </p>
          </div>
        </div>

        {adminView === 'TOURNAMENTS' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            style={{ background: C.yellow, color: '#000' }}
          >
            <Plus className="w-3.5 h-3.5" /> CREATE TOURNAMENT
          </button>
        )}
      </div>

      {/* Top Admin Section Switcher */}
      <div className="px-4 py-2 flex gap-2 bg-[#080D18] border-b border-[#202B40]">
        <button
          onClick={() => setAdminView('PAYMENT_VERIFICATION')}
          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer relative ${
            adminView === 'PAYMENT_VERIFICATION'
              ? 'bg-[#FFD600] text-black shadow-[0_0_12px_rgba(255,214,0,0.3)]'
              : 'bg-[#111A2C] text-zinc-400 hover:text-white border border-[#202B40]'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          PAYMENT VERIFICATION
          {pendingPaymentsCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
                adminView === 'PAYMENT_VERIFICATION'
                  ? 'bg-black text-[#FFD600]'
                  : 'bg-amber-500 text-black animate-pulse'
              }`}
            >
              {pendingPaymentsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminView('MATCH_RESULTS')}
          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer relative ${
            adminView === 'MATCH_RESULTS'
              ? 'bg-[#FFD600] text-black shadow-[0_0_12px_rgba(255,214,0,0.3)]'
              : 'bg-[#111A2C] text-zinc-400 hover:text-white border border-[#202B40]'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          MATCH RESULTS
          {pendingResultsCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
                adminView === 'MATCH_RESULTS'
                  ? 'bg-black text-[#FFD600]'
                  : 'bg-amber-500 text-black animate-pulse'
              }`}
            >
              {pendingResultsCount} PENDING
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminView('TOURNAMENTS')}
          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer ${
            adminView === 'TOURNAMENTS'
              ? 'bg-[#FFD600] text-black shadow-[0_0_12px_rgba(255,214,0,0.3)]'
              : 'bg-[#111A2C] text-zinc-400 hover:text-white border border-[#202B40]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          TOURNAMENTS
        </button>
      </div>

      {adminView === 'PAYMENT_VERIFICATION' ? (
        <PaymentVerificationPanel
          adminUid={effectiveAdminUid}
          showToast={showToast}
        />
      ) : adminView === 'MATCH_RESULTS' ? (
        <MatchResultVerificationPanel
          adminUid={effectiveAdminUid}
          showToast={showToast}
        />
      ) : (
        <>
          {/* Dynamic Financial Overview Strip */}
      <div className="p-3.5 mx-4 mt-3 rounded-2xl grid grid-cols-3 gap-2" style={{ background: C.cardLight, border: `1px solid ${C.yellowBorder}` }}>
        <div>
          <p className="text-[8px] font-bold uppercase text-zinc-400">TOTAL COLLECTION</p>
          <p className="text-base font-black text-white font-mono">₹{financialTotals.totalCollection.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase text-zinc-400">TOTAL PAYOUTS</p>
          <p className="text-base font-black text-[#FFD600] font-mono">₹{financialTotals.totalPrizePayout.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase text-zinc-400">PLATFORM PROFIT</p>
          <p className="text-base font-black text-emerald-400 font-mono">₹{financialTotals.totalProfit.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3 flex items-center justify-between border-b border-zinc-800">
        <div className="flex gap-2">
          {(['ALL', 'UPCOMING', 'LIVE', 'COMPLETED'] as const).map(tName => (
            <button
              key={tName}
              onClick={() => setTab(tName)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${tab === tName ? 'bg-[#FFD600] text-black' : 'text-zinc-400 bg-zinc-900'}`}
            >
              {tName}
            </button>
          ))}
        </div>
        <p className="text-[10px] font-mono text-zinc-400">{filtered.length} matches</p>
      </div>

      {/* Format Filter Bar */}
      <div className="px-4 py-2 flex gap-1.5 overflow-x-auto scrollbar-none">
        {(['ALL', 'SOLO', 'DUO', 'SQUAD', 'BIG_SLOT', 'CLASH_SQUAD'] as const).map(fmt => (
          <button
            key={fmt}
            onClick={() => setFormatFilter(fmt)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer ${formatFilter === fmt ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-zinc-400'}`}
          >
            {fmt === 'BIG_SLOT' ? 'BIG SLOT (₹300)' : fmt}
          </button>
        ))}
      </div>

      {/* Tournaments List */}
      <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-[#0D1424] rounded-2xl border border-zinc-800 p-6">
            <Trophy className="w-9 h-9 mx-auto text-zinc-600 opacity-40" />
            <p className="text-xs font-bold text-white mt-2">No tournaments in this category</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-3 px-4 py-2 rounded-xl text-xs font-black bg-[#FFD600] text-black uppercase"
            >
              + Create Tournament Now
            </button>
          </div>
        ) : (
          filtered.map(tourney => {
            const isSolo = tourney.format === 'SOLO';
            const isCS = tourney.format === 'CLASH_SQUAD';
            const isBigSlot = tourney.format === 'BIG_SLOT';
            const maxS = isSolo ? 48 : tourney.format === 'DUO' ? 24 : (tourney.format === 'SQUAD' || isBigSlot) ? 12 : 2;
            const curS = isSolo ? tourney.currentPlayers : (tourney.currentTeams || 0);
            const unit = isSolo ? 'Players' : 'Teams';
            const coll = isSolo ? 15 * tourney.currentPlayers : tourney.entryFee * curS;

            return (
              <div key={tourney.id} className="p-4 rounded-2xl bg-[#0D1424] border border-zinc-800 space-y-3">
                {/* Top Info */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-[#FFD600]/20 text-[#FFD600] border border-[#FFD600]/40">
                        {tourney.format}
                      </span>
                      <StatusBadge status={tourney.status} pulse={tourney.status === 'LIVE'} size="xs" />
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-[#FFD600]" />{tourney.map}
                      </span>
                    </div>
                    <h4 className="font-black text-white text-sm mt-1">{tourney.name}</h4>
                    <p className="text-[10px] text-zinc-400">{tourney.startDate} • {tourney.startTime}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] text-zinc-400 uppercase">COLLECTION</p>
                    <p className="text-base font-black text-[#FFD600] font-mono">₹{coll}</p>
                    <p className="text-[9px] text-zinc-400 font-mono">{curS}/{maxS} {unit}</p>
                  </div>
                </div>

                {/* Room Info */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-zinc-800 text-xs">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-[#FFD600]" />
                    <span className="text-zinc-300 font-mono">
                      {tourney.roomId ? `ID: ${tourney.roomId} | PWD: ${tourney.roomPassword || 'None'}` : 'Room Not Set'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setManagingRoomTourney(tourney);
                      setRoomModalId(tourney.roomId || '');
                      setRoomModalPwd(tourney.roomPassword || '');
                    }}
                    className="px-2 py-1 rounded text-[9px] font-black uppercase bg-zinc-800 text-[#FFD600] hover:bg-zinc-700"
                  >
                    {tourney.roomId ? 'EDIT ROOM' : '+ ADD ROOM'}
                  </button>
                </div>

                {/* Actions Button Grid */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <button
                    onClick={() => setViewingRegistrationsTourney(tourney)}
                    className="py-2 rounded-xl text-[10px] font-black uppercase bg-zinc-800 text-white hover:bg-zinc-700 transition"
                  >
                    USERS ({tourney.registrationsList.length})
                  </button>

                  {tourney.status === 'UPCOMING' ? (
                    <button
                      onClick={() => handleStartTournament(tourney.id)}
                      className="py-2 rounded-xl text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition"
                    >
                      ▶ START
                    </button>
                  ) : tourney.status === 'LIVE' ? (
                    <button
                      onClick={() => handleCompleteTournament(tourney.id)}
                      className="py-2 rounded-xl text-[10px] font-black uppercase bg-purple-500/20 text-purple-400 border border-purple-500/40 hover:bg-purple-500/30 transition"
                    >
                      ✓ FINISH
                    </button>
                  ) : (
                    <span className="py-2 rounded-xl text-[10px] font-black uppercase text-center text-zinc-500 bg-zinc-900 block">
                      DONE
                    </span>
                  )}

                  <button
                    onClick={() => {
                      setPublishingResultsTourney(tourney);
                      setResPlayerName('');
                      setResUid('');
                      setResPosition(1);
                      setResKills(5);
                    }}
                    className="py-2 rounded-xl text-[10px] font-black uppercase bg-yellow-500/20 text-[#FFD600] border border-yellow-500/40 hover:bg-yellow-500/30 transition"
                  >
                    🏆 WINNERS
                  </button>

                  <button
                    onClick={() => {
                      const updated = prompt('Enter new start time (e.g. 9:00 PM):', tourney.startTime);
                      if (updated) {
                        setTournaments(prev => prev.map(t => t.id === tourney.id ? { ...t, startTime: updated } : t));
                        showToast('Start time updated!');
                      }
                    }}
                    className="py-2 rounded-xl text-[10px] font-black uppercase bg-zinc-800 text-zinc-400 hover:text-white transition"
                  >
                    EDIT
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE TOURNAMENT MODAL (SECTION 7 FLOW) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto" style={{ background: C.navy, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">CREATE TOURNAMENT</h3>
                <p className="text-[10px] text-zinc-400">Predefined Free Fire tournament format only</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg bg-zinc-800 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTournament} className="space-y-3">
              {/* Step 1: Format Selector */}
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">SELECT FORMAT</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['SOLO', 'DUO', 'SQUAD', 'BIG_SLOT', 'CLASH_SQUAD'] as const).map(fmt => (
                    <button
                      type="button"
                      key={fmt}
                      onClick={() => setNewFormat(fmt)}
                      className={`p-2.5 rounded-xl text-xs font-black uppercase text-left transition ${newFormat === fmt ? 'bg-[#FFD600] text-black' : 'bg-[#0D1424] text-zinc-300 border border-zinc-800'}`}
                    >
                      {fmt === 'SOLO' && 'Solo (₹15)'}
                      {fmt === 'DUO' && 'Duo (₹40)'}
                      {fmt === 'SQUAD' && 'Squad (₹100)'}
                      {fmt === 'BIG_SLOT' && 'Big Slot (₹300)'}
                      {fmt === 'CLASH_SQUAD' && 'Clash Squad'}
                    </button>
                  ))}
                </div>
              </div>

              {/* If Big Slot: Specs preview */}
              {newFormat === 'BIG_SLOT' && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-amber-400 font-black">
                    <span>👑 BIG SLOT (SQUAD ONLY)</span>
                    <span>₹300 / Team</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">12 Teams (48 Players) • Placement: 1st ₹600, 2nd ₹400, 3rd ₹200</p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800">
                    <span>Kill Reward: <strong className="text-[#FFD600]">₹20/Kill</strong></span>
                    <span>Platform Profit: <strong className="text-emerald-400 font-mono">₹1,440</strong></span>
                  </div>
                </div>
              )}

              {/* If Clash Squad: Slot picker */}
              {newFormat === 'CLASH_SQUAD' && (
                <div className="p-3 rounded-xl bg-[#0D1424] border border-zinc-800 space-y-2">
                  <label className="text-[10px] font-black uppercase text-emerald-400 block">CLASH SQUAD SLOT PRICING</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { slot: 70, win: 110, profit: 30 },
                      { slot: 100, win: 150, profit: 50 },
                      { slot: 150, win: 220, profit: 80 },
                    ].map(s => (
                      <button
                        type="button"
                        key={s.slot}
                        onClick={() => setNewCsSlot(s.slot as ClashSquadSlot)}
                        className={`p-2 rounded-xl text-center transition ${newCsSlot === s.slot ? 'bg-emerald-500 text-black font-black' : 'bg-black/50 text-zinc-300 border border-zinc-800'}`}
                      >
                        <p className="text-xs font-black">₹{s.slot} / Team</p>
                        <p className="text-[9px]">Win ₹{s.win}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Map Selector (Free Fire Maps Only) */}
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">FREE FIRE MAP</label>
                <select
                  value={newMap}
                  onChange={e => setNewMap(e.target.value as FreeFireMap)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0D1424] border border-zinc-700 text-white focus:outline-none"
                >
                  {newFormat === 'CLASH_SQUAD' ? (
                    <>
                      <option value="Bermuda CS">Bermuda CS</option>
                      <option value="Kalahari CS">Kalahari CS</option>
                      <option value="Purgatory CS">Purgatory CS</option>
                      <option value="Alpine CS">Alpine CS</option>
                    </>
                  ) : (
                    <>
                      <option value="Bermuda">Bermuda</option>
                      <option value="Kalahari">Kalahari</option>
                      <option value="Purgatory">Purgatory</option>
                      <option value="Alpine">Alpine</option>
                    </>
                  )}
                </select>
              </div>

              {/* Step 3: Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">MATCH DATE</label>
                  <input
                    type="text"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    placeholder="e.g. Today"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0D1424] border border-zinc-700 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">START TIME</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    placeholder="e.g. 9:00 PM"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0D1424] border border-zinc-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Closing Time */}
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">REGISTRATION CLOSING TIME</label>
                <input
                  type="text"
                  value={newClosingTime}
                  onChange={e => setNewClosingTime(e.target.value)}
                  placeholder="e.g. 8:45 PM"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0D1424] border border-zinc-700 text-white focus:outline-none"
                />
              </div>

              {/* Room ID & Password */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">ROOM ID (OPTIONAL)</label>
                  <input
                    type="text"
                    value={newRoomId}
                    onChange={e => setNewRoomId(e.target.value)}
                    placeholder="e.g. 892019"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0D1424] border border-zinc-700 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">PASSWORD (OPTIONAL)</label>
                  <input
                    type="text"
                    value={newRoomPwd}
                    onChange={e => setNewRoomPwd(e.target.value)}
                    placeholder="e.g. FF2026"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0D1424] border border-zinc-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <PrimaryBtn>PUBLISH TOURNAMENT</PrimaryBtn>
            </form>
          </div>
        </div>
      )}

      {/* VIEW REGISTRATIONS MODAL */}
      {viewingRegistrationsTourney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto" style={{ background: C.navy, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">REGISTERED PARTICIPANTS</h3>
                <p className="text-xs text-zinc-400">{viewingRegistrationsTourney.name}</p>
              </div>
              <button onClick={() => setViewingRegistrationsTourney(null)} className="p-1 rounded bg-zinc-800 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {viewingRegistrationsTourney.registrationsList.length === 0 ? (
                <p className="text-center py-8 text-zinc-500 text-xs">No registered participants yet.</p>
              ) : (
                viewingRegistrationsTourney.registrationsList.map((reg, idx) => (
                  <div key={reg.id} className="p-3 rounded-xl bg-[#0D1424] border border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-white">
                        #{idx + 1} {reg.teamName ? `${reg.teamName} (${reg.playerName})` : reg.playerName}
                      </p>
                      <span className="text-[10px] font-mono text-[#FFD600]">Slot #{reg.slotNumber}</span>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-400">UID: {reg.playerUid} • {reg.registeredAt}</p>
                    {reg.teammates && (
                      <div className="pt-1 text-[9px] text-zinc-400">
                        Teammates: {reg.teammates.map(tm => `${tm.name} (${tm.uid})`).join(', ')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MANAGE ROOM MODAL */}
      {managingRoomTourney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={{ background: C.navy, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">ROOM CREDENTIALS</h3>
              <button onClick={() => setManagingRoomTourney(null)} className="p-1 rounded bg-zinc-800 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">ROOM ID</label>
                <input
                  type="text"
                  value={roomModalId}
                  onChange={e => setRoomModalId(e.target.value)}
                  placeholder="Enter Free Fire Room ID"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0D1424] border border-zinc-700 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">ROOM PASSWORD</label>
                <input
                  type="text"
                  value={roomModalPwd}
                  onChange={e => setRoomModalPwd(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0D1424] border border-zinc-700 text-white focus:outline-none"
                />
              </div>
              <PrimaryBtn onClick={() => handleSaveRoom(managingRoomTourney.id)}>
                SAVE & RELEASE ROOM
              </PrimaryBtn>
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH RESULTS MODAL (SECTION 13) */}
      {publishingResultsTourney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={{ background: C.navy, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">ENTER MATCH RESULTS</h3>
                <p className="text-[10px] text-zinc-400">{publishingResultsTourney.name}</p>
              </div>
              <button onClick={() => setPublishingResultsTourney(null)} className="p-1 rounded bg-zinc-800 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {publishingResultsTourney.format === 'CLASH_SQUAD' ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-emerald-400 block mb-1">WINNING TEAM</label>
                  <input
                    type="text"
                    value={csWinningTeam}
                    onChange={e => setCsWinningTeam(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0D1424] border border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-red-400 block mb-1">LOSING TEAM</label>
                  <input
                    type="text"
                    value={csLosingTeam}
                    onChange={e => setCsLosingTeam(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0D1424] border border-zinc-700 text-white"
                  />
                </div>
                <div className="p-2.5 rounded-xl bg-[#0D1424] text-xs flex justify-between">
                  <span className="text-zinc-400">Winner Prize:</span>
                  <span className="font-black text-[#FFD600]">₹{publishingResultsTourney.winnerPrize}</span>
                </div>
                <PrimaryBtn onClick={() => handlePublishResults(publishingResultsTourney)}>
                  CONFIRM & PUBLISH WINNER
                </PrimaryBtn>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">PLAYER / TEAM NAME</label>
                  <input
                    type="text"
                    value={resPlayerName}
                    onChange={e => setResPlayerName(e.target.value)}
                    placeholder="Enter winner name"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0D1424] border border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">FREE FIRE UID</label>
                  <input
                    type="text"
                    value={resUid}
                    onChange={e => setResUid(e.target.value)}
                    placeholder="Enter UID"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0D1424] border border-zinc-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">POSITION</label>
                    <select
                      value={resPosition}
                      onChange={e => setResPosition(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#0D1424] border border-zinc-700 text-white"
                    >
                      <option value={1}>1st Place</option>
                      <option value={2}>2nd Place</option>
                      <option value={3}>3rd Place</option>
                      <option value={4}>4th+ Place</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">TOTAL KILLS</label>
                    <input
                      type="number"
                      value={resKills}
                      onChange={e => setResKills(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#0D1424] border border-zinc-700 text-white"
                    />
                  </div>
                </div>
                {(() => {
                  const killRewardRate = publishingResultsTourney.killReward || (publishingResultsTourney.format === 'BIG_SLOT' ? 20 : 10);
                  const placementPrize = resPosition === 1
                    ? (publishingResultsTourney.placementRewards[0]?.prize || (publishingResultsTourney.format === 'BIG_SLOT' ? 600 : 20))
                    : resPosition === 2
                    ? (publishingResultsTourney.placementRewards[1]?.prize || (publishingResultsTourney.format === 'BIG_SLOT' ? 400 : 15))
                    : resPosition === 3
                    ? (publishingResultsTourney.placementRewards[2]?.prize || (publishingResultsTourney.format === 'BIG_SLOT' ? 200 : 10))
                    : 0;
                  const total = placementPrize + (resKills * killRewardRate);
                  return (
                    <div className="p-2.5 rounded-xl bg-[#0D1424] text-xs flex justify-between">
                      <span className="text-zinc-400">Total Prize (Placement + Kills × ₹{killRewardRate}):</span>
                      <span className="font-black text-[#FFD600]">₹{total}</span>
                    </div>
                  );
                })()}
                <PrimaryBtn onClick={() => handlePublishResults(publishingResultsTourney)}>
                  PUBLISH RESULT & WINNERS
                </PrimaryBtn>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

// ─── MY GAMES TAB ─────────────────────────────────────────────────────────────
const MyGamesTab: React.FC<{
  tournaments: MockTournament[];
  onSelectTournament: (t: MockTournament) => void;
  onOpenDispute?: () => void;
  showToast?: (m: string) => void;
  userPayments?: PaymentDocument[];
  userRegistrations?: RegistrationDocument[];
  userResults?: MatchResultDocument[];
  onOpenSubmitResult?: (t: MockTournament) => void;
}> = ({
  tournaments,
  onSelectTournament,
  onOpenDispute,
  showToast,
  userPayments = [],
  userRegistrations = [],
  userResults = [],
  onOpenSubmitResult,
}) => {
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'LIVE' | 'COMPLETED' | 'PAYMENTS'>('UPCOMING');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const registeredMatches = tournaments.filter(t => t.isRegistered || t.isPaymentPending);
  const matches = registeredMatches.filter(m => {
    if (activeTab === 'LIVE') return m.status === 'LIVE';
    if (activeTab === 'UPCOMING') return m.status === 'UPCOMING';
    return m.status === 'COMPLETED';
  });

  const filteredPayments = userPayments.filter(p => {
    if (paymentFilter === 'ALL') return true;
    return p.status === paymentFilter;
  });

  const pendingCount = userPayments.filter(p => p.status === 'PENDING').length;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    showToast?.(`Copied ${field === 'roomId' ? 'Room ID' : 'Password'}: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Tabs */}
      <div className="flex rounded-xl p-1 gap-1" style={{ background: C.cardLight, border: `1px solid ${C.border}` }}>
        {(['UPCOMING', 'LIVE', 'COMPLETED', 'PAYMENTS'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer relative"
            style={{
              background: activeTab === tab ? C.yellow : 'transparent',
              color: activeTab === tab ? '#000' : C.textSec,
            }}>
            {tab === 'LIVE' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />}
            {tab === 'PAYMENTS' ? 'STATUS' : tab}
            {tab === 'PAYMENTS' && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black text-[8px] font-black flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'PAYMENTS' ? (
        <div className="space-y-3 animate-fade-in">
          {/* Header Banner */}
          <div className="p-3.5 rounded-2xl bg-[#0D1424] border border-[#202B40] flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-white uppercase tracking-wider">PAYMENT & REGISTRATION STATUS</p>
              <p className="text-[10px] text-zinc-400">Live verification status from Cloud Firestore</p>
            </div>
            <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase bg-[#FFD600]/15 text-[#FFD600] border border-[#FFD600]/30">
              STEP 2 REAL
            </span>
          </div>

          {/* Filter Chips: ALL, PENDING, APPROVED, REJECTED */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(f => (
              <button
                key={f}
                onClick={() => setPaymentFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition active:scale-95 cursor-pointer whitespace-nowrap ${
                  paymentFilter === f
                    ? 'bg-[#FFD600] text-black shadow-[0_0_12px_rgba(255,214,0,0.3)]'
                    : 'bg-[#0D1424] text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
              >
                {f}
                {f === 'PENDING' && pendingCount > 0 && ` (${pendingCount})`}
              </button>
            ))}
          </div>

          {filteredPayments.length === 0 ? (
            <div className="py-14 text-center space-y-3 bg-[#0D1424] rounded-2xl border border-zinc-800 p-6">
              <Clock className="w-10 h-10 mx-auto opacity-20 text-[#FFD600]" />
              <p className="font-bold text-white text-sm">
                No {paymentFilter !== 'ALL' ? paymentFilter.toLowerCase() : ''} payments found
              </p>
              <p className="text-xs text-zinc-400">
                Submit payment proof for any Free Fire match. Verification updates will reflect here live.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPayments.map(p => (
                <div key={p.paymentId} className="p-4 rounded-2xl bg-[#0D1424] border border-[#202B40] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#202B40]">
                    <div>
                      <p className="text-xs font-black text-white">{p.tournamentName}</p>
                      <p className="text-[10px] font-mono text-zinc-500">ID: {p.paymentId}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 border ${
                      p.status === 'PENDING'
                        ? 'bg-[#FFD600]/15 text-[#FFD600] border-[#FFD600]/30'
                        : p.status === 'APPROVED'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/15 text-red-400 border-red-500/30'
                    }`}>
                      {p.status === 'PENDING' && <Clock className="w-3 h-3 animate-pulse" />}
                      {p.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                      {p.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                      {p.status === 'PENDING' ? 'PENDING VERIFICATION' : p.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800">
                      <span className="text-[8px] text-zinc-400 uppercase font-bold block">ENTRY FEE</span>
                      <span className="font-black text-[#FFD600] font-mono text-sm">₹{p.amount}.00</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800">
                      <span className="text-[8px] text-zinc-400 uppercase font-bold block">SUBMITTED UTR</span>
                      <span className="font-mono text-xs font-bold text-white truncate block">{p.utr}</span>
                    </div>
                  </div>

                  {p.screenshotUrl && (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/30 border border-zinc-800">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-black flex-shrink-0 flex items-center justify-center">
                        <img src={p.screenshotUrl} alt="Receipt" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-zinc-300 block">Payment Screenshot</span>
                        <a
                          href={p.screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[#FFD600] hover:underline flex items-center gap-1 font-bold mt-0.5"
                        >
                          View Original Proof <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-1">
                    <span>
                      Submitted: {p.submittedAt ? new Date(p.submittedAt.seconds ? p.submittedAt.seconds * 1000 : p.submittedAt).toLocaleString() : 'Recent'}
                    </span>
                    {p.status === 'PENDING' && (
                      <span className="text-amber-400 font-bold">Admin verification in progress</span>
                    )}
                  </div>

                  {p.adminNote && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] text-red-300">
                      <strong>Admin Note:</strong> {p.adminNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : matches.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-[#0D1424] rounded-2xl border border-zinc-800 p-6">
          <Gamepad2 className="w-10 h-10 mx-auto opacity-20 text-[#FFD600]" />
          <p className="font-bold text-white text-sm">No {activeTab.toLowerCase()} matches found</p>
          <p className="text-xs text-zinc-400">Join a Free Fire tournament to access your room details and results</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => {
            const matchResult = userResults?.find(
              (r) => r.tournamentId === m.id || r.matchId === m.id
            );

            return (
              <Card key={m.id} glowYellow={m.status === 'LIVE'} className="space-y-0">
                <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-[#FFD600]/20 text-[#FFD600]">
                      {m.format}
                    </span>
                    <StatusBadge status={m.status} pulse={m.status === 'LIVE'} size="xs" />
                    {m.isPaymentPending && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-[#FFD600]/15 text-[#FFD600] border border-[#FFD600]/30">
                        ⏳ PAYMENT PENDING
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400">{m.startDate} • {m.startTime}</span>
                </div>

                <div className="p-4 space-y-3">
                  <h4 className="font-black text-white text-sm">{m.name}</h4>

                  {/* Room Details for LIVE or Registered Matches */}
                  {m.isPaymentPending ? (
                    <div className="p-3 rounded-xl bg-[#FFD600]/5 border border-[#FFD600]/20 text-center space-y-1">
                      <p className="text-[10px] font-black uppercase text-[#FFD600] flex items-center justify-center gap-1">
                        <Clock className="w-3.5 h-3.5 animate-pulse" /> PAYMENT UNDER ADMIN VERIFICATION
                      </p>
                      <p className="text-[9px] text-zinc-400">
                        Room ID & Password unlock immediately once the admin approves your payment proof.
                      </p>
                    </div>
                  ) : m.roomId ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'ROOM ID', value: m.roomId, field: 'roomId' },
                        { label: 'PASSWORD', value: m.roomPassword || 'FF80', field: 'roomPwd' },
                      ].map(({ label, value, field }) => (
                        <div key={field} className="p-3 rounded-xl bg-black/60 border border-[#FFD600]/30">
                          <p className="text-[8px] font-black uppercase tracking-widest mb-1 text-zinc-400">{label}</p>
                          <p className="text-lg font-black font-mono text-[#FFD600]">{value}</p>
                          <button onClick={() => handleCopy(value, field)}
                            className="mt-1.5 flex items-center gap-1 text-[9px] font-bold uppercase cursor-pointer text-zinc-400 hover:text-white">
                            {copiedField === field ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            {copiedField === field ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[#FFD600]" />{m.map}</span>
                    <span className="text-[#FFD600] font-bold">
                      {m.format === 'CLASH_SQUAD' ? `Winner: ₹${m.winnerPrize}` : `₹10 / Kill`}
                    </span>
                    <span>Entry: ₹{m.entryFee}</span>
                  </div>

                  {/* Real Match Result Status / Submission Trigger */}
                  {matchResult?.status === 'PENDING' ? (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-[#FFD600] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-pulse" /> RESULT UNDER ADMIN VERIFICATION
                        </span>
                        <span className="text-[10px] font-mono font-bold text-white">
                          Claimed #{matchResult.placement} • {matchResult.kills} Kills
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-400">
                        Result submitted with proof screenshot. Standings update immediately once admin approves.
                      </p>
                    </div>
                  ) : matchResult?.status === 'APPROVED' ? (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> RESULT VERIFIED
                        </span>
                        <span className="text-xs font-black font-mono text-[#FFD600]">
                          +{matchResult.calculatedScore} PTS
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-300">
                        Official Placement: #{matchResult.placement} • {matchResult.kills} Kills • Credited to Official Leaderboard
                      </p>
                    </div>
                  ) : matchResult?.status === 'REJECTED' ? (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-red-400 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5" /> RESULT REJECTED
                        </span>
                      </div>
                      <p className="text-[9px] text-red-300">
                        <strong>Reason:</strong> {matchResult.adminNote || 'Evidence did not match official logs.'}
                      </p>
                      <button
                        onClick={() => onOpenSubmitResult?.(m)}
                        className="w-full py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 text-[10px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3" /> RESUBMIT RESULT WITH NEW PROOF
                      </button>
                    </div>
                  ) : m.isRegistered && !m.isPaymentPending ? (
                    <button
                      onClick={() => onOpenSubmitResult?.(m)}
                      className="w-full py-2.5 rounded-xl bg-[#FFD600] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#FFE033] transition active:scale-95 shadow-glow-yellow-sm cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      SUBMIT MATCH RESULT (KILLS + PROOF)
                    </button>
                  ) : null}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onSelectTournament(m)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[#FFD600] text-black cursor-pointer transition active:scale-95"
                    >
                      VIEW MATCH DETAILS
                    </button>
                    <button
                      onClick={onOpenDispute}
                      className="p-2.5 rounded-xl bg-zinc-800 text-amber-400 cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}

        </div>
      )}
    </div>
  );
};

// ─── RANKINGS TAB ─────────────────────────────────────────────────────────────
const RankingsTab: React.FC = () => {
  const [rankTab, setRankTab] = useState<'GLOBAL' | 'WEEKLY'>('GLOBAL');

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* My Rank Banner */}
      <div className="p-3.5 rounded-2xl flex items-center gap-3" style={{ background: 'linear-gradient(135deg, rgba(255,214,0,0.1), rgba(255,214,0,0.03))', border: `1px solid ${C.yellowBorder}` }}>
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ border: `2px solid ${C.yellow}` }}>
          <img src={MOCK_PLAYER.avatarUrl} alt="Me" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase" style={{ color: C.textSec }}>MY RANKING</p>
          <p className="font-black text-white">{MOCK_PLAYER.name}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-black" style={{ color: C.yellow }}>#{MOCK_PLAYER.rank}</p>
          <p className="text-[10px] font-bold flex items-center justify-end gap-0.5 text-emerald-400">
            <TrendingUp className="w-3 h-3" />↑{MOCK_PLAYER.rankChange} this week
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl p-1 gap-1" style={{ background: C.cardLight, border: `1px solid ${C.border}` }}>
        {(['GLOBAL', 'WEEKLY'] as const).map(tabName => (
          <button key={tabName} onClick={() => setRankTab(tabName)}
            className="flex-1 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer"
            style={{ background: rankTab === tabName ? C.yellow : 'transparent', color: rankTab === tabName ? '#000' : C.textSec }}>
            {tabName}
          </button>
        ))}
      </div>

      {/* Podium Top 3 */}
      <div className="p-4 rounded-2xl" style={{ background: C.cardLight, border: `1px solid ${C.border}` }}>
        <div className="flex items-end justify-center gap-6">
          {/* #2 */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full overflow-hidden mb-2 flex-shrink-0 border-2 border-slate-400">
              <img src={MOCK_PLAYERS[1].avatar} alt={MOCK_PLAYERS[1].name} className="w-full h-full object-cover" />
            </div>
            <div className="w-6 h-6 rounded-full flex items-center justify-center font-black text-xs mb-1 bg-slate-700 text-white">2</div>
            <p className="text-xs font-black text-white text-center truncate max-w-[70px]">{MOCK_PLAYERS[1].name}</p>
            <p className="text-[10px] text-zinc-400">{MOCK_PLAYERS[1].kills}K • {MOCK_PLAYERS[1].points}pts</p>
          </div>
          {/* #1 */}
          <div className="flex flex-col items-center -mt-4">
            <Crown className="w-6 h-6 mb-1 text-[#FFD600] animate-bounce" />
            <div className="w-20 h-20 rounded-full overflow-hidden mb-2 flex-shrink-0 border-4 border-[#FFD600] shadow-[0_0_20px_rgba(255,214,0,0.4)]">
              <img src={MOCK_PLAYERS[0].avatar} alt={MOCK_PLAYERS[0].name} className="w-full h-full object-cover" />
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-sm mb-1 bg-[#FFD600] text-black">1</div>
            <p className="text-sm font-black text-[#FFD600] text-center truncate max-w-[80px]">{MOCK_PLAYERS[0].name}</p>
            <p className="text-[10px] text-zinc-400">{MOCK_PLAYERS[0].kills}K • {MOCK_PLAYERS[0].points}pts</p>
          </div>
          {/* #3 */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full overflow-hidden mb-2 flex-shrink-0 border-2 border-amber-800">
              <img src={MOCK_PLAYERS[2].avatar} alt={MOCK_PLAYERS[2].name} className="w-full h-full object-cover" />
            </div>
            <div className="w-6 h-6 rounded-full flex items-center justify-center font-black text-xs mb-1 bg-amber-900 text-white">3</div>
            <p className="text-xs font-black text-white text-center truncate max-w-[70px]">{MOCK_PLAYERS[2].name}</p>
            <p className="text-[10px] text-zinc-400">{MOCK_PLAYERS[2].kills}K • {MOCK_PLAYERS[2].points}pts</p>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-1 px-3 py-1.5 text-[9px] font-black uppercase text-zinc-500">
          <span>#</span>
          <span>PLAYER</span>
          <span>KILLS</span>
          <span>POINTS</span>
        </div>
        {MOCK_PLAYERS.slice(3).map((p) => (
          <div key={p.rank} className="p-3 rounded-xl flex items-center gap-2 transition"
            style={{
              background: p.isMe ? 'rgba(255,214,0,0.07)' : C.cardLight,
              border: `1px solid ${p.isMe ? C.yellowBorder : C.border}`,
            }}>
            <span className="w-6 text-center font-black text-xs" style={{ color: p.isMe ? C.yellow : C.textSec }}>#{p.rank}</span>
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate">{p.name} {p.isMe && <span className="text-[#FFD600]">(YOU)</span>}</p>
              <p className="text-[9px] text-zinc-400">{p.tier}</p>
            </div>
            <span className="text-xs font-black text-white">{p.kills}</span>
            <span className="text-xs font-black text-[#FFD600]">{p.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── PROFILE TAB ─────────────────────────────────────────────────────────────
const ProfileTab: React.FC<{
  player: typeof MOCK_PLAYER;
  onOpenWallet: () => void;
  onOpenTournaments: () => void;
  onOpenRankings: () => void;
  onOpenNotifications: () => void;
  onOpenEditProfile: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenTerms: () => void;
  onSignOut: () => void;
}> = ({
  player, onOpenWallet, onOpenTournaments, onOpenRankings, onOpenNotifications,
  onOpenEditProfile, onOpenSettings, onOpenHelp, onOpenTerms, onSignOut
}) => {
  const menuItems = [
    { icon: Edit3, label: 'Edit Profile', desc: 'IGN, Avatar & Free Fire UID', action: onOpenEditProfile },
    { icon: Wallet, label: 'Wallet & Payouts', desc: `₹${player.walletBalance.toLocaleString()} available`, action: onOpenWallet },
    { icon: Trophy, label: 'My Matches', desc: `${player.matches} matches played`, action: onOpenTournaments },
    { icon: BarChart2, label: 'Leaderboard', desc: `Rank #${player.rank}`, action: onOpenRankings },
    { icon: Bell, label: 'Notifications', desc: 'Match & Room alerts', action: onOpenNotifications },
    { icon: Settings, label: 'Settings', desc: 'Audio & preferences', action: onOpenSettings },
    { icon: HelpCircle, label: 'Help & Support', desc: 'WhatsApp & Ticket support', action: onOpenHelp },
    { icon: FileText, label: 'Tournament Rules', desc: 'Official FF Arena rules', action: onOpenTerms },
    { icon: LogOut, label: 'Sign Out', desc: '', danger: true, action: onSignOut },
  ];

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Profile Card */}
      <div className="p-5 rounded-2xl text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,214,0,0.08), rgba(13,20,36,0.8))', border: `1px solid ${C.yellowBorder}` }}>
        <button
          onClick={onOpenEditProfile}
          className="absolute top-4 right-4 p-2 rounded-xl flex items-center gap-1 text-[10px] font-bold uppercase transition active:scale-95 cursor-pointer bg-[#111A2C] border border-[#202B40] text-[#FFD600]"
        >
          <Edit3 className="w-3 h-3" /> Edit
        </button>

        <div className="relative inline-block mb-3">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#FFD600] shadow-[0_0_24px_rgba(255,214,0,0.35)]">
            <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
          </div>
          <span className="absolute -bottom-1.5 -right-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#FFD600] text-black">
            {player.tier}
          </span>
        </div>
        <h2 className="text-xl font-black text-white">{player.name}</h2>
        <p className="text-[11px] font-bold uppercase tracking-wider mt-0.5 text-[#FFD600]">{player.badge}</p>
        <p className="text-[10px] mt-1 font-mono text-zinc-400">UID: {player.uid} • UPI: {player.upiId}</p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-1 mt-4 pt-4 border-t border-zinc-800">
          {[
            { label: 'MATCHES', value: player.matches },
            { label: 'WINS', value: player.wins },
            { label: 'KILLS', value: player.kills },
            { label: 'WIN%', value: `${player.winRate}%` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-lg font-black text-white">{value}</p>
              <p className="text-[8px] font-bold uppercase text-zinc-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Menu List */}
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        {menuItems.map((item, i) => (
          <button key={item.label}
            onClick={item.action}
            className="w-full flex items-center gap-3 px-4 py-3.5 transition active:bg-white/5 text-left cursor-pointer"
            style={{ borderBottom: i < menuItems.length - 1 ? `1px solid ${C.border}` : 'none', background: 'transparent' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: item.danger ? 'rgba(239,68,68,0.1)' : C.card, border: `1px solid ${item.danger ? 'rgba(239,68,68,0.3)' : C.border}` }}>
              <item.icon className="w-4 h-4" style={{ color: item.danger ? C.live : C.yellow }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: item.danger ? C.live : '#fff' }}>{item.label}</p>
              {item.desc && <p className="text-[10px] text-zinc-400">{item.desc}</p>}
            </div>
            {!item.danger && <ChevronRight className="w-4 h-4 flex-shrink-0 text-zinc-500" />}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── WALLET TAB ───────────────────────────────────────────────────────────────
const WalletTab: React.FC<{
  player: typeof MOCK_PLAYER;
  onBack?: () => void;
  onAddMoney: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  showToast: (msg: string) => void;
}> = ({ player, onBack, onAddMoney, onWithdraw, showToast }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [selectedAdd, setSelectedAdd] = useState(200);
  const [withdrawAmt, setWithdrawAmt] = useState(100);

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer mb-1">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </button>
      )}

      {/* Balance Card */}
      <div className="p-5 rounded-2xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,214,0,0.12), rgba(13,20,36,0.9))', border: `1px solid ${C.yellowBorder}` }}>
        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">AVAILABLE ESPORTS WALLET</p>
        <p className="text-3xl font-black font-mono mt-1 text-[#FFD600]">₹{player.walletBalance.toLocaleString()}</p>
        <p className="text-[11px] text-zinc-400 mt-1 font-mono">Winnings Balance: ₹{player.winningsBalance.toLocaleString()}</p>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <button onClick={() => setShowAdd(true)} className="py-2.5 rounded-xl font-black text-xs uppercase bg-[#FFD600] text-black transition active:scale-95 cursor-pointer">
            + ADD CASH
          </button>
          <button onClick={() => setShowWithdraw(true)} className="py-2.5 rounded-xl font-black text-xs uppercase bg-zinc-800 text-white border border-zinc-700 transition active:scale-95 cursor-pointer">
            WITHDRAW
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div>
        <SectionHeader title="Wallet Transactions" />
        <div className="space-y-2">
          {MOCK_WALLET_TRANSACTIONS.map(tx => (
            <div key={tx.id} className="p-3 rounded-xl flex items-center justify-between bg-[#0D1424] border border-zinc-800">
              <div>
                <p className="text-xs font-black text-white">{tx.title}</p>
                <p className="text-[10px] text-zinc-400">{tx.subtitle} • {tx.date}</p>
              </div>
              <p className={`text-sm font-black font-mono ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {tx.amount > 0 ? `+₹${tx.amount}` : `-₹${Math.abs(tx.amount)}`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Money Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4 bg-[#080D18] border border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">TOP UP WALLET</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 text-zinc-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[50, 100, 200, 500, 1000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setSelectedAdd(amt)}
                  className={`p-2.5 rounded-xl text-xs font-black ${selectedAdd === amt ? 'bg-[#FFD600] text-black' : 'bg-[#0D1424] text-white border border-zinc-700'}`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
            <PrimaryBtn onClick={() => { onAddMoney(selectedAdd); setShowAdd(false); showToast(`Added ₹${selectedAdd} to wallet!`); }}>
              PAY VIA UPI (₹{selectedAdd})
            </PrimaryBtn>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4 bg-[#080D18] border border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">WITHDRAW WINNINGS</h3>
              <button onClick={() => setShowWithdraw(false)} className="p-1 text-zinc-400"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">WITHDRAWAL AMOUNT</label>
              <input
                type="number"
                value={withdrawAmt}
                onChange={e => setWithdrawAmt(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#0D1424] border border-zinc-700 text-white"
              />
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">Transfer to UPI: {player.upiId}</p>
            <PrimaryBtn onClick={() => { onWithdraw(withdrawAmt); setShowWithdraw(false); showToast(`Withdrawal of ₹${withdrawAmt} initiated!`); }}>
              CONFIRM WITHDRAWAL
            </PrimaryBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── NOTIFICATIONS MODAL ──────────────────────────────────────────────────────
const NotificationsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex flex-col" style={{ background: C.bg }}>
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800" style={{ background: C.navy }}>
      <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#111A2C] border border-zinc-800">
        <X className="w-4 h-4 text-white" />
      </button>
      <h2 className="font-black text-white text-sm">NOTIFICATIONS</h2>
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {MOCK_NOTIFICATIONS.map(n => (
        <div key={n.id} className="p-3 rounded-xl flex items-start gap-3 bg-[#0D1424] border border-zinc-800">
          <span className="text-xl">{n.icon}</span>
          <div className="flex-1">
            <p className="font-black text-white text-xs">{n.title}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">{n.body}</p>
            <p className="text-[9px] font-mono text-zinc-500 mt-1">{n.time}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── MAIN FF ARENA ROOT COMPONENT ─────────────────────────────────────────────
type TabName = 'HOME' | 'TOURNAMENTS' | 'MY_GAMES' | 'RANKINGS' | 'PROFILE' | 'WALLET';

const NAV_ITEMS: { tab: TabName; icon: React.FC<any>; label: string }[] = [
  { tab: 'HOME', icon: Home, label: 'Home' },
  { tab: 'TOURNAMENTS', icon: Trophy, label: 'Tourneys' },
  { tab: 'MY_GAMES', icon: Gamepad2, label: 'My Matches' },
  { tab: 'RANKINGS', icon: BarChart2, label: 'Rankings' },
  { tab: 'PROFILE', icon: User, label: 'Profile' },
];

export const FFArenaMockUI: React.FC = () => {
  const { user: authUser, firebaseUser } = useAuth();
  const [player, setPlayer] = useState({ ...MOCK_PLAYER });
  const [tournaments, setTournaments] = useState<MockTournament[]>(MOCK_TOURNAMENTS);
  const [activeTab, setActiveTab] = useState<TabName>('HOME');
  const [activeFormatFilter, setActiveFormatFilter] = useState<string>('ALL');
  const [selectedTournament, setSelectedTournament] = useState<MockTournament | null>(null);
  const [activePaymentModal, setActivePaymentModal] = useState<{
    tournament: MockTournament;
    regData: { playerName: string; playerUid: string; teamName?: string; teammates?: any[] };
  } | null>(null);
  const [userPayments, setUserPayments] = useState<PaymentDocument[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<RegistrationDocument[]>([]);
  const [userResults, setUserResults] = useState<MatchResultDocument[]>([]);
  const [submissionMatch, setSubmissionMatch] = useState<any | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const activeUserId = authUser?.uid || firebaseUser?.uid || player.id;
  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.isRead).length;

  // Real-time Firestore subscriptions for payments, registrations, and match results
  useEffect(() => {
    if (!activeUserId) return;

    const unsubPayments = subscribeUserPayments(activeUserId, (payments) => {
      setUserPayments(payments);
      // Synchronize tournaments with payment statuses
      setTournaments((prev) =>
        prev.map((t) => {
          const hasPending = payments.some((p) => p.tournamentId === t.id && p.status === 'PENDING');
          const hasApproved = payments.some((p) => p.tournamentId === t.id && p.status === 'APPROVED');
          const isRejected = payments.some((p) => p.tournamentId === t.id && p.status === 'REJECTED') && !hasApproved;
          return {
            ...t,
            isPaymentPending: hasPending,
            isRegistered: hasApproved ? true : (isRejected ? false : t.isRegistered),
          };
        })
      );
    });

    const unsubRegs = subscribeUserRegistrations(activeUserId, (regs) => {
      setUserRegistrations(regs);
    });

    const unsubResults = subscribeUserMatchResults(activeUserId, (results) => {
      setUserResults(results);
    });

    return () => {
      unsubPayments();
      unsubRegs();
      unsubResults();
    };
  }, [activeUserId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleOpenPaymentModal = (
    t: MockTournament,
    regData: { playerName: string; playerUid: string; teamName?: string; teammates?: any[] }
  ) => {
    // 1. Authentication check
    if (!activeUserId) {
      showToast('Please sign in or continue as guest to join tournaments.');
      return;
    }
    // 2. Tournament exists
    if (!t) {
      showToast('Tournament not found.');
      return;
    }
    // 3. Tournament is active
    if ((t.status as string) === 'COMPLETED' || (t.status as string) === 'CANCELLED') {
      showToast('This tournament is no longer active.');
      return;
    }
    // 4. Tournament is not full
    const maxSlots = t.format === 'SOLO' ? 48 : t.format === 'DUO' ? 24 : 12;
    const curSlots = t.format === 'SOLO' ? t.currentPlayers : (t.currentTeams || 0);
    if (t.status === 'FULL' || curSlots >= maxSlots) {
      showToast('Slots for this tournament are already full.');
      return;
    }
    // 5. Already registered
    if (t.isRegistered || userRegistrations.some((r) => r.tournamentId === t.id && r.registrationStatus === 'CONFIRMED')) {
      showToast('You are already registered for this tournament.');
      return;
    }
    // 6. Existing pending payment
    if (t.isPaymentPending || userPayments.some((p) => p.tournamentId === t.id && p.status === 'PENDING')) {
      showToast('You already submitted payment proof. Awaiting admin verification.');
      return;
    }

    // Open RealPaymentModal
    setSelectedTournament(null);
    setActivePaymentModal({ tournament: t, regData });
  };

  const handleConfirmRegistration = (tId: string, reg: Partial<TournamentRegistrationItem>) => {
    const target = tournaments.find(t => t.id === tId);
    if (!target) return;

    if (player.walletBalance < target.entryFee) {
      showToast('Insufficient wallet balance!');
      return;
    }

    // Deduct entry fee
    setPlayer(p => ({ ...p, walletBalance: p.walletBalance - target.entryFee }));

    // Update tournament
    const newRegItem: TournamentRegistrationItem = {
      id: `reg-${Date.now()}`,
      userId: player.id,
      playerName: reg.playerName || player.name,
      playerUid: reg.playerUid || player.uid,
      teamName: reg.teamName,
      teammates: reg.teammates,
      slotNumber: (target.registrationsList?.length || 0) + 1,
      registeredAt: 'Just now',
    };

    setTournaments(prev => prev.map(t => {
      if (t.id !== tId) return t;
      const isSolo = t.format === 'SOLO';
      const isDuo = t.format === 'DUO';
      const isSquad = t.format === 'SQUAD';
      const isBigSlot = t.format === 'BIG_SLOT';
      const isCS = t.format === 'CLASH_SQUAD';

      const nextCurPlayers = isSolo
        ? t.currentPlayers + 1
        : isDuo
        ? t.currentPlayers + 2
        : isSquad || isBigSlot || isCS
        ? t.currentPlayers + 4
        : t.currentPlayers + 1;

      const nextCurTeams = (t.currentTeams || 0) + 1;

      return {
        ...t,
        isRegistered: true,
        currentPlayers: nextCurPlayers,
        currentTeams: nextCurTeams,
        registrationsList: [newRegItem, ...t.registrationsList],
      };
    }));

    showToast(`Successfully registered for ${target.name}!`);
  };

  return (
    <div className="w-full h-full flex flex-col relative" style={{ background: C.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Top App Bar */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2.5" style={{ background: C.navy, borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('PROFILE')}>
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ border: `2px solid ${C.yellow}`, boxShadow: `0 0 10px rgba(255,214,0,0.3)` }}>
            <img src={player.avatarUrl} alt="Me" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400">Welcome Back</p>
            <p className="text-sm font-black text-white leading-none">{player.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin Button */}
          <button
            onClick={() => setShowAdmin(true)}
            className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-[10px] font-black uppercase transition active:scale-95 cursor-pointer bg-purple-500/15 border border-purple-500/40 text-purple-300 hover:bg-purple-500/25"
          >
            <Shield className="w-3 h-3" /> ADMIN
          </button>

          {/* Wallet Balance Pill */}
          <button
            onClick={() => setActiveTab('WALLET')}
            className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 font-black text-[10px] transition active:scale-95 cursor-pointer bg-[#FFD600]/15 border border-[#FFD600]/30 text-[#FFD600]"
          >
            ₹{player.walletBalance.toLocaleString()}
          </button>

          {/* Notifications */}
          <button onClick={() => setShowNotifications(true)} className="relative w-8 h-8 rounded-xl flex items-center justify-center transition active:scale-95 cursor-pointer bg-[#111A2C] border border-zinc-800">
            <Bell className="w-4 h-4 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black bg-red-500 text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto scrollbar-none px-4 pt-4">
        {activeTab === 'HOME' && (
          <HomeTab
            player={player}
            tournaments={tournaments}
            onSelectTournament={setSelectedTournament}
            onTabChange={(tab) => setActiveTab(tab as TabName)}
            onFilterFormat={(fmt) => {
              setActiveFormatFilter(fmt);
              setActiveTab('TOURNAMENTS');
            }}
          />
        )}

        {activeTab === 'TOURNAMENTS' && (
          <TournamentsTab
            tournaments={tournaments}
            onSelectTournament={setSelectedTournament}
            activeFormatFilter={activeFormatFilter}
            setActiveFormatFilter={setActiveFormatFilter}
          />
        )}

        {activeTab === 'MY_GAMES' && (
          <MyGamesTab
            tournaments={tournaments}
            onSelectTournament={setSelectedTournament}
            onOpenDispute={() => showToast('Dispute system ready. Contact support if required.')}
            showToast={showToast}
            userPayments={userPayments}
            userRegistrations={userRegistrations}
            userResults={userResults}
            onOpenSubmitResult={(m) => setSubmissionMatch(m)}
          />
        )}

        {activeTab === 'RANKINGS' && <RankingsTab />}

        {activeTab === 'PROFILE' && (
          <ProfileTab
            player={player}
            onOpenWallet={() => setActiveTab('WALLET')}
            onOpenTournaments={() => setActiveTab('MY_GAMES')}
            onOpenRankings={() => setActiveTab('RANKINGS')}
            onOpenNotifications={() => setShowNotifications(true)}
            onOpenEditProfile={() => {
              const newIgn = prompt('Enter new In-game Name (IGN):', player.name);
              if (newIgn) setPlayer(p => ({ ...p, name: newIgn.trim() }));
            }}
            onOpenSettings={() => showToast('Settings saved.')}
            onOpenHelp={() => showToast('WhatsApp Support: +91 9876543210')}
            onOpenTerms={() => showToast('Rules: Fair-play & Anti-cheat strictly enforced.')}
            onSignOut={() => showToast('Session active.')}
          />
        )}

        {activeTab === 'WALLET' && (
          <WalletTab
            player={player}
            onBack={() => setActiveTab('PROFILE')}
            onAddMoney={(amt) => {
              setPlayer(p => ({ ...p, walletBalance: p.walletBalance + amt }));
            }}
            onWithdraw={(amt) => {
              setPlayer(p => ({
                ...p,
                walletBalance: Math.max(0, p.walletBalance - amt),
                winningsBalance: Math.max(0, p.winningsBalance - amt),
              }));
            }}
            showToast={showToast}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-shrink-0" style={{ background: C.navy, borderTop: `1px solid ${C.border}`, paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}>
        <div className="flex items-stretch">
          {NAV_ITEMS.map(({ tab, icon: Icon, label }) => {
            const isActive = activeTab === tab || (activeTab === 'WALLET' && tab === 'PROFILE');
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 flex flex-col items-center justify-center pt-2 pb-1.5 gap-0.5 transition active:scale-90 min-w-0 cursor-pointer"
                style={{ color: isActive ? C.yellow : C.textSec }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" style={{ filter: isActive ? 'drop-shadow(0 0 6px rgba(255,214,0,0.7))' : 'none' }} />
                <span className="text-[9px] font-bold leading-none">{label}</span>
                {isActive && <div className="w-4 h-0.5 rounded-full mt-0.5 bg-[#FFD600]" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-2xl animate-slide-in-up whitespace-nowrap bg-[#111A2C] border border-[#FFD600] text-[#FFD600] shadow-[0_8px_30px_rgba(0,0,0,0.8)]">
          <Zap className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Overlays / Modals */}
      {selectedTournament && (
        <TournamentDetailModal
          t={selectedTournament}
          onClose={() => setSelectedTournament(null)}
          player={player}
          onConfirmRegistration={handleConfirmRegistration}
          onOpenPaymentModal={handleOpenPaymentModal}
          isRegistered={userRegistrations.some((r) => r.tournamentId === selectedTournament.id && r.registrationStatus === 'CONFIRMED')}
          isPaymentPending={userPayments.some((p) => p.tournamentId === selectedTournament.id && p.status === 'PENDING')}
          isAuthenticated={!!activeUserId}
          showToast={showToast}
        />
      )}

      {/* Real UPI Payment Modal (Step 2) */}
      {activePaymentModal && (
        <RealPaymentModal
          tournament={activePaymentModal.tournament}
          registrationData={activePaymentModal.regData}
          userId={activeUserId}
          onSuccess={(payment) => {
            showToast(`Payment proof submitted for ${payment.tournamentName}! Awaiting verification.`);
            setTournaments((prev) =>
              prev.map((t) => {
                if (t.id !== payment.tournamentId) return t;
                return {
                  ...t,
                  isPaymentPending: true,
                  paymentId: payment.paymentId,
                };
              })
            );
          }}
          onClose={() => setActivePaymentModal(null)}
          onNavigateToMyMatches={() => {
            setActivePaymentModal(null);
            setSelectedTournament(null);
            setActiveTab('MY_GAMES');
          }}
        />
      )}

      {/* Match Result Submission Modal (Step 5) */}
      {submissionMatch && (
        <MatchSubmissionModal
          match={submissionMatch}
          tournament={submissionMatch}
          player={player}
          onClose={() => setSubmissionMatch(null)}
          onSuccess={() => {
            setSubmissionMatch(null);
            showToast('Match result submitted for admin verification!');
          }}
        />
      )}

      {showNotifications && (
        <NotificationsPanel onClose={() => setShowNotifications(false)} />
      )}

      {showAdmin && (
        <AdminDashboard
          tournaments={tournaments}
          setTournaments={setTournaments}
          onClose={() => setShowAdmin(false)}
          showToast={showToast}
          adminUid={activeUserId}
        />
      )}
    </div>
  );
};
