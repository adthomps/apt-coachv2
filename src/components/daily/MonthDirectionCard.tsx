import React from 'react';
import SectionCard from '@/components/common/SectionCard';
import { cn } from '@/lib/utils';

export interface DirectionTile {
  id: string;
  label: string;
  value: string;
  sub?: string;
  trend?: 'up' | 'down' | 'flat';
  status?: 'good' | 'watch' | 'act';
}

interface Props {
  tiles: DirectionTile[];
}

const STATUS_COLOR: Record<NonNullable<DirectionTile['status']>, string> = {
  good: 'text-success',
  watch: 'text-amber-500',
  act: 'text-destructive',
};

const TREND_GLYPH: Record<NonNullable<DirectionTile['trend']>, string> = {
  up: '↑',
  down: '↓',
  flat: '→',
};

const MonthDirectionCard: React.FC<Props> = ({ tiles }) => (
  <SectionCard
    title={
      <span className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">
        Month Direction
      </span>
    }
  >
    <div className="grid grid-cols-2 gap-2">
      {tiles.map(t => (
        <div key={t.id} className="rounded-md border border-border/50 bg-card/40 p-2.5">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{t.label}</div>
          <div className="mt-1 text-lg font-bold tabular-nums text-foreground leading-none">{t.value}</div>
          {(t.sub || t.trend) && (
            <div className={cn('text-[10px] mt-1 tabular-nums', t.status ? STATUS_COLOR[t.status] : 'text-muted-foreground')}>
              {t.trend && <span className="mr-1">{TREND_GLYPH[t.trend]}</span>}
              {t.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  </SectionCard>
);

export default MonthDirectionCard;
