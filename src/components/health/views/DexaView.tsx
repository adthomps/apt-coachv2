import React, { useEffect, useMemo, useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Link } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/common/EmptyState';
import SectionCard from '@/components/common/SectionCard';
import { Activity } from 'lucide-react';
import SourcePageShell from '../SourcePageShell';
import KpiHeroTile from '../KpiHeroTile';
import CompanionOverlayStrip, { type CompanionChip } from '../CompanionOverlayStrip';
import MetricExplainer from '../MetricExplainer';
import RangeBar from '../RangeBar';
import AIInsightsPanel from '@/components/AIInsightsPanel';
import { useSnapshots, useHealthCheckins } from '@/hooks/use-api-queries';
import { snapshotApi } from '@/lib/api';
import type { ProgressCompare, Snapshot } from '@/lib/api/types';
import { getBodyScanInsights } from '@/lib/ai/insights';
import { nearestCheckin, formatDelta, deltaTone } from './overlay-utils';

const isWithings = (s: Snapshot) => (s.provider || '').toLowerCase() === 'withings';

const DexaView: React.FC = () => {
  const { data: allSnapshots = [] } = useSnapshots();
  const { data: withingsCheckins = [] } = useHealthCheckins({ source: 'withings_scale' });
  const { data: skulptCheckins = [] } = useHealthCheckins({ source: 'skulpt_chisel' });

  const dexaScans = useMemo(
    () => allSnapshots.filter(s => !isWithings(s)).sort((a, b) => b.scanDate.localeCompare(a.scanDate)),
    [allSnapshots],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ProgressCompare | null>(null);

  const selected = (selectedId ? dexaScans.find(s => s.id === selectedId) : dexaScans[0]) || null;

  useEffect(() => {
    if (!selected || dexaScans.length < 2) { setComparison(null); return; }
    snapshotApi.compare(selected.id, compareId ?? 'last').then(setComparison).catch(() => setComparison(null));
  }, [selected?.id, dexaScans.length, compareId]);

  const insights = useMemo(
    () => (selected ? getBodyScanInsights(selected, comparison || undefined) : []),
    [selected, comparison],
  );

  if (dexaScans.length === 0) {
    return (
      <EmptyState
        icon={<Activity className="h-12 w-12" />}
        title="No DEXA scans yet"
        description="Import a BodySpec scan from Admin to track body composition over time."
        action={<Link to="/admin?tab=imports&source=body_scan"><Button><Upload className="mr-2 h-4 w-4" />Import Body Scan</Button></Link>}
      />
    );
  }
  if (!selected) return null;

  const bc = selected.bodyComposition;
  const cmp = comparison?.changes;
  const days = comparison ? Math.max(1, differenceInDays(new Date(selected.scanDate), new Date(comparison.previousSnapshot.scanDate))) : null;

  const overlayChips: CompanionChip[] = [];
  const wNear = nearestCheckin(withingsCheckins, selected.scanDate);
  if (wNear?.weightLbs !== undefined) {
    const d = wNear.weightLbs - bc.totalMass;
    overlayChips.push({
      source: 'Withings',
      primary: `${wNear.weightLbs.toFixed(1)} lbs`,
      date: format(new Date(wNear.date), 'MMM d'),
      delta: { text: `${d >= 0 ? '+' : ''}${d.toFixed(1)} lbs vs scan`, tone: 'neutral' },
    });
  }
  const sNear = nearestCheckin(skulptCheckins, selected.scanDate);
  if (sNear?.muscleQualityMQ !== undefined) {
    overlayChips.push({
      source: 'Skulpt',
      primary: `MQ ${sNear.muscleQualityMQ}`,
      date: format(new Date(sNear.date), 'MMM d'),
    });
  }

  const compareItems = dexaScans.filter(s => s.id !== selected.id).map(s => ({
    id: s.id,
    label: format(new Date(s.scanDate), 'MMM d, yyyy'),
    hint: `${s.bodyComposition.bodyFatPercentage.toFixed(1)}% BF`,
  }));

  const meta = (
    <>
      SCAN: {format(new Date(selected.scanDate), 'MMM d, yyyy').toUpperCase()} · {(selected.provider || 'BodySpec').toUpperCase()}
      {comparison && ` · COMPARING vs ${format(new Date(comparison.previousSnapshot.scanDate), 'MMM d, yyyy').toUpperCase()} (${days} DAYS)`}
    </>
  );

  const bfTone: 'success' | 'warning' | 'destructive' | 'default' =
    bc.bodyFatPercentage <= 20 && bc.bodyFatPercentage >= 10 ? 'success' :
    bc.bodyFatPercentage > 25 ? 'destructive' :
    bc.bodyFatPercentage > 20 ? 'warning' : 'default';

  return (
    <SourcePageShell
      metaLine={meta}
      compare={{
        value: compareId, onChange: setCompareId,
        autoLabel: 'Previous scan (auto)', items: compareItems,
      }}
      insightsCount={insights.length}
      onInsightsClick={() => document.getElementById('insights')?.scrollIntoView({ behavior: 'smooth' })}
    usedIn={[{ label: 'Today · training emphasis', href: '/today' }, { label: 'Dashboard · DEXA card', href: '/dashboard' }]}
    >
      {overlayChips.length > 0 && <CompanionOverlayStrip chips={overlayChips} />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiHeroTile label="Weight" value={`${bc.totalMass.toFixed(1)} lbs`}
          delta={cmp?.totalMass.value} deltaSuffix=" lbs" favTone={cmp ? (cmp.totalMass.value < 0 ? 'fav' : 'unfav') : undefined} metricKey="weight" />
        <KpiHeroTile label="Body fat %" value={`${bc.bodyFatPercentage.toFixed(1)}%`}
          delta={cmp?.bodyFatPercentage.value} deltaSuffix="pp" invertDelta valueTone={bfTone} metricKey="body_fat" />
        <KpiHeroTile label="Lean mass" value={`${bc.leanMass.toFixed(1)} lbs`}
          delta={cmp?.leanMass.value} deltaSuffix=" lbs" valueTone="success" metricKey="lean_mass" />
        <KpiHeroTile label="Fat mass" value={`${bc.fatMass.toFixed(1)} lbs`}
          delta={cmp?.fatMass.value} deltaSuffix=" lbs" invertDelta valueTone="destructive" metricKey="fat_mass" />
      </div>

      <SectionCard>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Body Composition Detail</div>
            <DetailRow label="Lean mass ratio" value={`${((bc.leanMass / bc.totalMass) * 100).toFixed(1)}%`} />
            <DetailRow label="Body fat vs healthy range" value={`${bc.bodyFatPercentage.toFixed(1)}% (men: 10–20% athletic)`} valueTone={bfTone} />
            {bc.visceralFatArea !== undefined && <DetailRow label="Visceral fat area" value={`${bc.visceralFatArea} (≤100 coaching ref)`} />}
            <DetailRow label="Fat : lean ratio" value={`1 : ${(bc.leanMass / Math.max(bc.fatMass, 0.1)).toFixed(2)}`} />
            <DetailRow label="Bone mass" value={`${bc.boneMass.toFixed(1)} lbs`} />
            <RangeBar
              value={bc.bodyFatPercentage} min={10} max={20}
              status={bfTone === 'success' ? 'optimal' : bfTone === 'destructive' ? 'outOfRange' : 'average'}
            />
          </div>

          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Regional Breakdown</div>
            {selected.regionalData.length === 0 && <p className="text-xs text-muted-foreground">No regional data on this scan.</p>}
            {selected.regionalData.map(r => {
              const prevR = comparison?.previousSnapshot.regionalData.find(p => p.region === r.region);
              const dLean = prevR ? r.leanMass - prevR.leanMass : null;
              return (
                <div key={r.region} className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0">
                  <span className="capitalize text-muted-foreground">{r.region}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-foreground tabular-nums">
                      {r.fatMass.toFixed(1)} lbs fat · {r.leanMass.toFixed(1)} lbs lean
                    </span>
                    {dLean !== null && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        dLean > 0 ? 'text-success border-success/30 bg-success/10' :
                        dLean < 0 ? 'text-destructive border-destructive/30 bg-destructive/10' :
                        'text-muted-foreground border-border bg-muted'
                      } tabular-nums`}>
                        {dLean > 0 ? '+' : ''}{dLean.toFixed(1)} lbs {dLean > 0 ? '↑' : dLean < 0 ? '↓' : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selected.boneDensity && (
          <div className="pt-5 mt-4 border-t border-border space-y-2">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Bone Density</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <BoneTile label="T-score" value={selected.boneDensity.tScore} hint={selected.boneDensity.tScore !== undefined ? (selected.boneDensity.tScore >= -1 ? 'Normal' : selected.boneDensity.tScore >= -2.5 ? 'Osteopenia' : 'Osteoporosis') : 'N/A'} />
              <BoneTile label="Z-score" value={selected.boneDensity.zScore} hint="Normal" />
              <BoneTile label="Lumbar BMD" value={selected.boneDensity.lumbarSpine} suffix=" g/cm²" hint="" />
              <BoneTile label="Femur BMD" value={selected.boneDensity.femur} suffix=" g/cm²" hint={selected.boneDensity.femur === undefined ? 'not in scan' : ''} />
            </div>
            <MetricExplainer metricKey="bone_t_score" compact title="What these scores mean" />
          </div>
        )}
      </SectionCard>

      <div id="insights">
        <AIInsightsPanel insights={insights} description="Coaching grounded in your DEXA deltas." />
      </div>
    </SourcePageShell>
  );
};

const DetailRow: React.FC<{ label: string; value: React.ReactNode; valueTone?: 'success' | 'warning' | 'destructive' | 'default' }> = ({ label, value, valueTone = 'default' }) => (
  <div className="flex items-center justify-between text-sm py-1 border-b border-border/40 last:border-0">
    <span className="text-muted-foreground">{label}</span>
    <span className={`tabular-nums font-medium ${
      valueTone === 'warning' ? 'text-warning' :
      valueTone === 'destructive' ? 'text-destructive' :
      valueTone === 'success' ? 'text-success' : 'text-foreground'
    }`}>{value}</span>
  </div>
);

const BoneTile: React.FC<{ label: string; value: number | undefined; suffix?: string; hint?: string }> = ({ label, value, suffix = '', hint }) => (
  <div className="rounded-lg border border-border bg-muted/30 p-3">
    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className={`text-xl font-bold tabular-nums ${value === undefined ? 'text-muted-foreground' : 'text-success'}`}>
      {value === undefined ? 'N/A' : `${value.toFixed(value < 10 ? 3 : 1)}${suffix}`}
    </div>
    {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
  </div>
);

export default DexaView;
