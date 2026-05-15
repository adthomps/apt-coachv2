import React, { useState } from 'react';
import { Settings2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NutritionTargetsDialog from './NutritionTargetsDialog';
import {
  ACTIVITY_LEVELS, GOAL_PHASE_LABELS,
  type NutritionGoal, type NutritionTargets,
} from '@/lib/api/types';

interface Props {
  targets: NutritionTargets;
  activeGoal: NutritionGoal | null;
}

const NutritionTargetsPanel: React.FC<Props> = ({ targets, activeGoal }) => {
  const [open, setOpen] = useState(false);
  const activityLabel = ACTIVITY_LEVELS.find(a => a.value === targets.activityMultiplier)?.label
    ?? `${targets.activityMultiplier}×`;
  const anyOverride = Object.values(targets.overridden).some(Boolean);

  return (
    <>
      <div className="rounded-lg border border-border/60 bg-card/50 p-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Targets</span>
          <Badge variant="secondary" className="text-xs">{GOAL_PHASE_LABELS[targets.phase]}</Badge>
          <Badge variant="secondary" className="text-xs">{activityLabel} · {targets.activityMultiplier}×</Badge>
          <span className="text-xs text-muted-foreground tabular-nums">
            {targets.calories} kcal · P {targets.protein} / C {targets.carbs} / F {targets.fat}
          </span>
          {anyOverride && <Badge variant="outline" className="text-xs">Overridden</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit targets
        </Button>
      </div>

      <NutritionTargetsDialog
        open={open}
        onOpenChange={setOpen}
        targets={targets}
        activeGoal={activeGoal}
      />
    </>
  );
};

export default NutritionTargetsPanel;
