import React, { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { Activity } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import SectionCard from '@/components/common/SectionCard';
import SourcePageShell from '../SourcePageShell';
import KpiHeroTile from '../KpiHeroTile';
import { useHealthCheckins } from '@/hooks/use-api-queries';

const PRESETS = [
  { id: '7',  label: 'Last 7 days' },
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 90 days' },
];

function classifyBP(sys?: number, dia?: number): { label: string; tone: 'success' | 'warning' | 'destructive' } {
  if (sys === undefined || dia === undefined) return { label: 'No reading', tone: 'warning' };
  if (sys >= 140 || dia >= 90) return { label: 'Stage 2 hypertension', tone: 'destructive' };
  if (sys >= 130 || dia >= 80) return { label: 'Stage 1 hypertension', tone: 'destructive' };
  if (sys >= 120) return { label: 'Elevated', tone: 'warning' };
  return { label: 'Normal', tone: 'success' };
}

const WithingsBpmView: React.FC = () => {
  const { data: checkins = [] } = useHealthCheckins({ source: 'withings_bpm' });
  const [windowDays, setWindowDays] = useState<string | null>('30');

  const filtered = useMemo(() => {
    const days = Number(windowDays ?? '30');
    const from = subDays(new Date(), days);
    return checkins.filter(c => new Date(c.date) >= from);
  }, [checkins, windowDays]);

  if (checkins.length === 0) {
    return (
      <EmptyState
        icon={<Activity className="h-12 w-12" />}
        title="No BPM Vision readings"
        description="Import Withings BPM blood pressure readings from Admin."
      />
    );
  }

  const sysVals = filtered.map(c => c.systolicMmHg).filter((n): n is number => n !== undefined);
  const diaVals = filtered.map(c => c.diastolicMmHg).filter((n): n is number => n !== undefined);
  const pulses = filtered.map(c => c.pulseBpm).filter((n): n is number => n !== undefined);

  const sysAvg = sysVals.length ? sysVals.reduce((a, b) => a + b, 0) / sysVals.length : undefined;
  const diaAvg = diaVals.length ? diaVals.reduce((a, b) => a + b, 0) / diaVals.length : undefined;
  const pulseAvg = pulses.length ? pulses.reduce((a, b) => a + b, 0) / pulses.length : undefined;
  const map = sysAvg !== undefined && diaAvg !== undefined ? diaAvg + (sysAvg - diaAvg) / 3 : undefined;

  const cls = classifyBP(sysAvg, diaAvg);
  const inTarget = filtered.filter(c => c.systolicMmHg !== undefined && c.diastolicMmHg !== undefined && c.systolicMmHg < 130 && c.diastolicMmHg < 80).length;
  const targetPct = filtered.length > 0 ? Math.round((inTarget / filtered.length) * 100) : 0;

  const meta = (
    <>WITHINGS BPM VISION · {filtered.length} READINGS · WINDOW {windowDays ?? '30'}D</>
  );

  return (
    <SourcePageShell
      metaLine={meta}
      compare={{ value: windowDays, onChange: setWindowDays, presets: PRESETS, autoLabel: 'Last 30 days', triggerLabel: 'Trend window' }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiHeroTile label="Systolic avg" value={sysAvg ? `${sysAvg.toFixed(0)}` : '—'} valueTone={cls.tone === 'success' ? 'success' : cls.tone === 'warning' ? 'warning' : 'destructive'} />
        <KpiHeroTile label="Diastolic avg" value={diaAvg ? `${diaAvg.toFixed(0)}` : '—'} valueTone={cls.tone === 'success' ? 'success' : cls.tone === 'warning' ? 'warning' : 'destructive'} />
        <KpiHeroTile label="Pulse avg" value={pulseAvg ? `${pulseAvg.toFixed(0)} bpm` : '—'} />
        <KpiHeroTile label="MAP" value={map ? `${map.toFixed(0)}` : '—'} />
      </div>

      <SectionCard>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Classification</div>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            cls.tone === 'success' ? 'bg-success/15 text-success border-success/20' :
            cls.tone === 'warning' ? 'bg-warning/15 text-warning border-warning/20' :
            'bg-destructive/15 text-destructive border-destructive/20'
          }`}>{cls.label}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><div className="text-muted-foreground text-xs">Time in target</div><div className="text-xl font-bold tabular-nums">{targetPct}%</div></div>
          <div><div className="text-muted-foreground text-xs"># Readings</div><div className="text-xl font-bold tabular-nums">{filtered.length}</div></div>
          <div><div className="text-muted-foreground text-xs">Highest sys</div><div className="text-xl font-bold tabular-nums">{sysVals.length ? Math.max(...sysVals) : '—'}</div></div>
          <div><div className="text-muted-foreground text-xs">Lowest sys</div><div className="text-xl font-bold tabular-nums">{sysVals.length ? Math.min(...sysVals) : '—'}</div></div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">Recent readings</div>
        <div className="space-y-1.5 max-h-80 overflow-auto">
          {filtered.slice(0, 30).map(c => (
            <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0">
              <span className="text-muted-foreground">{format(new Date(c.date), 'EEE, MMM d')}</span>
              <span className="text-foreground tabular-nums">
                {c.systolicMmHg ?? '—'}/{c.diastolicMmHg ?? '—'} {c.pulseBpm !== undefined && <span className="text-muted-foreground ml-2">· {c.pulseBpm} bpm</span>}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </SourcePageShell>
  );
};

export default WithingsBpmView;
