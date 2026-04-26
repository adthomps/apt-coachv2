import React from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ArrowRight, Calendar, CheckCircle2, Dumbbell, Eye, Flame, Heart, Play, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SectionCard from '@/components/common/SectionCard';
import EmptyState from '@/components/common/EmptyState';
import type { ScheduleEntry, WorkoutSession } from '@/lib/api/types';
import type { Insight } from '@/lib/ai/insights';
import { computeSessionSnapshot, getSessionInsights } from '@/lib/ai/session-insights';

interface Props {
  scheduleEntries: ScheduleEntry[];
  sessions: WorkoutSession[];
  adherenceRate: number;
  completedCount: number;
  totalScheduled: number;
}

const TrainingSection: React.FC<Props> = ({
  scheduleEntries, sessions, adherenceRate, completedCount, totalScheduled,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = scheduleEntries
    .filter((e) => e.status === 'scheduled' && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const completedSessions = sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt));

  const lastSession = completedSessions[0] ?? null;
  const lastSnap = lastSession ? computeSessionSnapshot(lastSession) : null;

  // Training Pulse — last 14 days
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const recentCompleted = completedSessions.filter((s) => (s.completedAt ?? s.startedAt) >= fourteenDaysAgo);
  const recentVolume = recentCompleted.reduce((sum, s) => sum + computeSessionSnapshot(s).totalVolume, 0);

  // Aggregated training insights from last 5 completed sessions
  const trainingInsights: Insight[] = completedSessions
    .slice(0, 5)
    .flatMap((s) => getSessionInsights(s, sessions, scheduleEntries))
    .filter((i, idx, arr) => arr.findIndex((x) => x.title === i.title) === idx)
    .slice(0, 2);

  return (
    <SectionCard
      title="Training"
      description="Pulse, adherence, what's next, and what your sessions are telling you."
      actions={
        <Link to="/training?tab=sessions">
          <Button variant="ghost" size="sm" className="text-xs">
            All sessions <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      }
    >
      {/* Training Pulse + Adherence row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <PulseStat label="Sessions / 14d" value={`${recentCompleted.length}`} icon={<Dumbbell className="h-3.5 w-3.5" />} />
        <PulseStat label="Volume / 14d" value={`${recentVolume.toLocaleString()} lbs`} icon={<Target className="h-3.5 w-3.5" />} />
        <PulseStat label="Adherence" value={`${adherenceRate}%`} sub={`${completedCount}/${totalScheduled}`} icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
        <PulseStat label="Upcoming" value={`${upcoming.length}`} sub="next 3 weeks" icon={<Calendar className="h-3.5 w-3.5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Upcoming */}
        <div className="lg:col-span-1 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Upcoming</h4>
          {upcoming.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-8 w-8" />}
              title="Nothing scheduled"
              description="Plan a session to keep adherence on track."
              action={<Link to="/schedule"><Button size="sm" variant="outline">Open schedule</Button></Link>}
            />
          ) : (
            <div className="space-y-2">
              {upcoming.map((e) => (
                <div key={e.id} className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">{format(parseISO(e.date), 'EEE, MMM d')}</span>
                    {e === upcoming[0] && <Badge variant="outline" className="text-[10px]">Next</Badge>}
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{e.workoutName ?? 'Workout'}</p>
                  <Link to={`/workouts/${e.workoutId}/start`}>
                    <Button size="sm" variant="default" className="w-full mt-2">
                      <Play className="mr-1 h-3 w-3" /> Start
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest completed session */}
        <div className="lg:col-span-1 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Latest Session</h4>
          {!lastSession || !lastSnap ? (
            <EmptyState
              icon={<Dumbbell className="h-8 w-8" />}
              title="No sessions yet"
              description="Complete a workout to see your performance snapshot."
            />
          ) : (
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground truncate">{lastSession.workoutName}</span>
                <Badge variant="outline" className="text-[10px]">
                  {format(new Date(lastSession.completedAt ?? lastSession.startedAt), 'MMM d')}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <Stat value={`${lastSnap.completionPct}%`} label="Complete" />
                <Stat value={lastSnap.totalVolume.toLocaleString()} label="Volume" />
                <Stat value={lastSnap.durationMinutes !== null ? `${lastSnap.durationMinutes}m` : '—'} label="Duration" />
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                {lastSession.metrics?.activeCalories !== undefined && (
                  <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" />{lastSession.metrics.activeCalories} cal</span>
                )}
                {lastSession.metrics?.avgHeartRate !== undefined && (
                  <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{lastSession.metrics.avgHeartRate} bpm</span>
                )}
                {lastSession.metrics?.rpe !== undefined && (
                  <span className="inline-flex items-center gap-1">RPE {lastSession.metrics.rpe}</span>
                )}
              </div>
              <Link to={`/sessions/${lastSession.id}`}>
                <Button size="sm" variant="outline" className="w-full mt-1">
                  <Eye className="mr-1 h-3 w-3" /> View detail
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Training Insights */}
        <div className="lg:col-span-1 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Training Insights
          </h4>
          {trainingInsights.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Complete a few sessions to surface AI insights from your training data.
            </p>
          ) : (
            <div className="space-y-2">
              {trainingInsights.map((i) => (
                <div key={i.id} className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground leading-tight">{i.title}</p>
                    <Badge variant="outline" className="text-[10px] capitalize shrink-0">{i.severity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug line-clamp-3">{i.rationale}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
};

const PulseStat: React.FC<{ label: string; value: string; sub?: string; icon: React.ReactNode }> = ({
  label, value, sub, icon,
}) => (
  <div className="rounded-lg border border-border bg-muted/20 p-3">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">{icon}{label}</div>
    <div className="text-lg font-bold text-foreground leading-tight">{value}</div>
    {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
  </div>
);

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div>
    <p className="text-base font-semibold text-foreground">{value}</p>
    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
  </div>
);

export default TrainingSection;
