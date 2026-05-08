import React, { useState } from 'react';
import { Settings2, RotateCcw, Save } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCreateNutritionGoal } from '@/hooks/use-api-queries';
import {
  ACTIVITY_LEVELS, GOAL_PHASE_DELTA, GOAL_PHASE_LABELS,
  type GoalPhase, type NutritionGoal, type NutritionTargets,
} from '@/lib/api/types';

interface Props {
  targets: NutritionTargets;
  activeGoal: NutritionGoal | null;
}

const PHASES: GoalPhase[] = ['aggressive_cut', 'cut', 'maintain', 'lean_gain'];

const todayStr = () => new Date().toISOString().slice(0, 10);

const NutritionTargetsPanel: React.FC<Props> = ({ targets, activeGoal }) => {
  const { toast } = useToast();
  const createGoal = useCreateNutritionGoal();

  const [phase, setPhase] = useState<GoalPhase>(targets.phase);
  const [activity, setActivity] = useState<number>(targets.activityMultiplier);
  const [overrides, setOverrides] = useState<{ calories: string; protein: string; carbs: string; fat: string }>({
    calories: activeGoal?.overrides.calories?.toString() ?? '',
    protein: activeGoal?.overrides.protein?.toString() ?? '',
    carbs: activeGoal?.overrides.carbs?.toString() ?? '',
    fat: activeGoal?.overrides.fat?.toString() ?? '',
  });
  const [effectiveFrom, setEffectiveFrom] = useState<string>(todayStr());

  const handleSave = () => {
    const ov: NutritionGoal['overrides'] = {};
    const parseNum = (s: string) => {
      const n = parseFloat(s);
      return Number.isFinite(n) && n > 0 ? n : undefined;
    };
    const c = parseNum(overrides.calories); if (c) ov.calories = c;
    const p = parseNum(overrides.protein); if (p) ov.protein = p;
    const cb = parseNum(overrides.carbs); if (cb) ov.carbs = cb;
    const f = parseNum(overrides.fat); if (f) ov.fat = f;

    createGoal.mutate(
      { effectiveFrom, phase, activityMultiplier: activity, overrides: ov },
      {
        onSuccess: () => toast({ title: 'Targets updated', description: `Active from ${effectiveFrom}.` }),
      },
    );
  };

  const resetField = (k: keyof typeof overrides) => setOverrides(prev => ({ ...prev, [k]: '' }));

  const activityLabel = ACTIVITY_LEVELS.find(a => a.value === activity)?.label ?? `${activity}×`;

  return (
    <div className="rounded-lg border border-border/60 bg-card/50">
      <Collapsible>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Targets</span>
            <Badge variant="secondary" className="text-xs">{GOAL_PHASE_LABELS[targets.phase]}</Badge>
            <span className="text-xs text-muted-foreground">{activityLabel} · {targets.activityMultiplier}× activity</span>
            {targets.source === 'overridden' && (
              <Badge variant="outline" className="text-xs">Manual override</Badge>
            )}
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs">Edit</Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="px-3 pb-4 space-y-4 border-t border-border/60 pt-4">
          {/* Phase */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Goal Phase</Label>
            <ToggleGroup
              type="single"
              value={phase}
              onValueChange={(v) => v && setPhase(v as GoalPhase)}
              className="grid grid-cols-2 sm:grid-cols-4 gap-1"
            >
              {PHASES.map(p => {
                const delta = GOAL_PHASE_DELTA[p];
                return (
                  <ToggleGroupItem key={p} value={p} className="flex flex-col h-auto py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                    <span className="text-sm font-medium">{GOAL_PHASE_LABELS[p]}</span>
                    <span className="text-[10px] opacity-70">{delta >= 0 ? '+' : ''}{delta} kcal</span>
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
          </div>

          {/* Activity */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Activity Level</Label>
            <ToggleGroup
              type="single"
              value={String(activity)}
              onValueChange={(v) => v && setActivity(parseFloat(v))}
              className="grid grid-cols-3 sm:grid-cols-5 gap-1"
            >
              {ACTIVITY_LEVELS.map(a => (
                <ToggleGroupItem key={a.value} value={String(a.value)} className="flex flex-col h-auto py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <span className="text-xs font-medium">{a.label}</span>
                  <span className="text-[10px] opacity-70">{a.value}×</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Overrides */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Manual Overrides (optional)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['calories', 'protein', 'carbs', 'fat'] as const).map(key => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs capitalize">{key}</Label>
                    {overrides[key] && (
                      <button
                        type="button"
                        onClick={() => resetField(key)}
                        className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
                      >
                        <RotateCcw className="h-2.5 w-2.5" /> reset
                      </button>
                    )}
                  </div>
                  <Input
                    type="number"
                    min={0}
                    placeholder={String(targets.autoBaseline[key])}
                    value={overrides[key]}
                    onChange={e => setOverrides(prev => ({ ...prev, [key]: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Effective from + Save */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-2 border-t border-border/60">
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Effective from</Label>
              <Input
                type="date"
                value={effectiveFrom}
                min={todayStr()}
                onChange={e => setEffectiveFrom(e.target.value)}
                className="h-8 text-sm w-full sm:w-44"
              />
            </div>
            <div className="flex-1" />
            <Button onClick={handleSave} disabled={createGoal.isPending} size="sm">
              <Save className="h-4 w-4 mr-1.5" />
              Save targets
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default NutritionTargetsPanel;
