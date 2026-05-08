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

const Dot: React.FC<{ on: boolean }> = ({ on }) =>
  on ? <span title="Manual override" className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" /> : null;

const NutritionBar: React.FC<NutritionBarProps> = ({ consumed, targets }) => {
  const ov = targets.overridden;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KpiStat
        icon={<Flame />}
        label="Calories"
        value={<>{consumed.calories} <span className="text-sm font-normal text-muted-foreground">/ {targets.calories}<Dot on={ov.calories} /></span></>}
        className="relative"
      />
      <KpiStat
        icon={<Beef />}
        label="Protein"
        value={<>{consumed.protein}g <span className="text-sm font-normal text-muted-foreground">/ {targets.protein}g<Dot on={ov.protein} /></span></>}
        className="relative"
      />
      <KpiStat
        icon={<Wheat />}
        label="Carbs"
        value={<>{consumed.carbs}g <span className="text-sm font-normal text-muted-foreground">/ {targets.carbs}g<Dot on={ov.carbs} /></span></>}
        className="relative"
      />
      <KpiStat
        icon={<Droplets />}
        label="Fat"
        value={<>{consumed.fat}g <span className="text-sm font-normal text-muted-foreground">/ {targets.fat}g<Dot on={ov.fat} /></span></>}
        className="relative"
      />
    </div>
  );
};

export default NutritionBar;
