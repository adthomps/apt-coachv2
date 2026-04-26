import React from 'react';
import { cn } from '@/lib/utils';

export type RangeStatus = 'optimal' | 'average' | 'outOfRange';

interface RangeBarProps {
  value: number;
  min: number;
  max: number;
  status?: RangeStatus;
  className?: string;
}

/** APT shared "value within reference range" bar. Used by blood markers and body-comp ratios. */
const RangeBar: React.FC<RangeBarProps> = ({ value, min, max, status = 'optimal', className }) => {
  const rangeSpan = max - min;
  if (rangeSpan <= 0) return null;

  const displayMin = min - rangeSpan * 0.2;
  const displayMax = max + rangeSpan * 0.2;
  const displaySpan = displayMax - displayMin;
  const position = Math.max(0, Math.min(100, ((value - displayMin) / displaySpan) * 100));

  const barColor =
    status === 'optimal' ? 'bg-success'
      : status === 'average' ? 'bg-muted-foreground'
      : 'bg-destructive';

  return (
    <div className={cn('relative h-2 bg-muted rounded-full', className)}>
      <div
        className="absolute h-full bg-success/20 rounded-full"
        style={{
          left: `${((min - displayMin) / displaySpan) * 100}%`,
          width: `${(rangeSpan / displaySpan) * 100}%`,
        }}
      />
      <div
        className={cn('absolute top-[-2px] h-3 w-3 rounded-full border-2 border-background', barColor)}
        style={{ left: `calc(${position}% - 6px)` }}
      />
    </div>
  );
};

export default RangeBar;
