import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Exercise, CreateExerciseInput, MovementPattern } from '@/lib/api/types';
import { MOVEMENT_PATTERN_LABELS } from '@/lib/api/types';

interface ExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise?: Exercise | null;
  onSubmit: (input: CreateExerciseInput) => Promise<void>;
}

const splitCsv = (s: string) => s.split(',').map((t) => t.trim()).filter(Boolean);
const splitLines = (s: string) => s.split('\n').map((t) => t.trim()).filter(Boolean);

const ExerciseDialog: React.FC<ExerciseDialogProps> = ({ open, onOpenChange, exercise, onSubmit }) => {
  const [name, setName] = useState('');
  const [movementPattern, setMovementPattern] = useState<MovementPattern>('horizontal_push');
  const [muscleGroups, setMuscleGroups] = useState('');
  const [equipment, setEquipment] = useState('');
  const [difficulty, setDifficulty] = useState<Exercise['difficulty']>('beginner');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [cues, setCues] = useState('');
  const [substitutions, setSubstitutions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (exercise) {
      setName(exercise.name);
      setMovementPattern(exercise.movementPattern);
      setMuscleGroups(exercise.muscleGroups.join(', '));
      setEquipment(exercise.equipment.join(', '));
      setDifficulty(exercise.difficulty);
      setDescription(exercise.description || '');
      setInstructions(exercise.instructions?.join('\n') || '');
      setCues(exercise.cues?.join('\n') || '');
      setSubstitutions(exercise.substitutions?.join(', ') || '');
    } else {
      setName(''); setMovementPattern('horizontal_push'); setMuscleGroups(''); setEquipment('');
      setDifficulty('beginner'); setDescription(''); setInstructions(''); setCues(''); setSubstitutions('');
    }
  }, [exercise, open]);

  const muscleChips = splitCsv(muscleGroups);
  const equipmentChips = splitCsv(equipment);

  const nameError = name.trim().length === 0 ? 'Required' : name.trim().length > 100 ? 'Too long' : null;
  const muscleError = muscleChips.length === 0 ? 'Add at least one muscle group' : null;
  const equipmentError = equipmentChips.length === 0 ? 'Add at least one equipment item' : null;

  const canSubmit = !nameError && !muscleError && !equipmentError && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        movementPattern,
        muscleGroups: muscleChips,
        equipment: equipmentChips,
        difficulty,
        description: description.trim() || undefined,
        instructions: instructions.trim() ? splitLines(instructions) : undefined,
        cues: cues.trim() ? splitLines(cues) : undefined,
        substitutions: substitutions.trim() ? splitCsv(substitutions) : undefined,
      });
      onOpenChange(false);
    } finally { setIsSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[88vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{exercise ? 'Edit Exercise' : 'Add Exercise'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          {/* Identity */}
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Barbell Bench Press" />
            {nameError && name.length > 0 && <p className="text-xs text-destructive">{nameError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Movement Pattern</Label>
              <Select value={movementPattern} onValueChange={(v) => setMovementPattern(v as MovementPattern)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MOVEMENT_PATTERN_LABELS).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Exercise['difficulty'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-2">
            <Label>Muscle Groups</Label>
            <Input
              value={muscleGroups}
              onChange={(e) => setMuscleGroups(e.target.value)}
              placeholder="chest, shoulders, triceps"
            />
            {muscleChips.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {muscleChips.map((m) => (
                  <Badge key={m} variant="secondary" className="text-xs capitalize">{m}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Comma-separated. At least one required.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Equipment</Label>
            <Input
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="barbell, bench"
            />
            {equipmentChips.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {equipmentChips.map((m) => (
                  <Badge key={m} variant="outline" className="text-xs capitalize">{m}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Comma-separated. At least one required.</p>
            )}
          </div>

          <Separator />

          {/* Coaching */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Instructions <span className="text-xs text-muted-foreground font-normal">(one step per line)</span></Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder={'1. Set up bench with feet flat\n2. Grip bar slightly wider than shoulders\n3. Lower to chest with control'}
            />
          </div>
          <div className="space-y-2">
            <Label>Coaching Cues <span className="text-xs text-muted-foreground font-normal">(one per line)</span></Label>
            <Textarea
              value={cues}
              onChange={(e) => setCues(e.target.value)}
              rows={3}
              placeholder={'Drive through heels\nTuck elbows ~45°'}
            />
          </div>
          <div className="space-y-2">
            <Label>Substitutions <span className="text-xs text-muted-foreground font-normal">(comma-separated slugs)</span></Label>
            <Input
              value={substitutions}
              onChange={(e) => setSubstitutions(e.target.value)}
              placeholder="dumbbell-bench-press, push-up"
            />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? 'Saving…' : exercise ? 'Update Exercise' : 'Add Exercise'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseDialog;
