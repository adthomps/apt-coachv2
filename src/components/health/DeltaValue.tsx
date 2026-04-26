import React from 'react';
import { cn } from '@/lib/utils';

interface DeltaValueProps {
  value: number;
  /** Suffix appended to the number, e.g. " lbs", "%". */
  suffix?: string;
  /** When true, a negative change is "good" (e.g. body fat %). */
  invert?: boolean;
  /** Decimals (default 1). */
  decimals?: number;
  /** Threshold below which the change is treated as neutral (default 0.05). */
  neutralThreshold?: number;
  className?: string;
}

/** APT shared "change vs prior" indicator. Consistent coloring across all health tabs. */
const DeltaValue: React.FC<DeltaValueProps> = ({
  value, suffix = '', invert = false, decimals = 1, neutralThreshold = 0.05, className,
}) => {
  const positive = invert ? value < 0 : value > 0;
  const tone =
    Math.abs(value) < neutralThreshold ? 'text-muted-foreground'
      : positive ? 'text-success'
      : 'text-destructive';
  const sign = value > 0 ? '+' : '';
  return (
    <span className={cn('text-sm tabular-nums', tone, className)}>
      {sign}{value.toFixed(decimals)}{suffix}
    </span>
  );
};

export default DeltaValue;
