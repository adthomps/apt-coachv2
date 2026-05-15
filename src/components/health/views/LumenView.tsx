import React, { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { Wind } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import SectionCard from '@/components/common/SectionCard';
import SourcePageShell from '../SourcePageShell';
import KpiHeroTile from '../KpiHeroTile';
import { useHealthCheckins } from '@/hooks/use-api-queries';
import { LUMEN_LEVEL_DEFINITIONS } from '@/lib/api/types';

const PRESETS = [
  { id: '7',  label: 'Last 7 days' },
  { id: '14', label: 'Last 14 days' },
  { id: '30', label: 'Last 30 days' },
];

const LumenView: React.FC = () => {
  const { data: checkins = [] } = useHealthCheckins({ source: 'lumen' });
  const [windowDays, setWindowDays] = useState<string | null>('14');

  const filtered = useMemo(() => {
    const days = Number(windowDays ?? '14');
    const from = subDays(new Date(), days);
    return checkins.filter(c => new Date(c.date) >= from).sort((a, b) => b.date.localeCompare(a.date));
  }, [checkins, windowDays]);

  if (checkins.length === 0) {
    return (
      <EmptyState
        icon={<Wind className="h-12 w-12" />}
        title="No Lumen readings"
        description="Import Lumen breath data from Admin to track metabolic flexibility."
      />
    );
  }

  const latest = filtered[0];
  const morningLevels = filtered.map(c => c.morningLumenLevel).filter((n): n is number => n !== undefined);
  const peakLevels = filtered.map(c => c.lumenLevel).filter((n): n is number => n !== undefined);
  const flexScores = filtered.map(c => c.metabolicFlexScore).filter((n): n is number => n !== undefined);

  const morningAvg = morningLevels.length ? morningLevels.reduce((a, b) => a + b, 0) / morningLevels.length : undefined;
  const peakAvg = peakLevels.length ? peakLevels.reduce((a, b) => a + b, 0) / peakLevels.length : undefined;
  const flexAvg = flexScores.length ? flexScores.reduce((a, b) => a + b, 0) / flexScores.length : undefined;
  const fastedAMPct = morningLevels.length ? Math.round((morningLevels.filter(l => l <= 2).length / morningLevels.length) * 100) : 0;

  return (
    <SourcePageShell
      metaLine={<>LUMEN · {filtered.length} DAYS · WINDOW {windowDays ?? '14'}D</>}
      compare={{ value: windowDays, onChange: setWindowDays, presets: PRESETS, autoLabel: 'Last 14 days', triggerLabel: 'Trend window' }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiHeroTile label="Morning level avg" value={morningAvg ? morningAvg.toFixed(1) : '—'}
          valueTone={morningAvg && morningAvg <= 2 ? 'success' : morningAvg && morningAvg >= 4 ? 'warning' : 'default'} />
        <KpiHeroTile label="Peak level avg" value={peakAvg ? peakAvg.toFixed(1) : '—'} />
        <KpiHeroTile label="Metabolic flex" value={flexAvg ? flexAvg.toFixed(0) : '—'} valueTone="success" />
        <KpiHeroTile label="Fasted-AM %" value={`${fastedAMPct}%`} valueTone={fastedAMPct >= 70 ? 'success' : 'warning'} favTone={fastedAMPct >= 70 ? 'fav' : 'unfav'} />
      </div>

      {latest && latest.morningLumenLevel !== undefined && (
        <SectionCard>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Latest morning reading</div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-3xl font-bold tabular-nums">Level {latest.morningLumenLevel}</div>
              <div className="text-sm text-muted-foreground">{LUMEN_LEVEL_DEFINITIONS[latest.morningLumenLevel].label} — {LUMEN_LEVEL_DEFINITIONS[latest.morningLumenLevel].detail}</div>
            </div>
            <div className="text-xs text-muted-foreground">{format(new Date(latest.date), 'EEE, MMM d')}</div>
          </div>
        </SectionCard>
      )}

      <SectionCard>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">Daily morning → peak swing</div>
        <div className="space-y-1.5 max-h-80 overflow-auto">
          {filtered.map(c => (
            <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0">
              <span className="text-muted-foreground">{format(new Date(c.date), 'EEE, MMM d')}</span>
              <span className="text-foreground tabular-nums text-xs">
                AM {c.morningLumenLevel ?? '—'} → Peak {c.lumenLevel ?? '—'}
                {c.metabolicFlexScore !== undefined && <span className="ml-3 text-muted-foreground">flex {c.metabolicFlexScore}</span>}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      <p className="text-xs text-muted-foreground">
        Lumen is in beta. Pre/post-meal readings (breakfast, lunch, dinner) recorded on the Today page will populate here as data flows in.
      </p>
    </SourcePageShell>
  );
};

export default LumenView;
