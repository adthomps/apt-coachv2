import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity, Upload, TrendingUp, TrendingDown, Scale, Percent,
  CheckCircle, XCircle, Calendar, Eye, Trash2, Droplets
} from 'lucide-react';
import Layout from '@/components/Layout';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import BloodPanelImportDialog from '@/components/BloodPanelImportDialog';
import BloodPanelDetail from '@/components/BloodPanelDetail';
import {
  useSnapshots, useCreateSnapshot, useDeleteSnapshot, useSnapshotCompare, useAnalyzeSnapshot,
  useBloodPanels, useDeleteBloodPanel, useAnalyzeBloodPanel,
} from '@/hooks/use-api-queries';
import SnapshotImportDialog from '@/components/SnapshotImportDialog';
import { snapshotApi } from '@/lib/api';
import type { Snapshot, ProgressCompare, BloodPanel } from '@/lib/api/types';
import { snapshotImportSchema } from '@/lib/validations';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const KG_TO_LBS = 2.20462;

const Snapshots = () => {
  const { data: snapshots = [], isLoading } = useSnapshots();
  const createMutation = useCreateSnapshot();
  const deleteMutation = useDeleteSnapshot();
  const analyzeMutation = useAnalyzeSnapshot();

  const { data: bloodPanels = [], isLoading: bloodPanelsLoading } = useBloodPanels();
  const deleteBloodPanelMutation = useDeleteBloodPanel();
  const analyzeBloodPanelMutation = useAnalyzeBloodPanel();

  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ProgressCompare | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Snapshot | null>(null);
  const [deletePanelTarget, setDeletePanelTarget] = useState<BloodPanel | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [bloodPanelImportOpen, setBloodPanelImportOpen] = useState(false);

  // Import state
  const [jsonData, setJsonData] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<Record<string, unknown> | null>(null);

  const selectedSnapshot = selectedSnapshotId
    ? snapshots.find(s => s.id === selectedSnapshotId) || snapshots[0] || null
    : snapshots[0] || null;

  const selectedPanel = selectedPanelId
    ? bloodPanels.find(p => p.id === selectedPanelId) || bloodPanels[0] || null
    : bloodPanels[0] || null;

  // Load comparison when snapshot changes
  React.useEffect(() => {
    if (selectedSnapshot && snapshots.length > 1) {
      const idx = snapshots.findIndex(s => s.id === selectedSnapshot.id);
      if (idx < snapshots.length - 1) {
        snapshotApi.compare(selectedSnapshot.id, 'last').then(setComparison).catch(() => setComparison(null));
      } else {
        setComparison(null);
      }
    } else {
      setComparison(null);
    }
  }, [selectedSnapshot?.id, snapshots.length]);

  const handleSelectSnapshot = (snap: Snapshot) => {
    setSelectedSnapshotId(snap.id);
  };

  const handleValidateJson = () => {
    setImportError(null);
    setImportPreview(null);
    try {
      const parsed = JSON.parse(jsonData);
      const mapped: Record<string, unknown> = {};
      mapped.scanDate = parsed.scan_date || parsed.scanDate || new Date().toISOString().split('T')[0];
      mapped.provider = parsed.source || parsed.provider || 'BodySpec';
      const bc = parsed.body_composition || parsed;

      let totalMass = bc.total_mass_lbs || bc.totalMass;
      let fatMass = bc.fat_mass_lbs || bc.fatMass;
      let leanMass = bc.lean_mass_lbs || bc.leanMass;
      let boneMass = bc.bone_mass_lbs || bc.boneMass;

      if (!totalMass && (bc.total_mass_kg || bc.weight)) {
        totalMass = (bc.total_mass_kg || bc.weight) * KG_TO_LBS;
        fatMass = (bc.fat_mass_kg) * KG_TO_LBS;
        leanMass = (bc.lean_mass_kg) * KG_TO_LBS;
        boneMass = (bc.bone_mass_kg || 3.0) * KG_TO_LBS;
      }

      mapped.totalMass = totalMass ? Number(totalMass.toFixed(1)) : undefined;
      mapped.fatMass = fatMass ? Number(fatMass.toFixed(1)) : undefined;
      mapped.leanMass = leanMass ? Number(leanMass.toFixed(1)) : undefined;
      mapped.boneMass = boneMass ? Number(boneMass.toFixed(1)) : undefined;
      mapped.bodyFatPct = bc.body_fat_pct || bc.bodyFatPercentage;

      const result = snapshotImportSchema.safeParse(mapped);
      if (!result.success) {
        const firstError = result.error.errors[0];
        setImportError(firstError?.message || 'Validation failed');
        return;
      }

      setImportPreview(mapped);
    } catch {
      setImportError('Invalid JSON format. Please check your data.');
    }
  };

  const handleSaveSnapshot = async () => {
    if (!importPreview) return;
    try {
      const saved = await createMutation.mutateAsync({
        scanDate: importPreview.scanDate as string,
        provider: importPreview.provider as string,
        bodyComposition: {
          totalMass: importPreview.totalMass as number,
          fatMass: importPreview.fatMass as number,
          leanMass: importPreview.leanMass as number,
          boneMass: importPreview.boneMass as number,
          bodyFatPercentage: importPreview.bodyFatPct as number,
        },
        regionalData: [],
        rawJson: jsonData,
      });
      try {
        const recs = await analyzeMutation.mutateAsync(saved.id);
        if (recs.length > 0) {
          toast({ title: 'Snapshot saved', description: `Body composition imported. ${recs.length} new insight${recs.length !== 1 ? 's' : ''} generated.` });
        } else {
          toast({ title: 'Snapshot saved', description: 'Your body composition data has been imported.' });
        }
      } catch {
        toast({ title: 'Snapshot saved', description: 'Your body composition data has been imported.' });
      }
      setJsonData('');
      setImportPreview(null);
    } catch {
      toast({ title: 'Error', description: 'Failed to save snapshot', variant: 'destructive' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    toast({ title: 'Snapshot deleted' });
    setDeleteTarget(null);
    if (selectedSnapshotId === deleteTarget.id) setSelectedSnapshotId(null);
  };

  const handleDeletePanelConfirm = async () => {
    if (!deletePanelTarget) return;
    await deleteBloodPanelMutation.mutateAsync(deletePanelTarget.id);
    toast({ title: 'Blood panel deleted' });
    setDeletePanelTarget(null);
    if (selectedPanelId === deletePanelTarget.id) setSelectedPanelId(null);
  };

  const handleAnalyzePanel = async (panelId: string) => {
    try {
      const recs = await analyzeBloodPanelMutation.mutateAsync(panelId);
      if (recs.length > 0) {
        toast({ title: 'Analysis complete', description: `${recs.length} health insight${recs.length !== 1 ? 's' : ''} generated from blood markers.` });
      } else {
        toast({ title: 'Analysis complete', description: 'All markers look good. No new recommendations.' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to analyze blood panel.', variant: 'destructive' });
    }
  };

  const formatChange = (v: number, suffix = '') => `${v > 0 ? '+' : ''}${v.toFixed(1)}${suffix}`;
  const changeColor = (v: number, invert = false) => {
    const positive = invert ? v < 0 : v > 0;
    return Math.abs(v) < 0.5 ? 'text-muted-foreground' : positive ? 'text-success' : 'text-destructive';
  };

  if (isLoading || bloodPanelsLoading) {
    return <Layout><div className="flex items-center justify-center h-96"><div className="animate-pulse text-muted-foreground">Loading health data...</div></div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Activity className="h-8 w-8 text-primary" />Health Data
            </h1>
            <p className="text-muted-foreground leading-relaxed">Body composition scans and blood marker panels</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBloodPanelImportOpen(true)}>
              <Droplets className="mr-2 h-4 w-4" />Import Blood Panel
            </Button>
            <Button onClick={() => setImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />Import Scan
            </Button>
          </div>
        </div>

        <Tabs defaultValue={snapshots.length === 0 && bloodPanels.length > 0 ? 'blood' : snapshots.length === 0 ? 'import' : 'history'}>
          <TabsList>
            <TabsTrigger value="history">Scan History ({snapshots.length})</TabsTrigger>
            <TabsTrigger value="blood">
              <Droplets className="mr-1.5 h-4 w-4" />Blood Panels ({bloodPanels.length})
            </TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="mr-1.5 h-4 w-4" />Import
            </TabsTrigger>
          </TabsList>

          {/* Blood Panels tab */}
          <TabsContent value="blood" className="mt-6">
            {bloodPanels.length === 0 ? (
              <Card className="text-center py-16">
                <CardContent>
                  <Droplets className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-foreground">No Blood Panels</h3>
                  <p className="text-muted-foreground mb-4">Import your RythmHealth blood work CSV to get health insights.</p>
                  <Button onClick={() => setBloodPanelImportOpen(true)}>
                    <Droplets className="mr-2 h-4 w-4" />Import Blood Panel
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Panel list */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Panel History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {bloodPanels.map(panel => {
                      const outOfRange = panel.markers.filter(m => m.status === 'outOfRange').length;
                      return (
                        <div
                          key={panel.id}
                          onClick={() => setSelectedPanelId(panel.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedPanel?.id === panel.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-foreground text-sm">{format(new Date(panel.panelDate), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {outOfRange > 0 && (
                                <Badge variant="destructive" className="text-xs">{outOfRange} flagged</Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); setDeletePanelTarget(panel); }}
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {panel.markers.length} markers · {panel.source}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Panel detail */}
                <div className="lg:col-span-3">
                  {selectedPanel && (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAnalyzePanel(selectedPanel.id)}
                          disabled={analyzeBloodPanelMutation.isPending}
                        >
                          <Activity className="mr-2 h-4 w-4" />
                          {analyzeBloodPanelMutation.isPending ? 'Analyzing...' : 'Generate Insights'}
                        </Button>
                      </div>
                      <BloodPanelDetail panel={selectedPanel} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Import tab */}
          <TabsContent value="import" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Paste BodySpec JSON</CardTitle>
                  <CardDescription>Paste your BodySpec scan JSON data below. Accepts lbs or kg (auto-converts to lbs).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder='{"source": "bodyspec", "scan_date": "2024-01-15", "total_mass_lbs": 181.9, "fat_mass_lbs": 30.9, "lean_mass_lbs": 143.9, "bone_mass_lbs": 7.1, "body_fat_pct": 17.0}'
                    value={jsonData}
                    onChange={e => { setJsonData(e.target.value); setImportPreview(null); setImportError(null); }}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  {importError && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                      <XCircle className="h-4 w-4" /><span className="text-sm">{importError}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={handleValidateJson} disabled={!jsonData.trim()}>
                      <Eye className="mr-2 h-4 w-4" />Validate & Preview
                    </Button>
                    <Button className="flex-1" onClick={handleSaveSnapshot} disabled={!importPreview || createMutation.isPending}>
                      <Upload className="mr-2 h-4 w-4" />{createMutation.isPending ? 'Saving...' : 'Save Snapshot'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {importPreview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />Preview (lbs)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(importPreview).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-sm border-b border-border pb-2">
                          <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-medium text-foreground">
                            {typeof val === 'number' && key !== 'bodyFatPct' ? `${val} lbs` : String(val)}
                            {key === 'bodyFatPct' ? '%' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* History tab */}
          <TabsContent value="history" className="mt-6">
            {snapshots.length === 0 ? (
              <Card className="text-center py-16">
                <CardContent>
                  <Activity className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-foreground">No Snapshots</h3>
                  <p className="text-muted-foreground mb-4">Import your first BodySpec scan to start tracking.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Snapshot list */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Scan History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {snapshots.map(snap => (
                      <div
                        key={snap.id}
                        onClick={() => handleSelectSnapshot(snap)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedSnapshot?.id === snap.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground text-sm">{format(new Date(snap.scanDate), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary">{snap.bodyComposition.bodyFatPercentage.toFixed(1)}%</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(snap); }}
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Detail view */}
                <div className="lg:col-span-3 space-y-6">
                  {selectedSnapshot && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-1"><Scale className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Weight</span></div>
                            <div className="text-2xl font-bold text-foreground">{selectedSnapshot.bodyComposition.totalMass.toFixed(1)} lbs</div>
                            {comparison && <div className={`text-sm ${changeColor(comparison.changes.totalMass.value)}`}>{formatChange(comparison.changes.totalMass.value, ' lbs')}</div>}
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-1"><Percent className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Body Fat</span></div>
                            <div className="text-2xl font-bold text-foreground">{selectedSnapshot.bodyComposition.bodyFatPercentage.toFixed(1)}%</div>
                            {comparison && <div className={`text-sm ${changeColor(comparison.changes.bodyFatPercentage.value, true)}`}>{formatChange(comparison.changes.bodyFatPercentage.value, '%')}</div>}
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Lean Mass</span></div>
                            <div className="text-2xl font-bold text-foreground">{selectedSnapshot.bodyComposition.leanMass.toFixed(1)} lbs</div>
                            {comparison && <div className={`text-sm ${changeColor(comparison.changes.leanMass.value)}`}>{formatChange(comparison.changes.leanMass.value, ' lbs')}</div>}
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-1"><TrendingDown className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Fat Mass</span></div>
                            <div className="text-2xl font-bold text-foreground">{selectedSnapshot.bodyComposition.fatMass.toFixed(1)} lbs</div>
                            {comparison && <div className={`text-sm ${changeColor(comparison.changes.fatMass.value, true)}`}>{formatChange(comparison.changes.fatMass.value, ' lbs')}</div>}
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle>Body Composition</CardTitle>
                          <CardDescription>{format(new Date(selectedSnapshot.scanDate), 'MMMM d, yyyy')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Lean Mass</span>
                              <span className="font-medium">{((selectedSnapshot.bodyComposition.leanMass / selectedSnapshot.bodyComposition.totalMass) * 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={(selectedSnapshot.bodyComposition.leanMass / selectedSnapshot.bodyComposition.totalMass) * 100} className="h-3" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Fat Mass</span>
                              <span className="font-medium">{selectedSnapshot.bodyComposition.bodyFatPercentage.toFixed(1)}%</span>
                            </div>
                            <Progress value={selectedSnapshot.bodyComposition.bodyFatPercentage} className="h-3" />
                          </div>

                          {selectedSnapshot.regionalData.length > 0 && (
                            <div className="pt-4 border-t border-border">
                              <h4 className="font-medium mb-3 text-foreground text-sm">Regional Breakdown</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {selectedSnapshot.regionalData.map(r => (
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
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
        title="Delete Snapshot"
        description="Are you sure you want to delete this body composition snapshot? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
      <DeleteConfirmDialog
        open={!!deletePanelTarget}
        onOpenChange={(open) => { if (!open) setDeletePanelTarget(null); }}
        onConfirm={handleDeletePanelConfirm}
        title="Delete Blood Panel"
        description="Are you sure you want to delete this blood panel? This action cannot be undone."
        isLoading={deleteBloodPanelMutation.isPending}
      />
      <SnapshotImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      <BloodPanelImportDialog open={bloodPanelImportOpen} onOpenChange={setBloodPanelImportOpen} />
    </Layout>
  );
};

export default Snapshots;
