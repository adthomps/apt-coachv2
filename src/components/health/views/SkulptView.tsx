import React, { useMemo, useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Pencil } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import SectionCard from '@/components/common/SectionCard';
import SourcePageShell from '../SourcePageShell';
import KpiHeroTile from '../KpiHeroTile';
import CompanionOverlayStrip, { type CompanionChip } from '../CompanionOverlayStrip';
import { useHealthCheckins, useSnapshots } from '@/hooks/use-api-queries';
import { nearestCheckin } from './overlay-utils';
import type { Snapshot } from '@/lib/api/types';

const isWithings = (s: Snapshot) => (s.provider || '').toLowerCase() === 'withings';

const SkulptView: React.FC = () => {
  const { data: skulpt = [] } = useHealthCheckins({ source: 'skulpt_chisel' });
  const { data: withings = [] } = useHealthCheckins({ source: 'withings_scale' });
  const { data: snapshots = [] } = useSnapshots();

  const dexa = useMemo(() => snapshots.filter(s => !isWithings(s)).sort((a, b) => b.scanDate.localeCompare(a.scanDate)), [snapshots]);
  const sorted = useMemo(() => [...skulpt].sort((a, b) => b.date.localeCompare(a.date)), [skulpt]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);

  const selected = (selectedId ? sorted.find(s => s.id === selectedId) : sorted[0]) || null;
  const previous = useMemo(() => {
    if (!selected) return null;
    if (compareId) return sorted.find(s => s.id === compareId) || null;
    const idx = sorted.findIndex(s => s.id === selected.id);
    return sorted[idx + 1] || null;
  }, [selected, sorted, compareId]);

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={<Pencil className="h-12 w-12" />}
        title="No Skulpt readings"
        description="Import Skulpt Chisel readings from Admin to track regional muscle quality."
      />
    );
  }
  if (!selected) return null;

  const regions = selected.regionalMQ ?? [];
  const sortedByMQ = [...regions].filter(r => r.mq !== undefined).sort((a, b) => (b.mq! - a.mq!));
  const best = sortedByMQ[0];
  const weakest = sortedByMQ[sortedByMQ.length - 1];

  const overlay: CompanionChip[] = [];
  const wNear = nearestCheckin(withings, selected.date, 14);
  if (wNear?.bodyFatPct !== undefined) {
    overlay.push({ source: 'Withings', primary: `${wNear.bodyFatPct.toFixed(1)}% BF`, date: format(new Date(wNear.date), 'MMM d') });
  }
  const dexaNear = dexa.find(s => Math.abs(differenceInDays(new Date(s.scanDate), new Date(selected.date))) <= 60);
  if (dexaNear) {
    overlay.push({ source: 'DEXA', primary: `${dexaNear.bodyComposition.bodyFatPercentage.toFixed(1)}% BF`, date: format(new Date(dexaNear.scanDate), 'MMM d') });
  }

  const compareItems = sorted.filter(s => s.id !== selected.id).map(s => ({
    id: s.id, label: format(new Date(s.date), 'MMM d, yyyy'),
    hint: s.muscleQualityMQ !== undefined ? `MQ ${s.muscleQualityMQ}` : undefined,
  }));

  const dMQ = previous && selected.muscleQualityMQ !== undefined && previous.muscleQualityMQ !== undefined
    ? selected.muscleQualityMQ - previous.muscleQualityMQ : undefined;
  const dBF = previous && selected.bodyFatPct !== undefined && previous.bodyFatPct !== undefined
    ? selected.bodyFatPct - previous.bodyFatPct : undefined;

  return (
    <SourcePageShell
      metaLine={<>SKULPT CHISEL · READING {format(new Date(selected.date), 'MMM d, yyyy').toUpperCase()}{previous && ` · vs ${format(new Date(previous.date), 'MMM d, yyyy').toUpperCase()}`}</>}
      compare={{ value: compareId, onChange: setCompareId, autoLabel: 'Previous reading (auto)', items: compareItems }}
    usedIn={[{ label: 'Today · training emphasis', href: '/today' }, { label: 'Dashboard · DEXA card', href: '/dashboard' }]}
    >
      {overlay.length > 0 && <CompanionOverlayStrip chips={overlay} title="vs ground truth" />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiHeroTile label="Overall MQ" value={selected.muscleQualityMQ ?? '—'} delta={dMQ} valueTone="success" />
        <KpiHeroTile label="Body fat %" value={selected.bodyFatPct !== undefined ? `${selected.bodyFatPct.toFixed(1)}%` : '—'} delta={dBF} deltaSuffix="pp" invertDelta />
        <KpiHeroTile label="Best region" value={best ? `${best.region} ${best.mq ?? ''}` : '—'} valueTone="success" favTone="fav" />
        <KpiHeroTile label="Weakest region" value={weakest && weakest !== best ? `${weakest.region} ${weakest.mq ?? ''}` : '—'} valueTone="warning" favTone="unfav" />
      </div>

      <SectionCard>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">Regional MQ</div>
        {regions.length === 0 && <p className="text-xs text-muted-foreground">No regional breakdown for this reading.</p>}
        <div className="grid md:grid-cols-2 gap-2">
          {regions.map(r => {
            const prev = previous?.regionalMQ?.find(p => p.region === r.region);
            const dRegion = prev && r.mq !== undefined && prev.mq !== undefined ? r.mq - prev.mq : null;
            return (
              <div key={r.region} className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0">
                <span className="capitalize text-muted-foreground">{r.region}</span>
                <div className="flex items-center gap-3">
                  <span className="text-foreground tabular-nums">MQ {r.mq ?? '—'}{r.bodyFatPct !== undefined && ` · ${r.bodyFatPct.toFixed(1)}% BF`}</span>
                  {dRegion !== null && (
                    <span className={`text-xs tabular-nums ${dRegion > 0 ? 'text-success' : dRegion < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {dRegion > 0 ? '+' : ''}{dRegion}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </SourcePageShell>
  );
};

export default SkulptView;
