import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Activity, Clock, Flame, Heart, Pencil, Play, Plus, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import EntityCard from '@/components/common/EntityCard';
import EmptyState from '@/components/common/EmptyState';
import ListToolbar from '@/components/common/ListToolbar';
import FormDialog from '@/components/common/FormDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import {
  useSessions,
  useCreateSession,
  useUpdateSession,
  useDeleteSession,
  useWorkouts,
  queryKeys,
} from '@/hooks/use-api-queries';
import { useQueryClient } from '@tanstack/react-query';
import { computeSessionSnapshot } from '@/lib/ai/session-insights';
import { shiftScheduleForSession } from '@/lib/schedule-sync';
import type { SessionKind, SessionMetrics, WorkoutSession } from '@/lib/api/types';
import { SESSION_KIND_LABELS } from '@/lib/api/types';
import { toast } from '@/hooks/use-toast';

const fmtDateTimeLocal = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocal = (v: string): string => (v ? new Date(v).toISOString() : '');

const STATUS_FILTERS = [
  { value: 'All', label: 'All' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'abandoned', label: 'Abandoned' },
];

const STATUS_TONE: Record<WorkoutSession['status'], string> = {
  in_progress: 'border-primary/40 text-primary',
  completed: 'border-accent/40 text-accent',
  abandoned: 'border-destructive/40 text-destructive',
};

const SessionsTab: React.FC = () => {
  const { data: sessions = [], isLoading } = useSessions();
  const { data: workouts = [] } = useWorkouts();
  const updateSession = useUpdateSession();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('All');
  const [editing, setEditing] = useState<WorkoutSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkoutSession | null>(null);

  // New-session dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newWorkoutId, setNewWorkoutId] = useState('');
  const [newStartedAt, setNewStartedAt] = useState(() => fmtDateTimeLocal(new Date().toISOString()));
  const [isCreating, setIsCreating] = useState(false);

  // Edit form state
  const [startedAt, setStartedAt] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const [editStatus, setEditStatus] = useState<WorkoutSession['status']>('completed');
  const [activeCalories, setActiveCalories] = useState('');
  const [totalCalories, setTotalCalories] = useState('');
  const [avgHeartRate, setAvgHeartRate] = useState('');
  const [rpe, setRpe] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openEdit = (s: WorkoutSession) => {
    setEditing(s);
    setStartedAt(fmtDateTimeLocal(s.startedAt));
    setCompletedAt(fmtDateTimeLocal(s.completedAt));
    setEditStatus(s.status);
    setActiveCalories(s.metrics?.activeCalories?.toString() ?? '');
    setTotalCalories(s.metrics?.totalCalories?.toString() ?? '');
    setAvgHeartRate(s.metrics?.avgHeartRate?.toString() ?? '');
    setRpe(s.metrics?.rpe?.toString() ?? '');
    setNotes(s.notes ?? '');
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((s) => {
      const matchSearch =
        !q ||
        s.workoutName.toLowerCase().includes(q) ||
        (s.notes?.toLowerCase().includes(q) ?? false);
      const matchStatus = status === 'All' || s.status === status;
      return matchSearch && matchStatus;
    });
  }, [sessions, search, status]);

  const inProgressCount = sessions.filter((s) => s.status === 'in_progress').length;

  const handleSave = async () => {
    if (!editing) return;
    setIsSaving(true);
    try {
      const metrics: SessionMetrics = {
        activeCalories: activeCalories ? Number(activeCalories) : undefined,
        totalCalories: totalCalories ? Number(totalCalories) : undefined,
        avgHeartRate: avgHeartRate ? Number(avgHeartRate) : undefined,
        rpe: rpe ? Number(rpe) : undefined,
      };
      const wasAbandoned = editing.status === 'abandoned';
      await updateSession.mutateAsync({
        id: editing.id,
        input: {
          status: editStatus,
          startedAt: startedAt ? fromLocal(startedAt) : editing.startedAt,
          completedAt: completedAt ? fromLocal(completedAt) : undefined,
          metrics,
          notes: notes || undefined,
        },
      });
      if (editStatus === 'abandoned' && !wasAbandoned) {
        const shifted = await shiftScheduleForSession(editing.workoutId, editing.workoutName, 'abandoned');
        if (shifted) queryClient.invalidateQueries({ queryKey: queryKeys.schedule });
      }
      toast({ title: 'Session updated' });
      setEditing(null);
    } catch {
      toast({ title: 'Could not save session', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const openCreate = () => {
    setNewWorkoutId(workouts[0]?.id ?? '');
    setNewStartedAt(fmtDateTimeLocal(new Date().toISOString()));
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!newWorkoutId) return;
    const wk = workouts.find((w) => w.id === newWorkoutId);
    if (!wk) return;
    setIsCreating(true);
    try {
      const created = await createSession.mutateAsync({
        workoutId: wk.id,
        workoutName: wk.name,
        status: 'in_progress',
        startedAt: newStartedAt ? fromLocal(newStartedAt) : new Date().toISOString(),
        exercises: [],
      });
      toast({ title: 'Session started', description: `${wk.name} is now in progress.` });
      setCreateOpen(false);
      navigate(`/workouts/${wk.id}/start?resume=${created.id}`);
    } catch {
      toast({ title: 'Could not start session', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="flex-1">
          <ListToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by workout or notes…"
            filters={STATUS_FILTERS}
            selectedFilter={status}
            onFilterChange={setStatus}
            resultCount={filtered.length}
            resultLabel="sessions"
          />
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> New Session
        </Button>
      </div>

      {inProgressCount > 0 && status !== 'in_progress' && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm flex items-center justify-between">
          <span className="text-foreground">
            <strong>{inProgressCount}</strong> in-progress {inProgressCount === 1 ? 'session' : 'sessions'} waiting to be resumed.
          </span>
          <Button size="sm" variant="outline" onClick={() => setStatus('in_progress')}>
            View
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading sessions…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-10 w-10" />}
          title="No sessions yet"
          description="Start a workout to log your first session, or jump in directly from the Workouts tab."
          action={
            <Button onClick={openCreate} disabled={workouts.length === 0}>
              <Plus className="mr-2 h-4 w-4" /> New Session
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const snap = computeSessionSnapshot(s);
            const dateLabel = format(new Date(s.startedAt), 'MMM d, yyyy · h:mm a');
            return (
              <EntityCard
                key={s.id}
                title={s.workoutName}
                subtitle={dateLabel}
                badge={
                  <Badge variant="outline" className={STATUS_TONE[s.status]}>
                    {s.status === 'in_progress' ? 'In progress' : s.status === 'completed' ? 'Completed' : 'Abandoned'}
                  </Badge>
                }
                body={
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-base font-semibold text-foreground">{snap.completionPct}%</p>
                        <p className="text-xs text-muted-foreground">Complete</p>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-foreground">{snap.totalVolume.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Volume (lbs)</p>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-foreground">
                          {snap.durationMinutes !== null ? `${snap.durationMinutes}m` : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">Duration</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {s.metrics?.activeCalories !== undefined && (
                        <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" />{s.metrics.activeCalories} cal</span>
                      )}
                      {s.metrics?.avgHeartRate !== undefined && (
                        <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{s.metrics.avgHeartRate} bpm</span>
                      )}
                      {s.metrics?.rpe !== undefined && (
                        <span className="inline-flex items-center gap-1"><Activity className="h-3 w-3" />RPE {s.metrics.rpe}</span>
                      )}
                      {!s.metrics?.activeCalories && !s.metrics?.avgHeartRate && !s.metrics?.rpe && (
                        <span className="italic">No wearable data</span>
                      )}
                    </div>
                  </div>
                }
                footer={
                  <>
                    {s.status === 'in_progress' ? (
                      <Link to={`/workouts/${s.workoutId}/start?resume=${s.id}`} className="flex-1">
                        <Button size="sm" variant="default" className="w-full">
                          <Play className="mr-1 h-3 w-3" />Resume
                        </Button>
                      </Link>
                    ) : (
                      <Link to={`/sessions/${s.id}`} className="flex-1">
                        <Button size="sm" variant="default" className="w-full">
                          <Eye className="mr-1 h-3 w-3" />View
                        </Button>
                      </Link>
                    )}
                    <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteTarget(s)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                }
              />
            );
          })}
        </div>
      )}

      <FormDialog
        open={!!editing}
        onOpenChange={(o) => { if (!o) setEditing(null); }}
        title="Edit Session"
        description="Adjust timing, status, wearable metrics, and notes."
        size="md"
        submitLabel="Save Changes"
        onSubmit={handleSave}
        isSubmitting={isSaving}
        canSubmit={!!editing}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="se-start"><Clock className="inline h-3 w-3 mr-1" />Start</Label>
            <Input id="se-start" type="datetime-local" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="se-end"><Clock className="inline h-3 w-3 mr-1" />End</Label>
            <Input id="se-end" type="datetime-local" value={completedAt} onChange={(e) => setCompletedAt(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <div className="flex gap-2">
            {(['in_progress', 'completed', 'abandoned'] as const).map((st) => (
              <Button
                key={st}
                type="button"
                size="sm"
                variant={editStatus === st ? 'default' : 'outline'}
                onClick={() => setEditStatus(st)}
                className="capitalize"
              >
                {st.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="se-ac"><Flame className="inline h-3 w-3 mr-1" />Active Calories</Label>
            <Input id="se-ac" type="number" min="0" value={activeCalories} onChange={(e) => setActiveCalories(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="se-tc"><Flame className="inline h-3 w-3 mr-1" />Total Calories</Label>
            <Input id="se-tc" type="number" min="0" value={totalCalories} onChange={(e) => setTotalCalories(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="se-hr"><Heart className="inline h-3 w-3 mr-1" />Avg Heart Rate</Label>
            <Input id="se-hr" type="number" min="0" value={avgHeartRate} onChange={(e) => setAvgHeartRate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="se-rpe"><Activity className="inline h-3 w-3 mr-1" />RPE (1–10)</Label>
            <Input id="se-rpe" type="number" min="1" max="10" step="0.5" value={rpe} onChange={(e) => setRpe(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="se-notes">Notes</Label>
          <Textarea id="se-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </FormDialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteSession.mutateAsync(deleteTarget.id);
          toast({ title: 'Session deleted' });
          setDeleteTarget(null);
        }}
        title="Delete Session"
        description={`Delete the ${deleteTarget?.workoutName} session? This cannot be undone.`}
        isLoading={deleteSession.isPending}
      />

      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New Session"
        description="Pick a workout and start time. The session opens in progress so you can log sets live."
        size="md"
        submitLabel="Start Session"
        onSubmit={handleCreate}
        isSubmitting={isCreating}
        canSubmit={!!newWorkoutId && workouts.length > 0}
      >
        <div className="space-y-2">
          <Label htmlFor="ns-workout">Workout</Label>
          {workouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No workouts yet — create one in the Workouts tab first.
            </p>
          ) : (
            <Select value={newWorkoutId} onValueChange={setNewWorkoutId}>
              <SelectTrigger id="ns-workout">
                <SelectValue placeholder="Select a workout" />
              </SelectTrigger>
              <SelectContent>
                {workouts.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="ns-start"><Clock className="inline h-3 w-3 mr-1" />Start time</Label>
          <Input
            id="ns-start"
            type="datetime-local"
            value={newStartedAt}
            onChange={(e) => setNewStartedAt(e.target.value)}
          />
        </div>
      </FormDialog>
    </div>
  );
};

export default SessionsTab;
