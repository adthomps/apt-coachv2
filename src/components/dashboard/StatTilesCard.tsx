import React from 'react';
import SectionCard from '@/components/common/SectionCard';
import { cn } from '@/lib/utils';

export interface StatTile {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: 'default' | 'success' | 'warning' | 'destructive' | 'primary';
}

const VALUE_TONE: Record<NonNullable<StatTile['tone']>, string> = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  primary: 'text-primary',
};

interface Props {
  title: string;
  tiles: StatTile[];
  cols?: 3 | 4;
}

const StatTilesCard: React.FC<Props> = ({ title, tiles, cols = 4 }) => (
  <SectionCard
    title={
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
        {title}
      </span>
    }
  >
    <div className={cn('grid gap-3', cols === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3')}>
      {tiles.map((t, i) => (
        <div key={i} className="rounded-lg border border-border/60 bg-muted/30 p-3">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{t.label}</div>
          <div className={cn('text-2xl font-bold tabular-nums leading-tight mt-1', VALUE_TONE[t.tone ?? 'default'])}>
            {t.value}
          </div>
          {t.sub && <div className="text-[11px] text-muted-foreground mt-0.5">{t.sub}</div>}
        </div>
      ))}
    </div>
  </SectionCard>
);

export default StatTilesCard;
