import React from 'react';
import { Smartphone, Code, Layers, Shield, Database, Cpu } from 'lucide-react';

export const FlutterAppGuide: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-6 h-6 text-blue-400" />
          <h2 className="font-display font-black text-2xl text-white">
            FLUTTER MOBILE ARCHITECTURE BLUEPRINT
          </h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Production-ready Flutter (Dart) mobile application specifications for FF Arena Android MVP.
        </p>
      </div>

      <div className="space-y-4 text-xs font-mono">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <h4 className="font-bold text-sm text-orange-400 font-sans">1. State Management & Core Stack</h4>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li><strong>State Management:</strong> Flutter Bloc / Riverpod 2.x</li>
            <li><strong>Backend Client:</strong> Supabase Flutter SDK (Auth, PostgREST, Realtime, Storage)</li>
            <li><strong>Push Notifications:</strong> Firebase Cloud Messaging (FCM) + Flutter Local Notifications</li>
            <li><strong>OCR Engine:</strong> Google ML Kit Text Recognition (for on-device screenshot parser)</li>
            <li><strong>Deep Linking:</strong> uni_links / app_links (for room codes and tournament shares)</li>
          </ul>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <h4 className="font-bold text-sm text-cyan-400 font-sans">2. Project Folder Structure</h4>
          <pre className="p-3 bg-slate-950 rounded-lg text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{`lib/
├── core/
│   ├── theme/          # FF Dark tactical themes, glow shaders
│   ├── network/        # Supabase API client & interceptors
│   └── utils/          # Rating Elo calculators & formatters
├── features/
│   ├── auth/           # Google Sign-in, Phone OTP, Free Fire UID
│   ├── tournaments/    # Discovery, Bracket, Filters, Detail
│   ├── custom_room/    # Scheduled release countdown & 1-tap copy
│   ├── results_ocr/    # ML Kit Screenshot parser & fraud checks
│   ├── teams/          # Squad creation, invites, roster
│   ├── rankings/       # Tier badges (Bronze - Grandmaster)
│   └── profile/        # Gamer identity, stats, achievements
└── main.dart           # App entry point with Supabase.initialize()`}
          </pre>
        </div>
      </div>
    </div>
  );
};
