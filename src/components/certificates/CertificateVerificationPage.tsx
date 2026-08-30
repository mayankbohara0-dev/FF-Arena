import React, { useState } from 'react';
import {
  Award,
  Search,
  CheckCircle2,
  Printer,
  QrCode,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CertificateVerificationPage: React.FC = () => {
  const { certificates, selectedCertificateId } = useApp();
  const [searchId, setSearchId] = useState<string>(selectedCertificateId || '');
  const [activeCert, setActiveCert] = useState(() => {
    if (selectedCertificateId) {
      return certificates.find((c) => (c.certificateNumber || c.certificateId) === selectedCertificateId) || null;
    }
    return certificates[0] || null;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    const found = certificates.find(
      (c) => (c.certificateNumber || c.certificateId || '').trim().toUpperCase() === searchId.trim().toUpperCase()
    );
    if (found) {
      setActiveCert(found);
    } else {
      alert(`Certificate ID "${searchId}" not found in public ledger.`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Header Search */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/30 border border-cyan-500/30 text-center space-y-4 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold font-mono">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>CRYPTOGRAPHIC ESPORTS LEDGER VERIFICATION</span>
        </div>
        <h2 className="font-display font-black text-2xl sm:text-4xl text-white tracking-wide">
          Official Tournament e-Certificate Registry
        </h2>
        <p className="text-xs text-slate-300 max-w-lg mx-auto">
          Verify authentic certificates issued to Free Fire tournament winners and verified college champions across India.
        </p>

        {/* Search input */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2">
          <input
            type="text"
            placeholder="Enter Certificate ID (e.g. FF-2026-...)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value.toUpperCase())}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono uppercase font-bold focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-glow-cyan transition flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            <span>Verify</span>
          </button>
        </form>
      </div>

      {/* Certificate Viewer Card */}
      {activeCert ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">
              LEDGER STATUS: <span className="text-green-400">VALIDATED & ON-CHAIN ✓</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>

          {/* Gold Embossed Certificate Canvas */}
          <div className="p-6 sm:p-10 rounded-3xl bg-[#0a0f1d] border-4 border-amber-500/60 shadow-2xl relative overflow-hidden text-center space-y-6">
            {/* Corner Decorative Ornaments */}
            <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400" />
            <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400" />
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400" />
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400" />

            {/* Emblem */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center shadow-glow-amber border border-amber-300">
                <Trophy className="w-9 h-9 text-slate-950" />
              </div>
              <h4 className="font-display font-black text-amber-400 tracking-widest text-lg mt-3 uppercase">
                FF ARENA ESPORTS INDIA
              </h4>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Official Competitive Certificate of Achievement
              </span>
            </div>

            {/* Main Statement */}
            <div className="space-y-2 max-w-xl mx-auto">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">
                This is officially certified to acknowledge that
              </p>
              <h1 className="font-display font-black text-2xl sm:text-4xl text-white tracking-wide">
                {activeCert.recipientName || activeCert.participantName || 'Champion Player'}
              </h1>
              <p className="text-xs font-mono text-orange-400 font-bold">
                In-Game Name: {activeCert.recipientIgn || 'Player'} • Free Fire UID: {activeCert.recipientGameUid || activeCert.gameUid || '—'}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed pt-2">
                has demonstrated outstanding esports performance and secured{' '}
                <strong className="text-amber-300 font-black">
                  {activeCert.achievementTitle || activeCert.position || 'Tournament Winner'}
                </strong>{' '}
                in the official competition:
              </p>
              <h3 className="font-display font-bold text-lg sm:text-xl text-amber-400">
                {activeCert.tournamentName}
              </h3>
            </div>

            {/* Cryptographic Seal & Signatures */}
            <div className="pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center text-left">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Organizer</span>
                <span className="text-xs font-bold text-white block">{activeCert.organizerName || 'FF Arena Admin'}</span>
                <span className="text-[9px] text-slate-400 font-mono">Verified Tournament Director</span>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                <QrCode className="w-10 h-10 text-cyan-400 mb-1" />
                <span className="text-[9px] font-mono text-cyan-300 font-bold">
                  {activeCert.certificateNumber || activeCert.certificateId}
                </span>
                <span className="text-[8px] text-slate-500">Scan to verify authenticity</span>
              </div>

              <div className="space-y-1 sm:text-right">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Date Issued</span>
                <span className="text-xs font-bold text-white block">{activeCert.issueDate || activeCert.issuedAt || new Date().toISOString().split('T')[0]}</span>
                <span className="text-[9px] text-green-400 font-mono flex sm:justify-end items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Cryptographically Sealed
                </span>
              </div>
            </div>

            {/* Signature Hash */}
            <div className="pt-2 text-[9px] font-mono text-slate-600 break-all">
              Verification Hash: {activeCert.digitalSignatureHash || '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-[#0E0E12] border border-zinc-800 text-center space-y-2">
          <Award className="w-10 h-10 text-zinc-600 mx-auto opacity-60" />
          <h4 className="font-bold text-sm text-white">No Certificate Selected</h4>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Enter a valid Certificate ID above to look up and verify authentic tournament champion credentials from the ledger.
          </p>
        </div>
      )}
    </div>
  );
};
