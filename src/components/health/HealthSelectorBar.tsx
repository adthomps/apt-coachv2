import React from 'react';
import { Calendar, Trash2, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface SelectorOption {
  id: string;
  label: string;
  /** Optional sub-line shown to the right of the label inside the dropdown. */
  hint?: string;
}

interface HealthSelectorBarProps {
  /** Items in the primary "current" picker. */
  items: SelectorOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;

  /** Optional compare-against picker. Pass an empty array to hide. */
  compareItems?: SelectorOption[];
  /** Special id for "previous" auto-pick. */
  compareId?: string | null;
  onCompareChange?: (id: string | null) => void;
  /** Label for the compare auto option (e.g. "Previous reading"). */
  compareAutoLabel?: string;

  onDelete?: () => void;
  /** Right-aligned slot for extra actions (e.g. "Add Reading"). */
  actions?: React.ReactNode;

  /** Total count badge text, e.g. "12 scans". */
  countLabel?: string;
  className?: string;
}

/** Compact top-of-page selector. Replaces the left history rail to give the detail pane full width. */
const HealthSelectorBar: React.FC<HealthSelectorBarProps> = ({
  items, selectedId, onSelect,
  compareItems, compareId, onCompareChange, compareAutoLabel = 'Previous',
  onDelete, actions, countLabel, className,
}) => {
  const hasCompare = !!compareItems && compareItems.length > 0 && !!onCompareChange;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-2',
        className,
      )}
    >
      {/* Current */}
      <div className="flex items-center gap-2 min-w-0">
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select value={selectedId ?? undefined} onValueChange={onSelect}>
          <SelectTrigger className="h-9 w-[240px] bg-background">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {items.map((it) => (
              <SelectItem key={it.id} value={it.id}>
                <div className="flex items-center justify-between gap-3 w-full">
                  <span className="font-medium">{it.label}</span>
                  {it.hint && <span className="text-xs text-muted-foreground ml-2">{it.hint}</span>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {countLabel && (
          <span className="text-xs text-muted-foreground hidden sm:inline">{countLabel}</span>
        )}
      </div>

      {/* Compare */}
      {hasCompare && (
        <div className="flex items-center gap-2 min-w-0">
          <GitCompare className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground hidden sm:inline">Compare to</span>
          <Select
            value={compareId ?? '__auto__'}
            onValueChange={(v) => onCompareChange!(v === '__auto__' ? null : v)}
          >
            <SelectTrigger className="h-9 w-[220px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="__auto__">{compareAutoLabel}</SelectItem>
              {compareItems!.map((it) => (
                <SelectItem key={it.id} value={it.id}>
                  <div className="flex items-center justify-between gap-3 w-full">
                    <span>{it.label}</span>
                    {it.hint && <span className="text-xs text-muted-foreground ml-2">{it.hint}</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Right slot */}
      <div className="ml-auto flex items-center gap-2">
        {actions}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onDelete}
            aria-label="Delete selected"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default HealthSelectorBar;
