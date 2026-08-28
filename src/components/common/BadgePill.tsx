import React from 'react';
import { TierName } from '../../types';
import { getTierBadge, getTierColor } from '../../services/scoringEngine';

interface BadgePillProps {
  tier: TierName;
  rating?: number;
  size?: 'sm' | 'md' | 'lg';
  showRating?: boolean;
}

export const BadgePill: React.FC<BadgePillProps> = ({
  tier,
  rating,
  size = 'md',
  showRating = false,
}) => {
  const color = getTierColor(tier);
  const badge = getTierBadge(tier);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3 py-1.5 gap-2 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border backdrop-blur-md transition-all ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${color}18`,
        borderColor: `${color}66`,
        color: color,
        boxShadow: `0 0 10px ${color}22`,
      }}
    >
      <span>{badge}</span>
      <span>{tier}</span>
      {showRating && rating !== undefined && (
        <span className="text-slate-300 font-mono text-[11px] ml-0.5">({rating})</span>
      )}
    </span>
  );
};
