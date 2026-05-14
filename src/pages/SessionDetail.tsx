import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft, Clock, Flame, Heart, Activity, TrendingUp,
  CheckCircle2, MinusCircle, Sparkles, Save, Edit3,
} from 'lucide-react';
import Layout from '@/components/Layout';
import PageHeader from '@/components/common/PageHeader';
import SectionCard from '@/components/common/SectionCard';
import AIInsightsPanel from '@/components/AIInsightsPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useSession, useSessions, useSchedule, useUpdateSession } from '@/hooks/use-api-queries';
import { computeSessionSnapshot, getSessionInsights, getInputQuality } from '@/lib/ai/session-insights';
import { useToast } from '@/hooks/use-toast';
import type { SessionMetrics } from '@/lib/api/types';

const fmtDateTimeLocal = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromDateTimeLocal = (v: string): string => {
  if (!v) return '';
  return new Date(v).toISOString();
};

const SessionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: session, isLoading } = useSession(id);
  const { data: allSessions = [] } = useSessions();
  const { data: schedule = [] } = useSchedule();
  const updateSession = useUpdateSession();

  const [editOpen, setEditOpen] = useState(false);
  const [autoGen, setAutoGen] = useState(false);
  const [generated, setGenerated] = useState(false);

  // Edit form state
  const [startedAt, setStartedAt] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const [activeCalories, setActiveCalories] = useState('');
  const [totalCalories, setTotalCalories] = useState('');
  const [avgHeartRate, setAvgHeartRate] = useState('');
  const [rpe, setRpe] = useState('');
  const [notes, setNotes] = useState('');

  const snapshot = useMemo(
    () => (session ? computeSessionSnapshot(session) : null),
    [session],
  );

  const insights = useMemo(() => {
    if (!session) return [];
    if (!autoGen && !generated) return [];
    return getSessionInsights(session, allSessions, schedule);
  }, [session, allSessions, schedule, autoGen, generated]);

  const inputQuality = useMemo(
    () => (session ? getInputQuality(session) : null),
    [session],
  );

  const openEdit = () => {
    if (!session) return;
    setStartedAt(fmtDateTimeLocal(session.startedAt));
    setCompletedAt(fmtDateTimeLocal(session.completedAt));
    setActiveCalories(session.metrics?.activeCalories?.toString() ?? '');
    setTotalCalories(session.metrics?.totalCalories?.toString() ?? '');
    setAvgHeartRate(session.metrics?.avgHeartRate?.toString() ?? '');
    setRpe(session.metrics?.rpe?.toString() ?? '');
    setNotes(session.notes ?? '');
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!session) return;
    const metrics: SessionMetrics = {
      activeCalories: activeCalories ? Number(activeCalories) : undefined,
      totalCalories: totalCalories ? Number(totalCalories) : undefined,
      avgHeartRate: avgHeartRate ? Number(avgHeartRate) : undefined,
      rpe: rpe ? Number(rpe) : undefined,
    };
    try {
      await updateSession.mutateAsync({
        id: session.id,
        input: {
          startedAt: startedAt ? fromDateTimeLocal(startedAt) : session.startedAt,
          completedAt: completedAt ? fromDateTimeLocal(completedAt) : undefined,
          metrics,
          notes: notes || undefined,
        },
      });
      toast({ title: 'Session updated' });
      setEditOpen(false);
    } catch {
      toast({ title: 'Could not save', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Loading session…</div>
        </div>
      </Layout>
    );
  }

  if (!session || !snapshot) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Session not found.</p>
          <Link to="/schedule"><Button variant="outline" className="mt-4">Back to Schedule</Button></Link>
        </div>
      </Layout>
    );
  }

  const dateLabel = session.completedAt
    ? format(new Date(session.completedAt), 'MMM d, yyyy · h:mm a')
    : format(new Date(session.startedAt), 'MMM d, yyyy · h:mm a');

  const headlineInsight = insights[0];
  const supportingInsights = insights.slice(1);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/schedule')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Schedule
          </Button>
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Edit3 className="h-4 w-4 mr-2" /> Edit Session
          </Button>
        </div>

        <PageHeader
          title={session.workoutName}
          description={`Session breakdown — ${dateLabel}`}
        />

        {/* === Performance Snapshot === */}
        <SectionCard
          title="Session Performance Snapshot"
          description="Quick read on completion, volume, and exercise-level distribution."
          actions={
            <Badge
              variant="outline"
              className={
                session.status === 'completed'
                  ? 'border-accent/40 text-accent'
                  : session.status === 'in_progress'
                  ? 'border-primary/40 text-primary'
                  : 'border-destructive/40 text-destructive'
              }
            >
              {session.status === 'in_progress' ? 'In progress' : session.status === 'completed' ? 'Completed' : 'Abandoned'}
            </Badge>
          }
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiTile
              label="Completion"
              value={`${snapshot.completionPct}%`}
              hint={`${snapshot.completedSets}/${snapshot.plannedSets} sets`}
              accent={snapshot.completionPct >= 95 ? 'good' : snapshot.completionPct >= 70 ? 'warn' : 'bad'}
            />
            <KpiTile
              label="Volume"
              value={snapshot.totalVolume.toLocaleString()}
              hint="total lbs"
            />
            <KpiTile
              label="Exercises"
              value={snapshot.exerciseCount.toString()}
              hint="logged"
            />
            <KpiTile
              label="Duration"
              value={snapshot.durationMinutes !== null ? `${snapshot.durationMinutes} min` : '—'}
              hint="session length"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* Volume by exercise */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="text-sm font-medium text-foreground">Volume by exercise</div>
              {snapshot.volumeByExercise.length === 0 ? (
                <p className="text-sm text-muted-foreground">No completed sets logged.</p>
              ) : (
                <div className="space-y-2">
                  {snapshot.volumeByExercise.map((v) => {
                    const max = Math.max(...snapshot.volumeByExercise.map((x) => x.volume), 1);
                    const pct = (v.volume / max) * 100;
                    return (
                      <div key={v.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-foreground truncate pr-2">{v.name}</span>
                          <span className="text-muted-foreground font-mono">{v.volume.toLocaleString()} lbs</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* What to do next (headline insight or generate prompt) */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">What to do next</div>
                {headlineInsight && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {headlineInsight.severity}
                  </Badge>
                )}
              </div>
              {!headlineInsight ? (
                <div className="text-sm text-muted-foreground">
                  Generate insights to see a coaching read on this session.
                </div>
              ) : (
                <div className="text-sm space-y-2">
                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <span className="text-muted-foreground">Source</span>
                    <span className="text-foreground capitalize">{headlineInsight.evidence.label}</span>
                    <span className="text-muted-foreground">Reasoning</span>
                    <span className="text-foreground">{headlineInsight.rationale}</span>
                    {headlineInsight.actions && headlineInsight.actions[0] && (
                      <>
                        <span className="text-muted-foreground">Action</span>
                        <span className="text-foreground font-medium">{headlineInsight.actions[0]}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* === Session Metrics === */}
        <SectionCard
          title={
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" /> Session Metrics
            </span>
          }
          description="Timing, calories, and heart-rate summary."
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Metric
              icon={<Clock className="h-4 w-4" />}
              label="Workout Time"
              value={snapshot.durationMinutes !== null ? `${Math.floor(snapshot.durationMinutes / 60)}:${String(snapshot.durationMinutes % 60).padStart(2, '0')}` : '—'}
            />
            <Metric
              icon={<Flame className="h-4 w-4" />}
              label="Active Calories"
              value={session.metrics?.activeCalories ? `${session.metrics.activeCalories} cal` : '—'}
            />
            <Metric
              icon={<Flame className="h-4 w-4" />}
              label="Total Calories"
              value={session.metrics?.totalCalories ? `${session.metrics.totalCalories} cal` : '—'}
            />
            <Metric
              icon={<Heart className="h-4 w-4" />}
              label="Avg / Max HR"
              value={
                session.metrics?.avgHeartRate
                  ? `${session.metrics.avgHeartRate}${session.metrics.maxHeartRate ? ` / ${session.metrics.maxHeartRate}` : ''} BPM`
                  : '—'
              }
            />
            <Metric
              icon={<Activity className="h-4 w-4" />}
              label="Effort (RPE)"
              value={session.metrics?.rpe ? `${session.metrics.rpe}/10` : '—'}
            />
          </div>
          {(session.kind === 'cardio' || session.kind === 'mixed') && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              <Metric
                icon={<Activity className="h-4 w-4" />}
                label="Distance"
                value={session.metrics?.distanceMiles ? `${session.metrics.distanceMiles} mi` : '—'}
              />
              <Metric
                icon={<Clock className="h-4 w-4" />}
                label="Avg Pace"
                value={
                  session.metrics?.avgPaceSecPerMile
                    ? `${Math.floor(session.metrics.avgPaceSecPerMile / 60)}:${String(session.metrics.avgPaceSecPerMile % 60).padStart(2, '0')} /mi`
                    : '—'
                }
              />
              <Metric
                icon={<TrendingUp className="h-4 w-4" />}
                label="Elevation Gain"
                value={session.metrics?.elevationGainFt ? `${session.metrics.elevationGainFt} ft` : '—'}
              />
            </div>
          )}
          {session.metrics?.hrZoneSecs && (
            <div className="mt-4 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" /> Heart-Rate Zones
                </div>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide border-primary/30 text-primary">
                  Apple Fitness
                </Badge>
              </div>
              <HeartRateZoneBar zones={session.metrics.hrZoneSecs} />
            </div>
          )}
          {session.notes && (
            <div className="mt-4 rounded-lg border border-border p-3 text-sm text-muted-foreground italic">
              “{session.notes}”
            </div>
          )}
        </SectionCard>

        {/* === Adaptive Insights generator === */}
        <SectionCard
          title={
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" /> Adaptive Insights
            </span>
          }
          description="Coaching narrative and adaptive recommendations for this session."
          actions={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-md px-2 py-1">
                <span>Auto-generate</span>
                <Switch checked={autoGen} onCheckedChange={setAutoGen} />
              </div>
              <Button size="sm" onClick={() => setGenerated(true)}>
                <Sparkles className="h-4 w-4 mr-2" /> Generate Insights
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Auto-generate produces insights as soon as the session changes. Manual generation lets you choose when to run it.
            </p>

            {inputQuality && (
              <div className="space-y-1.5">
                <div className="text-sm font-medium text-foreground">AI input quality</div>
                <ul className="space-y-1 text-sm">
                  <Quality ok={inputQuality.loggedSets > 0} label={`Logged sets: ${inputQuality.loggedSets}`} />
                  <Quality ok={inputQuality.completedSets > 0} label={`Completed sets: ${inputQuality.completedSets}`} />
                  <Quality ok={inputQuality.rpePresent} label="RPE present" />
                  <Quality ok={inputQuality.heartRatePresent} label="Heart-rate data present" />
                </ul>
              </div>
            )}

            {!autoGen && !generated ? (
              <p className="text-sm text-muted-foreground">AI insights not yet generated</p>
            ) : insights.length === 0 ? (
              <p className="text-sm text-muted-foreground">No actionable insights from this session.</p>
            ) : null}
          </div>
        </SectionCard>

        {(autoGen || generated) && supportingInsights.length > 0 && (
          <AIInsightsPanel
            insights={supportingInsights}
            title="Session insights"
            description="Evidence-cited reads from this session and your recent history."
          />
        )}

        {/* === Per-exercise breakdown === */}
        <div className="space-y-4">
          {session.exercises.map((ex) => {
            const completed = ex.actualSets.filter((s) => s.completed).length;
            const max = ex.actualSets.reduce((m, s) => Math.max(m, s.weight || 0), 0);
            const avgReps = ex.actualSets.length > 0
              ? ex.actualSets.reduce((sum, s) => sum + (s.reps || 0), 0) / ex.actualSets.length
              : 0;
            const volume = ex.actualSets
              .filter((s) => s.completed)
              .reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
            const onTarget = avgReps >= ex.plannedRepsMin;
            return (
              <SectionCard
                key={ex.exerciseId}
                title={ex.exerciseName}
                description={`Planned ${ex.plannedSets} × ${ex.plannedRepsMin}-${ex.plannedRepsMax}`}
                actions={
                  <Badge variant="outline" className={onTarget ? 'text-accent border-accent/40' : 'text-warning border-warning/40'}>
                    {onTarget ? '— On target' : '— Below target'}
                  </Badge>
                }
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <KpiTile label="Completed Sets" value={completed.toString()} />
                  <KpiTile
                    label="Avg Reps"
                    value={avgReps.toFixed(1)}
                    hint={`Planned ${ex.plannedRepsMin}-${ex.plannedRepsMax}`}
                  />
                  <KpiTile label="Max Weight" value={`${max} lbs`} />
                  <KpiTile label="Volume" value={`${volume.toLocaleString()} lbs`} />
                </div>

                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-[60px_1fr_1fr_1fr_60px] gap-2 px-4 py-2 text-xs text-muted-foreground border-b border-border bg-muted/30">
                    <span>Set</span>
                    <span>Weight</span>
                    <span>Reps</span>
                    <span>RPE</span>
                    <span className="text-right">Done</span>
                  </div>
                  {ex.actualSets.map((s) => (
                    <div key={s.setNumber} className="grid grid-cols-[60px_1fr_1fr_1fr_60px] gap-2 px-4 py-2 text-sm border-b border-border last:border-0">
                      <span className="text-primary font-mono">{s.setNumber}</span>
                      <span className="font-mono text-foreground">{s.weight} lbs</span>
                      <span className="font-mono text-foreground">{s.reps}</span>
                      <span className="font-mono text-muted-foreground">{s.rpe ?? '—'}</span>
                      <span className="flex justify-end">
                        {s.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                        ) : (
                          <MinusCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            );
          })}
        </div>
      </div>

      {/* === Edit session dialog === */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>
              Update timing and wearable data. Manual values are accepted; future Apple Health / Withings sync can fill these in automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="started">Start</Label>
                <Input id="started" type="datetime-local" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="completed">End</Label>
                <Input id="completed" type="datetime-local" value={completedAt} onChange={(e) => setCompletedAt(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="active">Active Calories</Label>
                <Input id="active" type="number" min="0" value={activeCalories} onChange={(e) => setActiveCalories(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="total">Total Calories</Label>
                <Input id="total" type="number" min="0" value={totalCalories} onChange={(e) => setTotalCalories(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hr">Avg Heart Rate (BPM)</Label>
                <Input id="hr" type="number" min="0" value={avgHeartRate} onChange={(e) => setAvgHeartRate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rpe">Effort (RPE 1–10)</Label>
                <Input id="rpe" type="number" min="1" max="10" step="0.5" value={rpe} onChange={(e) => setRpe(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} placeholder="How did it feel? Any pain, energy notes…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={updateSession.isPending}>
              <Save className="h-4 w-4 mr-2" /> Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

const KpiTile: React.FC<{ label: string; value: string; hint?: string; accent?: 'good' | 'warn' | 'bad' }> = ({
  label, value, hint, accent,
}) => {
  const tone =
    accent === 'good' ? 'border-accent/40 bg-accent/5' :
    accent === 'warn' ? 'border-warning/40 bg-warning/5' :
    accent === 'bad' ? 'border-destructive/40 bg-destructive/5' :
    'border-border';
  const valueTone =
    accent === 'good' ? 'text-accent' :
    accent === 'warn' ? 'text-warning' :
    accent === 'bad' ? 'text-destructive' :
    'text-foreground';
  return (
    <div className={`rounded-lg border p-3 ${tone}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold ${valueTone}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-lg border border-border p-3">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</div>
    <div className="text-base font-semibold text-foreground mt-1">{value}</div>
  </div>
);

const Quality: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
  <li className="flex items-center gap-2">
    {ok ? (
      <CheckCircle2 className="h-4 w-4 text-accent" />
    ) : (
      <MinusCircle className="h-4 w-4 text-destructive" />
    )}
    <span className={ok ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
  </li>
);

export default SessionDetail;
