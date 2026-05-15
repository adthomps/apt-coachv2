import React, { useState } from 'react';
import { Sun, Sunset, Moon, Apple, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MealEntryRow from './MealEntryRow';
import type { MealEntry, MealSlot } from '@/lib/api/types';

interface MealCardProps {
  slot: MealSlot;
  slotLabel: string;
  entries: MealEntry[];
  onAdd: (data: { label: string; protein: number; carbs: number; fat: number; calories: number }) => void;
  onDelete: (mealId: string) => void;
}

const SLOT_ICON: Record<MealSlot, React.ReactNode> = {
  breakfast: <Sun className="h-4 w-4 text-warning" />,
  lunch: <Sunset className="h-4 w-4 text-warning" />,
  dinner: <Moon className="h-4 w-4 text-primary" />,
  snacks: <Apple className="h-4 w-4 text-accent" />,
};

const Macro: React.FC<{ k: string; v: number }> = ({ k, v }) => (
  <span className="text-xs text-muted-foreground tabular-nums">
    <span className="text-foreground/60 mr-0.5">{k}</span>{v}g
  </span>
);

const MealCard: React.FC<MealCardProps> = ({ slot, slotLabel, entries, onAdd, onDelete }) => {
  const [adding, setAdding] = useState(false);
  const totals = entries.reduce(
    (acc, e) => ({ p: acc.p + e.protein, c: acc.c + e.carbs, f: acc.f + e.fat, cal: acc.cal + e.calories }),
    { p: 0, c: 0, f: 0, cal: 0 },
  );

  return (
    <div className="py-3 first:pt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {SLOT_ICON[slot]}
          <span className="font-medium text-sm text-foreground">{slotLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          {entries.length > 0 && (
            <div className="flex items-center gap-2">
              <Macro k="P" v={totals.p} />
              <Macro k="C" v={totals.c} />
              <Macro k="F" v={totals.f} />
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAdding(v => !v)}
            className="h-7 w-7 p-0"
            aria-label={`Add ${slotLabel} item`}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Entries as cards */}
      <div className="space-y-1.5">
        {entries.map(entry => (
          <div key={entry.id} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-foreground truncate">{entry.label}</span>
              <span className="text-sm tabular-nums text-foreground shrink-0">{entry.calories} kcal</span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <div className="flex items-center gap-3">
                <Macro k="P" v={entry.protein} />
                <Macro k="C" v={entry.carbs} />
                <Macro k="F" v={entry.fat} />
              </div>
              <button
                onClick={() => onDelete(entry.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Delete entry"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {adding && (
          <div className="rounded-lg border border-border bg-card/40 px-2 py-1">
            <MealEntryRow
              isAdding
              onSave={(data) => {
                onAdd(data);
                setAdding(false);
              }}
            />
          </div>
        )}

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="w-full rounded-lg border border-dashed border-border/70 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-border hover:bg-card/30 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add {slotLabel.toLowerCase()} item
          </button>
        )}
      </div>
    </div>
  );
};

export default MealCard;
