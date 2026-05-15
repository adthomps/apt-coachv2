import React from 'react';
import { cn } from '@/lib/utils';
import type { NutritionTargets } from '@/lib/api/types';

interface NutritionBarProps {
  consumed: { calories: number; protein: number; carbs: number; fat: number };
  targets: NutritionTargets;
}

type Status = 'under' | 'on' | 'over';

function statusFor(val: number, target: number, tolerance = 0.05): Status {
  if (target <= 0) return 'under';
  const ratio = val / target;
  if (ratio > 1 + tolerance) return 'over';
  if (ratio >= 0.95) return 'on';
  return 'under';
}

const TONE_TEXT: Record<Status, string> = {
  under: 'text-foreground',
  on: 'text-primary',
  over: 'text-warning',
};

const TONE_BAR: Record<Status, string> = {
  under: 'bg-muted-foreground/60',
  on: 'bg-primary',
  over: 'bg-warning',
};

const Tile: React.FC<{ label: string; value: number; target: number; unit?: string; overridden?: boolean }> = ({
  label, value, target, unit = '', overridden,
}) => {
  const s = statusFor(value, target);
  return (
    <div className="rounded-lg border border-border/60 bg-card/50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn('text-2xl font-semibold tabular-nums leading-tight', TONE_TEXT[s])}>
        {Math.round(value).toLocaleString()}{unit}
      </div>
      <div className="text-xs text-muted-foreground tabular-nums">
        target {Math.round(target).toLocaleString()}{unit}
        {overridden && <span title="Manual override" className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" />}
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: number; target: number; unit?: string }> = ({ label, value, target, unit = '' }) => {
  const s = statusFor(value, target);
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  return (
    <div className="grid grid-cols-[5rem_1fr_auto] items-center gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', TONE_BAR[s])} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('tabular-nums text-xs', TONE_TEXT[s])}>
        {Math.round(value)} / {Math.round(target)}{unit}
        {s === 'over' && <span className="ml-1">↑</span>}
      </span>
    </div>
  );
};

const NutritionBar: React.FC<NutritionBarProps> = ({ consumed, targets }) => {
  const ov = targets.overridden;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Tile label="Calories" value={consumed.calories} target={targets.calories} overridden={ov.calories} />
        <Tile label="Protein"  value={consumed.protein}  target={targets.protein}  unit="g" overridden={ov.protein} />
        <Tile label="Carbs"    value={consumed.carbs}    target={targets.carbs}    unit="g" overridden={ov.carbs} />
        <Tile label="Fat"      value={consumed.fat}      target={targets.fat}      unit="g" overridden={ov.fat} />
      </div>
      <div className="space-y-2">
        <Row label="Calories" value={consumed.calories} target={targets.calories} />
        <Row label="Protein"  value={consumed.protein}  target={targets.protein}  unit="g" />
        <Row label="Carbs"    value={consumed.carbs}    target={targets.carbs}    unit="g" />
        <Row label="Fat"      value={consumed.fat}      target={targets.fat}      unit="g" />
      </div>
    </div>
  );
};

export default NutritionBar;
