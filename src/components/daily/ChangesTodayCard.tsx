import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import SectionCard from '@/components/common/SectionCard';
import { Button } from '@/components/ui/button';

export interface ChangeNote {
  id: string;
  category: 'nutrition' | 'training' | 'week';
  label: string;
  body: string;
}

interface Props {
  notes: ChangeNote[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

const CATEGORY_LABEL: Record<ChangeNote['category'], string> = {
  nutrition: 'Nutrition',
  training: 'Training',
  week: 'Week direction',
};

const ChangesTodayCard: React.FC<Props> = ({ notes, onRefresh, refreshing }) => (
  <SectionCard
    title={
      <span className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">
        Changes To Work On Today
      </span>
    }
    actions={
      <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
      </Button>
    }
  >
    {notes.length === 0 ? (
      <div className="text-sm text-muted-foreground py-4 text-center">
        Log meals and signals to generate today's changes.
      </div>
    ) : (
      <ul className="space-y-3">
        {notes.map(n => (
          <li key={n.id} className="rounded-lg border-l-2 border-primary/60 bg-primary/[0.04] px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary mb-1">
              <Sparkles className="h-3 w-3" />
              {CATEGORY_LABEL[n.category]}
            </div>
            <p className="text-sm text-foreground leading-relaxed">{n.body}</p>
          </li>
        ))}
      </ul>
    )}
  </SectionCard>
);

export default ChangesTodayCard;
