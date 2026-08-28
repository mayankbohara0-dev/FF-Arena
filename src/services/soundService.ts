/**
 * FF Arena Sound & Haptic Service
 * Uses Web Audio API only — no external packages needed.
 */

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.2,
  startDelay = 0
): void {
  try {
    const ctx = getAudioCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + startDelay);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime + startDelay);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);

    oscillator.start(ctx.currentTime + startDelay);
    oscillator.stop(ctx.currentTime + startDelay + duration);
  } catch {
    // Silently fail — audio context may be blocked
  }
}

/** Subtle click on any button tap */
export function playTap(): void {
  playTone(800, 0.05, 'square', 0.1);
}

/** Soft success chime — wallet credit, payment confirmed */
export function playSuccess(): void {
  playTone(523, 0.15, 'sine', 0.2, 0.0);  // C5
  playTone(659, 0.15, 'sine', 0.2, 0.1);  // E5
  playTone(784, 0.25, 'sine', 0.25, 0.2); // G5
}

/** Booyah fanfare — room unlocked / tournament win */
export function playBooyah(): void {
  playTone(440, 0.08, 'square', 0.15, 0.0);
  playTone(554, 0.08, 'square', 0.15, 0.1);
  playTone(659, 0.08, 'square', 0.15, 0.2);
  playTone(880, 0.25, 'sine',   0.3,  0.3);
}

/** Error buzz — failed action, KYC blocked */
export function playError(): void {
  playTone(200, 0.15, 'sawtooth', 0.2, 0.0);
  playTone(150, 0.2,  'sawtooth', 0.2, 0.15);
}

/** Notification ping */
export function playNotif(): void {
  playTone(900, 0.08, 'sine', 0.15, 0.0);
  playTone(700, 0.12, 'sine', 0.15, 0.1);
}

/** Haptic vibration wrapper (Android Chrome + some iOS browsers) */
export function vibrate(pattern: number | number[] = 20): void {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    // Not supported
  }
}

/** Combined tap feedback */
export function tapFeedback(): void {
  playTap();
  vibrate(15);
}

/** Combined success feedback */
export function successFeedback(): void {
  playSuccess();
  vibrate([30, 50, 30]);
}

/** Combined booyah feedback */
export function booyahFeedback(): void {
  playBooyah();
  vibrate([50, 30, 80, 30, 120]);
}
