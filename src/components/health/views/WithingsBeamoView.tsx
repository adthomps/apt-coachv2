import React, { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { Stethoscope } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import SectionCard from '@/components/common/SectionCard';
import SourcePageShell from '../SourcePageShell';
import KpiHeroTile from '../KpiHeroTile';
import { useHealthCheckins } from '@/hooks/use-api-queries';
import { nearestCheckin } from './overlay-utils';
import CompanionOverlayStrip, { type CompanionChip } from '../CompanionOverlayStrip';

const PRESETS = [
  { id: '7',  label: 'Last 7 days' },
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 90 days' },
];

const WithingsBeamoView: React.FC = () => {
  const { data: checkins = [] } = useHealthCheckins({ source: 'withings_beamo' });
  const { data: appleCheckins = [] } = useHealthCheckins({ source: 'apple_health' });
  const [windowDays, setWindowDays] = useState<string | null>('30');

  const filtered = useMemo(() => {
    const days = Number(windowDays ?? '30');
    const from = subDays(new Date(), days);
    return checkins.filter(c => new Date(c.date) >= from);
  }, [checkins, windowDays]);

  if (checkins.length === 0) {
    return (
      <EmptyState
        icon={<Stethoscope className="h-12 w-12" />}
        title="No BeamO readings"
        description="Capture stethoscope, ECG, SpO₂, and temperature spot-checks via the Withings BeamO importer."
      />
    );
  }

  const latest = filtered[0];
  const temps = filtered.map(c => c.bodyTempF).filter((n): n is number => n !== undefined);
  const spo2s = filtered.map(c => c.bloodOxygenPct).filter((n): n is number => n !== undefined);
  const ecgCount = filtered.filter(c => c.ecgRhythm).length;
  const ecgAfib = filtered.filter(c => c.ecgRhythm === 'afib').length;

  const overlay: CompanionChip[] = [];
  if (latest) {
    const apple = nearestCheckin(appleCheckins, latest.date, 3);
    if (apple?.pulseBpm !== undefined) {
      overlay.push({ source: 'Apple', primary: `HR ${apple.pulseBpm}`, date: format(new Date(apple.date), 'MMM d') });
    }
  }

  return (
    <SourcePageShell
      metaLine={<>WITHINGS BEAMO · {filtered.length} READINGS · WINDOW {windowDays ?? '30'}D</>}
      compare={{ value: windowDays, onChange: setWindowDays, presets: PRESETS, autoLabel: 'Last 30 days', triggerLabel: 'Trend window' }}
    usedIn={[{ label: 'Today · vitals', href: '/today' }, { label: 'Dashboard · recovery signal', href: '/dashboard' }]}
    >
      {overlay.length > 0 && <CompanionOverlayStrip chips={overlay} />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiHeroTile label="Temp avg" value={temps.length ? `${(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)}°F` : '—'} />
        <KpiHeroTile label="SpO₂ avg" value={spo2s.length ? `${(spo2s.reduce((a, b) => a + b, 0) / spo2s.length).toFixed(0)}%` : '—'}
          valueTone={spo2s.length && spo2s.reduce((a, b) => a + b, 0) / spo2s.length >= 95 ? 'success' : 'warning'} />
        <KpiHeroTile label="ECG readings" value={ecgCount} />
        <KpiHeroTile label="A-fib events" value={ecgAfib} valueTone={ecgAfib > 0 ? 'destructive' : 'success'} favTone={ecgAfib > 0 ? 'unfav' : 'fav'} />
      </div>

      <SectionCard>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">Recent readings</div>
        <div className="space-y-1.5 max-h-80 overflow-auto">
          {filtered.slice(0, 30).map(c => (
            <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0">
              <span className="text-muted-foreground">{format(new Date(c.date), 'EEE, MMM d')}</span>
              <span className="text-foreground tabular-nums text-xs">
                {c.bodyTempF !== undefined && <span className="ml-3">{c.bodyTempF.toFixed(1)}°F</span>}
                {c.bloodOxygenPct !== undefined && <span className="ml-3">SpO₂ {c.bloodOxygenPct.toFixed(0)}%</span>}
                {c.ecgRhythm && <span className={`ml-3 ${c.ecgRhythm === 'afib' ? 'text-destructive' : c.ecgRhythm === 'normal' ? 'text-success' : 'text-warning'}`}>ECG: {c.ecgRhythm}</span>}
                {c.stethoscopeNotes && <span className="ml-3 text-muted-foreground italic">"{c.stethoscopeNotes}"</span>}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </SourcePageShell>
  );
};

export default WithingsBeamoView;
