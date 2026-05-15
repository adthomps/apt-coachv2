import React from 'react';
import { Edit2 } from 'lucide-react';
import SectionCard from '@/components/common/SectionCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DayGoal {
  id: string;
  label: string;
  target: string;
  status: string;
  tone: 'good' | 'pending' | 'over' | 'info';
}

interface Props {
  goals: DayGoal[];
  onEdit?: () => void;
}

const TONE_COLOR: Record<DayGoal['tone'], string> = {
  good: 'text-primary',
  pending: 'text-muted-foreground',
  over: 'text-warning',
  info: 'text-accent',
};

const DayGoalsCard: React.FC<Props> = ({ goals, onEdit }) => (
  <SectionCard
    title={
      <span className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">
        Day Goals
      </span>
    }
    actions={
      onEdit && (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit goals
        </Button>
      )
    }
  >
    <ul className="divide-y divide-border/50">
      {goals.map(g => (
        <li key={g.id} className="flex items-baseline justify-between py-2 text-sm">
          <span className="text-foreground">{g.label}</span>
          <div className="flex items-baseline gap-3 tabular-nums">
            <span className="text-foreground font-medium">{g.target}</span>
            <span className={cn('text-xs', TONE_COLOR[g.tone])}>{g.status}</span>
          </div>
        </li>
      ))}
    </ul>
  </SectionCard>
);

export default DayGoalsCard;
