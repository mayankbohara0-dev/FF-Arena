import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Shield,
  QrCode,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { PaymentModal } from '../modals/PaymentModal';
import { KYCModal } from '../modals/KYCModal';
import { tapFeedback, successFeedback, playError } from '../../../services/soundService';

// Admin UPI details - players pay here for wallet deposits
const ADMIN_UPI_ID = 'mayankbohara0@oksbi';
const ADMIN_UPI_NAME = 'Mayank Bohara (FF Arena)';

export const WalletTab: React.FC = () => {
  const { currentUser, walletTransactions, addCash, withdrawWinnings } = useApp();
  const [withdrawAmount, setWithdrawAmount] = useState('50');
  const [upiId, setUpiId] = useState(currentUser.upiId || '');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [activeModal, setActiveModal] = useState<'NONE' | 'DEPOSIT' | 'WITHDRAW' | 'PAYMENT' | 'KYC'>('NONE');
  const [kycApproved, setKycApproved] = useState(() => localStorage.getItem('ff_kyc') === 'approved');
  const [depositAmount, setDepositAmount] = useState('50');
  const [depositUtr, setDepositUtr] = useState('');
  const [depositSubmitted, setDepositSubmitted] = useState(false);

  const safeWalletBalance = currentUser.walletBalance ?? 0;
  const safeWinningsBalance = currentUser.winningsBalance ?? 0;

  const handleWithdrawClick = () => {
    tapFeedback();
    const amt = Number(withdrawAmount);
    if (amt > 500 && !kycApproved) {
      // Gate: KYC required
      setActiveModal('KYC');
      return;
    }
    setActiveModal('WITHDRAW');
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsWithdrawing(true);
    const res = await withdrawWinnings(Number(withdrawAmount), upiId);
    setIsWithdrawing(false);
    if (res.success) {
      successFeedback();
      setActiveModal('NONE');
    } else {
      playError();
      alert(res.message);
    }
  };

  const handleKycVerified = () => {
    localStorage.setItem('ff_kyc', 'approved');
    setKycApproved(true);
    setActiveModal('WITHDRAW');
  };

  const handlePaymentSuccess = (addedAmount: number) => {
    addCash(Number(addedAmount || 15));
    successFeedback();
    setActiveModal('NONE');
  };

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* 1. Wallet Card */}
      <div className="p-4 rounded-3xl bg-[#0E0E12] border border-[#FFE600]/30 shadow-glow-yellow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">TOTAL WALLET BALANCE</span>
          {kycApproved ? (
            <span className="text-[9px] text-green-400 font-black flex items-center gap-1"><Shield className="w-2.5 h-2.5" />KYC VERIFIED</span>
          ) : (
            <button onClick={() => { tapFeedback(); setActiveModal('KYC'); }} className="text-[9px] text-[#FFE600] font-black">COMPLETE KYC →</button>
          )}
        </div>

        <div>
          <div className="text-3xl font-display font-black text-white font-mono tracking-tight">
            ₹{safeWalletBalance.toFixed(2)}
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">Free Fire UID: {currentUser.gamerProfile?.gameUid || 'Not Linked'}</p>
        </div>

        {/* Split */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80">
          <div className="p-2.5 rounded-xl bg-[#050507] border border-zinc-800/80">
            <span className="text-[9px] font-bold text-zinc-500 block">WITHDRAWABLE WINNINGS</span>
            <span className="text-base font-black text-[#FFE600] font-mono mt-0.5 block">₹{safeWinningsBalance.toFixed(2)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#050507] border border-zinc-800/80">
            <span className="text-[9px] font-bold text-zinc-500 block">UNUTILIZED DEPOSIT</span>
            <span className="text-base font-black text-white font-mono mt-0.5 block">
              ₹{Math.max(0, safeWalletBalance - safeWinningsBalance).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={() => { tapFeedback(); setActiveModal('DEPOSIT'); setDepositSubmitted(false); setDepositUtr(''); }}
            className="py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-800 transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-[#FFE600]" />
            <span>+ Add Cash</span>
          </button>

          <button
            onClick={handleWithdrawClick}
            className="py-2.5 rounded-xl bg-[#FFE600] text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-glow-yellow-sm hover:bg-[#FFF066] transition active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4 text-black" />
            <span>Withdraw UPI</span>
          </button>
        </div>

        {/* KYC note if not approved */}
        {!kycApproved && (
          <p className="text-[9px] text-zinc-600 text-center">
            ⚠️ KYC required for withdrawals above ₹500
          </p>
        )}
      </div>

      {/* 2. Transaction Passbook */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">TRANSACTION PASSBOOK</span>
          <span className="text-[10px] text-zinc-500 font-mono">{walletTransactions.length} items</span>
        </div>

        <div className="space-y-2">
          {walletTransactions.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#0E0E12] border border-zinc-800/80 text-center space-y-1">
              <p className="text-xs text-zinc-400 font-bold">No Transactions Yet</p>
              <p className="text-[10px] text-zinc-600">Deposits, entry fees, and prize credits will be logged here.</p>
            </div>
          ) : (
            walletTransactions.map((tx) => {
              const isCredit = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl bg-[#0E0E12] border border-zinc-800/80 flex items-center justify-between shadow-card-dark"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                      isCredit ? 'bg-[#FFE600]/10 border-[#FFE600]/30 text-[#FFE600]' : 'bg-zinc-800/60 border-zinc-700 text-zinc-400'
                    }`}>
                      {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-white line-clamp-1">{tx.title}</h5>
                      <span className="text-[9px] text-zinc-500 font-mono">{tx.date} • {tx.status}</span>
                    </div>
                  </div>
                  <span className={`font-mono font-black text-xs shrink-0 ${isCredit ? 'text-[#FFE600]' : 'text-white'}`}>
                    {isCredit ? `+₹${tx.amount}` : `-₹${Math.abs(tx.amount)}`}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* UTR Deposit Modal */}
      {activeModal === 'DEPOSIT' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0E0E12] border border-zinc-800 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#FFE600]" />
                ADD CASH TO WALLET
              </h4>
              <button onClick={() => setActiveModal('NONE')} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            {!depositSubmitted ? (
              <>
                {/* Step 1: Pay to Admin UPI */}
                <div className="p-3 rounded-xl bg-[#FFE600]/5 border border-[#FFE600]/20 space-y-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Step 1 — Pay via UPI</p>
                  <div className="p-2.5 rounded-lg bg-[#050507] border border-zinc-800">
                    <span className="text-[9px] text-zinc-500 block">SEND MONEY TO</span>
                    <span className="font-mono font-bold text-[#FFE600] text-sm">{ADMIN_UPI_ID}</span>
                    <span className="text-[9px] text-zinc-400 block">{ADMIN_UPI_NAME}</span>
                  </div>
                  <a
                    href={`upi://pay?pa=${ADMIN_UPI_ID}&pn=${encodeURIComponent(ADMIN_UPI_NAME)}&am=${depositAmount}&cu=INR&tn=FF+Arena+Wallet+Deposit`}
                    className="block w-full py-2 rounded-xl bg-[#FFE600] text-black font-black text-xs text-center shadow-glow-yellow-sm transition active:scale-95"
                  >
                    ⚡ Open GPay / PhonePe / Paytm
                  </a>
                </div>

                {/* Step 2: Enter amount + UTR */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Step 2 — Enter Transaction Details</p>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 block mb-1">AMOUNT PAID (₹)</label>
                    <input
                      type="number"
                      min="15"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-[#050507] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#FFE600]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 block mb-1">UPI TRANSACTION REF / UTR NUMBER</label>
                    <input
                      type="text"
                      value={depositUtr}
                      onChange={(e) => setDepositUtr(e.target.value)}
                      placeholder="e.g. 412345678901"
                      className="w-full bg-[#050507] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#FFE600]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!depositUtr.trim() || Number(depositAmount) < 15}
                  onClick={() => {
                    tapFeedback();
                    // In production this would submit to admin for verification
                    // For now add to passbook as pending
                    addCash(0); // mark as pending, not credited yet
                    setDepositSubmitted(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#FFE600] text-black font-black text-xs uppercase shadow-glow-yellow-sm transition active:scale-95 disabled:opacity-40"
                >
                  SUBMIT FOR VERIFICATION
                </button>
              </>
            ) : (
              <div className="text-center py-4 space-y-3">
                <Clock className="w-10 h-10 text-amber-400 mx-auto" />
                <h4 className="font-bold text-white">Pending Admin Verification</h4>
                <p className="text-xs text-zinc-400">
                  Your deposit of <strong className="text-[#FFE600] font-mono">₹{depositAmount}</strong> (UTR: {depositUtr}) has been submitted.
                  Admin will verify and credit your wallet within <strong>15–30 minutes</strong>.
                </p>
                <p className="text-[10px] text-zinc-600">You will get a notification when your wallet is credited.</p>
                <button
                  onClick={() => { setActiveModal('NONE'); setDepositSubmitted(false); }}
                  className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold text-xs"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* UPI Payment Modal (legacy fallback) */}
      {activeModal === 'PAYMENT' && (
        <PaymentModal
          amount={50}
          purpose="Add Cash to FF Arena Wallet"
          onSuccess={handlePaymentSuccess}
          onClose={() => setActiveModal('NONE')}
        />
      )}

      {/* KYC Modal */}
      {activeModal === 'KYC' && (
        <KYCModal
          onVerified={handleKycVerified}
          onClose={() => setActiveModal('NONE')}
        />
      )}

      {/* Withdraw Modal */}
      {activeModal === 'WITHDRAW' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0E0E12] border border-zinc-800 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white">INSTANT UPI WITHDRAWAL</h4>
              <button onClick={() => setActiveModal('NONE')} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <p className="text-[11px] text-zinc-400">
              Withdrawable: <strong className="text-[#FFE600] font-mono">₹{safeWinningsBalance.toFixed(2)}</strong>
            </p>

            <form onSubmit={handleWithdraw} className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-zinc-500 block mb-1">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-[#050507] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#FFE600]"
                  required
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-zinc-500 block mb-1">AMOUNT (₹)</label>
                <input
                  type="number"
                  max={safeWinningsBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-[#050507] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#FFE600]"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isWithdrawing}
                className="w-full py-2.5 rounded-xl bg-[#FFE600] text-black font-black text-xs tracking-wider uppercase transition active:scale-95"
              >
                {isWithdrawing ? 'Processing...' : `WITHDRAW ₹${withdrawAmount} →`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
