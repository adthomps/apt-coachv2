import React, { useEffect, useState } from 'react';
import FormDialog from '@/components/common/FormDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCreateNutritionGoal } from '@/hooks/use-api-queries';
import {
  ACTIVITY_LEVELS, GOAL_PHASE_DELTA, GOAL_PHASE_LABELS,
  type GoalPhase, type NutritionGoal, type NutritionTargets,
} from '@/lib/api/types';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  targets: NutritionTargets;
  activeGoal: NutritionGoal | null;
}

const PHASES: GoalPhase[] = ['aggressive_cut', 'cut', 'maintain', 'lean_gain'];
const todayStr = () => new Date().toISOString().slice(0, 10);

const NutritionTargetsDialog: React.FC<Props> = ({ open, onOpenChange, targets, activeGoal }) => {
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

  useEffect(() => {
    if (!open) return;
    setPhase(targets.phase);
    setActivity(targets.activityMultiplier);
    setOverrides({
      calories: activeGoal?.overrides.calories?.toString() ?? '',
      protein: activeGoal?.overrides.protein?.toString() ?? '',
      carbs: activeGoal?.overrides.carbs?.toString() ?? '',
      fat: activeGoal?.overrides.fat?.toString() ?? '',
    });
    setEffectiveFrom(todayStr());
  }, [open, targets, activeGoal]);

  const resetField = (k: keyof typeof overrides) => setOverrides(prev => ({ ...prev, [k]: '' }));

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
        onSuccess: () => {
          toast({ title: 'Targets updated', description: `Active from ${effectiveFrom}.` });
          onOpenChange(false);
        },
      },
    );
  };

  const macroFields: Array<{ key: keyof typeof overrides; label: string; unit: string }> = [
    { key: 'calories', label: 'Calories', unit: 'kcal' },
    { key: 'protein', label: 'Protein', unit: 'g' },
    { key: 'carbs', label: 'Carbs', unit: 'g' },
    { key: 'fat', label: 'Fat', unit: 'g' },
  ];

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title="Nutrition targets"
      description="Set your phase, activity level, and macro values. All inputs are values you can override at any time."
      submitLabel="Save targets"
      isSubmitting={createGoal.isPending}
      onSubmit={handleSave}
    >
      {/* Phase */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Goal phase</Label>
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
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Activity level</Label>
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

      {/* Macro values */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Macro targets</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {macroFields.map(({ key, label, unit }) => {
            const auto = targets.autoBaseline[key];
            const isOverridden = overrides[key] !== '';
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1.5">
                    {label}
                    {isOverridden && <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-label="overridden" />}
                  </Label>
                  {isOverridden && (
                    <button
                      type="button"
                      onClick={() => resetField(key)}
                      className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
                    >
                      <RotateCcw className="h-2.5 w-2.5" /> auto
                    </button>
                  )}
                </div>
                <Input
                  type="number"
                  min={0}
                  placeholder={String(auto)}
                  value={overrides[key]}
                  onChange={e => setOverrides(prev => ({ ...prev, [key]: e.target.value }))}
                  className="h-9 text-sm tabular-nums"
                />
                <p className="text-[10px] text-muted-foreground">Auto: {auto} {unit}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Effective from */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Effective from</Label>
        <Input
          type="date"
          value={effectiveFrom}
          min={todayStr()}
          onChange={e => setEffectiveFrom(e.target.value)}
          className="h-9 text-sm w-full sm:w-44"
        />
      </div>
    </FormDialog>
  );
};

export default NutritionTargetsDialog;
