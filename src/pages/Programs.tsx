import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Search, Plus, Trash2, Pencil, Layers, Clock } from 'lucide-react';
import Layout from '@/components/Layout';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { usePrograms, useWorkouts, useCreateProgram, useUpdateProgram, useDeleteProgram } from '@/hooks/use-api-queries';
import type { Program, ProgramDay } from '@/lib/api/types';
import { toast } from '@/hooks/use-toast';

const GOAL_LABELS: Record<string, string> = {
  strength: 'Strength', hypertrophy: 'Hypertrophy', endurance: 'Endurance',
  recomposition: 'Recomposition', general_fitness: 'General Fitness',
};

const diffColor = (d: string) => {
  if (d === 'beginner') return 'bg-success/10 text-success border-success/20';
  if (d === 'intermediate') return 'bg-warning/10 text-warning border-warning/20';
  return 'bg-destructive/10 text-destructive border-destructive/20';
};

const Programs = () => {
  const { data: programs = [], isLoading, error } = usePrograms();
  const { data: workouts = [] } = useWorkouts();
  const createMutation = useCreateProgram();
  const updateMutation = useUpdateProgram();
  const deleteMutation = useDeleteProgram();

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);

  // Create/Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDuration, setFormDuration] = useState(8);
  const [formGoal, setFormGoal] = useState<Program['goal']>('recomposition');
  const [formDifficulty, setFormDifficulty] = useState<Program['difficulty']>('intermediate');

  // Edit Days dialog
  const [daysOpen, setDaysOpen] = useState(false);
  const [daysProgramId, setDaysProgramId] = useState<string | null>(null);
  const [editDays, setEditDays] = useState<Omit<ProgramDay, 'id'>[]>([]);

  const resetForm = () => {
    setFormName(''); setFormDesc(''); setFormDuration(8);
    setFormGoal('recomposition'); setFormDifficulty('intermediate');
    setEditingProgram(null);
  };

  const openCreate = () => { resetForm(); setFormOpen(true); };

  const openEdit = (p: Program) => {
    setEditingProgram(p);
    setFormName(p.name); setFormDesc(p.description || '');
    setFormDuration(p.durationWeeks); setFormGoal(p.goal); setFormDifficulty(p.difficulty);
    setFormOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!formName) return;
    try {
      if (editingProgram) {
        await updateMutation.mutateAsync({
          id: editingProgram.id,
          input: { name: formName, description: formDesc, durationWeeks: formDuration, goal: formGoal, difficulty: formDifficulty },
        });
        toast({ title: 'Program updated', description: `${formName} has been updated.` });
      } else {
        await createMutation.mutateAsync({
          name: formName, description: formDesc, durationWeeks: formDuration,
          goal: formGoal, difficulty: formDifficulty, days: [],
        });
        toast({ title: 'Program created', description: `${formName} has been created.` });
      }
      setFormOpen(false); resetForm();
    } catch {
      toast({ title: 'Error', description: 'Failed to save program', variant: 'destructive' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    toast({ title: 'Program deleted', description: `${deleteTarget.name} has been removed.` });
    setDeleteTarget(null);
  };

  // Edit Days
  const openEditDays = (p: Program) => {
    setDaysProgramId(p.id);
    setEditDays(p.days.length > 0
      ? p.days.map(({ id, ...rest }) => rest)
      : Array.from({ length: 7 }, (_, i) => ({ dayNumber: i + 1, isRestDay: false, workoutId: undefined, notes: undefined }))
    );
    setDaysOpen(true);
  };

  const updateDay = (index: number, updates: Partial<Omit<ProgramDay, 'id'>>) => {
    setEditDays(prev => prev.map((d, i) => i === index ? { ...d, ...updates } : d));
  };

  const handleSaveDays = async () => {
    if (!daysProgramId) return;
    try {
      await updateMutation.mutateAsync({ id: daysProgramId, input: { days: editDays } });
      toast({ title: 'Days updated' });
      setDaysOpen(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to save days', variant: 'destructive' });
    }
  };

  const filtered = programs.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Program Builder</h1>
            <p className="text-muted-foreground">Create and manage training programs from your workouts</p>
          </div>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Create Program</Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search programs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </CardContent>
        </Card>

        {error ? (
          <Card className="text-center py-12">
            <CardContent><p className="text-destructive">Failed to load programs.</p></CardContent>
          </Card>
        ) : isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading programs...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(p => {
              const trainingDays = p.days.filter(d => !d.isRestDay).length;
              const restDays = p.days.filter(d => d.isRestDay).length;
              return (
                <Card key={p.id} className="apt-hover-lift hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{p.name}</CardTitle>
                        <CardDescription className="text-sm mt-1 line-clamp-2">{p.description}</CardDescription>
                      </div>
                      <Badge variant="outline" className={`${diffColor(p.difficulty)} capitalize`}>{p.difficulty}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">{p.durationWeeks} weeks</span>
                      </div>
                      <Badge variant="secondary" className="capitalize">{GOAL_LABELS[p.goal] || p.goal}</Badge>
                    </div>
                    {p.days.length > 0 ? (
                      <div className="text-sm text-muted-foreground">
                        {trainingDays} training days • {restDays} rest days per cycle
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">No days configured yet</div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDays(p)}>
                        Edit Days
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteTarget(p)}>
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
              <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No programs found</h3>
              <p className="text-muted-foreground mb-4">Create your first training program.</p>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />Create Program
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Program Dialog */}
        <Dialog open={formOpen} onOpenChange={o => { setFormOpen(o); if (!o) resetForm(); }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingProgram ? 'Edit Program' : 'Create New Program'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Program Name</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g., 8-Week Recomp" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Describe the program..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (weeks)</Label>
                  <Input type="number" min={1} max={52} value={formDuration} onChange={e => setFormDuration(parseInt(e.target.value) || 8)} />
                </div>
                <div className="space-y-2">
                  <Label>Goal</Label>
                  <Select value={formGoal} onValueChange={v => setFormGoal(v as Program['goal'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="hypertrophy">Hypertrophy</SelectItem>
                      <SelectItem value="endurance">Endurance</SelectItem>
                      <SelectItem value="recomposition">Recomposition</SelectItem>
                      <SelectItem value="general_fitness">General Fitness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={formDifficulty} onValueChange={v => setFormDifficulty(v as Program['difficulty'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleFormSubmit} disabled={!formName}>
                {editingProgram ? 'Save Changes' : 'Create Program'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Days Dialog */}
        <Dialog open={daysOpen} onOpenChange={setDaysOpen}>
          <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Training Days</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              {editDays.map((day, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <span className="text-sm font-medium text-foreground w-14 shrink-0">Day {day.dayNumber}</span>
                  <div className="flex items-center gap-2">
                    <Switch checked={day.isRestDay} onCheckedChange={v => updateDay(i, { isRestDay: v, workoutId: v ? undefined : day.workoutId })} />
                    <span className="text-xs text-muted-foreground">Rest</span>
                  </div>
                  {!day.isRestDay && (
                    <Select value={day.workoutId || ''} onValueChange={v => updateDay(i, { workoutId: v || undefined })}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select workout" /></SelectTrigger>
                      <SelectContent>
                        {workouts.map(w => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {day.isRestDay && <span className="text-sm text-muted-foreground italic flex-1">Rest Day</span>}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setEditDays(prev => [...prev, { dayNumber: prev.length + 1, isRestDay: false }])}>
                <Plus className="mr-2 h-3 w-3" />Add Day
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDaysOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveDays}>Save Days</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          onConfirm={handleDeleteConfirm}
          title="Delete Program"
          description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </Layout>
  );
};

export default Programs;
