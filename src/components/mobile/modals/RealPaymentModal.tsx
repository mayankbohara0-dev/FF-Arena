/**
 * Real UPI Payment & Tournament Registration Modal — FF Arena (STEP 2)
 *
 * Implements:
 * 1. Live fetching of Firestore `paymentSettings/default` (no mock or hardcoded UPI/QR)
 * 2. Disabled/missing settings protection
 * 3. Copy UPI ID with clipboard API and visual feedback
 * 4. Real QR Code display with View Fullscreen & Download support
 * 5. Admin-configured payment instructions
 * 6. UTR validation (non-empty, whitespace cleanup, length & anti-dummy check)
 * 7. Payment screenshot selection, preview, type & size (5MB) validation
 * 8. Firebase Storage upload to `paymentScreenshots/{userId}/{paymentId}/{fileName}`
 * 9. Atomic Firestore payment record (`status = 'PENDING'`) & registration (`status = 'PAYMENT_PENDING'`)
 * 10. Duplicate UTR rejection ("This transaction ID has already been submitted.")
 * 11. Locked amount matching tournament entry fee
 * 12. Payment Status View: PENDING badge, "Payment proof submitted..."
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  QrCode,
  Download,
  Eye,
  AlertCircle,
  Clock,
  Upload,
  Image as ImageIcon,
  Trash2,
  Shield,
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  getPaymentSettings,
  submitPaymentAndRegistration,
  validateUtr,
  validateScreenshotFile,
  checkDuplicateUtr,
  checkExistingUserRegistration,
} from '../../../firebase/paymentService';
import type { PaymentSettingsDocument, PaymentDocument, RegistrationDocument } from '../../../types';
import { tapFeedback, successFeedback, playError } from '../../../services/soundService';

interface RealPaymentModalProps {
  tournament: {
    id: string;
    name: string;
    entryFee: number;
    format: string;
    startDate?: string;
    startTime?: string;
    currentPlayers: number;
    maxPlayers?: number;
    status: string;
  };
  registrationData: {
    playerName: string;
    playerUid: string;
    teamName?: string;
    teammates?: Array<{ name: string; uid: string }>;
  };
  userId: string;
  onSuccess: (payment: PaymentDocument, registration: RegistrationDocument) => void;
  onClose: () => void;
  onNavigateToMyMatches?: () => void;
}

export const RealPaymentModal: React.FC<RealPaymentModalProps> = ({
  tournament,
  registrationData,
  userId,
  onSuccess,
  onClose,
  onNavigateToMyMatches,
}) => {
  // Payment settings from Firestore
  const [settings, setSettings] = useState<PaymentSettingsDocument | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Form state
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [showQrLightbox, setShowQrLightbox] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState<'PAY' | 'STATUS'>('PAY');

  // Completed submission data
  const [completedPayment, setCompletedPayment] = useState<PaymentDocument | null>(null);
  const [completedRegistration, setCompletedRegistration] = useState<RegistrationDocument | null>(null);

  // Fetch Firestore paymentSettings/default on mount
  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      setLoadingSettings(true);
      setSettingsError(null);
      try {
        const data = await getPaymentSettings();
        if (!mounted) return;

        if (!data) {
          setSettingsError(
            'Payment settings have not been configured in Firestore. Please contact the tournament administrator.'
          );
        } else if (data.enabled === false) {
          setSettingsError(
            'UPI payments are temporarily disabled by the administrator. Please try again later.'
          );
        } else if (!data.upiId && !data.merchantUpiId) {
          setSettingsError(
            'Merchant UPI ID is missing in Firestore paymentSettings/default. Payments cannot be accepted.'
          );
        } else if (!data.qrImageUrl && !data.qrCodeUrl) {
          setSettingsError(
            'Merchant UPI QR Code image is missing in Firestore paymentSettings/default. Payments cannot be accepted.'
          );
        } else {
          setSettings(data);
        }
      } catch (err: any) {
        if (!mounted) return;
        setSettingsError(err?.message || 'Failed to load payment configuration from Firebase.');
      } finally {
        if (mounted) setLoadingSettings(false);
      }
    }

    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  // Pre-check for duplicate user registration on modal open
  useEffect(() => {
    let mounted = true;
    async function verifyEligibility() {
      if (!userId || !tournament.id) return;
      try {
        const existing = await checkExistingUserRegistration(userId, tournament.id);
        if (!mounted) return;
        if (existing.hasPendingOrApproved) {
          setSubmitError('You already have an existing pending or confirmed registration for this tournament.');
        }
      } catch (e) {
        // Ignored pre-check failure, will be caught at submit
      }
    }
    verifyEligibility();
    return () => {
      mounted = false;
    };
  }, [userId, tournament.id]);

  // Copy UPI ID to clipboard
  const handleCopyUpi = () => {
    const upi = settings?.upiId || settings?.merchantUpiId;
    if (!upi) return;
    tapFeedback();
    navigator.clipboard.writeText(upi).then(
      () => {
        setCopiedUpi(true);
        setTimeout(() => setCopiedUpi(false), 2000);
      },
      () => {
        setSubmitError('Could not access clipboard.');
      }
    );
  };

  // Download QR code image
  const handleDownloadQr = () => {
    const qrUrl = settings?.qrImageUrl || settings?.qrCodeUrl;
    if (!qrUrl) return;
    tapFeedback();

    // Trigger download via anchor
    const link = document.createElement('a');
    link.href = qrUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = `ff-arena-qr-${tournament.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubmitError(null);
    const check = validateScreenshotFile({
      size: file.size,
      type: file.type,
      name: file.name,
    });

    if (!check.valid) {
      playError();
      setSubmitError(check.error || 'Invalid file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setScreenshotFile(file);

    // Create object URL for preview
    const previewUrl = URL.createObjectURL(file);
    setScreenshotPreview(previewUrl);
    tapFeedback();
  };

  // Remove selected screenshot
  const handleRemoveScreenshot = () => {
    tapFeedback();
    setScreenshotFile(null);
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
      setScreenshotPreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit payment form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    tapFeedback();
    setSubmitError(null);

    // 1. Auth check
    if (!userId) {
      setSubmitError('You must be logged in to submit payment.');
      playError();
      return;
    }

    // 2. Settings check
    if (!settings || !settings.enabled) {
      setSubmitError('Payments are currently unavailable.');
      playError();
      return;
    }

    // 3. UTR validation
    const utrCheck = validateUtr(utrNumber);
    if (!utrCheck.valid) {
      setSubmitError(utrCheck.error || 'Please enter a valid 12-digit UTR.');
      playError();
      return;
    }

    // 4. Screenshot check
    if (!screenshotFile) {
      setSubmitError('Payment screenshot proof is required. Please upload your transaction receipt.');
      playError();
      return;
    }

    setSubmitting(true);

    try {
      // 5. Submit real payment + registration
      const result = await submitPaymentAndRegistration({
        userId,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        playerName: registrationData.playerName,
        playerUid: registrationData.playerUid,
        teamName: registrationData.teamName,
        teammates: registrationData.teammates,
        entryFee: tournament.entryFee, // Protected amount directly from tournament
        utr: utrCheck.cleanUtr,
        screenshotFile,
        screenshotFileName: screenshotFile.name,
      });

      setCompletedPayment(result.payment);
      setCompletedRegistration(result.registration);
      setStep('STATUS');
      successFeedback();
      onSuccess(result.payment, result.registration);
    } catch (err: any) {
      console.error('[RealPaymentModal] Submission failed:', err);
      playError();
      setSubmitError(err.message || 'Payment submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeUpiId = settings?.upiId || settings?.merchantUpiId || '';
  const activeQrUrl = settings?.qrImageUrl || settings?.qrCodeUrl || '';
  const activeInstructions =
    settings?.instructions ||
    '1. Pay the exact tournament entry fee using any UPI App (GPay, PhonePe, Paytm).\n2. Copy the 12-digit UTR / UPI Reference Number from your payment receipt.\n3. Take a screenshot of the completed payment and upload it below.\n4. Admin will verify your transaction against bank records.';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in p-0 sm:p-4">
      <div className="bg-[#080D18] border border-[#202B40] rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-slide-in-up">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#202B40] flex items-center justify-between bg-[#050811]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFD600]/15 border border-[#FFD600]/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#FFD600]" />
            </div>
            <div>
              <h3 className="font-black text-xs sm:text-sm text-white uppercase tracking-wider">
                {step === 'STATUS' ? 'PAYMENT PROOF SUBMITTED' : 'REAL UPI PAYMENT PROOF'}
              </h3>
              <p className="text-[10px] text-zinc-400 truncate max-w-[240px]">
                {tournament.name} • ₹{tournament.entryFee} Entry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">

          {/* Loading Settings State */}
          {loadingSettings && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 mx-auto text-[#FFD600] animate-spin" />
              <p className="text-xs text-zinc-400">Connecting to Firebase & fetching UPI configuration...</p>
            </div>
          )}

          {/* Settings Error / Disabled State */}
          {!loadingSettings && settingsError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-2">
              <div className="flex items-center gap-2 text-red-400 text-xs font-black uppercase">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>PAYMENT UNAVAILABLE</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">{settingsError}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:text-white"
              >
                Close & Return
              </button>
            </div>
          )}

          {/* STEP 1: PAYMENT SUBMISSION FLOW */}
          {!loadingSettings && !settingsError && step === 'PAY' && (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Tournament & Amount Overview (Locked / Non-Editable) */}
              <div className="p-3.5 rounded-2xl bg-[#0D1424] border border-[#202B40] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Tournament:</span>
                  <span className="font-bold text-white truncate max-w-[200px]">{tournament.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Player IGN:</span>
                  <span className="font-bold text-[#FFD600]">{registrationData.playerName}</span>
                </div>
                {registrationData.teamName && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Squad Name:</span>
                    <span className="font-bold text-white">{registrationData.teamName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-[#202B40]">
                  <span className="font-black text-xs text-white uppercase tracking-wider">Exact Entry Fee:</span>
                  <div className="text-right">
                    <span className="text-lg font-black text-[#FFD600] font-mono">
                      ₹{tournament.entryFee}.00
                    </span>
                    <span className="text-[9px] text-zinc-400 block font-sans">Locked • Non-Negotiable</span>
                  </div>
                </div>
              </div>

              {/* Real UPI ID Section from Firestore */}
              <div className="p-3.5 rounded-2xl bg-[#0D1424] border border-[#202B40] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    OFFICIAL MERCHANT UPI ID
                  </span>
                  <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/50 border border-zinc-800">
                  <span className="font-mono text-xs font-black text-[#FFD600] truncate">
                    {activeUpiId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-3 py-1.5 rounded-lg bg-[#FFD600]/15 border border-[#FFD600]/40 text-[#FFD600] text-[10px] font-black flex items-center gap-1.5 hover:bg-[#FFD600]/25 transition active:scale-95 cursor-pointer flex-shrink-0"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUpi ? 'UPI ID COPIED' : 'COPY UPI ID'}</span>
                  </button>
                </div>
              </div>

              {/* Real QR Code Section from Firebase */}
              <div className="p-3.5 rounded-2xl bg-[#0D1424] border border-[#202B40] space-y-3 text-center">
                <div className="flex items-center justify-between text-left">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
                      SCAN UPI QR CODE
                    </span>
                    <span className="text-[10px] text-zinc-500">Google Pay, PhonePe, Paytm, BHIM</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowQrLightbox(true)}
                      className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer"
                      title="View QR Fullscreen"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer"
                      title="Download QR"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                {/* QR Image */}
                <div
                  onClick={() => setShowQrLightbox(true)}
                  className="w-44 h-44 mx-auto p-2 bg-white rounded-2xl shadow-xl flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#FFD600] transition group relative"
                >
                  <img
                    src={activeQrUrl}
                    alt="Official Tournament UPI QR"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/30 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <span className="px-2 py-1 rounded bg-black/80 text-white text-[9px] font-bold">
                      Click to Enlarge
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Scan and pay exactly <strong className="text-[#FFD600]">₹{tournament.entryFee}</strong>
                </p>
              </div>

              {/* Payment Instructions from Firestore */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-zinc-800 space-y-1.5 text-left">
                <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-bold">
                  <Info className="w-3.5 h-3.5 text-[#FFD600]" />
                  <span>PAYMENT INSTRUCTIONS</span>
                </div>
                <div className="text-[11px] text-zinc-400 leading-relaxed whitespace-pre-line pl-5">
                  {activeInstructions}
                </div>
              </div>

              {/* ── Submission Inputs ── */}
              <div className="space-y-3 pt-1">
                {/* UTR Number Input */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-300 block mb-1">
                    12-DIGIT UPI REFERENCE / UTR NUMBER <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. 423819284910"
                    maxLength={22}
                    className="w-full bg-[#0D1424] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm font-bold tracking-wider focus:outline-none focus:border-[#FFD600] transition placeholder:text-zinc-600"
                    required
                  />
                  <span className="text-[9px] text-zinc-500 block mt-1">
                    Found on your UPI payment receipt (Google Pay, PhonePe, Paytm, BHIM)
                  </span>
                </div>

                {/* Screenshot Upload with Preview */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-300 block mb-1">
                    PAYMENT SCREENSHOT PROOF <span className="text-red-400">*</span>
                  </label>

                  {!screenshotPreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-zinc-700 hover:border-[#FFD600]/60 rounded-2xl p-4 text-center cursor-pointer bg-[#0D1424] transition space-y-2"
                    >
                      <Upload className="w-6 h-6 mx-auto text-zinc-400" />
                      <div>
                        <p className="text-xs font-bold text-white">Click to upload screenshot</p>
                        <p className="text-[10px] text-zinc-500">JPG, JPEG, or PNG up to 5MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-[#0D1424] border border-[#202B40] space-y-2">
                      <div className="relative rounded-xl overflow-hidden bg-black max-h-48 flex items-center justify-center">
                        <img
                          src={screenshotPreview}
                          alt="Screenshot Preview"
                          className="max-h-48 object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-1.5 text-zinc-300 truncate max-w-[200px]">
                          <ImageIcon className="w-3.5 h-3.5 text-[#FFD600]" />
                          <span className="text-[10px] truncate">{screenshotFile?.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveScreenshot}
                          className="text-red-400 hover:text-red-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Change
                        </button>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Error Banner */}
              {submitError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">{submitError}</span>
                </div>
              )}

              {/* Important Disclaimer */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 leading-snug flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-400" />
                <span>
                  Payments are verified manually by admin against live bank statements before slots are confirmed.
                  Fake or reused UTR numbers result in an immediate account ban.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !utrNumber.trim() || !screenshotFile}
                className="w-full py-3.5 rounded-xl bg-[#FFD600] text-black font-black text-xs uppercase tracking-wider transition active:scale-95 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,214,0,0.3)] hover:bg-[#FFE033]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>UPLOADING PROOF & RECORDING...</span>
                  </>
                ) : (
                  <span>SUBMIT PAYMENT PROOF (₹{tournament.entryFee}) →</span>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: PAYMENT STATUS VIEW (POST SUBMISSION) */}
          {step === 'STATUS' && completedPayment && (
            <div className="space-y-4 py-2 text-center animate-fade-in">
              
              {/* Status Icon */}
              <div className="w-16 h-16 rounded-full bg-[#FFD600]/20 border-2 border-[#FFD600] flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(255,214,0,0.3)]">
                <Clock className="w-8 h-8 text-[#FFD600] animate-pulse" />
              </div>

              {/* Primary Status Banner */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD600]/15 border border-[#FFD600]/40 text-[#FFD600] text-xs font-black uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  <span>PAYMENT STATUS: PENDING</span>
                </div>
                <h4 className="text-base font-black text-white pt-1">PROOF SUBMITTED FOR VERIFICATION</h4>
                <p className="text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed">
                  "Payment proof submitted. Your payment will be manually verified by the admin."
                </p>
              </div>

              {/* Summary Details */}
              <div className="p-4 rounded-2xl bg-[#0D1424] border border-[#202B40] text-left space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Tournament:</span>
                  <span className="font-bold text-white truncate max-w-[200px]">{completedPayment.tournamentName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Amount Paid:</span>
                  <span className="font-mono font-black text-[#FFD600]">₹{completedPayment.amount}.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Submitted UTR:</span>
                  <span className="font-mono font-bold text-white">{completedPayment.utr}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Payment ID:</span>
                  <span className="font-mono text-[10px] text-zinc-400">{completedPayment.paymentId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Submission Date:</span>
                  <span className="text-zinc-300">{new Date().toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#202B40]">
                  <span className="text-zinc-400">Registration Status:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#FFD600]/20 text-[#FFD600] border border-[#FFD600]/40">
                    PAYMENT_PENDING
                  </span>
                </div>
              </div>

              {/* Screenshot thumbnail */}
              {screenshotPreview && (
                <div className="p-3 rounded-2xl bg-black/40 border border-zinc-800 text-left space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">UPLOADED RECEIPT:</span>
                  <div className="h-28 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                    <img src={screenshotPreview} alt="Receipt" className="h-full object-contain" />
                  </div>
                </div>
              )}

              {/* Next steps notice */}
              <div className="p-3 rounded-xl bg-[#050811] border border-zinc-800 text-left text-[11px] text-zinc-400 leading-relaxed">
                <p className="font-bold text-white mb-1">What happens next?</p>
                <p>
                  1. Admin matches your UTR with the official bank ledger.<br />
                  2. Upon verification, your registration status will change to <strong>CONFIRMED</strong>.<br />
                  3. Room ID and password will be unlocked 15 minutes before match start in the <strong>My Matches</strong> tab.
                </p>
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToMyMatches?.();
                  }}
                  className="flex-1 py-3 rounded-xl bg-[#FFD600] text-black font-black text-xs uppercase tracking-wider cursor-pointer hover:bg-[#FFE033] transition"
                >
                  Go to My Matches →
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs uppercase hover:text-white transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* QR Lightbox / Fullscreen Viewer */}
      {showQrLightbox && activeQrUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 animate-fade-in"
          onClick={() => setShowQrLightbox(false)}
        >
          <div
            className="max-w-sm w-full bg-[#080D18] border border-zinc-700 rounded-3xl p-5 text-center space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-white">MERCHANT UPI QR CODE</span>
              <button
                onClick={() => setShowQrLightbox(false)}
                className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-64 h-64 mx-auto p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center">
              <img src={activeQrUrl} alt="UPI QR Enlarge" className="w-full h-full object-contain" />
            </div>

            <p className="font-mono text-sm font-black text-[#FFD600]">{activeUpiId}</p>

            <div className="flex gap-2">
              <button
                onClick={handleCopyUpi}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-xs font-bold text-white flex items-center justify-center gap-1.5"
              >
                {copiedUpi ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUpi ? 'Copied' : 'Copy UPI ID'}</span>
              </button>
              <button
                onClick={handleDownloadQr}
                className="flex-1 py-2.5 rounded-xl bg-[#FFD600] text-black text-xs font-black flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download QR</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
