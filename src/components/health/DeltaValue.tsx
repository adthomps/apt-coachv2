import React from 'react';
import { cn } from '@/lib/utils';

interface DeltaValueProps {
  value: number;
  /** Suffix appended to the number, e.g. " lbs", "%". */
  suffix?: string;
  /** When true, a negative change is "good" (e.g. body fat %, fat mass). */
  invert?: boolean;
  /**
   * When true, the change is shown without good/bad coloring (always muted).
   * Use for metrics where direction is goal-dependent (e.g. total weight).
   */
  neutral?: boolean;
  /** Decimals (default 1). */
  decimals?: number;
  /** Threshold below which the change is treated as neutral (default 0.05). */
  neutralThreshold?: number;
  className?: string;
}

/**
 * APT shared "change vs prior" indicator.
 *
 * Coloring rules:
 *  - `neutral`         → always muted (e.g. total weight — direction is goal-dependent)
 *  - `invert: false`   → up = success, down = destructive (e.g. lean mass)
 *  - `invert: true`    → down = success, up = destructive (e.g. body fat %, fat mass, hs-CRP)
 *  - |value| < threshold → muted regardless
 */
const DeltaValue: React.FC<DeltaValueProps> = ({
  value, suffix = '', invert = false, neutral = false,
  decimals = 1, neutralThreshold = 0.05, className,
}) => {
  const isNeutral = neutral || Math.abs(value) < neutralThreshold;
  const positive = invert ? value < 0 : value > 0;
  const tone = isNeutral
    ? 'text-muted-foreground'
    : positive ? 'text-success' : 'text-destructive';
  const sign = value > 0 ? '+' : '';
  return (
    <span className={cn('text-sm tabular-nums', tone, className)}>
      {sign}{value.toFixed(decimals)}{suffix}
    </span>
  );
};

export default DeltaValue;
