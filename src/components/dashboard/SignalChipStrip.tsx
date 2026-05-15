import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SignalChip {
  id: string;
  label: string;
  tone: 'destructive' | 'success' | 'warning' | 'primary' | 'muted';
  trend?: 'up' | 'down';
}

const TONE_CLASS: Record<SignalChip['tone'], string> = {
  destructive: 'bg-destructive/15 text-destructive border-destructive/30',
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  primary: 'bg-primary/15 text-primary border-primary/30',
  muted: 'bg-muted text-muted-foreground border-border',
};

const SignalChipStrip: React.FC<{ chips: SignalChip[] }> = ({ chips }) => {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map(c => (
        <span
          key={c.id}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
            TONE_CLASS[c.tone],
          )}
        >
          {c.trend === 'up' && <TrendingUp className="h-3 w-3" />}
          {c.trend === 'down' && <TrendingDown className="h-3 w-3" />}
          {c.label}
        </span>
      ))}
    </div>
  );
};

export default SignalChipStrip;
