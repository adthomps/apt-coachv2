import React, { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { Heart } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import SectionCard from '@/components/common/SectionCard';
import SourcePageShell from '../SourcePageShell';
import KpiHeroTile from '../KpiHeroTile';
import { useHealthCheckins } from '@/hooks/use-api-queries';
import type { HealthCheckin } from '@/lib/api/types';

const WINDOW_PRESETS = [
  { id: '7',   label: 'Last 7 days' },
  { id: '30',  label: 'Last 30 days' },
  { id: '90',  label: 'Last 90 days' },
  { id: '180', label: 'Last 180 days' },
];

function avg(arr: number[]): number | undefined {
  const v = arr.filter(n => Number.isFinite(n));
  if (!v.length) return undefined;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

const AppleHealthView: React.FC = () => {
  const { data: checkins = [] } = useHealthCheckins({ source: 'apple_health' });
  const [windowDays, setWindowDays] = useState<string | null>('30');

  const filtered: HealthCheckin[] = useMemo(() => {
    const days = Number(windowDays ?? '30');
    const from = subDays(new Date(), days);
    return checkins.filter(c => new Date(c.date) >= from);
  }, [checkins, windowDays]);

  if (checkins.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="h-12 w-12" />}
        title="No Apple Health data yet"
        description="Import an Apple Health vitals export from Admin to see resting HR, HRV, sleep, and more."
      />
    );
  }

  const restingHR = avg(filtered.map(c => c.pulseBpm).filter((n): n is number => n !== undefined));
  const spo2 = avg(filtered.map(c => c.bloodOxygenPct).filter((n): n is number => n !== undefined));
  const temps = avg(filtered.map(c => c.bodyTempF).filter((n): n is number => n !== undefined));
  const sysAvg = avg(filtered.map(c => c.systolicMmHg).filter((n): n is number => n !== undefined));
  const diaAvg = avg(filtered.map(c => c.diastolicMmHg).filter((n): n is number => n !== undefined));

  const meta = (
    <>
      APPLE HEALTH · TREND WINDOW: {windowDays ?? '30'} DAYS · {filtered.length} READINGS
    </>
  );

  return (
    <SourcePageShell
      metaLine={meta}
      compare={{
        value: windowDays, onChange: setWindowDays,
        autoLabel: 'Last 30 days', presets: WINDOW_PRESETS, triggerLabel: 'Trend window',
      }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiHeroTile label="Resting HR" value={restingHR ? `${restingHR.toFixed(0)} bpm` : '—'} />
        <KpiHeroTile label="SpO₂ avg" value={spo2 ? `${spo2.toFixed(1)}%` : '—'} valueTone={spo2 && spo2 >= 95 ? 'success' : 'warning'} />
        <KpiHeroTile label="Body temp" value={temps ? `${temps.toFixed(1)}°F` : '—'} />
        <KpiHeroTile label="BP avg" value={sysAvg && diaAvg ? `${sysAvg.toFixed(0)}/${diaAvg.toFixed(0)}` : '—'} />
      </div>

      <SectionCard>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">Recent readings</div>
        <div className="space-y-1.5 max-h-80 overflow-auto">
          {filtered.slice(0, 30).map(c => (
            <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0">
              <span className="text-muted-foreground">{format(new Date(c.date), 'EEE, MMM d')}</span>
              <span className="text-foreground tabular-nums text-xs">
                {c.pulseBpm !== undefined && <span className="ml-3">HR {c.pulseBpm}</span>}
                {c.bloodOxygenPct !== undefined && <span className="ml-3">SpO₂ {c.bloodOxygenPct.toFixed(0)}%</span>}
                {c.systolicMmHg !== undefined && c.diastolicMmHg !== undefined && <span className="ml-3">{c.systolicMmHg}/{c.diastolicMmHg}</span>}
                {c.bodyTempF !== undefined && <span className="ml-3">{c.bodyTempF.toFixed(1)}°F</span>}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      <p className="text-xs text-muted-foreground">
        Apple Health is the aggregator. Import vitals from Admin to refresh trends.
      </p>
    </SourcePageShell>
  );
};

export default AppleHealthView;
