import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Upload, FileJson, CheckCircle, XCircle, Clock,
  Eye, History, Settings
} from 'lucide-react';
import Layout from '@/components/Layout';
import { importApi } from '@/lib/api';
import { useImportJobs } from '@/hooks/use-api-queries';
import type { ImportType, ImportPreview } from '@/lib/api';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/use-api-queries';

const Admin = () => {
  const queryClient = useQueryClient();
  const { data: importJobs = [] } = useImportJobs();

  const [activeTab, setActiveTab] = useState('import');
  const [importType, setImportType] = useState<ImportType>('exercise_library');
  const [jsonData, setJsonData] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async () => {
    setError(null); setPreview(null); setIsValidating(true);
    try {
      const parsed = JSON.parse(jsonData);
      setPreview(await importApi.preview(importType, parsed));
    } catch (err) {
      setError(err instanceof SyntaxError ? 'Invalid JSON format.' : 'Failed to validate.');
    } finally { setIsValidating(false); }
  };

  const handleCommit = async () => {
    if (!preview?.isValid) return;
    setIsImporting(true);
    try {
      await importApi.commit(importType, JSON.parse(jsonData));
      setJsonData(''); setPreview(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.importJobs });
      setActiveTab('history');
    } catch { setError('Failed to import.'); }
    finally { setIsImporting(false); }
  };

  const statusIcon = (s: string) => {
    if (s === 'completed') return <CheckCircle className="h-4 w-4 text-success" />;
    if (s === 'failed') return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-warning animate-spin" />;
  };

  const typeLabel = (t: ImportType) => ({ exercise_library: 'Exercises', workouts: 'Workouts', programs: 'Programs', snapshots: 'Snapshots' }[t] || t);

  const sampleData: Record<ImportType, string> = {
    exercise_library: JSON.stringify([{ name: "Romanian Deadlift", movementPattern: "hip_hinge", muscleGroups: ["hamstrings", "glutes"], equipment: ["barbell"], difficulty: "intermediate" }], null, 2),
    workouts: JSON.stringify([{ name: "Upper Body Strength", difficulty: "intermediate", estimatedDuration: 60, blocks: [] }], null, 2),
    programs: JSON.stringify([{ name: "8 Week Recomp", durationWeeks: 8, goal: "recomposition", difficulty: "intermediate" }], null, 2),
    snapshots: JSON.stringify([{ scan_date: "2024-01-15", source: "bodyspec", total_mass_kg: 82.5, fat_mass_kg: 14.0, lean_mass_kg: 65.3, bone_mass_kg: 3.2, body_fat_pct: 17.0 }], null, 2),
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />Admin
          </h1>
          <p className="text-muted-foreground leading-relaxed">Bulk import, data management, and admin tools</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="import"><Upload className="mr-1.5 h-4 w-4" />Bulk Import</TabsTrigger>
            <TabsTrigger value="history"><History className="mr-1.5 h-4 w-4" />Import History</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileJson className="h-5 w-5 text-primary" />Import Data</CardTitle>
                    <CardDescription>Bulk import exercises, workouts, programs, or snapshots via JSON</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select value={importType} onValueChange={v => setImportType(v as ImportType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exercise_library">Exercise Library</SelectItem>
                        <SelectItem value="workouts">Workouts</SelectItem>
                        <SelectItem value="programs">Programs</SelectItem>
                        <SelectItem value="snapshots">Snapshots</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">JSON Data</label>
                      <Button variant="ghost" size="sm" onClick={() => setJsonData(sampleData[importType])}>Load Sample</Button>
                    </div>
                    <Textarea placeholder="Paste JSON array..." value={jsonData} onChange={e => { setJsonData(e.target.value); setPreview(null); setError(null); }} rows={10} className="font-mono text-sm" />
                    {error && <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg"><XCircle className="h-4 w-4" /><span className="text-sm">{error}</span></div>}
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={handlePreview} disabled={!jsonData.trim() || isValidating}><Eye className="mr-2 h-4 w-4" />{isValidating ? 'Validating...' : 'Preview'}</Button>
                      <Button className="flex-1" onClick={handleCommit} disabled={!preview?.isValid || isImporting}><Upload className="mr-2 h-4 w-4" />{isImporting ? 'Importing...' : 'Import'}</Button>
                    </div>
                  </CardContent>
                </Card>

                {preview && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Preview</span>
                        <Badge variant={preview.isValid ? 'default' : 'destructive'}>{preview.isValid ? 'Valid' : 'Has Errors'}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="p-3 bg-success/10 rounded-lg text-center"><div className="text-xl font-bold text-success">{preview.adds}</div><div className="text-xs text-muted-foreground">New</div></div>
                        <div className="p-3 bg-primary/10 rounded-lg text-center"><div className="text-xl font-bold text-primary">{preview.updates}</div><div className="text-xs text-muted-foreground">Updates</div></div>
                        <div className="p-3 bg-muted rounded-lg text-center"><div className="text-xl font-bold text-muted-foreground">{preview.skips}</div><div className="text-xs text-muted-foreground">Skipped</div></div>
                        <div className="p-3 bg-destructive/10 rounded-lg text-center"><div className="text-xl font-bold text-destructive">{preview.errors}</div><div className="text-xs text-muted-foreground">Errors</div></div>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {preview.items.map(item => (
                          <div key={item.index} className="flex items-center justify-between p-2 border border-border rounded">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-success" />
                              <span className="text-sm">{item.name}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">{item.action}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">Import Guide</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <p>Provide a JSON array of objects. Click "Load Sample" for an example.</p>
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Supported Types</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Exercises</Badge>
                      <Badge variant="secondary">Workouts</Badge>
                      <Badge variant="secondary">Programs</Badge>
                      <Badge variant="secondary">Snapshots</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Import History</CardTitle></CardHeader>
              <CardContent>
                {importJobs.length === 0 ? (
                  <div className="text-center py-12"><History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">No import history yet</p></div>
                ) : (
                  <div className="space-y-3">
                    {importJobs.map(job => (
                      <div key={job.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-4">
                          {statusIcon(job.status)}
                          <div>
                            <div className="font-medium text-foreground">{typeLabel(job.type)}</div>
                            <div className="text-sm text-muted-foreground">{format(new Date(job.createdAt), 'MMM d, yyyy h:mm a')}</div>
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="text-success">{job.successItems}</span>
                          <span className="text-muted-foreground"> / {job.totalItems}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
