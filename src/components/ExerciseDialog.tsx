import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Exercise, CreateExerciseInput, MovementPattern } from '@/lib/api/types';
import { MOVEMENT_PATTERN_LABELS } from '@/lib/api/types';

interface ExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise?: Exercise | null;
  onSubmit: (input: CreateExerciseInput) => Promise<void>;
}

const ExerciseDialog: React.FC<ExerciseDialogProps> = ({ open, onOpenChange, exercise, onSubmit }) => {
  const [name, setName] = useState('');
  const [movementPattern, setMovementPattern] = useState<MovementPattern>('horizontal_push');
  const [muscleGroups, setMuscleGroups] = useState('');
  const [equipment, setEquipment] = useState('');
  const [difficulty, setDifficulty] = useState<Exercise['difficulty']>('beginner');
  const [description, setDescription] = useState('');
  const [cues, setCues] = useState('');
  const [substitutions, setSubstitutions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (exercise) {
      setName(exercise.name);
      setMovementPattern(exercise.movementPattern);
      setMuscleGroups(exercise.muscleGroups.join(', '));
      setEquipment(exercise.equipment.join(', '));
      setDifficulty(exercise.difficulty);
      setDescription(exercise.description || '');
      setCues(exercise.cues?.join('\n') || '');
      setSubstitutions(exercise.substitutions?.join(', ') || '');
    } else {
      setName(''); setMovementPattern('horizontal_push'); setMuscleGroups(''); setEquipment('');
      setDifficulty('beginner'); setDescription(''); setCues(''); setSubstitutions('');
    }
  }, [exercise, open]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        movementPattern,
        muscleGroups: muscleGroups.split(',').map(s => s.trim()).filter(Boolean),
        equipment: equipment.split(',').map(s => s.trim()).filter(Boolean),
        difficulty,
        description: description.trim() || undefined,
        cues: cues.trim() ? cues.split('\n').map(s => s.trim()).filter(Boolean) : undefined,
        substitutions: substitutions.trim() ? substitutions.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      });
      onOpenChange(false);
    } finally { setIsSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{exercise ? 'Edit Exercise' : 'Add Exercise'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Barbell Bench Press" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Movement Pattern</Label>
              <Select value={movementPattern} onValueChange={v => setMovementPattern(v as MovementPattern)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(MOVEMENT_PATTERN_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={v => setDifficulty(v as Exercise['difficulty'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2"><Label>Muscle Groups (comma separated)</Label><Input value={muscleGroups} onChange={e => setMuscleGroups(e.target.value)} placeholder="chest, shoulders, triceps" /></div>
          <div className="space-y-2"><Label>Equipment (comma separated)</Label><Input value={equipment} onChange={e => setEquipment(e.target.value)} placeholder="barbell, bench" /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
          <div className="space-y-2"><Label>Coaching Cues (one per line)</Label><Textarea value={cues} onChange={e => setCues(e.target.value)} rows={3} /></div>
          <div className="space-y-2"><Label>Substitutions (comma-separated slugs)</Label><Input value={substitutions} onChange={e => setSubstitutions(e.target.value)} /></div>
          <Button className="w-full" onClick={handleSubmit} disabled={!name.trim() || isSubmitting}>{isSubmitting ? 'Saving...' : exercise ? 'Update Exercise' : 'Add Exercise'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseDialog;
