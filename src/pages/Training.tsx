import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Plus, Pencil, Trash2, Play, Dumbbell, Target, Layers, Library, ListChecks, Calendar as CalendarIcon,
} from 'lucide-react';
import Layout from '@/components/Layout';
import PageHeader from '@/components/common/PageHeader';
import ListToolbar from '@/components/common/ListToolbar';
import EntityCard from '@/components/common/EntityCard';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import ExerciseDialog from '@/components/ExerciseDialog';
import WorkoutDialog from '@/components/WorkoutDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import {
  useExercises, useCreateExercise, useUpdateExercise, useDeleteExercise,
  useWorkouts, useCreateWorkout, useUpdateWorkout, useDeleteWorkout,
  usePrograms, useCreateProgram, useUpdateProgram, useDeleteProgram,
} from '@/hooks/use-api-queries';
import type {
  Exercise, CreateExerciseInput, MovementPattern,
  Workout, CreateWorkoutInput,
  Program, ProgramDay,
} from '@/lib/api/types';
import { MOVEMENT_PATTERN_LABELS, BLOCK_TYPE_LABELS } from '@/lib/api/types';
import { toast } from '@/hooks/use-toast';

type TrainingTab = 'library' | 'workouts' | 'programs';

const GOAL_LABELS: Record<string, string> = {
  strength: 'Strength', hypertrophy: 'Hypertrophy', endurance: 'Endurance',
  recomposition: 'Recomposition', general_fitness: 'General Fitness',
};

const Training: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as TrainingTab) || 'library';
  const setTab = (t: TrainingTab) => setSearchParams({ tab: t });

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Training"
          icon={<Dumbbell className="h-8 w-8 text-primary" />}
          description="Build your library, design workouts, and structure programs."
        />

        <Tabs value={tab} onValueChange={(v) => setTab(v as TrainingTab)}>
          <TabsList>
            <TabsTrigger value="library"><Library className="mr-1.5 h-4 w-4" />Library</TabsTrigger>
            <TabsTrigger value="workouts"><ListChecks className="mr-1.5 h-4 w-4" />Workouts</TabsTrigger>
            <TabsTrigger value="programs"><Layers className="mr-1.5 h-4 w-4" />Programs</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-4"><LibraryTab /></TabsContent>
          <TabsContent value="workouts" className="mt-4"><WorkoutsTab /></TabsContent>
          <TabsContent value="programs" className="mt-4"><ProgramsTab /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

// ============ Library Tab ============

const LibraryTab: React.FC = () => {
  const { data: exercises = [], isLoading } = useExercises();
  const createMutation = useCreateExercise();
  const updateMutation = useUpdateExercise();
  const deleteMutation = useDeleteExercise();

  const [search, setSearch] = useState('');
  const [pattern, setPattern] = useState('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);

  const filters = [
    { value: 'All', label: 'All' },
    ...Object.entries(MOVEMENT_PATTERN_LABELS).map(([v, l]) => ({ value: v, label: l })),
  ];

  const filtered = exercises.filter((ex) => {
    const matchSearch =
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.muscleGroups.some((g) => g.toLowerCase().includes(search.toLowerCase()));
    const matchPattern = pattern === 'All' || ex.movementPattern === pattern;
    return matchSearch && matchPattern;
  });

  const handleCreate = async (input: CreateExerciseInput) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, input });
      toast({ title: 'Exercise updated', description: input.name });
      setEditing(null);
    } else {
      await createMutation.mutateAsync(input);
      toast({ title: 'Exercise added', description: input.name });
    }
  };

  return (
    <div className="space-y-6">
      <ListToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search exercises or muscle groups..."
        filters={filters}
        selectedFilter={pattern}
        onFilterChange={setPattern}
        resultCount={filtered.length}
        resultLabel="exercises"
        action={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Add Exercise
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading exercises...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Library className="h-10 w-10" />}
          title="No exercises found"
          description="Adjust filters or add a new exercise to your library."
          action={
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Add Exercise
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ex) => (
            <EntityCard
              key={ex.id}
              title={ex.name}
              subtitle={`${MOVEMENT_PATTERN_LABELS[ex.movementPattern]} · ${ex.equipment.join(', ')}`}
              badge={<StatusBadge tone={ex.difficulty} />}
              body={
                <>
                  {ex.description && <p className="text-sm text-muted-foreground">{ex.description}</p>}
                  <div className="flex flex-wrap gap-1">
                    {ex.muscleGroups.map((m) => (
                      <Badge key={m} variant="secondary" className="text-xs capitalize">{m}</Badge>
                    ))}
                  </div>
                </>
              }
              footer={
                <>
                  <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setEditing(ex); setDialogOpen(true); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteTarget(ex)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              }
            />
          ))}
        </div>
      )}

      <ExerciseDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        exercise={editing}
        onSubmit={handleCreate}
      />
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
          toast({ title: 'Exercise deleted' });
          setDeleteTarget(null);
        }}
        title="Delete Exercise"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

// ============ Workouts Tab ============

const WorkoutsTab: React.FC = () => {
  const { data: workouts = [], isLoading } = useWorkouts();
  const createMutation = useCreateWorkout();
  const updateMutation = useUpdateWorkout();
  const deleteMutation = useDeleteWorkout();

  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Workout | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Workout | null>(null);

  const filters = [
    { value: 'All', label: 'All' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  const filtered = workouts.filter((w) => {
    const matchSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchDiff = difficulty === 'All' || w.difficulty === difficulty;
    return matchSearch && matchDiff;
  });

  const handleSubmit = async (input: CreateWorkoutInput) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, input });
      toast({ title: 'Workout updated', description: input.name });
      setEditing(null);
    } else {
      await createMutation.mutateAsync(input);
      toast({ title: 'Workout created', description: input.name });
    }
  };

  return (
    <div className="space-y-6">
      <ListToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search workouts..."
        filters={filters}
        selectedFilter={difficulty}
        onFilterChange={setDifficulty}
        resultCount={filtered.length}
        resultLabel="workouts"
        action={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Create Workout
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading workouts...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Target className="h-10 w-10" />}
          title="No workouts yet"
          description="Create your first workout from blocks of exercises."
          action={
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Create Workout
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((w) => {
            const totalExercises = w.blocks.reduce((s, b) => s + b.items.length, 0);
            return (
              <EntityCard
                key={w.id}
                title={w.name}
                subtitle={w.description}
                badge={<StatusBadge tone={w.difficulty} />}
                body={
                  <>
                    <div className="grid grid-cols-3 gap-2 text-center">
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
                        {w.blocks.slice(0, 3).map((b) => (
                          <div key={b.id} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                            <span className="font-medium text-foreground truncate">{b.name}</span>
                            <Badge variant="secondary" className="text-xs shrink-0">{BLOCK_TYPE_LABELS[b.type]}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                }
                footer={
                  <>
                    <Link to={`/workouts/${w.id}/start`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full">
                        <Play className="mr-1 h-3 w-3" />Start
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => { setEditing(w); setDialogOpen(true); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteTarget(w)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                }
              />
            );
          })}
        </div>
      )}

      <WorkoutDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        workout={editing}
        onSubmit={handleSubmit}
      />
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
          toast({ title: 'Workout deleted' });
          setDeleteTarget(null);
        }}
        title="Delete Workout"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

// ============ Programs Tab ============

const ProgramsTab: React.FC = () => {
  const { data: programs = [], isLoading } = usePrograms();
  const { data: workouts = [] } = useWorkouts();
  const createMutation = useCreateProgram();
  const updateMutation = useUpdateProgram();
  const deleteMutation = useDeleteProgram();

  const [search, setSearch] = useState('');
  const [goal, setGoal] = useState('All');
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);

  // Edit form state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDuration, setFormDuration] = useState(8);
  const [formGoal, setFormGoal] = useState<Program['goal']>('recomposition');
  const [formDifficulty, setFormDifficulty] = useState<Program['difficulty']>('intermediate');

  // Days dialog
  const [daysOpen, setDaysOpen] = useState(false);
  const [daysProgramId, setDaysProgramId] = useState<string | null>(null);
  const [editDays, setEditDays] = useState<Omit<ProgramDay, 'id'>[]>([]);

  const filters = [
    { value: 'All', label: 'All' },
    ...Object.entries(GOAL_LABELS).map(([v, l]) => ({ value: v, label: l })),
  ];

  const filtered = programs.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchGoal = goal === 'All' || p.goal === goal;
    return matchSearch && matchGoal;
  });

  const resetForm = () => {
    setFormName(''); setFormDesc(''); setFormDuration(8);
    setFormGoal('recomposition'); setFormDifficulty('intermediate');
    setEditing(null);
  };

  const openCreate = () => { resetForm(); setFormOpen(true); };
  const openEdit = (p: Program) => {
    setEditing(p);
    setFormName(p.name); setFormDesc(p.description || '');
    setFormDuration(p.durationWeeks); setFormGoal(p.goal); setFormDifficulty(p.difficulty);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName) return;
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          input: { name: formName, description: formDesc, durationWeeks: formDuration, goal: formGoal, difficulty: formDifficulty },
        });
        toast({ title: 'Program updated', description: formName });
      } else {
        await createMutation.mutateAsync({
          name: formName, description: formDesc, durationWeeks: formDuration,
          goal: formGoal, difficulty: formDifficulty, days: [],
        });
        toast({ title: 'Program created', description: formName });
      }
      setFormOpen(false); resetForm();
    } catch {
      toast({ title: 'Error', description: 'Failed to save program', variant: 'destructive' });
    }
  };

  const openEditDays = (p: Program) => {
    setDaysProgramId(p.id);
    setEditDays(p.days.length > 0
      ? p.days.map(({ id, ...rest }) => rest)
      : Array.from({ length: 7 }, (_, i) => ({ dayNumber: i + 1, isRestDay: false, workoutId: undefined, notes: undefined }))
    );
    setDaysOpen(true);
  };
  const updateDay = (i: number, updates: Partial<Omit<ProgramDay, 'id'>>) => {
    setEditDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...updates } : d)));
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

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Create Program</Button>
      </div>

      <ListToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search programs..."
        filters={filters}
        selectedFilter={goal}
        onFilterChange={setGoal}
        resultCount={filtered.length}
        resultLabel="programs"
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading programs...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-10 w-10" />}
          title="No programs yet"
          description="Group workouts into a multi-week program with goal and difficulty."
          action={<Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Create Program</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => {
            const trainingDays = p.days.filter((d) => !d.isRestDay).length;
            const restDays = p.days.filter((d) => d.isRestDay).length;
            return (
              <EntityCard
                key={p.id}
                title={p.name}
                subtitle={p.description}
                badge={<StatusBadge tone={p.difficulty} />}
                meta={
                  <>
                    <span className="flex items-center gap-1.5 text-foreground font-medium">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      {p.durationWeeks} weeks
                    </span>
                    <Badge variant="secondary" className="capitalize">{GOAL_LABELS[p.goal] || p.goal}</Badge>
                  </>
                }
                body={
                  p.days.length > 0 ? (
                    <p className="text-sm text-muted-foreground">{trainingDays} training · {restDays} rest days</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No days configured yet</p>
                  )
                }
                footer={
                  <>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDays(p)}>Edit Days</Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteTarget(p)}><Trash2 className="h-3 w-3" /></Button>
                  </>
                }
              />
            );
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{editing ? 'Edit Program' : 'Create Program'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Name</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., 8-Week Recomp" />
            </div>
            <div className="space-y-2"><Label>Description</Label>
              <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Duration (weeks)</Label>
                <Input type="number" min={1} max={52} value={formDuration} onChange={(e) => setFormDuration(parseInt(e.target.value) || 8)} />
              </div>
              <div className="space-y-2"><Label>Goal</Label>
                <Select value={formGoal} onValueChange={(v) => setFormGoal(v as Program['goal'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(GOAL_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Difficulty</Label>
              <Select value={formDifficulty} onValueChange={(v) => setFormDifficulty(v as Program['difficulty'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={!formName}>
              {editing ? 'Save Changes' : 'Create Program'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Days dialog */}
      <Dialog open={daysOpen} onOpenChange={setDaysOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Training Days</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {editDays.map((day, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <span className="text-sm font-medium text-foreground w-14 shrink-0">Day {day.dayNumber}</span>
                <div className="flex items-center gap-2">
                  <Switch checked={day.isRestDay} onCheckedChange={(v) => updateDay(i, { isRestDay: v, workoutId: v ? undefined : day.workoutId })} />
                  <span className="text-xs text-muted-foreground">Rest</span>
                </div>
                {!day.isRestDay && (
                  <Select value={day.workoutId || ''} onValueChange={(v) => updateDay(i, { workoutId: v || undefined })}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select workout" /></SelectTrigger>
                    <SelectContent>
                      {workouts.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {day.isRestDay && <span className="text-sm text-muted-foreground italic flex-1">Rest Day</span>}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setEditDays((prev) => [...prev, { dayNumber: prev.length + 1, isRestDay: false }])}>
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
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
          toast({ title: 'Program deleted' });
          setDeleteTarget(null);
        }}
        title="Delete Program"
        description={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Training;
