import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Trash2, X } from 'lucide-react';
import type { MealEntry } from '@/lib/api/types';

interface MealEntryRowProps {
  entry?: MealEntry;
  onSave: (data: { label: string; protein: number; carbs: number; fat: number; calories: number }) => void;
  onDelete?: () => void;
  onCancel?: () => void;
  /** When true, render compact column labels above the inputs. */
  showLabels?: boolean;
  /** When true, autofocus the name input on mount. */
  autoFocus?: boolean;
  isAdding?: boolean;
}

const MealEntryRow: React.FC<MealEntryRowProps> = ({
  entry, onSave, onDelete, onCancel, showLabels, autoFocus, isAdding,
}) => {
  const [label, setLabel] = useState(entry?.label ?? '');
  const [protein, setProtein] = useState(entry?.protein?.toString() ?? '');
  const [carbs, setCarbs] = useState(entry?.carbs?.toString() ?? '');
  const [fat, setFat] = useState(entry?.fat?.toString() ?? '');
  const [calories, setCalories] = useState(entry?.calories?.toString() ?? '');

  const handleSubmit = () => {
    const p = parseFloat(protein) || 0;
    const c = parseFloat(carbs) || 0;
    const f = parseFloat(fat) || 0;
    const cal = parseFloat(calories) || Math.round(p * 4 + c * 4 + f * 9);
    onSave({ label: label || 'Meal', protein: p, carbs: c, fat: f, calories: cal });
    if (isAdding) { setLabel(''); setProtein(''); setCarbs(''); setFat(''); setCalories(''); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape' && onCancel) onCancel();
  };

  return (
    <div className="space-y-1">
      {showLabels && (
        <div className="flex items-center gap-2 px-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          <span className="flex-1">Item</span>
          <span className="w-14 text-center">Protein</span>
          <span className="w-14 text-center">Carbs</span>
          <span className="w-14 text-center">Fat</span>
          <span className="w-16 text-center">kcal</span>
          <span className="w-[68px]" />
        </div>
      )}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Item name"
          value={label}
          autoFocus={autoFocus}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 h-8 text-sm"
        />
        <Input placeholder="P" value={protein} onChange={e => setProtein(e.target.value)} onKeyDown={handleKeyDown}
          className="w-14 h-8 text-sm text-center tabular-nums" type="number" min={0} />
        <Input placeholder="C" value={carbs} onChange={e => setCarbs(e.target.value)} onKeyDown={handleKeyDown}
          className="w-14 h-8 text-sm text-center tabular-nums" type="number" min={0} />
        <Input placeholder="F" value={fat} onChange={e => setFat(e.target.value)} onKeyDown={handleKeyDown}
          className="w-14 h-8 text-sm text-center tabular-nums" type="number" min={0} />
        <Input placeholder="auto" value={calories} onChange={e => setCalories(e.target.value)} onKeyDown={handleKeyDown}
          className="w-16 h-8 text-sm text-center tabular-nums" type="number" min={0} />
        <div className="flex items-center gap-0.5 shrink-0">
          <Button size="sm" variant="ghost" onClick={handleSubmit} className="h-8 w-8 p-0" aria-label="Save">
            <Check className="h-4 w-4" />
          </Button>
          {onCancel && (
            <Button size="sm" variant="ghost" onClick={onCancel} className="h-8 w-8 p-0" aria-label="Cancel">
              <X className="h-4 w-4" />
            </Button>
          )}
          {onDelete && !onCancel && (
            <Button size="sm" variant="ghost" onClick={onDelete} className="h-8 w-8 p-0 text-destructive hover:text-destructive" aria-label="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealEntryRow;
