import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type DifficultyTone = 'beginner' | 'intermediate' | 'advanced';
type MarkerTone = 'optimal' | 'average' | 'outOfRange';
type StatusTone = 'completed' | 'skipped' | 'scheduled' | 'rescheduled' | 'in_progress' | 'abandoned';

type Tone = DifficultyTone | MarkerTone | StatusTone | 'success' | 'warning' | 'destructive' | 'muted' | 'primary';

interface StatusBadgeProps {
  tone: Tone;
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

/** Single home for all status/difficulty/marker badge colors. APT semantic-tokens only. */
const TONE_CLASS: Record<Tone, string> = {
  beginner: 'bg-success/10 text-success border-success/30',
  intermediate: 'bg-warning/10 text-warning border-warning/30',
  advanced: 'bg-destructive/10 text-destructive border-destructive/30',

  optimal: 'bg-success/15 text-success border-success/30',
  average: 'bg-muted text-muted-foreground border-border',
  outOfRange: 'bg-destructive/15 text-destructive border-destructive/30',

  completed: 'bg-accent/15 text-accent border-accent/30',
  skipped: 'bg-destructive/10 text-destructive border-destructive/30',
  scheduled: 'bg-primary/10 text-primary border-primary/30',
  rescheduled: 'bg-warning/10 text-warning border-warning/30',
  in_progress: 'bg-warning/10 text-warning border-warning/30',
  abandoned: 'bg-destructive/10 text-destructive border-destructive/30',

  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  destructive: 'bg-destructive/10 text-destructive border-destructive/30',
  primary: 'bg-primary/10 text-primary border-primary/30',
  muted: 'bg-muted text-muted-foreground border-border',
};

const TONE_LABEL: Partial<Record<Tone, string>> = {
  optimal: 'Optimal',
  average: 'Average',
  outOfRange: 'Out of Range',
  completed: 'Completed',
  skipped: 'Skipped',
  scheduled: 'Scheduled',
  rescheduled: 'Rescheduled',
  in_progress: 'In Progress',
  abandoned: 'Abandoned',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ tone, label, className, children }) => (
  <Badge variant="outline" className={cn('capitalize text-xs font-medium', TONE_CLASS[tone], className)}>
    {children ?? label ?? TONE_LABEL[tone] ?? tone}
  </Badge>
);

export default StatusBadge;
