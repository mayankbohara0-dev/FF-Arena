import { ScoringRules, TierName } from '../types';

export const DEFAULT_SCORING_RULES: ScoringRules = {
  placementPoints: {
    1: 12,
    2: 9,
    3: 8,
    4: 7,
    5: 6,
    6: 5,
    7: 4,
    8: 3,
    9: 2,
    10: 1,
    11: 0,
    12: 0,
  },
  killPoint: 1,
  customBonus: {
    firstBloodBonus: 2,
    mostKillsBonus: 3
  }
};

export const TIER_THRESHOLDS: { tier: TierName; min: number; max: number; color: string; badge: string }[] = [
  { tier: 'Bronze', min: 0, max: 999, color: '#cd7f32', badge: '🥉' },
  { tier: 'Silver', min: 1000, max: 1199, color: '#c0c0c0', badge: '🥈' },
  { tier: 'Gold', min: 1200, max: 1399, color: '#ffd700', badge: '🥇' },
  { tier: 'Platinum', min: 1400, max: 1599, color: '#00e5ff', badge: '💎' },
  { tier: 'Diamond', min: 1600, max: 1799, color: '#a855f7', badge: '💠' },
  { tier: 'Master', min: 1800, max: 1999, color: '#ef4444', badge: '👑' },
  { tier: 'Grandmaster', min: 2000, max: 9999, color: '#ff5e14', badge: '🔥' },
];

export function calculateTierFromRating(rating: number): TierName {
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (rating >= TIER_THRESHOLDS[i].min) {
      return TIER_THRESHOLDS[i].tier;
    }
  }
  return 'Bronze';
}

export function getTierColor(tier: TierName): string {
  const found = TIER_THRESHOLDS.find(t => t.tier === tier);
  return found ? found.color : '#c0c0c0';
}

export function getTierBadge(tier: TierName): string {
  const found = TIER_THRESHOLDS.find(t => t.tier === tier);
  return found ? found.badge : '🥈';
}

export function calculateMatchScore(
  placement: number,
  kills: number,
  rules: ScoringRules = DEFAULT_SCORING_RULES,
  isMostKills: boolean = false
): { placementPoints: number; killPoints: number; totalPoints: number } {
  const placementPoints = rules.placementPoints[placement] || 0;
  let killPoints = kills * rules.killPoint;
  
  if (isMostKills && rules.customBonus?.mostKillsBonus) {
    killPoints += rules.customBonus.mostKillsBonus;
  }

  return {
    placementPoints,
    killPoints,
    totalPoints: placementPoints + killPoints,
  };
}

export function calculateRatingDelta(placement: number, kills: number, avgLobbyRating: number = 1400): number {
  // Competitive Elo formula
  let baseChange = 0;
  if (placement === 1) baseChange = +35;
  else if (placement === 2) baseChange = +25;
  else if (placement === 3) baseChange = +18;
  else if (placement <= 5) baseChange = +10;
  else if (placement <= 8) baseChange = +2;
  else if (placement <= 10) baseChange = -5;
  else baseChange = -15;

  const killBonus = Math.min(kills * 3, 25);
  return baseChange + killBonus;
}
