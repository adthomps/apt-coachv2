import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import MealEntryRow from './MealEntryRow';
import type { MealEntry, MealSlot, MEAL_SLOT_LABELS } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface MealCardProps {
  slot: MealSlot;
  slotLabel: string;
  entries: MealEntry[];
  onAdd: (data: { label: string; protein: number; carbs: number; fat: number; calories: number }) => void;
  onDelete: (mealId: string) => void;
}

const MealCard: React.FC<MealCardProps> = ({ slot, slotLabel, entries, onAdd, onDelete }) => {
  const totals = entries.reduce(
    (acc, e) => ({ p: acc.p + e.protein, c: acc.c + e.carbs, f: acc.f + e.fat, cal: acc.cal + e.calories }),
    { p: 0, c: 0, f: 0, cal: 0 },
  );

  return (
    <Collapsible defaultOpen={entries.length > 0}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2.5 px-1 group">
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm text-foreground">{slotLabel}</span>
          {entries.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {totals.cal} cal · {totals.p}P · {totals.c}C · {totals.f}F
            </span>
          )}
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border pt-2 pb-1 space-y-0.5">
          {/* Header labels */}
          <div className="flex items-center gap-2 px-0 text-[10px] text-muted-foreground uppercase tracking-wider">
            <span className="flex-1 min-w-0">Item</span>
            <span className="w-14 text-center">Prot</span>
            <span className="w-14 text-center">Carb</span>
            <span className="w-14 text-center">Fat</span>
            <span className="w-16 text-center">Cal</span>
            <span className="w-8" />
          </div>
          {entries.map((entry) => (
            <MealEntryRow key={entry.id} entry={entry} onSave={() => {}} onDelete={() => onDelete(entry.id)} />
          ))}
          <MealEntryRow isAdding onSave={onAdd} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default MealCard;
