import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import {
  Activity, Droplets, Upload, Sparkles, TrendingUp,
  Scale, Percent, TrendingDown, Plus, CheckCircle, AlertTriangle, Calendar,
} from 'lucide-react';
import Layout from '@/components/Layout';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import SectionCard from '@/components/common/SectionCard';
import StatusBadge from '@/components/common/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import BloodPanelDetail from '@/components/BloodPanelDetail';
import AIInsightsPanel from '@/components/AIInsightsPanel';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import WithingsImportDialog from '@/components/WithingsImportDialog';
import HealthSelectorBar from '@/components/health/HealthSelectorBar';
import KpiStat from '@/components/health/KpiStat';
import RangeBar from '@/components/health/RangeBar';
import DeltaValue from '@/components/health/DeltaValue';
import InsightsAnchor from '@/components/health/InsightsAnchor';
import MetricExplainer from '@/components/health/MetricExplainer';
import type { MetricKey } from '@/lib/health/metric-glossary';
import {
  useSnapshots, useDeleteSnapshot,
  useBloodPanels, useDeleteBloodPanel,
} from '@/hooks/use-api-queries';
import { snapshotApi } from '@/lib/api';
import type { Snapshot, ProgressCompare, BloodPanel } from '@/lib/api/types';
import { getBodyScanInsights, getBloodPanelInsights } from '@/lib/ai/insights';
import { toast } from '@/hooks/use-toast';

const isWithings = (s: Snapshot) => (s.provider || '').toLowerCase() === 'withings';

/** Build a ProgressCompare in-page from two snapshots (no API call needed). */
function buildLocalCompare(current: Snapshot, previous: Snapshot): ProgressCompare {
  const c = current.bodyComposition;
  const p = previous.bodyComposition;
  const pct = (delta: number, base: number) => (base === 0 ? 0 : (delta / base) * 100);
  return {
    currentSnapshot: current,
    previousSnapshot: previous,
    changes: {
      totalMass: { value: c.totalMass - p.totalMass, percentage: pct(c.totalMass - p.totalMass, p.totalMass) },
      fatMass: { value: c.fatMass - p.fatMass, percentage: pct(c.fatMass - p.fatMass, p.fatMass) },
      leanMass: { value: c.leanMass - p.leanMass, percentage: pct(c.leanMass - p.leanMass, p.leanMass) },
      bodyFatPercentage: {
        value: c.bodyFatPercentage - p.bodyFatPercentage,
        percentage: pct(c.bodyFatPercentage - p.bodyFatPercentage, p.bodyFatPercentage),
      },
      regionalChanges: [],
    },
    timeSpanDays: Math.max(1, differenceInDays(new Date(current.scanDate), new Date(previous.scanDate))),
  };
}

const Health: React.FC = () => {
  const { data: allSnapshots = [], isLoading: snapsLoading } = useSnapshots();
  const { data: panels = [], isLoading: panelsLoading } = useBloodPanels();
  const deleteSnapshot = useDeleteSnapshot();
  const deletePanel = useDeleteBloodPanel();

  const dexaScans = useMemo(
    () => allSnapshots.filter((s) => !isWithings(s)).sort((a, b) => b.scanDate.localeCompare(a.scanDate)),
    [allSnapshots],
  );
  const withingsReadings = useMemo(
    () => allSnapshots.filter(isWithings).sort((a, b) => b.scanDate.localeCompare(a.scanDate)),
    [allSnapshots],
  );
  const sortedPanels = useMemo(
    () => [...panels].sort((a, b) => b.panelDate.localeCompare(a.panelDate)),
    [panels],
  );

  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [selectedWithingsId, setSelectedWithingsId] = useState<string | null>(null);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);

  // Compare-against picker state. null = "auto previous".
  const [scanCompareId, setScanCompareId] = useState<string | null>(null);
  const [withingsCompareId, setWithingsCompareId] = useState<string | null>(null);

  const [comparison, setComparison] = useState<ProgressCompare | null>(null);
  const [deleteScanTarget, setDeleteScanTarget] = useState<Snapshot | null>(null);
  const [deletePanelTarget, setDeletePanelTarget] = useState<BloodPanel | null>(null);
  const [withingsImportOpen, setWithingsImportOpen] = useState(false);

  const selectedScan = useMemo(
    () => (selectedScanId ? dexaScans.find((s) => s.id === selectedScanId) : dexaScans[0]) || null,
    [selectedScanId, dexaScans],
  );
  const selectedWithings = useMemo(
    () => (selectedWithingsId ? withingsReadings.find((s) => s.id === selectedWithingsId) : withingsReadings[0]) || null,
    [selectedWithingsId, withingsReadings],
  );
  const selectedPanel = useMemo(
    () => (selectedPanelId ? sortedPanels.find((p) => p.id === selectedPanelId) : sortedPanels[0]) || null,
    [selectedPanelId, sortedPanels],
  );

  // DEXA comparison via API (specific id when chosen, otherwise 'last').
  useEffect(() => {
    if (!selectedScan || dexaScans.length < 2) {
      setComparison(null);
      return;
    }
    const previousArg = scanCompareId ?? 'last';
    snapshotApi.compare(selectedScan.id, previousArg).then(setComparison).catch(() => setComparison(null));
  }, [selectedScan?.id, dexaScans.length, scanCompareId]);

  // Withings comparison built locally — uses chosen id, or auto-picks the next item.
  const withingsCompare = useMemo<ProgressCompare | null>(() => {
    if (!selectedWithings) return null;
    let prev: Snapshot | undefined;
    if (withingsCompareId) {
      prev = withingsReadings.find((r) => r.id === withingsCompareId);
    } else {
      const idx = withingsReadings.findIndex((r) => r.id === selectedWithings.id);
      prev = withingsReadings[idx + 1];
    }
    return prev ? buildLocalCompare(selectedWithings, prev) : null;
  }, [selectedWithings, withingsReadings, withingsCompareId]);

  const scanInsights = useMemo(
    () => (selectedScan ? getBodyScanInsights(selectedScan, comparison || undefined) : []),
    [selectedScan, comparison],
  );
  const withingsInsights = useMemo(
    () => (selectedWithings ? getBodyScanInsights(selectedWithings, withingsCompare || undefined) : []),
    [selectedWithings, withingsCompare],
  );
  const panelInsights = useMemo(
    () => (selectedPanel ? getBloodPanelInsights(selectedPanel) : []),
    [selectedPanel],
  );

  if (snapsLoading || panelsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Loading health data...</div>
        </div>
      </Layout>
    );
  }

  const defaultTab =
    dexaScans.length > 0 ? 'scans'
    : withingsReadings.length > 0 ? 'withings'
    : sortedPanels.length > 0 ? 'blood'
    : 'scans';

  const insightsTitle = (
    <span className="flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-primary" />AI Insights
    </span>
  );

  // ---------- Selector option builders ----------
  const scanOptions = dexaScans.map((s) => ({
    id: s.id,
    label: format(new Date(s.scanDate), 'MMM d, yyyy'),
    hint: `${s.bodyComposition.bodyFatPercentage.toFixed(1)}% BF`,
  }));
  const scanCompareOptions = scanOptions.filter((o) => o.id !== selectedScan?.id);

  const withingsOptions = withingsReadings.map((r) => ({
    id: r.id,
    label: format(new Date(r.scanDate), 'MMM d, yyyy'),
    hint: `${r.bodyComposition.totalMass.toFixed(1)} lbs`,
  }));
  const withingsCompareOptions = withingsOptions.filter((o) => o.id !== selectedWithings?.id);

  const panelOptions = sortedPanels.map((p) => {
    const flagged = p.markers.filter((m) => m.status === 'outOfRange').length;
    return {
      id: p.id,
      label: format(new Date(p.panelDate), 'MMM d, yyyy'),
      hint: flagged > 0 ? `${flagged} flagged` : `${p.markers.length} markers`,
    };
  });

  const compareSpan = (cmp: ProgressCompare | null) =>
    cmp ? `vs ${format(new Date(cmp.previousSnapshot.scanDate), 'MMM d, yyyy')} · ${cmp.timeSpanDays} days` : null;

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Health Data"
          icon={<Activity className="h-8 w-8 text-primary" />}
          description="Body composition scans, smart-scale trends, and blood marker panels."
          actions={
            <Link to="/admin?tab=imports">
              <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Import in Admin</Button>
            </Link>
          }
        />

        <Tabs defaultValue={defaultTab}>
          <TabsList>
            <TabsTrigger value="scans">
              <Activity className="mr-1.5 h-4 w-4" />DEXA Scans ({dexaScans.length})
            </TabsTrigger>
            <TabsTrigger value="withings">
              <Scale className="mr-1.5 h-4 w-4" />Withings ({withingsReadings.length})
            </TabsTrigger>
            <TabsTrigger value="blood">
              <Droplets className="mr-1.5 h-4 w-4" />Blood Panels ({sortedPanels.length})
            </TabsTrigger>
          </TabsList>

          {/* ============ DEXA Scans ============ */}
          <TabsContent value="scans" className="mt-6 space-y-6">
            {dexaScans.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-12 w-12" />}
                title="No body scans yet"
                description="Import a BodySpec (DEXA) scan from Admin to track body composition over time."
                action={
                  <Link to="/admin?tab=imports&source=body_scan">
                    <Button><Upload className="mr-2 h-4 w-4" />Import Body Scan</Button>
                  </Link>
                }
              />
            ) : (
              <>
                <HealthSelectorBar
                  items={scanOptions}
                  selectedId={selectedScan?.id ?? null}
                  onSelect={setSelectedScanId}
                  compareItems={scanCompareOptions}
                  compareId={scanCompareId}
                  onCompareChange={setScanCompareId}
                  compareAutoLabel="Previous scan (auto)"
                  countLabel={`${dexaScans.length} scan${dexaScans.length === 1 ? '' : 's'}`}
                  onDelete={() => selectedScan && setDeleteScanTarget(selectedScan)}
                />

                {selectedScan && (
                  <>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(selectedScan.scanDate), 'MMMM d, yyyy')} · {selectedScan.provider || 'BodySpec'} (DEXA)
                        {compareSpan(comparison) && <span className="ml-2 text-xs">· {compareSpan(comparison)}</span>}
                      </div>
                      <InsightsAnchor count={scanInsights.length} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <KpiStat icon={<Scale />} label="Weight" value={`${selectedScan.bodyComposition.totalMass.toFixed(1)} lbs`}
                        delta={comparison?.changes.totalMass.value} deltaSuffix=" lbs" neutralDelta metricKey="weight" />
                      <KpiStat icon={<Percent />} label="Body Fat" value={`${selectedScan.bodyComposition.bodyFatPercentage.toFixed(1)}%`}
                        delta={comparison?.changes.bodyFatPercentage.value} deltaSuffix="%" invertDelta metricKey="body_fat" />
                      <KpiStat icon={<TrendingUp />} label="Lean Mass" value={`${selectedScan.bodyComposition.leanMass.toFixed(1)} lbs`}
                        delta={comparison?.changes.leanMass.value} deltaSuffix=" lbs" metricKey="lean_mass" />
                      <KpiStat icon={<TrendingDown />} label="Fat Mass" value={`${selectedScan.bodyComposition.fatMass.toFixed(1)} lbs`}
                        delta={comparison?.changes.fatMass.value} deltaSuffix=" lbs" invertDelta metricKey="fat_mass" />
                    </div>

                    <SectionCard title="Body Composition" description="Lean / fat distribution and regional breakdown.">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Lean Mass Ratio</span>
                            <span className="font-medium tabular-nums">
                              {((selectedScan.bodyComposition.leanMass / selectedScan.bodyComposition.totalMass) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={(selectedScan.bodyComposition.leanMass / selectedScan.bodyComposition.totalMass) * 100} className="h-3" />
                          <MetricExplainer metricKey="lean_mass_ratio" compact />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Body Fat % vs Healthy Range (10–20%)</span>
                            <span className="font-medium tabular-nums">{selectedScan.bodyComposition.bodyFatPercentage.toFixed(1)}%</span>
                          </div>
                          <RangeBar
                            value={selectedScan.bodyComposition.bodyFatPercentage}
                            min={10}
                            max={20}
                            status={
                              selectedScan.bodyComposition.bodyFatPercentage <= 20 && selectedScan.bodyComposition.bodyFatPercentage >= 10
                                ? 'optimal'
                                : selectedScan.bodyComposition.bodyFatPercentage > 25
                                  ? 'outOfRange'
                                  : 'average'
                            }
                          />
                          <MetricExplainer metricKey="body_fat" compact />
                        </div>

                        {selectedScan.regionalData.length > 0 && (
                          <div className="pt-4 border-t border-border">
                            <h4 className="font-medium mb-3 text-foreground text-sm">Regional Breakdown</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                              {selectedScan.regionalData.map((r) => {
                                const regionKey = `region_${r.region}` as MetricKey;
                                return (
                                  <div key={r.region} className="p-3 border border-border rounded-lg">
                                    <h5 className="font-medium capitalize text-sm text-foreground">{r.region}</h5>
                                    <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                      <div className="flex justify-between"><span>Fat</span><span className="tabular-nums">{r.fatMass.toFixed(1)} lbs</span></div>
                                      <div className="flex justify-between"><span>Lean</span><span className="tabular-nums">{r.leanMass.toFixed(1)} lbs</span></div>
                                      <div className="flex justify-between"><span>Fat %</span><span className="tabular-nums">{r.fatPercentage.toFixed(1)}%</span></div>
                                    </div>
                                    <MetricExplainer metricKey={regionKey} compact title="About this region" />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {selectedScan.boneDensity && (selectedScan.boneDensity.tScore !== undefined || selectedScan.boneDensity.zScore !== undefined) && (
                          <div className="pt-4 border-t border-border">
                            <h4 className="font-medium mb-3 text-foreground text-sm">Bone Density</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {selectedScan.boneDensity.tScore !== undefined && (
                                <div className="p-3 border border-border rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">T-score</span>
                                    <span className="text-lg font-semibold text-foreground tabular-nums">{selectedScan.boneDensity.tScore.toFixed(1)}</span>
                                  </div>
                                  <MetricExplainer metricKey="bone_t_score" compact />
                                </div>
                              )}
                              {selectedScan.boneDensity.zScore !== undefined && (
                                <div className="p-3 border border-border rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Z-score</span>
                                    <span className="text-lg font-semibold text-foreground tabular-nums">{selectedScan.boneDensity.zScore.toFixed(1)}</span>
                                  </div>
                                  <MetricExplainer metricKey="bone_z_score" compact />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </SectionCard>

                    <div id="insights">
                      <AIInsightsPanel
                        insights={scanInsights}
                        title={insightsTitle}
                        description="Coaching grounded in your scan deltas. Every insight cites the reading it came from."
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </TabsContent>

          {/* ============ Withings Smart Scale ============ */}
          <TabsContent value="withings" className="mt-6 space-y-6">
            {withingsReadings.length === 0 ? (
              <EmptyState
                icon={<Scale className="h-12 w-12" />}
                title="No Withings readings yet"
                description="Log a smart-scale reading to track weight, body fat %, and lean mass between DEXA scans."
                action={
                  <Button onClick={() => setWithingsImportOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />Add Reading
                  </Button>
                }
              />
            ) : (
              <>
                <HealthSelectorBar
                  items={withingsOptions}
                  selectedId={selectedWithings?.id ?? null}
                  onSelect={setSelectedWithingsId}
                  compareItems={withingsCompareOptions}
                  compareId={withingsCompareId}
                  onCompareChange={setWithingsCompareId}
                  compareAutoLabel="Previous reading (auto)"
                  countLabel={`${withingsReadings.length} reading${withingsReadings.length === 1 ? '' : 's'}`}
                  onDelete={() => selectedWithings && setDeleteScanTarget(selectedWithings)}
                  actions={
                    <Button size="sm" onClick={() => setWithingsImportOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />Add Reading
                    </Button>
                  }
                />

                {selectedWithings && (
                  <>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(selectedWithings.scanDate), 'MMMM d, yyyy')} · Withings smart scale
                        {compareSpan(withingsCompare) && <span className="ml-2 text-xs">· {compareSpan(withingsCompare)}</span>}
                      </div>
                      <InsightsAnchor count={withingsInsights.length} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <KpiStat icon={<Scale />} label="Weight" value={`${selectedWithings.bodyComposition.totalMass.toFixed(1)} lbs`}
                        delta={withingsCompare?.changes.totalMass.value} deltaSuffix=" lbs" neutralDelta metricKey="weight" />
                      <KpiStat icon={<Percent />} label="Body Fat" value={`${selectedWithings.bodyComposition.bodyFatPercentage.toFixed(1)}%`}
                        delta={withingsCompare?.changes.bodyFatPercentage.value} deltaSuffix="%" invertDelta metricKey="body_fat" />
                      <KpiStat icon={<TrendingUp />} label="Lean Mass" value={`${selectedWithings.bodyComposition.leanMass.toFixed(1)} lbs`}
                        delta={withingsCompare?.changes.leanMass.value} deltaSuffix=" lbs" metricKey="lean_mass" />
                      <KpiStat icon={<TrendingDown />} label="Fat Mass" value={`${selectedWithings.bodyComposition.fatMass.toFixed(1)} lbs`}
                        delta={withingsCompare?.changes.fatMass.value} deltaSuffix=" lbs" invertDelta metricKey="fat_mass" />
                    </div>

                    <SectionCard
                      title="Trend"
                      description="Body fat % vs typical healthy range, plus recent reading-to-reading deltas."
                    >
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Body Fat % vs Healthy Range (10–20%)</span>
                            <span className="font-medium tabular-nums">{selectedWithings.bodyComposition.bodyFatPercentage.toFixed(1)}%</span>
                          </div>
                          <RangeBar
                            value={selectedWithings.bodyComposition.bodyFatPercentage}
                            min={10}
                            max={20}
                            status={
                              selectedWithings.bodyComposition.bodyFatPercentage <= 20 && selectedWithings.bodyComposition.bodyFatPercentage >= 10
                                ? 'optimal'
                                : selectedWithings.bodyComposition.bodyFatPercentage > 25
                                  ? 'outOfRange'
                                  : 'average'
                            }
                          />
                        </div>

                        {withingsReadings.length > 1 && (
                          <div className="pt-4 border-t border-border">
                            <h4 className="font-medium mb-3 text-foreground text-sm">Recent Readings</h4>
                            <div className="space-y-2">
                              {withingsReadings.slice(0, 5).map((r, idx) => {
                                const prev = withingsReadings[idx + 1];
                                const dW = prev ? r.bodyComposition.totalMass - prev.bodyComposition.totalMass : null;
                                const dBf = prev ? r.bodyComposition.bodyFatPercentage - prev.bodyComposition.bodyFatPercentage : null;
                                return (
                                  <div key={r.id} className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-border last:border-0">
                                    <div className="flex items-center gap-2 min-w-0 text-muted-foreground">
                                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                                      <span>{format(new Date(r.scanDate), 'EEE, MMM d')}</span>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                      <div className="text-right">
                                        <div className="font-semibold text-foreground tabular-nums">{r.bodyComposition.totalMass.toFixed(1)} lbs</div>
                                        {dW !== null && <DeltaValue value={dW} suffix=" lbs" neutral className="text-xs" />}
                                      </div>
                                      <div className="text-right hidden sm:block">
                                        <div className="font-semibold text-foreground tabular-nums">{r.bodyComposition.bodyFatPercentage.toFixed(1)}%</div>
                                        {dBf !== null && <DeltaValue value={dBf} suffix="%" invert className="text-xs" />}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <MetricExplainer metricKey="weight_trend" compact title="How to read scale-to-scale changes" />

                        <p className="text-xs text-muted-foreground pt-1">
                          Smart-scale readings track day-to-day trends. For ground-truth body composition (regional, bone density), import a DEXA scan from Admin.
                        </p>
                      </div>
                    </SectionCard>

                    {selectedWithings.notes && (
                      <SectionCard title="Notes">
                        <p className="text-sm text-muted-foreground italic">"{selectedWithings.notes}"</p>
                      </SectionCard>
                    )}

                    <div id="insights">
                      <AIInsightsPanel
                        insights={withingsInsights}
                        title={insightsTitle}
                        description="Coaching grounded in your reading-to-reading deltas. Every insight cites the reading it came from."
                        emptyTitle="Need at least two readings"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </TabsContent>

          {/* ============ Blood Panels ============ */}
          <TabsContent value="blood" className="mt-6 space-y-6">
            {sortedPanels.length === 0 ? (
              <EmptyState
                icon={<Droplets className="h-12 w-12" />}
                title="No blood panels yet"
                description="Import a RythmHealth blood panel CSV from Admin to get marker insights."
                action={
                  <Link to="/admin?tab=imports&source=blood_panel">
                    <Button><Upload className="mr-2 h-4 w-4" />Import Blood Panel</Button>
                  </Link>
                }
              />
            ) : (
              <>
                <HealthSelectorBar
                  items={panelOptions}
                  selectedId={selectedPanel?.id ?? null}
                  onSelect={setSelectedPanelId}
                  countLabel={`${sortedPanels.length} panel${sortedPanels.length === 1 ? '' : 's'}`}
                  onDelete={() => selectedPanel && setDeletePanelTarget(selectedPanel)}
                />

                {selectedPanel && (() => {
                  const optimal = selectedPanel.markers.filter((m) => m.status === 'optimal').length;
                  const flagged = selectedPanel.markers.filter((m) => m.status === 'outOfRange').length;
                  const flaggedBadge = flagged > 0
                    ? <StatusBadge tone="outOfRange" label={`${flagged} flagged`} />
                    : null;
                  return (
                    <>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{format(new Date(selectedPanel.panelDate), 'MMMM d, yyyy')} · RythmHealth</span>
                          {flaggedBadge}
                        </div>
                        <InsightsAnchor count={panelInsights.length} />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <KpiStat icon={<Droplets />} label="Total Markers" value={selectedPanel.markers.length} />
                        <KpiStat icon={<CheckCircle className="text-success" />} label="Optimal" value={<span className="text-success">{optimal}</span>} metricKey="markers_optimal" />
                        <KpiStat icon={<AlertTriangle className="text-destructive" />} label="Out of Range" value={<span className="text-destructive">{flagged}</span>} metricKey="markers_out_of_range" />
                        <KpiStat icon={<Calendar />} label="Panel Date" value={<span className="text-lg">{format(new Date(selectedPanel.panelDate), 'MMM d, yyyy')}</span>} />
                      </div>

                      <SectionCard variant="subtle">
                        <MetricExplainer metricKey="panel_summary" compact title="How to read this panel" />
                      </SectionCard>

                      <BloodPanelDetail panel={selectedPanel} />

                      <div id="insights">
                        <AIInsightsPanel
                          insights={panelInsights}
                          title={insightsTitle}
                          description="Each insight cites the marker, value, and reference range that triggered it."
                          emptyTitle="All markers in optimal range"
                        />
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <DeleteConfirmDialog
        open={!!deleteScanTarget}
        onOpenChange={(o) => { if (!o) setDeleteScanTarget(null); }}
        onConfirm={async () => {
          if (!deleteScanTarget) return;
          await deleteSnapshot.mutateAsync(deleteScanTarget.id);
          toast({ title: isWithings(deleteScanTarget) ? 'Reading deleted' : 'Scan deleted' });
          if (selectedScanId === deleteScanTarget.id) setSelectedScanId(null);
          if (selectedWithingsId === deleteScanTarget.id) setSelectedWithingsId(null);
          setDeleteScanTarget(null);
        }}
        title={deleteScanTarget && isWithings(deleteScanTarget) ? 'Delete Reading' : 'Delete Body Scan'}
        description="This action cannot be undone."
        isLoading={deleteSnapshot.isPending}
      />

      <DeleteConfirmDialog
        open={!!deletePanelTarget}
        onOpenChange={(o) => { if (!o) setDeletePanelTarget(null); }}
        onConfirm={async () => {
          if (!deletePanelTarget) return;
          await deletePanel.mutateAsync(deletePanelTarget.id);
          toast({ title: 'Blood panel deleted' });
          if (selectedPanelId === deletePanelTarget.id) setSelectedPanelId(null);
          setDeletePanelTarget(null);
        }}
        title="Delete Blood Panel"
        description="Delete this blood panel? This cannot be undone."
        isLoading={deletePanel.isPending}
      />

      <WithingsImportDialog open={withingsImportOpen} onOpenChange={setWithingsImportOpen} />
    </Layout>
  );
};

export default Health;
