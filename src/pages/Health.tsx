import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Activity, Droplets, Calendar, Trash2, Upload, Sparkles, TrendingUp,
  Scale, Percent, TrendingDown, Plus,
} from 'lucide-react';
import Layout from '@/components/Layout';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import SectionCard from '@/components/common/SectionCard';
import StatusBadge from '@/components/common/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import BloodPanelDetail from '@/components/BloodPanelDetail';
import AIInsightsPanel from '@/components/AIInsightsPanel';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import WithingsImportDialog from '@/components/WithingsImportDialog';
import {
  useSnapshots, useDeleteSnapshot,
  useBloodPanels, useDeleteBloodPanel,
} from '@/hooks/use-api-queries';
import { snapshotApi } from '@/lib/api';
import type { Snapshot, ProgressCompare, BloodPanel } from '@/lib/api/types';
import { getBodyScanInsights, getBloodPanelInsights } from '@/lib/ai/insights';
import { toast } from '@/hooks/use-toast';

const isWithings = (s: Snapshot) => (s.provider || '').toLowerCase() === 'withings';

const Health: React.FC = () => {
  const { data: allSnapshots = [], isLoading: snapsLoading } = useSnapshots();
  const { data: panels = [], isLoading: panelsLoading } = useBloodPanels();
  const deleteSnapshot = useDeleteSnapshot();
  const deletePanel = useDeleteBloodPanel();

  // Split smart-scale (Withings) readings from DEXA scans so each tab is focused.
  const dexaScans = useMemo(() => allSnapshots.filter((s) => !isWithings(s)), [allSnapshots]);
  const withingsReadings = useMemo(
    () => allSnapshots.filter(isWithings).sort((a, b) => b.scanDate.localeCompare(a.scanDate)),
    [allSnapshots],
  );
  // The "scans" tab continues to compare against its own series (DEXA only).
  const snapshots = dexaScans;

  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ProgressCompare | null>(null);
  const [deleteScanTarget, setDeleteScanTarget] = useState<Snapshot | null>(null);
  const [deletePanelTarget, setDeletePanelTarget] = useState<BloodPanel | null>(null);
  const [withingsImportOpen, setWithingsImportOpen] = useState(false);

  const selectedScan = useMemo(
    () => (selectedScanId ? snapshots.find((s) => s.id === selectedScanId) : snapshots[0]) || null,
    [selectedScanId, snapshots],
  );
  const selectedPanel = useMemo(
    () => (selectedPanelId ? panels.find((p) => p.id === selectedPanelId) : panels[0]) || null,
    [selectedPanelId, panels],
  );

  // Load comparison when scan changes
  useEffect(() => {
    if (selectedScan && snapshots.length > 1) {
      snapshotApi.compare(selectedScan.id, 'last').then(setComparison).catch(() => setComparison(null));
    } else {
      setComparison(null);
    }
  }, [selectedScan?.id, snapshots.length]);

  const scanInsights = useMemo(
    () => (selectedScan ? getBodyScanInsights(selectedScan, comparison || undefined) : []),
    [selectedScan, comparison],
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
    snapshots.length > 0 ? 'scans'
    : withingsReadings.length > 0 ? 'withings'
    : panels.length > 0 ? 'blood'
    : 'scans';

  const formatChange = (v: number, suffix = '') => `${v > 0 ? '+' : ''}${v.toFixed(1)}${suffix}`;
  const changeColor = (v: number, invert = false) => {
    const positive = invert ? v < 0 : v > 0;
    return Math.abs(v) < 0.5 ? 'text-muted-foreground' : positive ? 'text-success' : 'text-destructive';
  };

  // Withings trend deltas (latest vs previous reading).
  const withingsLatest = withingsReadings[0];
  const withingsPrev = withingsReadings[1];
  const withingsDelta = withingsLatest && withingsPrev ? {
    weight: withingsLatest.bodyComposition.totalMass - withingsPrev.bodyComposition.totalMass,
    bf: withingsLatest.bodyComposition.bodyFatPercentage - withingsPrev.bodyComposition.bodyFatPercentage,
    lean: withingsLatest.bodyComposition.leanMass - withingsPrev.bodyComposition.leanMass,
    fat: withingsLatest.bodyComposition.fatMass - withingsPrev.bodyComposition.fatMass,
  } : null;

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
              <Activity className="mr-1.5 h-4 w-4" />DEXA Scans ({snapshots.length})
            </TabsTrigger>
            <TabsTrigger value="withings">
              <Scale className="mr-1.5 h-4 w-4" />Withings ({withingsReadings.length})
            </TabsTrigger>
            <TabsTrigger value="blood">
              <Droplets className="mr-1.5 h-4 w-4" />Blood Panels ({panels.length})
            </TabsTrigger>
          </TabsList>

          {/* ============ DEXA Scans ============ */}
          <TabsContent value="scans" className="mt-6">
            {snapshots.length === 0 ? (
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
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Scan list */}
                <SectionCard variant="subtle" title="Scan History" className="lg:col-span-1 h-fit">
                  <div className="space-y-2">
                    {snapshots.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => setSelectedScanId(s.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedScan?.id === s.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium text-sm text-foreground truncate">
                              {format(new Date(s.scanDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={(e) => { e.stopPropagation(); setDeleteScanTarget(s); }}
                          >
                            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {s.bodyComposition.bodyFatPercentage.toFixed(1)}% BF · {s.provider || 'BodySpec'}
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Detail */}
                <div className="lg:col-span-3 space-y-6">
                  {selectedScan && (
                    <>
                      {/* KPIs */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-1">
                              <Scale className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Weight</span>
                            </div>
                            <div className="text-2xl font-bold text-foreground">{selectedScan.bodyComposition.totalMass.toFixed(1)} lbs</div>
                            {comparison && (
                              <div className={`text-sm ${changeColor(comparison.changes.totalMass.value)}`}>
                                {formatChange(comparison.changes.totalMass.value, ' lbs')}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-1">
                              <Percent className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Body Fat</span>
                            </div>
                            <div className="text-2xl font-bold text-foreground">{selectedScan.bodyComposition.bodyFatPercentage.toFixed(1)}%</div>
                            {comparison && (
                              <div className={`text-sm ${changeColor(comparison.changes.bodyFatPercentage.value, true)}`}>
                                {formatChange(comparison.changes.bodyFatPercentage.value, '%')}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Lean Mass</span>
                            </div>
                            <div className="text-2xl font-bold text-foreground">{selectedScan.bodyComposition.leanMass.toFixed(1)} lbs</div>
                            {comparison && (
                              <div className={`text-sm ${changeColor(comparison.changes.leanMass.value)}`}>
                                {formatChange(comparison.changes.leanMass.value, ' lbs')}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingDown className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Fat Mass</span>
                            </div>
                            <div className="text-2xl font-bold text-foreground">{selectedScan.bodyComposition.fatMass.toFixed(1)} lbs</div>
                            {comparison && (
                              <div className={`text-sm ${changeColor(comparison.changes.fatMass.value, true)}`}>
                                {formatChange(comparison.changes.fatMass.value, ' lbs')}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* AI Insights */}
                      <AIInsightsPanel
                        insights={scanInsights}
                        title={<span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />AI Insights</span>}
                        description="Coaching grounded in your scan deltas. Every insight cites the reading it came from."
                      />

                      {/* Body composition */}
                      <SectionCard
                        title="Body Composition"
                        description={`${format(new Date(selectedScan.scanDate), 'MMMM d, yyyy')} · ${selectedScan.provider || 'BodySpec'} (DEXA)`}
                      >
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Lean Mass Ratio</span>
                              <span className="font-medium">
                                {((selectedScan.bodyComposition.leanMass / selectedScan.bodyComposition.totalMass) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <Progress value={(selectedScan.bodyComposition.leanMass / selectedScan.bodyComposition.totalMass) * 100} className="h-3" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Fat Mass Ratio</span>
                              <span className="font-medium">{selectedScan.bodyComposition.bodyFatPercentage.toFixed(1)}%</span>
                            </div>
                            <Progress value={selectedScan.bodyComposition.bodyFatPercentage} className="h-3" />
                          </div>

                          {selectedScan.regionalData.length > 0 && (
                            <div className="pt-4 border-t border-border">
                              <h4 className="font-medium mb-3 text-foreground text-sm">Regional Breakdown</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {selectedScan.regionalData.map((r) => (
                                  <div key={r.region} className="p-3 border border-border rounded-lg">
                                    <h5 className="font-medium capitalize text-sm text-foreground">{r.region}</h5>
                                    <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                      <div className="flex justify-between"><span>Fat</span><span>{r.fatMass.toFixed(1)} lbs</span></div>
                                      <div className="flex justify-between"><span>Lean</span><span>{r.leanMass.toFixed(1)} lbs</span></div>
                                      <div className="flex justify-between"><span>Fat %</span><span>{r.fatPercentage.toFixed(1)}%</span></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </SectionCard>
                    </>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ============ Withings Smart Scale ============ */}
          <TabsContent value="withings" className="mt-6">
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
              <div className="space-y-6">
                {/* KPI strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-1">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Weight</span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{withingsLatest!.bodyComposition.totalMass.toFixed(1)} lbs</div>
                      {withingsDelta && (
                        <div className={`text-sm ${changeColor(withingsDelta.weight)}`}>{formatChange(withingsDelta.weight, ' lbs')}</div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-1">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Body Fat</span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{withingsLatest!.bodyComposition.bodyFatPercentage.toFixed(1)}%</div>
                      {withingsDelta && (
                        <div className={`text-sm ${changeColor(withingsDelta.bf, true)}`}>{formatChange(withingsDelta.bf, '%')}</div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Lean Mass</span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{withingsLatest!.bodyComposition.leanMass.toFixed(1)} lbs</div>
                      {withingsDelta && (
                        <div className={`text-sm ${changeColor(withingsDelta.lean)}`}>{formatChange(withingsDelta.lean, ' lbs')}</div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Fat Mass</span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">{withingsLatest!.bodyComposition.fatMass.toFixed(1)} lbs</div>
                      {withingsDelta && (
                        <div className={`text-sm ${changeColor(withingsDelta.fat, true)}`}>{formatChange(withingsDelta.fat, ' lbs')}</div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Reading history + add */}
                <SectionCard
                  title="Reading History"
                  description={`${withingsReadings.length} reading${withingsReadings.length === 1 ? '' : 's'} from your Withings smart scale.`}
                  actions={
                    <Button size="sm" onClick={() => setWithingsImportOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />Add Reading
                    </Button>
                  }
                >
                  <div className="space-y-2">
                    {withingsReadings.map((r, idx) => {
                      const prev = withingsReadings[idx + 1];
                      const dW = prev ? r.bodyComposition.totalMass - prev.bodyComposition.totalMass : null;
                      const dBf = prev ? r.bodyComposition.bodyFatPercentage - prev.bodyComposition.bodyFatPercentage : null;
                      return (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground">
                                {format(new Date(r.scanDate), 'EEE, MMM d, yyyy')}
                              </div>
                              {r.notes && (
                                <div className="text-xs text-muted-foreground truncate italic">"{r.notes}"</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm shrink-0">
                            <div className="text-right">
                              <div className="font-semibold text-foreground">{r.bodyComposition.totalMass.toFixed(1)} lbs</div>
                              {dW !== null && (
                                <div className={`text-xs ${changeColor(dW)}`}>{formatChange(dW, ' lbs')}</div>
                              )}
                            </div>
                            <div className="text-right hidden sm:block">
                              <div className="font-semibold text-foreground">{r.bodyComposition.bodyFatPercentage.toFixed(1)}%</div>
                              {dBf !== null && (
                                <div className={`text-xs ${changeColor(dBf, true)}`}>{formatChange(dBf, '%')}</div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setDeleteScanTarget(r)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>

                <p className="text-xs text-muted-foreground">
                  Smart-scale readings track <strong>day-to-day trends</strong>. For ground-truth body composition (regional, bone density), import a DEXA scan from Admin.
                </p>
              </div>
            )}
          </TabsContent>

          {/* ============ Blood Panels ============ */}
          <TabsContent value="blood" className="mt-6">
            {panels.length === 0 ? (
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
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <SectionCard variant="subtle" title="Panel History" className="lg:col-span-1 h-fit">
                  <div className="space-y-2">
                    {panels.map((p) => {
                      const flagged = p.markers.filter((m) => m.status === 'outOfRange').length;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPanelId(p.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedPanel?.id === p.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="font-medium text-sm text-foreground truncate">
                                {format(new Date(p.panelDate), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {flagged > 0 && <StatusBadge tone="outOfRange" label={`${flagged} flagged`} />}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); setDeletePanelTarget(p); }}
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {p.markers.length} markers · RythmHealth
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>

                <div className="lg:col-span-3 space-y-6">
                  {selectedPanel && (
                    <>
                      <AIInsightsPanel
                        insights={panelInsights}
                        title={<span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />AI Insights</span>}
                        description="Each insight cites the marker, value, and reference range that triggered it."
                        emptyTitle="All markers in optimal range"
                      />
                      <BloodPanelDetail panel={selectedPanel} />
                    </>
                  )}
                </div>
              </div>
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
          toast({ title: 'Scan deleted' });
          if (selectedScanId === deleteScanTarget.id) setSelectedScanId(null);
          setDeleteScanTarget(null);
        }}
        title="Delete Body Scan"
        description="Delete this body composition scan? This cannot be undone."
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
    </Layout>
  );
};

export default Health;
