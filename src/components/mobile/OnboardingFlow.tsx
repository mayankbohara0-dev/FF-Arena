import React, { useState, useRef } from 'react';
import { ChevronRight, Zap, Trophy, Wallet } from 'lucide-react';
import { tapFeedback } from '../../services/soundService';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    icon: Trophy,
    iconColor: '#FFE600',
    title: 'JOIN 48-PLAYER\nTOURNAMENTS',
    subtitle: 'Solo, Duo & Squad formats across Bermuda, Kalahari, Alpine & more. Admin-verified matches only.',
    bg: 'from-[#0E0E12] to-[#1A1A00]',
    accent: '#FFE600',
  },
  {
    icon: Zap,
    iconColor: '#FFE600',
    title: 'WIN ₹10\nPER KILL',
    subtitle: 'Every confirmed kill puts cash in your wallet. Booyah gets +₹20 extra. 2nd & 3rd place get +₹15.',
    bg: 'from-[#0E0E12] to-[#001A0D]',
    accent: '#FFE600',
  },
  {
    icon: Wallet,
    iconColor: '#FFE600',
    title: 'INSTANT UPI\nWITHDRAWAL',
    subtitle: 'Winnings credited after AI OCR result verification. Withdraw instantly to GPay, PhonePe or Paytm.',
    bg: 'from-[#0E0E12] to-[#00001A]',
    accent: '#FFE600',
  },
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);

  const next = () => {
    tapFeedback();
    if (current < SLIDES.length - 1) {
      setCurrent(current + 1);
    } else {
      localStorage.setItem('ff_onboarded', '1');
      onComplete();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setDragging(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!dragging) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (dx < -40 && current < SLIDES.length - 1) {
      setCurrent(current + 1);
    } else if (dx > 40 && current > 0) {
      setCurrent(current - 1);
    }
    setDragging(false);
  };

  const slide = SLIDES[current];
  const Icon = slide.icon;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#050507] flex flex-col items-center justify-between px-6 py-12 select-none`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip */}
      <button
        onClick={() => { localStorage.setItem('ff_onboarded', '1'); onComplete(); }}
        className="self-end text-xs text-zinc-500 hover:text-white transition px-2 py-1"
      >
        SKIP →
      </button>

      {/* Slide Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in" key={current}>
        {/* Icon circle */}
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center border-2 border-[#FFE600]/40 shadow-glow-yellow"
          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,230,0,0.12), transparent 70%)' }}
        >
          <Icon className="w-14 h-14" style={{ color: slide.iconColor }} strokeWidth={1.5} />
        </div>

        {/* Slide number */}
        <span className="text-[10px] font-black text-zinc-600 tracking-[0.3em] uppercase">
          {current + 1} / {SLIDES.length}
        </span>

        {/* Title */}
        <h2 className="font-display font-black text-3xl text-white leading-tight whitespace-pre-line tracking-wide">
          {slide.title}
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
          {slide.subtitle}
        </p>
      </div>

      {/* Bottom controls */}
      <div className="w-full space-y-5">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { tapFeedback(); setCurrent(i); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-[#FFE600]' : 'w-2 bg-zinc-700'
              }`}
            />
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={next}
          className="w-full py-4 rounded-2xl bg-[#FFE600] text-black font-black text-sm tracking-wider uppercase shadow-glow-yellow flex items-center justify-center gap-2 active:scale-95 transition"
        >
          <span>{current < SLIDES.length - 1 ? 'NEXT' : 'GET STARTED'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
