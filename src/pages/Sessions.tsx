import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock, Dumbbell, CheckCircle, XCircle, ChevronDown, ChevronUp,
  History, AlertCircle, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useSessions } from '@/hooks/use-api-queries';
import type { WorkoutSession, SessionExerciseLog } from '@/lib/api/types';
import { format, formatDistanceStrict } from 'date-fns';

const statusConfig: Record<WorkoutSession['status'], { label: string; color: string; icon: React.ReactNode }> = {
  completed: { label: 'Completed', color: 'bg-success/10 text-success border-success/20', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  abandoned: { label: 'Abandoned', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: <XCircle className="h-3.5 w-3.5" /> },
  in_progress: { label: 'In Progress', color: 'bg-warning/10 text-warning border-warning/20', icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

/** Compute actual summary stats for an exercise log */
function getActualStats(ex: SessionExerciseLog) {
  const completed = ex.actualSets.filter(s => s.completed);
  if (completed.length === 0) return null;
  const totalReps = completed.reduce((s, set) => s + set.reps, 0);
  const avgReps = totalReps / completed.length;
  const maxWeight = Math.max(...completed.map(s => s.weight));
  const avgWeight = completed.reduce((s, set) => s + set.weight, 0) / completed.length;
  const totalVolume = completed.reduce((s, set) => s + set.weight * set.reps, 0);
  return { sets: completed.length, avgReps, maxWeight, avgWeight, totalVolume, totalReps };
}

/** Compare planned vs actual and return a delta indicator */
function getPerformanceDelta(ex: SessionExerciseLog): { label: string; color: string; icon: React.ReactNode } | null {
  const actual = getActualStats(ex);
  if (!actual) return null;

  const plannedMidReps = (ex.plannedRepsMin + ex.plannedRepsMax) / 2;
  const repsDelta = actual.avgReps - plannedMidReps;
  const setsDelta = actual.sets - ex.plannedSets;

  // Weight comparison (if planned weight exists)
  if (ex.plannedWeight && actual.maxWeight > ex.plannedWeight) {
    return { label: `+${(actual.maxWeight - ex.plannedWeight).toFixed(0)} lbs`, color: 'text-success', icon: <TrendingUp className="h-3 w-3" /> };
  }
  if (ex.plannedWeight && actual.maxWeight < ex.plannedWeight) {
    return { label: `${(actual.maxWeight - ex.plannedWeight).toFixed(0)} lbs`, color: 'text-destructive', icon: <TrendingDown className="h-3 w-3" /> };
  }

  // Rep performance
  if (repsDelta > 0.5) {
    return { label: `+${repsDelta.toFixed(1)} reps avg`, color: 'text-success', icon: <TrendingUp className="h-3 w-3" /> };
  }
  if (repsDelta < -0.5) {
    return { label: `${repsDelta.toFixed(1)} reps avg`, color: 'text-destructive', icon: <TrendingDown className="h-3 w-3" /> };
  }

  // Set completion
  if (setsDelta < 0) {
    return { label: `${setsDelta} sets`, color: 'text-warning', icon: <TrendingDown className="h-3 w-3" /> };
  }

  return { label: 'On target', color: 'text-muted-foreground', icon: <Minus className="h-3 w-3" /> };
}

const Sessions = () => {
  const { data: sessions = [], isLoading, error } = useSessions();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);

  const getDuration = (s: WorkoutSession) => {
    if (!s.completedAt) return null;
    return formatDistanceStrict(new Date(s.completedAt), new Date(s.startedAt));
  };

  /** Build a map of exerciseId → previous session's max weight for trend arrows on the card header */
  const sessionTrends = useMemo(() => {
    const trends = new Map<string, { volumeDelta: number; weightDelta: number }>();
    if (sessions.length < 2) return trends;

    // Sessions are sorted newest first
    for (let i = 0; i < sessions.length - 1; i++) {
      const current = sessions[i];
      // Find the most recent prior session with the same workout
      const prior = sessions.slice(i + 1).find(s => s.workoutId === current.workoutId);
      if (!prior) continue;

      let currentVol = 0;
      let priorVol = 0;
      let weightDelta = 0;
      let weightCount = 0;

      for (const ex of current.exercises) {
        const actual = getActualStats(ex);
        if (actual) currentVol += actual.totalVolume;

        const priorEx = prior.exercises.find(e => e.exerciseId === ex.exerciseId);
        if (priorEx) {
          const priorActual = getActualStats(priorEx);
          if (priorActual) priorVol += priorActual.totalVolume;
          if (actual && priorActual) {
            weightDelta += actual.maxWeight - priorActual.maxWeight;
            weightCount++;
          }
        }
      }

      trends.set(current.id, {
        volumeDelta: currentVol - priorVol,
        weightDelta: weightCount > 0 ? weightDelta / weightCount : 0,
      });
    }
    return trends;
  }, [sessions]);

  if (isLoading) {
    return <Layout><div className="flex items-center justify-center h-96"><div className="animate-pulse text-muted-foreground">Loading sessions...</div></div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Session History</h1>
          <p className="text-muted-foreground">Review your completed workout sessions and logged sets</p>
        </div>

        {error ? (
          <Card className="text-center py-12">
            <CardContent><p className="text-destructive">Failed to load sessions.</p></CardContent>
          </Card>
        ) : sessions.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <History className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">No Sessions Yet</h3>
              <p className="text-muted-foreground">Complete a workout to see your session history here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => {
              const status = statusConfig[session.status];
              const duration = getDuration(session);
              const totalSets = session.exercises.reduce((s, e) => s + e.actualSets.length, 0);
              const completedSets = session.exercises.reduce((s, e) => s + e.actualSets.filter(st => st.completed).length, 0);
              const isExpanded = expandedId === session.id;
              const trend = sessionTrends.get(session.id);

              // Session-level total volume
              const totalVolume = session.exercises.reduce((s, ex) => {
                const actual = getActualStats(ex);
                return s + (actual?.totalVolume || 0);
              }, 0);

              return (
                <Card key={session.id} className="apt-hover-lift">
                  <CardHeader
                    className="cursor-pointer pb-3"
                    onClick={() => toggleExpand(session.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Dumbbell className="h-4 w-4 text-muted-foreground" />
                          {session.workoutName}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-3 mt-1 flex-wrap">
                          <span>{format(new Date(session.startedAt), 'MMM d, yyyy · h:mm a')}</span>
                          {duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />{duration}
                            </span>
                          )}
                          {totalVolume > 0 && (
                            <span className="text-xs font-mono">{totalVolume.toLocaleString()} lbs vol</span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        {trend && (
                          <div className="text-right text-xs hidden sm:block">
                            {trend.volumeDelta !== 0 && (
                              <div className={`flex items-center gap-1 ${trend.volumeDelta > 0 ? 'text-success' : trend.volumeDelta < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {trend.volumeDelta > 0 ? <TrendingUp className="h-3 w-3" /> : trend.volumeDelta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                                {trend.volumeDelta > 0 ? '+' : ''}{trend.volumeDelta.toLocaleString()} vol
                              </div>
                            )}
                          </div>
                        )}
                        <div className="text-right text-sm">
                          <span className="text-muted-foreground">{completedSets}/{totalSets} sets</span>
                        </div>
                        <Badge variant="outline" className={`${status.color} flex items-center gap-1`}>
                          {status.icon}{status.label}
                        </Badge>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-4 pt-0">
                      {session.exercises.map((ex, i) => {
                        const actual = getActualStats(ex);
                        const delta = getPerformanceDelta(ex);

                        return (
                          <div key={i} className="p-3 border border-border rounded-lg space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-foreground text-sm">{ex.exerciseName}</span>
                              <div className="flex items-center gap-3">
                                {delta && (
                                  <span className={`flex items-center gap-1 text-xs font-medium ${delta.color}`}>
                                    {delta.icon}{delta.label}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Planned vs Actual summary */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="p-2 bg-muted/30 rounded">
                                <span className="text-muted-foreground">Planned: </span>
                                <span className="font-medium text-foreground">
                                  {ex.plannedSets} × {ex.plannedRepsMin}-{ex.plannedRepsMax}
                                  {ex.plannedWeight ? ` @ ${ex.plannedWeight} lbs` : ''}
                                </span>
                              </div>
                              {actual && (
                                <div className="p-2 bg-primary/5 rounded border border-primary/10">
                                  <span className="text-muted-foreground">Actual: </span>
                                  <span className="font-medium text-foreground">
                                    {actual.sets} × {actual.avgReps.toFixed(1)} avg @ {actual.maxWeight} lbs
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Set-by-set detail */}
                            <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 text-xs text-muted-foreground font-medium px-1">
                              <span>Set</span><span>Weight</span><span>Reps</span><span>RPE</span><span></span>
                            </div>
                            {ex.actualSets.map((set, si) => (
                              <div key={si} className={`grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 items-center text-sm px-1 ${!set.completed ? 'opacity-50' : ''}`}>
                                <span className="text-muted-foreground w-6 text-center">{set.setNumber}</span>
                                <span className="font-mono text-foreground">{set.weight} lbs</span>
                                <span className="font-mono text-foreground">{set.reps}</span>
                                <span className="font-mono text-muted-foreground">{set.rpe ?? '—'}</span>
                                {set.completed ? <CheckCircle className="h-3.5 w-3.5 text-success" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                              </div>
                            ))}

                            {/* Volume summary */}
                            {actual && (
                              <div className="text-xs text-muted-foreground pt-1 border-t border-border flex gap-4">
                                <span>Volume: <span className="font-medium text-foreground">{actual.totalVolume.toLocaleString()} lbs</span></span>
                                <span>Total reps: <span className="font-medium text-foreground">{actual.totalReps}</span></span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {session.notes && (
                        <p className="text-sm text-muted-foreground italic">Notes: {session.notes}</p>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Sessions;
