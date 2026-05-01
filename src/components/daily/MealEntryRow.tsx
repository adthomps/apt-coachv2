import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { MealEntry } from '@/lib/api/types';

interface MealEntryRowProps {
  entry?: MealEntry;
  onSave: (data: { label: string; protein: number; carbs: number; fat: number; calories: number }) => void;
  onDelete?: () => void;
  isAdding?: boolean;
}

const MealEntryRow: React.FC<MealEntryRowProps> = ({ entry, onSave, onDelete, isAdding }) => {
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

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div className="flex items-center gap-2 py-1.5">
      <Input
        placeholder="Item name"
        value={label}
        onChange={e => setLabel(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 min-w-0 h-8 text-sm"
      />
      <Input
        placeholder="P"
        value={protein}
        onChange={e => setProtein(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-14 h-8 text-sm text-center"
        type="number"
        min={0}
      />
      <Input
        placeholder="C"
        value={carbs}
        onChange={e => setCarbs(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-14 h-8 text-sm text-center"
        type="number"
        min={0}
      />
      <Input
        placeholder="F"
        value={fat}
        onChange={e => setFat(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-14 h-8 text-sm text-center"
        type="number"
        min={0}
      />
      <Input
        placeholder="Cal"
        value={calories}
        onChange={e => setCalories(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-16 h-8 text-sm text-center"
        type="number"
        min={0}
      />
      {isAdding ? (
        <Button size="sm" variant="ghost" onClick={handleSubmit} className="h-8 w-8 p-0 shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      ) : (
        onDelete && (
          <Button size="sm" variant="ghost" onClick={onDelete} className="h-8 w-8 p-0 shrink-0 text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )
      )}
    </div>
  );
};

export default MealEntryRow;
