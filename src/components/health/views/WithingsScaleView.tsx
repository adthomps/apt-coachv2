import React, { useEffect, useMemo, useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Plus, Scale } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import SectionCard from '@/components/common/SectionCard';
import { Button } from '@/components/ui/button';
import SourcePageShell from '../SourcePageShell';
import KpiHeroTile from '../KpiHeroTile';
import CompanionOverlayStrip, { type CompanionChip } from '../CompanionOverlayStrip';
import AIInsightsPanel from '@/components/AIInsightsPanel';
import WithingsImportDialog from '@/components/WithingsImportDialog';
import { useSnapshots, useHealthCheckins } from '@/hooks/use-api-queries';
import type { ProgressCompare, Snapshot } from '@/lib/api/types';
import { getBodyScanInsights } from '@/lib/ai/insights';
import { nearestCheckin } from './overlay-utils';

const isWithings = (s: Snapshot) => (s.provider || '').toLowerCase() === 'withings';

function buildCompare(curr: Snapshot, prev: Snapshot): ProgressCompare {
  const c = curr.bodyComposition, p = prev.bodyComposition;
  const pct = (d: number, b: number) => (b === 0 ? 0 : (d / b) * 100);
  return {
    currentSnapshot: curr, previousSnapshot: prev,
    changes: {
      totalMass: { value: c.totalMass - p.totalMass, percentage: pct(c.totalMass - p.totalMass, p.totalMass) },
      fatMass: { value: c.fatMass - p.fatMass, percentage: pct(c.fatMass - p.fatMass, p.fatMass) },
      leanMass: { value: c.leanMass - p.leanMass, percentage: pct(c.leanMass - p.leanMass, p.leanMass) },
      bodyFatPercentage: { value: c.bodyFatPercentage - p.bodyFatPercentage, percentage: pct(c.bodyFatPercentage - p.bodyFatPercentage, p.bodyFatPercentage) },
      regionalChanges: [],
    },
    timeSpanDays: Math.max(1, differenceInDays(new Date(curr.scanDate), new Date(prev.scanDate))),
  };
}

const WithingsScaleView: React.FC = () => {
  const { data: allSnapshots = [] } = useSnapshots();
  const { data: dexaCheckinsViaSnap } = useSnapshots(); // for DEXA overlay we use snapshots
  const { data: skulptCheckins = [] } = useHealthCheckins({ source: 'skulpt_chisel' });

  const readings = useMemo(
    () => allSnapshots.filter(isWithings).sort((a, b) => b.scanDate.localeCompare(a.scanDate)),
    [allSnapshots],
  );
  const dexaScans = useMemo(
    () => (dexaCheckinsViaSnap ?? []).filter(s => !isWithings(s)).sort((a, b) => b.scanDate.localeCompare(a.scanDate)),
    [dexaCheckinsViaSnap],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const selected = (selectedId ? readings.find(r => r.id === selectedId) : readings[0]) || null;
  const previous = useMemo(() => {
    if (!selected) return null;
    if (compareId) return readings.find(r => r.id === compareId) || null;
    const idx = readings.findIndex(r => r.id === selected.id);
    return readings[idx + 1] || null;
  }, [selected, readings, compareId]);

  const compare = selected && previous ? buildCompare(selected, previous) : null;
  const insights = useMemo(() => (selected ? getBodyScanInsights(selected, compare || undefined) : []), [selected, compare]);

  if (readings.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Scale className="h-12 w-12" />}
          title="No Withings scale readings"
          description="Add a smart-scale reading to track weight, BF%, and muscle mass between DEXA scans."
          action={<Button onClick={() => setImportOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Reading</Button>}
        />
        <WithingsImportDialog open={importOpen} onOpenChange={setImportOpen} />
      </>
    );
  }
  if (!selected) return null;

  const bc = selected.bodyComposition;
  const cmp = compare?.changes;

  // Overlays from DEXA + Skulpt
  const overlayChips: CompanionChip[] = [];
  const dexaNear = dexaScans.find(s => Math.abs(differenceInDays(new Date(s.scanDate), new Date(selected.scanDate))) <= 60);
  if (dexaNear) {
    const d = bc.bodyFatPercentage - dexaNear.bodyComposition.bodyFatPercentage;
    overlayChips.push({
      source: 'DEXA',
      primary: `${dexaNear.bodyComposition.bodyFatPercentage.toFixed(1)}% BF`,
      date: format(new Date(dexaNear.scanDate), 'MMM d'),
      delta: { text: `Δ ${d >= 0 ? '+' : ''}${d.toFixed(1)}pp scale vs DEXA`, tone: 'neutral' },
    });
  }
  const skulptNear = nearestCheckin(skulptCheckins, selected.scanDate, 30);
  if (skulptNear?.muscleQualityMQ !== undefined) {
    overlayChips.push({
      source: 'Skulpt',
      primary: `MQ ${skulptNear.muscleQualityMQ}`,
      date: format(new Date(skulptNear.date), 'MMM d'),
    });
  }

  const compareItems = readings.filter(r => r.id !== selected.id).map(r => ({
    id: r.id,
    label: format(new Date(r.scanDate), 'MMM d, yyyy'),
    hint: `${r.bodyComposition.totalMass.toFixed(1)} lbs`,
  }));

  const meta = (
    <>
      READING: {format(new Date(selected.scanDate), 'MMM d, yyyy').toUpperCase()} · WITHINGS BODY SCAN
      {compare && ` · COMPARING vs ${format(new Date(previous!.scanDate), 'MMM d, yyyy').toUpperCase()} (${compare.timeSpanDays} DAYS)`}
    </>
  );

  return (
    <>
      <SourcePageShell
        metaLine={meta}
        compare={{ value: compareId, onChange: setCompareId, autoLabel: 'Previous reading (auto)', items: compareItems }}
        insightsCount={insights.length}
        onInsightsClick={() => document.getElementById('insights')?.scrollIntoView({ behavior: 'smooth' })}
      >
        {overlayChips.length > 0 && <CompanionOverlayStrip chips={overlayChips} />}

        <div className="flex justify-end -mt-2">
          <Button size="sm" onClick={() => setImportOpen(true)}><Plus className="mr-1.5 h-3.5 w-3.5" />Add Reading</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiHeroTile label="Weight" value={`${bc.totalMass.toFixed(1)} lbs`}
            delta={cmp?.totalMass.value} deltaSuffix=" lbs" favTone={cmp ? (cmp.totalMass.value < 0 ? 'fav' : 'unfav') : undefined} />
          <KpiHeroTile label="Body fat %" value={`${bc.bodyFatPercentage.toFixed(1)}%`}
            delta={cmp?.bodyFatPercentage.value} deltaSuffix="pp" invertDelta />
          <KpiHeroTile label="Muscle mass" value={`${bc.leanMass.toFixed(1)} lbs`}
            delta={cmp?.leanMass.value} deltaSuffix=" lbs" valueTone="success" />
          <KpiHeroTile label="Fat mass" value={`${bc.fatMass.toFixed(1)} lbs`}
            delta={cmp?.fatMass.value} deltaSuffix=" lbs" invertDelta valueTone="destructive" />
        </div>

        <SectionCard>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">Recent readings</div>
          <div className="space-y-1.5">
            {readings.slice(0, 8).map((r, idx) => {
              const prev = readings[idx + 1];
              const dW = prev ? r.bodyComposition.totalMass - prev.bodyComposition.totalMass : null;
              return (
                <div key={r.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0">
                  <span className="text-muted-foreground">{format(new Date(r.scanDate), 'EEE, MMM d')}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-foreground tabular-nums">{r.bodyComposition.totalMass.toFixed(1)} lbs</span>
                    <span className="text-foreground tabular-nums hidden sm:inline">{r.bodyComposition.bodyFatPercentage.toFixed(1)}%</span>
                    {dW !== null && (
                      <span className={`text-xs tabular-nums ${dW < 0 ? 'text-success' : dW > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {dW > 0 ? '+' : ''}{dW.toFixed(1)} lbs
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <div id="insights">
          <AIInsightsPanel insights={insights} description="Reading-to-reading deltas with DEXA and Skulpt context overlays." emptyTitle="Need at least two readings" />
        </div>
      </SourcePageShell>

      <WithingsImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
};

export default WithingsScaleView;
