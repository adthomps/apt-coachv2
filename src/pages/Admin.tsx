import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Upload, FileJson, CheckCircle, XCircle, Clock,
  Eye, History, Settings, Activity, Droplets, Database, AlertTriangle,
} from 'lucide-react';
import Layout from '@/components/Layout';
import PageHeader from '@/components/common/PageHeader';
import SectionCard from '@/components/common/SectionCard';
import EmptyState from '@/components/common/EmptyState';
import {
  importApi, snapshotApi, bloodPanelApi,
} from '@/lib/api';
import {
  useImportJobs, useExercises, useWorkouts, usePrograms, useSnapshots, useBloodPanels,
  useCreateSnapshot, useCreateBloodPanel, useAnalyzeSnapshot, useAnalyzeBloodPanel,
  useBulkCreateHealthCheckins,
} from '@/hooks/use-api-queries';
import type { ImportType, ImportPreview } from '@/lib/api';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/use-api-queries';
import {
  parseBodyspecJson, parseRythmHealthCsv, parseEntityArrayJson,
  parseAppleHealthLabsJson, parseAppleHealthLabsPdfText, extractPdfText,
  parseWithingsScaleCsv, parseWithingsBpmCsv, parseWithingsBeamoJson,
  parseSkulptJson, parseLumenJson, parseAppleHealthVitalsJson,
} from '@/lib/importers';
import { toast } from '@/hooks/use-toast';

type ImportSource =
  | 'body_scan'
  | 'blood_panel'
  | 'apple_health_labs'
  | 'withings_scale'
  | 'withings_bpm'
  | 'withings_beamo'
  | 'skulpt_chisel'
  | 'lumen'
  | 'apple_health_vitals'
  | 'exercise_library'
  | 'workouts'
  | 'programs';

const SOURCE_LABELS: Record<ImportSource, string> = {
  body_scan: 'Body Scan (BodySpec / DEXA) — ground truth',
  blood_panel: 'Blood Panel (Rythm Health CSV) — ground truth',
  apple_health_labs: 'Apple Health Labs (PDF or FHIR JSON)',
  withings_scale: 'Withings Body / Scale (CSV)',
  withings_bpm: 'Withings BPM Vision (CSV)',
  withings_beamo: 'Withings BeamO (JSON, beta)',
  skulpt_chisel: 'Skulpt Chisel (JSON)',
  lumen: 'Lumen (JSON, beta)',
  apple_health_vitals: 'Apple Health Vitals (JSON)',
  exercise_library: 'Exercises (JSON)',
  workouts: 'Workouts (JSON)',
  programs: 'Programs (JSON)',
};

const DAILY_CONTEXT_SOURCES: ImportSource[] = [
  'withings_scale', 'withings_bpm', 'withings_beamo', 'skulpt_chisel', 'lumen', 'apple_health_vitals',
];

const SAMPLE_DATA: Record<ImportSource, string> = {
  body_scan: JSON.stringify({
    source: 'bodyspec', scan_date: '2024-01-15',
    total_mass_lbs: 181.9, fat_mass_lbs: 30.9, lean_mass_lbs: 143.9, bone_mass_lbs: 7.1, body_fat_pct: 17.0,
  }, null, 2),
  blood_panel: 'marker,value,unit,reference_range,status,time\nFree T3,4.25,pg/mL,2 - 4.4,optimal,2026-03-09\nApoB,131,mg/dL,0 - 90,outOfRange,2026-03-09',
  apple_health_labs: JSON.stringify([
    { marker: 'ApoB', value: 95, unit: 'mg/dL', referenceRange: '0 - 90', time: '2026-04-01' },
    { marker: 'HDL Cholesterol', value: 58, unit: 'mg/dL', referenceRange: '40 - 100', time: '2026-04-01' },
  ], null, 2),
  withings_scale: 'Date,Weight (kg),Fat mass (kg),Muscle mass (kg),Hydration (kg)\n2024-07-22,83.7,11.5,69.0,50.4\n2024-07-23,83.5,11.4,69.1,50.5',
  withings_bpm: 'Date,Systolic (mmHg),Diastolic (mmHg),Heart rate (bpm)\n2024-07-23,118,76,58\n2024-07-24,120,78,60',
  withings_beamo: JSON.stringify([
    { date: '2024-07-23', tempF: 98.1, spo2: 98, ecg: 'normal', notes: 'AM check' },
  ], null, 2),
  skulpt_chisel: JSON.stringify({
    date: '2024-07-20', overallMQ: 137, bodyFatPct: 14.1,
    regions: [
      { region: 'chest', mq: 142, bodyFatPct: 11.5 },
      { region: 'biceps', mq: 148, bodyFatPct: 9.0 },
    ],
  }, null, 2),
  lumen: JSON.stringify([
    { date: '2024-07-21', level: 2 },
    { date: '2024-07-21', level: 3 },
    { date: '2024-07-22', level: 2 },
  ], null, 2),
  apple_health_vitals: JSON.stringify([
    { type: 'HKQuantityTypeIdentifierOxygenSaturation', value: 0.98, startDate: '2024-07-22T08:00:00Z' },
    { type: 'HKQuantityTypeIdentifierRestingHeartRate', value: 56, startDate: '2024-07-22T07:00:00Z' },
    { type: 'HKQuantityTypeIdentifierStepCount', value: 8423, startDate: '2024-07-22T23:59:00Z' },
  ], null, 2),
  exercise_library: JSON.stringify([{ name: 'Romanian Deadlift', movementPattern: 'hip_hinge', muscleGroups: ['hamstrings', 'glutes'], equipment: ['barbell'], difficulty: 'intermediate' }], null, 2),
  workouts: JSON.stringify([{ name: 'Upper Body Strength', difficulty: 'intermediate', estimatedDuration: 60, blocks: [] }], null, 2),
  programs: JSON.stringify([{ name: '8 Week Recomp', durationWeeks: 8, goal: 'recomposition', difficulty: 'intermediate' }], null, 2),
};

const Admin: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'imports';
  const initialSource = (searchParams.get('source') as ImportSource) || 'body_scan';

  const queryClient = useQueryClient();
  const { data: importJobs = [] } = useImportJobs();
  const { data: exercises = [] } = useExercises();
  const { data: workouts = [] } = useWorkouts();
  const { data: programs = [] } = usePrograms();
  const { data: snapshots = [] } = useSnapshots();
  const { data: bloodPanels = [] } = useBloodPanels();
  const createSnapshot = useCreateSnapshot();
  const createBloodPanel = useCreateBloodPanel();
  const analyzeSnapshot = useAnalyzeSnapshot();
  const analyzeBloodPanel = useAnalyzeBloodPanel();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [source, setSource] = useState<ImportSource>(initialSource);
  const [rawText, setRawText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const reset = () => {
    setRawText(''); setErrors([]); setWarnings([]); setPreview(null);
  };

  const setTab = (t: string) => {
    setActiveTab(t);
    setSearchParams({ tab: t });
  };

  const handleSourceChange = (s: ImportSource) => {
    setSource(s);
    reset();
  };

  // Body scan & blood panel: validate using importers (no preview structure)
  const handleValidate = async () => {
    setIsValidating(true);
    setErrors([]); setWarnings([]); setPreview(null);
    try {
      if (source === 'body_scan') {
        const result = parseBodyspecJson(rawText);
        if (result.errors.length > 0) setErrors(result.errors);
        if (result.warnings.length > 0) setWarnings(result.warnings);
        if (result.data) {
          setPreview({
            type: 'snapshots', schemaVersion: '1.0', totalItems: 1, adds: 1, updates: 0, skips: 0, errors: 0,
            items: [{ index: 0, action: 'add', name: `Scan ${result.data.snapshotInput.scanDate}`, data: result.data.snapshotInput as unknown as Record<string, unknown> }],
            isValid: true,
          });
        }
      } else if (source === 'blood_panel') {
        const result = parseRythmHealthCsv(rawText);
        if (result.errors.length > 0) setErrors(result.errors);
        if (result.data) {
          setPreview({
            type: 'snapshots', schemaVersion: '1.0', totalItems: result.data.panelInput.markers.length,
            adds: result.data.panelInput.markers.length, updates: 0, skips: 0,
            errors: result.data.outOfRangeCount,
            items: result.data.panelInput.markers.map((m, i) => ({
              index: i, action: 'add' as const, name: `${m.marker}: ${m.value} ${m.unit}`, data: m as unknown as Record<string, unknown>,
            })),
            isValid: true,
          });
        }
      } else if (source === 'apple_health_labs') {
        const result = parseAppleHealthLabsJson(rawText);
        if (result.errors.length > 0) setErrors(result.errors);
        if (result.warnings.length > 0) setWarnings(result.warnings);
        if (result.data) {
          setPreview({
            type: 'snapshots', schemaVersion: '1.0', totalItems: result.data.panelInput.markers.length,
            adds: result.data.panelInput.markers.length, updates: 0, skips: 0,
            errors: result.data.outOfRangeCount,
            items: result.data.panelInput.markers.map((m, i) => ({
              index: i, action: 'add' as const, name: `${m.marker}: ${m.value} ${m.unit}`, data: m as unknown as Record<string, unknown>,
            })),
            isValid: true,
          });
        }
      } else {
        const result = parseEntityArrayJson(rawText);
        if (result.errors.length > 0) setErrors(result.errors);
        if (result.data) {
          const p = await importApi.preview(source as ImportType, result.data);
          setPreview(p);
        }
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setIsImporting(true);
    try {
      if (source === 'body_scan') {
        const result = parseBodyspecJson(rawText);
        if (!result.data) throw new Error('Validation failed');
        const saved = await createSnapshot.mutateAsync(result.data.snapshotInput);
        try {
          const recs = await analyzeSnapshot.mutateAsync(saved.id);
          toast({ title: 'Body scan imported', description: `${recs.length} insight${recs.length !== 1 ? 's' : ''} generated.` });
        } catch {
          toast({ title: 'Body scan imported' });
        }
      } else if (source === 'blood_panel') {
        const result = parseRythmHealthCsv(rawText);
        if (!result.data) throw new Error('Validation failed');
        const saved = await createBloodPanel.mutateAsync(result.data.panelInput);
        try {
          const recs = await analyzeBloodPanel.mutateAsync(saved.id);
          toast({ title: 'Blood panel imported', description: `${result.data.panelInput.markers.length} markers, ${recs.length} insight${recs.length !== 1 ? 's' : ''}.` });
        } catch {
          toast({ title: 'Blood panel imported' });
        }
      } else if (source === 'apple_health_labs') {
        const result = parseAppleHealthLabsJson(rawText);
        if (!result.data) throw new Error('Validation failed');
        const saved = await createBloodPanel.mutateAsync(result.data.panelInput);
        try {
          const recs = await analyzeBloodPanel.mutateAsync(saved.id);
          toast({ title: 'Apple Health labs imported', description: `${result.data.panelInput.markers.length} markers, ${recs.length} insight${recs.length !== 1 ? 's' : ''}.` });
        } catch {
          toast({ title: 'Apple Health labs imported' });
        }
      } else {
        const result = parseEntityArrayJson(rawText);
        if (!result.data) throw new Error('Validation failed');
        await importApi.commit(source as ImportType, result.data);
        queryClient.invalidateQueries({ queryKey: queryKeys.importJobs });
        queryClient.invalidateQueries({ queryKey: [source === 'exercise_library' ? 'exercises' : source] });
        toast({ title: 'Import complete', description: `${result.data.length} ${SOURCE_LABELS[source]} imported.` });
      }
      reset();
      setTab('history');
    } catch (e) {
      toast({ title: 'Import failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  const statusIcon = (s: string) => {
    if (s === 'completed') return <CheckCircle className="h-4 w-4 text-success" />;
    if (s === 'failed') return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-warning animate-spin" />;
  };

  const placeholderFor = (s: ImportSource) =>
    s === 'blood_panel'
      ? 'Paste CSV: marker,value,unit,reference_range,status,time'
      : 'Paste JSON...';

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Admin"
          icon={<Settings className="h-8 w-8 text-primary" />}
          description="Single home for all data imports and system health."
        />

        <Tabs value={activeTab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="imports"><Upload className="mr-1.5 h-4 w-4" />Imports</TabsTrigger>
            <TabsTrigger value="history"><History className="mr-1.5 h-4 w-4" />Import History</TabsTrigger>
            <TabsTrigger value="data"><Database className="mr-1.5 h-4 w-4" />Data Health</TabsTrigger>
          </TabsList>

          {/* ============ Imports ============ */}
          <TabsContent value="imports" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <SectionCard
                  title={<span className="flex items-center gap-2"><FileJson className="h-5 w-5 text-primary" />Import Data</span>}
                  description="Choose a source, paste data, validate, then import. Same flow for every type."
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Source</label>
                      <Select value={source} onValueChange={(v) => handleSourceChange(v as ImportSource)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.entries(SOURCE_LABELS) as [ImportSource, string][]).map(([v, l]) => (
                            <SelectItem key={v} value={v}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        {source === 'blood_panel' ? 'CSV Data' : source === 'apple_health_labs' ? 'PDF or JSON' : 'JSON Data'}
                      </label>
                      <div className="flex gap-2">
                        {source === 'apple_health_labs' && (
                          <label className="inline-flex items-center text-xs cursor-pointer text-primary hover:underline">
                            <Upload className="h-3 w-3 mr-1" />Upload PDF
                            <input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setErrors([]); setWarnings([]); setPreview(null);
                                try {
                                  const text = await extractPdfText(file);
                                  const result = parseAppleHealthLabsPdfText(text);
                                  if (result.errors.length) setErrors(result.errors);
                                  if (result.warnings.length) setWarnings(result.warnings);
                                  if (result.data) {
                                    setRawText(JSON.stringify(result.data.panelInput.markers, null, 2));
                                    setPreview({
                                      type: 'snapshots', schemaVersion: '1.0',
                                      totalItems: result.data.panelInput.markers.length,
                                      adds: result.data.panelInput.markers.length,
                                      updates: 0, skips: 0, errors: result.data.outOfRangeCount,
                                      items: result.data.panelInput.markers.map((m, i) => ({
                                        index: i, action: 'add' as const,
                                        name: `${m.marker}: ${m.value} ${m.unit}`,
                                        data: m as unknown as Record<string, unknown>,
                                      })),
                                      isValid: true,
                                    });
                                  }
                                } catch (err) {
                                  setErrors([err instanceof Error ? err.message : 'PDF parsing failed']);
                                }
                              }}
                            />
                          </label>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => { setRawText(SAMPLE_DATA[source]); setPreview(null); setErrors([]); }}>
                          Load Sample
                        </Button>
                      </div>
                    </div>

                    <Textarea
                      placeholder={placeholderFor(source)}
                      value={rawText}
                      onChange={(e) => { setRawText(e.target.value); setPreview(null); setErrors([]); setWarnings([]); }}
                      rows={10}
                      className="font-mono text-xs"
                    />

                    {warnings.length > 0 && (
                      <div className="p-3 bg-warning/10 rounded-lg space-y-1">
                        {warnings.map((w, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-warning">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{w}
                          </div>
                        ))}
                      </div>
                    )}

                    {errors.length > 0 && (
                      <div className="p-3 bg-destructive/10 rounded-lg space-y-1">
                        {errors.map((e, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                            <XCircle className="h-3.5 w-3.5 shrink-0" />{e}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={handleValidate} disabled={!rawText.trim() || isValidating}>
                        <Eye className="mr-2 h-4 w-4" />{isValidating ? 'Validating...' : 'Validate'}
                      </Button>
                      <Button className="flex-1" onClick={handleImport} disabled={!preview || isImporting}>
                        <Upload className="mr-2 h-4 w-4" />{isImporting ? 'Importing...' : 'Import'}
                      </Button>
                    </div>
                  </div>
                </SectionCard>

                {preview && (
                  <SectionCard
                    title="Preview"
                    actions={<Badge variant={preview.isValid ? 'default' : 'destructive'}>{preview.isValid ? 'Valid' : 'Has Errors'}</Badge>}
                  >
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="p-3 bg-success/10 rounded-lg text-center">
                        <div className="text-xl font-bold text-success">{preview.adds}</div>
                        <div className="text-xs text-muted-foreground">{source === 'blood_panel' ? 'Markers' : 'New'}</div>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg text-center">
                        <div className="text-xl font-bold text-primary">{preview.updates}</div>
                        <div className="text-xs text-muted-foreground">Updates</div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <div className="text-xl font-bold text-muted-foreground">{preview.skips}</div>
                        <div className="text-xs text-muted-foreground">Skipped</div>
                      </div>
                      <div className="p-3 bg-destructive/10 rounded-lg text-center">
                        <div className="text-xl font-bold text-destructive">{preview.errors}</div>
                        <div className="text-xs text-muted-foreground">{source === 'blood_panel' ? 'Flagged' : 'Errors'}</div>
                      </div>
                    </div>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {preview.items.map((item) => (
                        <div key={item.index} className="flex items-center justify-between p-2 border border-border rounded text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs shrink-0">{item.action}</Badge>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}
              </div>

              <SectionCard variant="subtle" title="Import Guide" className="h-fit">
                <div className="text-sm text-muted-foreground space-y-3">
                  <p>One unified flow for every data source. Validation runs locally before import.</p>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Available Sources</h4>
                    <ul className="space-y-1.5">
                      <li className="flex gap-2"><Activity className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span>Body Scan — BodySpec JSON, lbs or kg</span></li>
                      <li className="flex gap-2"><Droplets className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span>Blood Panel — RythmHealth CSV</span></li>
                      <li className="flex gap-2"><FileJson className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span>Exercises / Workouts / Programs — JSON arrays</span></li>
                    </ul>
                  </div>
                </div>
              </SectionCard>
            </div>
          </TabsContent>

          {/* ============ History ============ */}
          <TabsContent value="history" className="mt-6">
            {importJobs.length === 0 ? (
              <EmptyState
                icon={<History className="h-10 w-10" />}
                title="No imports yet"
                description="Imported jobs appear here with status and counts."
              />
            ) : (
              <SectionCard title="Recent Imports">
                <div className="space-y-3">
                  {importJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-4">
                        {statusIcon(job.status)}
                        <div>
                          <div className="font-medium text-foreground capitalize">{job.type.replace(/_/g, ' ')}</div>
                          <div className="text-sm text-muted-foreground">{format(new Date(job.createdAt), 'MMM d, yyyy h:mm a')}</div>
                        </div>
                      </div>
                      <div className="text-sm">
                        <span className="text-success font-medium">{job.successItems}</span>
                        <span className="text-muted-foreground"> / {job.totalItems}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </TabsContent>

          {/* ============ Data Health ============ */}
          <TabsContent value="data" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: 'Exercises', count: exercises.length, icon: FileJson },
                { label: 'Workouts', count: workouts.length, icon: FileJson },
                { label: 'Programs', count: programs.length, icon: FileJson },
                { label: 'Body Scans', count: snapshots.length, icon: Activity },
                { label: 'Blood Panels', count: bloodPanels.length, icon: Droplets },
              ].map((item) => (
                <Card key={item.label}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-1">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                    </div>
                    <div className="text-3xl font-bold text-foreground">{item.count}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
