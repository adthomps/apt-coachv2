import React from 'react';
import { Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionCard from '@/components/common/SectionCard';
import { cn } from '@/lib/utils';

export interface HealthHistoryItem {
  id: string;
  /** Primary label (typically formatted date). */
  label: string;
  /** Sub-line with summary stats (e.g. "18.3% BF · BodySpec"). */
  summary?: React.ReactNode;
  /** Optional trailing badge (e.g. "2 flagged"). */
  badge?: React.ReactNode;
}

interface HealthHistoryRailProps {
  title: string;
  items: HealthHistoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

/** APT shared selectable history rail. Used by DEXA, Withings, and Blood Panels. */
const HealthHistoryRail: React.FC<HealthHistoryRailProps> = ({
  title, items, selectedId, onSelect, onDelete, className,
}) => (
  <SectionCard variant="subtle" title={title} className={cn('h-fit', className)}>
    <div className="space-y-2">
      {items.map((item) => {
        const isSelected = selectedId === item.id;
        return (
          <div
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              'p-3 rounded-lg border cursor-pointer transition-colors',
              isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-sm text-foreground truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {item.badge}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                )}
              </div>
            </div>
            {item.summary && (
              <div className="text-xs text-muted-foreground mt-1">{item.summary}</div>
            )}
          </div>
        );
      })}
    </div>
  </SectionCard>
);

export default HealthHistoryRail;
