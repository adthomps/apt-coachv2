import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit2, Trash2, Dumbbell, TrendingUp, Clock } from 'lucide-react';
import Layout from '@/components/Layout';
import ExerciseDialog from '@/components/ExerciseDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { useExercises, useCreateExercise, useUpdateExercise, useDeleteExercise, usePerformanceProfiles } from '@/hooks/use-api-queries';
import type { Exercise, CreateExerciseInput, MovementPattern } from '@/lib/api/types';
import { MOVEMENT_PATTERN_LABELS } from '@/lib/api/types';
import { toast } from '@/hooks/use-toast';

const Exercises = () => {
  const { data: exercises = [], isLoading, error } = useExercises();
  const { data: profiles = [] } = usePerformanceProfiles();
  const createMutation = useCreateExercise();
  const updateMutation = useUpdateExercise();
  const deleteMutation = useDeleteExercise();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPattern, setSelectedPattern] = useState<string>('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);

  const patterns: string[] = ['All', ...Object.keys(MOVEMENT_PATTERN_LABELS)];

  const handleCreate = async (input: CreateExerciseInput) => {
    await createMutation.mutateAsync(input);
    toast({ title: 'Exercise added', description: `${input.name} has been added.` });
  };

  const handleUpdate = async (input: CreateExerciseInput) => {
    if (!editingExercise) return;
    await updateMutation.mutateAsync({ id: editingExercise.id, input });
    setEditingExercise(null);
    toast({ title: 'Exercise updated', description: `${input.name} has been updated.` });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    toast({ title: 'Exercise deleted', description: `${deleteTarget.name} has been removed.` });
    setDeleteTarget(null);
  };

  const filtered = exercises.filter(ex => {
    const matchSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.muscleGroups.some(g => g.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchPattern = selectedPattern === 'All' || ex.movementPattern === selectedPattern;
    return matchSearch && matchPattern;
  });

  const diffColor = (d: string) => {
    if (d === 'beginner') return 'bg-success/10 text-success border-success/20';
    if (d === 'intermediate') return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Exercise Library</h1>
            <p className="text-muted-foreground">Search, filter, and manage your movement library</p>
          </div>
          <Button onClick={() => { setEditingExercise(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Add Exercise
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search exercises or muscle groups..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {patterns.map(p => (
                  <Button key={p} variant={selectedPattern === p ? 'default' : 'outline'} size="sm" onClick={() => setSelectedPattern(p)} className="whitespace-nowrap text-xs">
                    {p === 'All' ? 'All' : MOVEMENT_PATTERN_LABELS[p as MovementPattern]}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{filtered.length} exercises</span>
          <span>•</span>
          <span>{new Set(exercises.flatMap(e => e.muscleGroups)).size} muscle groups</span>
        </div>

        {error ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-destructive">Failed to load exercises. Please try again.</p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading exercises...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(ex => (
              <Card key={ex.id} className="apt-hover-lift hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{ex.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {MOVEMENT_PATTERN_LABELS[ex.movementPattern]} • {ex.equipment.join(', ')}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={`${diffColor(ex.difficulty)} capitalize`}>{ex.difficulty}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ex.description && <p className="text-sm text-muted-foreground">{ex.description}</p>}
                  <div className="flex flex-wrap gap-1">
                    {ex.muscleGroups.map(m => <Badge key={m} variant="secondary" className="text-xs capitalize">{m}</Badge>)}
                  </div>
                  {ex.cues && ex.cues.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Cues: </span>
                      {ex.cues.slice(0, 2).join(' • ')}
                      {ex.cues.length > 2 && ` +${ex.cues.length - 2} more`}
                    </div>
                  )}

                  {(() => {
                    const profile = profiles.find(p => p.exerciseId === ex.id);
                    if (!profile) return null;
                    return (
                      <div className="pt-2 border-t border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs">
                            <TrendingUp className="h-3 w-3 text-primary" />
                            <span className="font-medium text-foreground">Performance</span>
                          </div>
                          <Badge variant={profile.progressionState === 'progressing' ? 'default' : profile.progressionState === 'stalled' ? 'secondary' : 'outline'} className="text-xs capitalize">
                            {profile.progressionState}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-1.5 bg-muted/30 rounded">
                            <span className="text-muted-foreground">Last: </span>
                            <span className="font-medium text-foreground">{profile.lastWeight} lbs</span>
                          </div>
                          <div className="p-1.5 bg-muted/30 rounded">
                            <span className="text-muted-foreground">Best: </span>
                            <span className="font-medium text-foreground">{profile.bestWeight} lbs</span>
                          </div>
                        </div>
                        {profile.sessionHistory.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {profile.sessionHistory.slice(0, 4).map((s, i) => (
                              <span key={i} className="font-mono">{i > 0 && '→ '}{s.weight}×{s.avgReps.toFixed(0)}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex justify-between items-center pt-2">
                    <code className="text-xs text-muted-foreground">{ex.slug}</code>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditingExercise(ex); setDialogOpen(true); }}><Edit2 className="h-3 w-3" /></Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget(ex)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No exercises found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search or add a new exercise.</p>
              <Button onClick={() => { setEditingExercise(null); setDialogOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />Add Exercise
              </Button>
            </CardContent>
          </Card>
        )}

        <ExerciseDialog open={dialogOpen} onOpenChange={setDialogOpen} exercise={editingExercise} onSubmit={editingExercise ? handleUpdate : handleCreate} />
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          onConfirm={handleDeleteConfirm}
          title="Delete Exercise"
          description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </Layout>
  );
};

export default Exercises;
