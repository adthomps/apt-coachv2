import React from 'react';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CompanionChip {
  source: string;            // short label (e.g., "Withings", "Skulpt")
  primary: string;           // value text e.g., "205.4 lbs"
  date?: string;             // e.g., "Feb 26"
  delta?: { text: string; tone: 'fav' | 'unfav' | 'neutral' };
}

interface Props {
  title?: string;
  chips: CompanionChip[];
  className?: string;
}

const TONE: Record<NonNullable<CompanionChip['delta']>['tone'], string> = {
  fav: 'text-success',
  unfav: 'text-destructive',
  neutral: 'text-muted-foreground',
};

const CompanionOverlayStrip: React.FC<Props> = ({ title = 'Context overlays', chips, className }) => {
  if (!chips.length) return null;
  return (
    <div className={cn('flex items-center gap-2 flex-wrap rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2', className)}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        <Layers className="h-3 w-3" />
        {title}
      </div>
      {chips.map((c, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-background border border-border">
          <span className="font-semibold text-foreground">{c.source}</span>
          <span className="text-foreground tabular-nums">{c.primary}</span>
          {c.date && <span className="text-muted-foreground">· {c.date}</span>}
          {c.delta && <span className={cn('tabular-nums', TONE[c.delta.tone])}>· {c.delta.text}</span>}
        </div>
      ))}
    </div>
  );
};

export default CompanionOverlayStrip;
