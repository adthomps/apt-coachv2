import React from 'react';
import { Flame, Beef, Wheat, Droplets } from 'lucide-react';
import KpiStat from '@/components/health/KpiStat';
import type { NutritionTargets } from '@/lib/api/types';

interface NutritionBarProps {
  consumed: { calories: number; protein: number; carbs: number; fat: number };
  targets: NutritionTargets;
}

function pct(val: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(Math.round((val / target) * 100), 999);
}

const MiniProgress: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => {
  const pctVal = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-muted mt-2">
      <div className="h-full rounded-full transition-all" style={{ width: `${pctVal}%`, backgroundColor: color }} />
    </div>
  );
};

const NutritionBar: React.FC<NutritionBarProps> = ({ consumed, targets }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    <KpiStat
      icon={<Flame />}
      label="Calories"
      value={<>{consumed.calories} <span className="text-sm font-normal text-muted-foreground">/ {targets.calories}</span></>}
      className="relative"
    />
    <KpiStat
      icon={<Beef />}
      label="Protein"
      value={<>{consumed.protein}g <span className="text-sm font-normal text-muted-foreground">/ {targets.protein}g</span></>}
      className="relative"
    />
    <KpiStat
      icon={<Wheat />}
      label="Carbs"
      value={<>{consumed.carbs}g <span className="text-sm font-normal text-muted-foreground">/ {targets.carbs}g</span></>}
      className="relative"
    />
    <KpiStat
      icon={<Droplets />}
      label="Fat"
      value={<>{consumed.fat}g <span className="text-sm font-normal text-muted-foreground">/ {targets.fat}g</span></>}
      className="relative"
    />
  </div>
);

export default NutritionBar;
