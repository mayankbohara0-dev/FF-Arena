import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  User,
  Trophy,
} from 'lucide-react';
import type { PaymentDocument } from '../../types';
import {
  subscribeAllPayments,
  approvePaymentTransaction,
  rejectPaymentTransaction,
} from '../../firebase/paymentService';
import { useAuth } from '../../context/AuthContext';
import { isEmailAdmin, getAdminEmails } from '../../firebase/authService';

interface PaymentVerificationPanelProps {
  adminUid: string;
  showToast?: (msg: string) => void;
  onClose?: () => void;
}

const REJECTION_PRESETS = [
  'Invalid / Fake UTR',
  'Amount Mismatch',
  'Unclear / Fake Screenshot',
  'Payment Not Received in Bank',
  'Duplicate Transaction Reference',
  'Other',
];

export const PaymentVerificationPanel: React.FC<PaymentVerificationPanelProps> = ({
  adminUid,
  showToast,
  onClose,
}) => {
  const { user: authUser, firebaseUser } = useAuth();
  const currentEmail = authUser?.email || firebaseUser?.email || '';
  const isAuthorizedAdmin = isEmailAdmin(currentEmail) || authUser?.role === 'admin';

  const [payments, setPayments] = useState<PaymentDocument[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Modals state
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [approvingPayment, setApprovingPayment] = useState<PaymentDocument | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<PaymentDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState(REJECTION_PRESETS[0]);
  const [customRejectNote, setCustomRejectNote] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Subscribe to real-time payments across all players
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeAllPayments((allList) => {
      setPayments(allList);
      setLoading(false);
    }, 'ALL');

    return () => {
      unsubscribe();
    };
  }, []);

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    const matchStatus = filter === 'ALL' || p.status === filter;
    if (!matchStatus) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.playerName?.toLowerCase().includes(q) ||
      p.tournamentName?.toLowerCase().includes(q) ||
      p.utr?.toLowerCase().includes(q) ||
      p.paymentId?.toLowerCase().includes(q) ||
      p.userId?.toLowerCase().includes(q)
    );
  });

  const pendingCount = payments.filter((p) => p.status === 'PENDING').length;
  const approvedCount = payments.filter((p) => p.status === 'APPROVED').length;
  const rejectedCount = payments.filter((p) => p.status === 'REJECTED').length;

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr).catch(() => {});
    setCopiedUtr(utr);
    showToast?.(`Copied UTR: ${utr}`);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleApproveConfirm = async () => {
    if (!approvingPayment) return;
    setActionInProgress(true);
    setActionError(null);

    try {
      const res = await approvePaymentTransaction(approvingPayment.paymentId, adminUid);
      showToast?.(res.message || 'Payment approved and slot confirmed!');
      setApprovingPayment(null);
    } catch (err: any) {
      console.error('[Admin Verification] Approval failed:', err);
      setActionError(err.message || 'Approval failed. Please check tournament slot capacity.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingPayment) return;
    setActionInProgress(true);
    setActionError(null);

    const finalReason =
      rejectionReason === 'Other'
        ? customRejectNote.trim() || 'Payment details could not be verified.'
        : customRejectNote.trim()
        ? `${rejectionReason} — ${customRejectNote.trim()}`
        : rejectionReason;

    try {
      const res = await rejectPaymentTransaction(
        rejectingPayment.paymentId,
        finalReason,
        adminUid
      );
      showToast?.(res.message || 'Payment marked as rejected.');
      setRejectingPayment(null);
      setCustomRejectNote('');
    } catch (err: any) {
      console.error('[Admin Verification] Rejection failed:', err);
      setActionError(err.message || 'Rejection failed.');
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080E1A] text-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-[#0D1527] border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FFD600]/15 border border-[#FFD600]/30 flex items-center justify-center text-[#FFD600]">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                PAYMENT VERIFICATION
              </h2>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-[#FFD600] text-black">
                REAL FIRESTORE
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Manual UPI & Bank Statement Verification Workflow
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Manual Verification Warning Banner */}
      <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed text-amber-200/90">
          <strong className="text-amber-300 font-bold block mb-0.5">
            Admin Verification Mandatory Protocol:
          </strong>
          Cross-check the submitted <strong>UTR / Transaction ID</strong> and <strong>Amount</strong> directly against your UPI app (PhonePe / Google Pay / Paytm / Bank statement). No automatic bank clearance is claimed.
        </div>
      </div>

      {/* Authorization Status Banner */}
      {!isAuthorizedAdmin && (
        <div className="mx-4 mt-2 p-3 rounded-xl bg-red-500/15 border border-red-500/40 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-red-200">
            <strong className="text-red-300 font-bold block mb-0.5">
              Read-Only Governance Mode:
            </strong>
            The active account ({currentEmail || 'guest player'}) is not an authorized administrator. Approvals, rejections, and setting modifications are restricted to verified admins.
          </div>
        </div>
      )}

      {/* Filter Tabs and Search Bar */}
      <div className="px-4 pt-3 pb-2 space-y-2.5 border-b border-zinc-800/80 bg-[#0A1020]">
        <div className="flex items-center justify-between gap-2">
          {/* Tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                filter === 'PENDING'
                  ? 'bg-[#FFD600] text-black shadow-[0_0_12px_rgba(255,214,0,0.3)]'
                  : 'bg-[#111A2E] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Pending
              <span
                className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
                  filter === 'PENDING' ? 'bg-black text-[#FFD600]' : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setFilter('APPROVED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                filter === 'APPROVED'
                  ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-[#111A2E] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approved
              <span
                className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
                  filter === 'APPROVED' ? 'bg-black/30 text-white' : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {approvedCount}
              </span>
            </button>

            <button
              onClick={() => setFilter('REJECTED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                filter === 'REJECTED'
                  ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                  : 'bg-[#111A2E] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Rejected
              <span
                className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
                  filter === 'REJECTED' ? 'bg-black/30 text-white' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {rejectedCount}
              </span>
            </button>

            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition active:scale-95 cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-zinc-200 text-black'
                  : 'bg-[#111A2E] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              All ({payments.length})
            </button>
          </div>

          <p className="text-[10px] font-mono text-zinc-400 flex-shrink-0">
            {filteredPayments.length} records
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Player, UTR, Tournament, or ID..."
            className="w-full bg-[#111A2E] border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FFD600]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Payment Cards List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-20">
        {loading ? (
          <div className="py-20 text-center space-y-2">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-[#FFD600]" />
            <p className="text-xs text-zinc-400">Loading Cloud Firestore payment records...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-[#0D1527] rounded-2xl border border-zinc-800/80 p-6">
            <Shield className="w-10 h-10 mx-auto opacity-20 text-[#FFD600]" />
            <p className="font-bold text-white text-sm">
              No {filter !== 'ALL' ? filter.toLowerCase() : ''} payments found
            </p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {filter === 'PENDING'
                ? 'All submitted payments have been verified! New submissions from players will appear here in real-time.'
                : 'No payments match the current filter or search criteria.'}
            </p>
          </div>
        ) : (
          filteredPayments.map((p) => {
            const isPending = p.status === 'PENDING';
            const isApproved = p.status === 'APPROVED';
            const isRejected = p.status === 'REJECTED';

            const submittedDate = p.submittedAt
              ? new Date(
                  p.submittedAt.seconds ? p.submittedAt.seconds * 1000 : p.submittedAt
                ).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent';

            return (
              <div
                key={p.paymentId}
                className={`p-4 rounded-2xl bg-[#0D1527] border transition-all ${
                  isPending
                    ? 'border-[#FFD600]/40 shadow-[0_0_15px_rgba(255,214,0,0.06)]'
                    : isApproved
                    ? 'border-emerald-500/30'
                    : 'border-red-500/30 opacity-80'
                }`}
              >
                {/* Top Row: Tournament & Status */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-800/80">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-3.5 h-3.5 text-[#FFD600] flex-shrink-0" />
                      <h3 className="text-sm font-black text-white truncate">{p.tournamentName}</h3>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-400 mt-0.5 truncate">
                      Tournament ID: {p.tournamentId} • Payment ID: {p.paymentId}
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 flex-shrink-0 border ${
                      isPending
                        ? 'bg-[#FFD600]/15 text-[#FFD600] border-[#FFD600]/30 animate-pulse'
                        : isApproved
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/15 text-red-400 border-red-500/30'
                    }`}
                  >
                    {isPending && <Clock className="w-3 h-3" />}
                    {isApproved && <CheckCircle2 className="w-3 h-3" />}
                    {isRejected && <XCircle className="w-3 h-3" />}
                    {p.status}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3 text-xs">
                  {/* Player */}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800/80">
                    <span className="text-[8px] font-bold uppercase text-zinc-400 block mb-0.5">
                      PLAYER NAME / UID
                    </span>
                    <span className="font-bold text-white block truncate">{p.playerName}</span>
                    <span className="text-[9px] font-mono text-zinc-400 block truncate">
                      UID: {p.userId}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800/80">
                    <span className="text-[8px] font-bold uppercase text-zinc-400 block mb-0.5">
                      ENTRY FEE (₹)
                    </span>
                    <span className="text-base font-black text-[#FFD600] font-mono block">
                      ₹{p.amount}.00
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold block">
                      Official Tournament Rate
                    </span>
                  </div>

                  {/* Submitted UTR with Copy */}
                  <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800/80 col-span-2 sm:col-span-2">
                    <span className="text-[8px] font-bold uppercase text-zinc-400 block mb-0.5">
                      SUBMITTED UTR / TRANSACTION ID
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-black text-white tracking-wider truncate select-all">
                        {p.utr}
                      </span>
                      <button
                        onClick={() => handleCopyUtr(p.utr)}
                        className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold flex items-center gap-1 flex-shrink-0 cursor-pointer active:scale-95"
                      >
                        {copiedUtr === p.utr ? (
                          <>
                            <Check className="w-3 h-3 text-green-400" />
                            <span className="text-green-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy UTR</span>
                          </>
                        )}
                      </button>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono block mt-1">
                      Submitted: {submittedDate}
                    </span>
                  </div>
                </div>

                {/* Screenshot Preview Card */}
                {p.screenshotUrl ? (
                  <div className="p-2.5 rounded-xl bg-black/30 border border-zinc-800/80 flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => {
                          setLightboxImageUrl(p.screenshotUrl || null);
                          setLightboxZoom(1);
                        }}
                        className="w-14 h-14 rounded-lg overflow-hidden bg-black border border-zinc-700/60 cursor-pointer relative group flex-shrink-0"
                      >
                        <img
                          src={p.screenshotUrl}
                          alt="Proof"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-zinc-200 block">
                          Payment Proof Screenshot
                        </span>
                        <span className="text-[10px] text-zinc-400 block">
                          Stored securely on Firebase Storage
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setLightboxImageUrl(p.screenshotUrl || null);
                          setLightboxZoom(1);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#FFD600]" />
                        View Full Screen
                      </button>
                      <a
                        href={p.screenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[10px] text-zinc-500 mb-3 text-center">
                    No screenshot URL provided
                  </div>
                )}

                {/* Audit & Notes Display */}
                {isApproved && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 flex items-center justify-between mb-3">
                    <span>
                      ✓ Verified & Slot Confirmed by Admin UID:{' '}
                      <strong className="font-mono">{p.verifiedBy || 'admin'}</strong>
                    </span>
                    <span>
                      {p.verifiedAt
                        ? new Date(
                            p.verifiedAt.seconds ? p.verifiedAt.seconds * 1000 : p.verifiedAt
                          ).toLocaleString('en-IN')
                        : ''}
                    </span>
                  </div>
                )}

                {isRejected && p.adminNote && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] text-red-300 mb-3">
                    <strong>Rejection Reason:</strong> {p.adminNote}
                  </div>
                )}

                {/* Action Buttons (Only for PENDING or already processed indicator) */}
                <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
                  {isPending ? (
                    <>
                      <button
                        disabled={!isAuthorizedAdmin}
                        onClick={() => {
                          if (!isAuthorizedAdmin) {
                            showToast?.('Unauthorized: Admin account required to approve payments.');
                            return;
                          }
                          setActionError(null);
                          setApprovingPayment(p);
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.25)] ${
                          !isAuthorizedAdmin
                            ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed opacity-60'
                            : 'bg-emerald-500 hover:bg-emerald-400'
                        }`}
                        title={!isAuthorizedAdmin ? 'Admin account required' : 'Approve Payment'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        APPROVE PAYMENT
                      </button>

                      <button
                        disabled={!isAuthorizedAdmin}
                        onClick={() => {
                          if (!isAuthorizedAdmin) {
                            showToast?.('Unauthorized: Admin account required to reject payments.');
                            return;
                          }
                          setActionError(null);
                          setRejectingPayment(p);
                          setRejectionReason(REJECTION_PRESETS[0]);
                          setCustomRejectNote('');
                        }}
                        className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                          !isAuthorizedAdmin
                            ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-60'
                            : 'bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300'
                        }`}
                        title={!isAuthorizedAdmin ? 'Admin account required' : 'Reject Payment'}
                      >
                        <XCircle className="w-4 h-4" />
                        REJECT PAYMENT
                      </button>
                    </>
                  ) : isApproved ? (
                    <div className="w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-not-allowed">
                      <CheckCircle2 className="w-4 h-4" />
                      PAYMENT APPROVED • SLOT CONSUMED
                    </div>
                  ) : (
                    <div className="w-full py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-center text-xs font-black text-red-400 uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-not-allowed">
                      <XCircle className="w-4 h-4" />
                      PAYMENT REJECTED • NO SLOT ALLOCATED
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lightbox / Screenshot Viewer Modal */}
      {lightboxImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col animate-fade-in"
          onClick={() => setLightboxImageUrl(null)}
        >
          {/* Lightbox Header */}
          <div
            className="p-3 bg-black/60 border-b border-zinc-800 flex items-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                PAYMENT PROOF LIGHTBOX
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                Zoom: {Math.round(lightboxZoom * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLightboxZoom((prev) => Math.min(prev + 0.25, 3))}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLightboxZoom((prev) => Math.max(prev - 0.25, 0.5))}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLightboxZoom(1)}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <a
                href={lightboxImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[#FFD600] cursor-pointer"
                title="Open in new window"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => setLightboxImageUrl(null)}
                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500 text-white cursor-pointer ml-2"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Image Container */}
          <div
            className="flex-1 overflow-auto flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImageUrl}
              alt="Full Payment Proof"
              style={{ transform: `scale(${lightboxZoom})`, transition: 'transform 0.15s ease' }}
              className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal for Approval */}
      {approvingPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div
            className="w-full max-w-md bg-[#0D1527] border border-[#FFD600]/40 rounded-2xl p-5 space-y-4 shadow-[0_0_40px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  CONFIRM PAYMENT APPROVAL
                </h3>
                <p className="text-xs text-zinc-400">Manual Verification Confirmation</p>
              </div>
            </div>

            {/* Prompt */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
              <p className="text-xs font-black text-amber-300">
                Have you verified that this payment was actually received?
              </p>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                Confirm that ₹{approvingPayment.amount} with UTR{' '}
                <strong className="font-mono text-white">{approvingPayment.utr}</strong> appears in
                your merchant bank account or UPI statement.
              </p>
            </div>

            {/* Payment Summary */}
            <div className="space-y-1.5 text-xs bg-black/40 p-3 rounded-xl border border-zinc-800">
              <div className="flex justify-between">
                <span className="text-zinc-400">Player:</span>
                <span className="font-bold text-white">{approvingPayment.playerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Tournament:</span>
                <span className="font-bold text-white">{approvingPayment.tournamentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Entry Fee:</span>
                <span className="font-mono font-black text-[#FFD600]">
                  ₹{approvingPayment.amount}.00
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">UTR:</span>
                <span className="font-mono text-white">{approvingPayment.utr}</span>
              </div>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-bold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApprovingPayment(null)}
                disabled={actionInProgress}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveConfirm}
                disabled={actionInProgress}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
              >
                {actionInProgress ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    APPROVING...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    YES, APPROVE PAYMENT
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Rejection */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div
            className="w-full max-w-md bg-[#0D1527] border border-red-500/40 rounded-2xl p-5 space-y-4 shadow-[0_0_40px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  REJECT PAYMENT PROOF
                </h3>
                <p className="text-xs text-zinc-400">Slot will NOT be allocated</p>
              </div>
            </div>

            {/* Select Reason Preset */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-zinc-400">
                SELECT REJECTION REASON:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {REJECTION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className={`p-2 rounded-xl text-[10px] font-bold text-left transition cursor-pointer border ${
                      rejectionReason === preset
                        ? 'bg-red-500/20 border-red-500 text-white'
                        : 'bg-black/30 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Admin Note */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-400">
                ADDITIONAL ADMIN NOTE (VISIBLE TO PLAYER):
              </label>
              <textarea
                value={customRejectNote}
                onChange={(e) => setCustomRejectNote(e.target.value)}
                placeholder="Explain clearly to the player why the payment was rejected..."
                rows={2}
                className="w-full bg-black/40 border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-bold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingPayment(null)}
                disabled={actionInProgress}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={actionInProgress}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase tracking-wider transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-50"
              >
                {actionInProgress ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    REJECTING...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    CONFIRM REJECTION
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
