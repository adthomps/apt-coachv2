import React, { useEffect, useState } from 'react';
import FormDialog from '@/components/common/FormDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateDayGoals } from '@/hooks/use-api-queries';
import type { DayGoals, NutritionTargets } from '@/lib/api/types';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  date: string;
  goals?: DayGoals;
  targets: NutritionTargets;
}

const DayGoalsEditorDialog: React.FC<Props> = ({ open, onOpenChange, date, goals, targets }) => {
  const update = useUpdateDayGoals();

  const [proteinG, setProteinG] = useState('');
  const [steps, setSteps] = useState('');
  const [waterL, setWaterL] = useState('');
  const [sessionNote, setSessionNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setProteinG(goals?.proteinG != null ? String(goals.proteinG) : '');
    setSteps(goals?.steps != null ? String(goals.steps) : '');
    setWaterL(goals?.waterL != null ? String(goals.waterL) : '');
    setSessionNote(goals?.sessionNote ?? '');
  }, [open, goals]);

  const handleSave = () => {
    const num = (s: string) => {
      const n = parseFloat(s);
      return Number.isFinite(n) && n > 0 ? n : undefined;
    };
    update.mutate(
      {
        date,
        goals: {
          proteinG: num(proteinG),
          steps: num(steps),
          waterL: num(waterL),
          sessionNote: sessionNote.trim() || undefined,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={`Day goals · ${date}`}
      description="Set your targets for today. Leave a field blank to use the default."
      submitLabel="Save goals"
      isSubmitting={update.isPending}
      onSubmit={handleSave}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Protein target</Label>
          <Input
            type="number"
            min={0}
            placeholder={`${targets.protein} (auto)`}
            value={proteinG}
            onChange={e => setProteinG(e.target.value)}
            className="h-9 tabular-nums"
          />
          <p className="text-[11px] text-muted-foreground">Defaults to nutrition target ({targets.protein} g).</p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Step target</Label>
          <Input
            type="number"
            min={0}
            placeholder="8000"
            value={steps}
            onChange={e => setSteps(e.target.value)}
            className="h-9 tabular-nums"
          />
          <p className="text-[11px] text-muted-foreground">Defaults to 8,000 steps.</p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Water target (L)</Label>
          <Input
            type="number"
            min={0}
            step="0.1"
            placeholder="2.5"
            value={waterL}
            onChange={e => setWaterL(e.target.value)}
            className="h-9 tabular-nums"
          />
          <p className="text-[11px] text-muted-foreground">Defaults to 2.5 L.</p>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Session intent / note</Label>
          <Textarea
            value={sessionNote}
            onChange={e => setSessionNote(e.target.value)}
            placeholder="e.g. Push day, RPE 7, focus on tempo."
            rows={3}
          />
        </div>
      </div>
    </FormDialog>
  );
};

export default DayGoalsEditorDialog;
