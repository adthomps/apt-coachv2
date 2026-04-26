import React, { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft, Play, CheckCircle, Dumbbell, TrendingUp,
  Zap, Clock, ChevronDown, ChevronUp, Save
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useWorkout, useExercises, usePerformanceProfiles, useAdaptiveRecommendations, useCreateSession, useAnalyzeSession } from '@/hooks/use-api-queries';
import type { SessionExerciseLog, SessionSetLog, SessionMetrics } from '@/lib/api/types';
import { toast } from '@/hooks/use-toast';

const WorkoutStart = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: workout, isLoading } = useWorkout(id);
  const { data: exercises = [] } = useExercises();
  const { data: profiles = [] } = usePerformanceProfiles();
  const { data: allRecs = [] } = useAdaptiveRecommendations();
  const createSession = useCreateSession();
  const analyzeSession = useAnalyzeSession();

  const [sessionActive, setSessionActive] = useState(false);
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, SessionSetLog[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const startedAtRef = useRef<string | null>(null);

  // Finish dialog state
  const [finishOpen, setFinishOpen] = useState(false);
  const [activeCalories, setActiveCalories] = useState('');
  const [totalCalories, setTotalCalories] = useState('');
  const [avgHeartRate, setAvgHeartRate] = useState('');
  const [rpe, setRpe] = useState('');
  const [notes, setNotes] = useState('');

  // Filter recommendations for exercises in this workout
  const exerciseIds = new Set(workout?.blocks.flatMap(b => b.items.map(i => i.exerciseId)) || []);
  const recommendations = allRecs.filter(r => !r.targetExerciseId || exerciseIds.has(r.targetExerciseId));

  const getExerciseName = (exerciseId: string) => {
    const profile = profiles.find(p => p.exerciseId === exerciseId);
    if (profile) return profile.exerciseName;
    const ex = exercises.find(e => e.id === exerciseId);
    return ex?.name || exerciseId;
  };

  const getProfileForExercise = (exerciseId: string) =>
    profiles.find(p => p.exerciseId === exerciseId);

  const getRecsForExercise = (exerciseId: string) =>
    recommendations.filter(r => r.targetExerciseId === exerciseId);

  const startSession = () => {
    if (!workout) return;
    const logs: Record<string, SessionSetLog[]> = {};
    for (const block of workout.blocks) {
      for (const item of block.items) {
        const profile = getProfileForExercise(item.exerciseId);
        const rec = getRecsForExercise(item.exerciseId).find(r => r.suggestedWeight);
        const weight = rec?.suggestedWeight || profile?.lastWeight || 0;
        logs[`${block.id}_${item.id}`] = Array.from({ length: item.sets }, (_, i) => ({
          setNumber: i + 1,
          weight,
          reps: item.repsMin,
          completed: false,
        }));
      }
    }
    setExerciseLogs(logs);
    setSessionActive(true);
    setExpandedBlock(workout.blocks[0]?.id || null);
  };

  const updateSet = (key: string, setIndex: number, field: keyof SessionSetLog, value: number | boolean) => {
    setExerciseLogs(prev => {
      const updated = { ...prev };
      updated[key] = [...(updated[key] || [])];
      updated[key][setIndex] = { ...updated[key][setIndex], [field]: value };
      return updated;
    });
  };

  const toggleSetComplete = (key: string, setIndex: number) => {
    updateSet(key, setIndex, 'completed', !exerciseLogs[key]?.[setIndex]?.completed);
  };

  const completeSession = async () => {
    if (!workout) return;
    setIsSaving(true);
    try {
      const exercises: SessionExerciseLog[] = [];
      for (const block of workout.blocks) {
        for (const item of block.items) {
          const key = `${block.id}_${item.id}`;
          const profile = getProfileForExercise(item.exerciseId);
          exercises.push({
            exerciseId: item.exerciseId,
            exerciseName: getExerciseName(item.exerciseId),
            plannedSets: item.sets,
            plannedRepsMin: item.repsMin,
            plannedRepsMax: item.repsMax,
            actualSets: exerciseLogs[key] || [],
          });
        }
      }
      const session = await createSession.mutateAsync({
        workoutId: workout.id,
        workoutName: workout.name,
        status: 'completed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        exercises,
      });

      const newRecs = await analyzeSession.mutateAsync(session.id);
      toast({
        title: 'Workout Complete!',
        description: `${newRecs.length} new insight${newRecs.length !== 1 ? 's' : ''} generated.`,
      });
      navigate('/workouts');
    } catch {
      toast({ title: 'Error', description: 'Failed to save session', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Layout><div className="flex items-center justify-center h-96"><div className="animate-pulse text-muted-foreground">Loading workout...</div></div></Layout>;
  }

  if (!workout) {
    return <Layout><div className="text-center py-12"><p className="text-muted-foreground">Workout not found.</p><Link to="/workouts"><Button variant="outline" className="mt-4">Back to Workouts</Button></Link></div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/workouts"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{workout.name}</h1>
            <p className="text-muted-foreground text-sm">{workout.description}</p>
          </div>
          {!sessionActive ? (
            <Button size="lg" onClick={startSession}>
              <Play className="mr-2 h-5 w-5" />Begin Session
            </Button>
          ) : (
            <Button size="lg" onClick={completeSession} disabled={isSaving} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Save className="mr-2 h-5 w-5" />{isSaving ? 'Saving...' : 'Complete Workout'}
            </Button>
          )}
        </div>

        {recommendations.length > 0 && !sessionActive && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Adaptive Insights</span>
                <Badge variant="secondary">{recommendations.length}</Badge>
              </div>
              <div className="space-y-2">
                {recommendations.slice(0, 3).map(r => (
                  <div key={r.id} className="text-sm text-muted-foreground flex items-start gap-2">
                    <TrendingUp className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                    <span>{r.rationale}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {workout.blocks.map(block => (
          <Card key={block.id}>
            <CardHeader
              className="cursor-pointer"
              onClick={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{block.name}</CardTitle>
                  <CardDescription>{block.items.length} exercises • {block.type.replace(/_/g, ' ')}</CardDescription>
                </div>
                {expandedBlock === block.id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </div>
            </CardHeader>
            {expandedBlock === block.id && (
              <CardContent className="space-y-4">
                {block.items.map(item => {
                  const profile = getProfileForExercise(item.exerciseId);
                  const exRecs = getRecsForExercise(item.exerciseId);
                  const suggestedWeight = exRecs.find(r => r.suggestedWeight)?.suggestedWeight;
                  const key = `${block.id}_${item.id}`;
                  const sets = exerciseLogs[key] || [];

                  return (
                    <div key={item.id} className="p-4 border border-border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            <Dumbbell className="h-4 w-4 text-muted-foreground" />
                            {getExerciseName(item.exerciseId)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {item.sets} sets × {item.repsMin}-{item.repsMax} reps
                            {item.restSeconds && ` • ${item.restSeconds}s rest`}
                            {item.rpeTarget && ` • RPE ${item.rpeTarget}`}
                          </div>
                        </div>
                        {profile && (
                          <div className="text-right">
                            <Badge variant={profile.progressionState === 'progressing' ? 'default' : profile.progressionState === 'stalled' ? 'secondary' : 'outline'} className="text-xs capitalize">
                              {profile.progressionState}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {suggestedWeight && !sessionActive && (
                        <div className="flex items-center gap-2 text-sm p-2 bg-primary/5 rounded border border-primary/10">
                          <TrendingUp className="h-3.5 w-3.5 text-primary" />
                          <span className="text-foreground">Suggested: <strong>{suggestedWeight} lbs</strong></span>
                          {profile && (
                            <span className="text-muted-foreground">
                              (last: {profile.lastWeight} lbs × {profile.sessionHistory[0]?.avgReps.toFixed(0) || '?'} reps)
                            </span>
                          )}
                        </div>
                      )}

                      {profile && profile.sessionHistory.length > 0 && !sessionActive && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last {Math.min(4, profile.sessionHistory.length)} sessions:
                          {profile.sessionHistory.slice(0, 4).map((s, i) => (
                            <span key={i} className="font-mono">{s.weight}×{s.avgReps.toFixed(0)}</span>
                          )).reduce((prev, curr, i) => (
                            <>{prev}{i > 0 && <span className="mx-0.5">→</span>}{curr}</>
                          ) as any)}
                        </div>
                      )}

                      {sessionActive && sets.length > 0 && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-xs text-muted-foreground font-medium px-1">
                            <span>Set</span>
                            <span>Weight (lbs)</span>
                            <span>Reps</span>
                            <span>Done</span>
                          </div>
                          {sets.map((set, si) => (
                            <div key={si} className={`grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center ${set.completed ? 'opacity-60' : ''}`}>
                              <span className="text-sm font-medium text-muted-foreground w-6 text-center">{set.setNumber}</span>
                              <Input
                                type="number"
                                value={set.weight}
                                onChange={e => updateSet(key, si, 'weight', parseFloat(e.target.value) || 0)}
                                className="h-9 text-sm"
                              />
                              <Input
                                type="number"
                                value={set.reps}
                                onChange={e => updateSet(key, si, 'reps', parseInt(e.target.value) || 0)}
                                className="h-9 text-sm"
                              />
                              <Button
                                variant={set.completed ? 'default' : 'outline'}
                                size="sm"
                                className="h-9 w-9 p-0"
                                onClick={() => toggleSetComplete(key, si)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </Layout>
  );
};

export default WorkoutStart;
