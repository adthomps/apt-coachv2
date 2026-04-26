import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Trash2, Pencil, Target, Play } from 'lucide-react';
import Layout from '@/components/Layout';
import WorkoutDialog from '@/components/WorkoutDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { useWorkouts, useCreateWorkout, useUpdateWorkout, useDeleteWorkout } from '@/hooks/use-api-queries';
import type { Workout, CreateWorkoutInput } from '@/lib/api/types';
import { BLOCK_TYPE_LABELS } from '@/lib/api/types';
import { toast } from '@/hooks/use-toast';

const Workouts = () => {
  const { data: workouts = [], isLoading, error } = useWorkouts();
  const createMutation = useCreateWorkout();
  const updateMutation = useUpdateWorkout();
  const deleteMutation = useDeleteWorkout();

  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Workout | null>(null);

  const handleCreate = async (input: CreateWorkoutInput) => {
    if (editingWorkout) {
      await updateMutation.mutateAsync({ id: editingWorkout.id, input });
      toast({ title: 'Workout updated', description: `${input.name} has been updated.` });
      setEditingWorkout(null);
    } else {
      await createMutation.mutateAsync(input);
      toast({ title: 'Workout created', description: `${input.name} has been created.` });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    toast({ title: 'Workout deleted', description: `${deleteTarget.name} has been removed.` });
    setDeleteTarget(null);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingWorkout(null);
  };

  const filtered = workouts.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

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
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Workout Builder</h1>
            <p className="text-muted-foreground">Create workouts from structured blocks</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />Create Workout
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search workouts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </CardContent>
        </Card>

        {error ? (
          <Card className="text-center py-12">
            <CardContent><p className="text-destructive">Failed to load workouts.</p></CardContent>
          </Card>
        ) : isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading workouts...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(w => {
              const totalExercises = w.blocks.reduce((s, b) => s + b.items.length, 0);
              return (
                <Card key={w.id} className="apt-hover-lift hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg leading-tight">{w.name}</CardTitle>
                        <CardDescription className="text-sm mt-1">{w.description}</CardDescription>
                      </div>
                      <Badge variant="outline" className={`${diffColor(w.difficulty)} capitalize`}>{w.difficulty}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-foreground">{totalExercises}</p>
                        <p className="text-xs text-muted-foreground">Exercises</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{w.estimatedDuration}m</p>
                        <p className="text-xs text-muted-foreground">Duration</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{w.blocks.length}</p>
                        <p className="text-xs text-muted-foreground">Blocks</p>
                      </div>
                    </div>

                    {w.blocks.length > 0 && (
                      <div className="space-y-1.5">
                        {w.blocks.map(b => (
                          <div key={b.id} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                            <span className="font-medium text-foreground">{b.name}</span>
                            <Badge variant="secondary" className="text-xs">{BLOCK_TYPE_LABELS[b.type]}</Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {w.tags && w.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {w.tags.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Link to={`/workouts/${w.id}/start`} className="flex-1">
                        <Button variant="default" size="sm" className="w-full">
                          <Play className="mr-1 h-3 w-3" />Start
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => { setEditingWorkout(w); setDialogOpen(true); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget(w)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No workouts found</h3>
              <p className="text-muted-foreground mb-4">Create your first workout to get started.</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />Create Workout
              </Button>
            </CardContent>
          </Card>
        )}

        <WorkoutDialog open={dialogOpen} onOpenChange={handleDialogChange} onSubmit={handleCreate} workout={editingWorkout} />
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          onConfirm={handleDeleteConfirm}
          title="Delete Workout"
          description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </Layout>
  );
};

export default Workouts;
