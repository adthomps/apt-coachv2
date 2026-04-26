import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CreateWorkoutInput, Workout } from '@/lib/api/types';

interface WorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateWorkoutInput) => Promise<void>;
  workout?: Workout | null;
}

const WorkoutDialog: React.FC<WorkoutDialogProps> = ({ open, onOpenChange, onSubmit, workout }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [duration, setDuration] = useState(60);
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!workout;

  useEffect(() => {
    if (workout) {
      setName(workout.name);
      setDescription(workout.description || '');
      setDifficulty(workout.difficulty);
      setDuration(workout.estimatedDuration);
      setTags(workout.tags?.join(', ') || '');
    } else {
      setName(''); setDescription(''); setDifficulty('intermediate'); setDuration(60); setTags('');
    }
  }, [workout, open]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        difficulty,
        estimatedDuration: duration,
        blocks: workout?.blocks?.map(({ id: _id, ...rest }) => ({ ...rest, items: rest.items.map(({ id: _iid, ...item }) => item) })) as CreateWorkoutInput['blocks'] || [],
        tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      });
      onOpenChange(false);
      if (!isEditing) {
        setName(''); setDescription(''); setDifficulty('intermediate'); setDuration(60); setTags('');
      }
    } finally { setIsSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader><DialogTitle>{isEditing ? 'Edit Workout' : 'Create Workout'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2"><Label>Workout Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Upper Body Push" /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={v => setDifficulty(v as typeof difficulty)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Duration (min)</Label><Input type="number" min={10} max={180} value={duration} onChange={e => setDuration(parseInt(e.target.value) || 60)} /></div>
          </div>
          <div className="space-y-2"><Label>Tags (comma separated)</Label><Input value={tags} onChange={e => setTags(e.target.value)} placeholder="push, upper, strength" /></div>
          <Button className="w-full" onClick={handleSubmit} disabled={!name.trim() || isSubmitting}>
            {isSubmitting ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Workout')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkoutDialog;
