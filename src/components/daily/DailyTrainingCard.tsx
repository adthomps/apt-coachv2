import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Play, CheckCircle2, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionCard from '@/components/common/SectionCard';
import type { ScheduleEntry, WorkoutSession } from '@/lib/api/types';

interface DailyTrainingCardProps {
  todayEntry?: ScheduleEntry;
  todaySession?: WorkoutSession;
}

const DailyTrainingCard: React.FC<DailyTrainingCardProps> = ({ todayEntry, todaySession }) => {
  if (todaySession?.status === 'completed') {
    const duration = todaySession.completedAt
      ? Math.round((new Date(todaySession.completedAt).getTime() - new Date(todaySession.startedAt).getTime()) / 60000)
      : null;
    const totalSets = todaySession.exercises.reduce((s, ex) => s + ex.actualSets.filter(ss => ss.completed).length, 0);
    return (
      <SectionCard title={<span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Workout Complete</span>}>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{todaySession.workoutName}</span>
          {duration && <span>{duration} min</span>}
          <span>{totalSets} sets</span>
          {todaySession.metrics?.rpe && <span>RPE {todaySession.metrics.rpe}</span>}
        </div>
      </SectionCard>
    );
  }

  if (todayEntry?.workoutId) {
    return (
      <SectionCard
        title={<span className="flex items-center gap-2"><Dumbbell className="h-4 w-4" /> Today's Workout</span>}
        actions={
          <Link to={`/workouts/${todayEntry.workoutId}/start`}>
            <Button size="sm"><Play className="mr-1.5 h-3.5 w-3.5" /> Start</Button>
          </Link>
        }
      >
        <p className="text-sm text-muted-foreground">{todayEntry.workoutName || 'Scheduled workout'}</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title={<span className="flex items-center gap-2"><Coffee className="h-4 w-4" /> Rest Day</span>}>
      <p className="text-sm text-muted-foreground">No workout scheduled today. Focus on recovery, mobility, and nutrition.</p>
    </SectionCard>
  );
};

export default DailyTrainingCard;
