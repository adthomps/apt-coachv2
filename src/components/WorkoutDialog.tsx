import React, { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useExercises } from '@/hooks/use-api-queries';
import type { CreateWorkoutInput, Workout, BlockType } from '@/lib/api/types';
import { BLOCK_TYPE_LABELS } from '@/lib/api/types';

interface WorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateWorkoutInput) => Promise<void>;
  workout?: Workout | null;
}

type EditableItem = {
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  rpeTarget?: number;
  notes?: string;
  order: number;
};

type EditableBlock = {
  name: string;
  type: BlockType;
  rounds?: number;
  notes?: string;
  order: number;
  items: EditableItem[];
  collapsed?: boolean;
};

const newItem = (order: number): EditableItem => ({
  exerciseId: '',
  sets: 3,
  repsMin: 8,
  repsMax: 12,
  restSeconds: 90,
  order,
});

const newBlock = (order: number): EditableBlock => ({
  name: `Block ${order + 1}`,
  type: 'straight_sets',
  order,
  items: [newItem(0)],
});

const WorkoutDialog: React.FC<WorkoutDialogProps> = ({ open, onOpenChange, onSubmit, workout }) => {
  const { data: exercises = [] } = useExercises();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [duration, setDuration] = useState(60);
  const [tags, setTags] = useState('');
  const [blocks, setBlocks] = useState<EditableBlock[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!workout;

  useEffect(() => {
    if (!open) return;
    if (workout) {
      setName(workout.name);
      setDescription(workout.description || '');
      setDifficulty(workout.difficulty);
      setDuration(workout.estimatedDuration);
      setTags(workout.tags?.join(', ') || '');
      setBlocks(
        (workout.blocks || []).map((b) => ({
          name: b.name,
          type: b.type,
          rounds: b.rounds,
          notes: b.notes,
          order: b.order,
          items: b.items.map((it) => ({
            exerciseId: it.exerciseId,
            sets: it.sets,
            repsMin: it.repsMin,
            repsMax: it.repsMax,
            restSeconds: it.restSeconds,
            rpeTarget: it.rpeTarget,
            notes: it.notes,
            order: it.order,
          })),
        })),
      );
    } else {
      setName('');
      setDescription('');
      setDifficulty('intermediate');
      setDuration(60);
      setTags('');
      setBlocks([newBlock(0)]);
    }
  }, [workout, open]);

  const updateBlock = (idx: number, patch: Partial<EditableBlock>) => {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  };

  const addBlock = () => setBlocks((prev) => [...prev, newBlock(prev.length)]);

  const removeBlock = (idx: number) =>
    setBlocks((prev) => prev.filter((_, i) => i !== idx).map((b, i) => ({ ...b, order: i })));

  const moveBlock = (idx: number, dir: -1 | 1) => {
    setBlocks((prev) => {
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((b, i) => ({ ...b, order: i }));
    });
  };

  const updateItem = (bIdx: number, iIdx: number, patch: Partial<EditableItem>) => {
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === bIdx ? { ...b, items: b.items.map((it, j) => (j === iIdx ? { ...it, ...patch } : it)) } : b,
      ),
    );
  };

  const addItem = (bIdx: number) =>
    setBlocks((prev) =>
      prev.map((b, i) => (i === bIdx ? { ...b, items: [...b.items, newItem(b.items.length)] } : b)),
    );

  const removeItem = (bIdx: number, iIdx: number) =>
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === bIdx
          ? { ...b, items: b.items.filter((_, j) => j !== iIdx).map((it, j) => ({ ...it, order: j })) }
          : b,
      ),
    );

  const totalExercises = blocks.reduce((s, b) => s + b.items.filter((i) => i.exerciseId).length, 0);
  const hasInvalidItem = blocks.some((b) => b.items.some((i) => !i.exerciseId));

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        difficulty,
        estimatedDuration: duration,
        blocks: blocks.map((b, bi) => ({
          name: b.name.trim() || `Block ${bi + 1}`,
          type: b.type,
          rounds: b.rounds,
          notes: b.notes?.trim() || undefined,
          order: bi,
          items: b.items
            .filter((it) => it.exerciseId)
            .map((it, ii) => ({
              exerciseId: it.exerciseId,
              sets: it.sets,
              repsMin: it.repsMin,
              repsMax: it.repsMax,
              restSeconds: it.restSeconds,
              rpeTarget: it.rpeTarget,
              notes: it.notes?.trim() || undefined,
              order: ii,
            })),
        })) as CreateWorkoutInput['blocks'],
        tags: tags.trim() ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Workout' : 'Create Workout'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Basics */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Workout Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Upper Body Push" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  min={10}
                  max={180}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="push, upper" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Blocks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Blocks</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'} · {totalExercises} exercises
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addBlock}>
                <Plus className="mr-1.5 h-4 w-4" /> Add Block
              </Button>
            </div>

            {blocks.length === 0 && (
              <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                No blocks yet. Add a block to start building this workout.
              </div>
            )}

            {blocks.map((block, bIdx) => (
              <div key={bIdx} className="border border-border rounded-lg overflow-hidden bg-card">
                {/* Block header */}
                <div className="p-3 bg-muted/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      value={block.name}
                      onChange={(e) => updateBlock(bIdx, { name: e.target.value })}
                      className="h-8 flex-1 font-medium"
                      placeholder="Block name"
                    />
                    <Select
                      value={block.type}
                      onValueChange={(v) => updateBlock(bIdx, { type: v as BlockType })}
                    >
                      <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(BLOCK_TYPE_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => moveBlock(bIdx, -1)}
                      disabled={bIdx === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => moveBlock(bIdx, 1)}
                      disabled={bIdx === blocks.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => removeBlock(bIdx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {block.items.length} {block.items.length === 1 ? 'exercise' : 'exercises'}
                  </Badge>
                </div>

                {/* Items */}
                <div className="p-3 space-y-2">
                  {block.items.map((item, iIdx) => (
                    <div key={iIdx} className="grid grid-cols-12 gap-2 items-end p-2 rounded bg-muted/20">
                      <div className="col-span-12 md:col-span-4 space-y-1">
                        <Label className="text-xs text-muted-foreground">Exercise</Label>
                        <Select
                          value={item.exerciseId}
                          onValueChange={(v) => updateItem(bIdx, iIdx, { exerciseId: v })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select…" />
                          </SelectTrigger>
                          <SelectContent>
                            {exercises.map((ex) => (
                              <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 md:col-span-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">Sets</Label>
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          className="h-9"
                          value={item.sets}
                          onChange={(e) => updateItem(bIdx, iIdx, { sets: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="col-span-3 md:col-span-2 space-y-1">
                        <Label className="text-xs text-muted-foreground">Reps</Label>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            className="h-9"
                            value={item.repsMin}
                            onChange={(e) => updateItem(bIdx, iIdx, { repsMin: parseInt(e.target.value) || 1 })}
                          />
                          <span className="text-muted-foreground text-xs">–</span>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            className="h-9"
                            value={item.repsMax}
                            onChange={(e) => updateItem(bIdx, iIdx, { repsMax: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                      </div>
                      <div className="col-span-3 md:col-span-2 space-y-1">
                        <Label className="text-xs text-muted-foreground">Rest (s)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={600}
                          step={15}
                          className="h-9"
                          value={item.restSeconds}
                          onChange={(e) => updateItem(bIdx, iIdx, { restSeconds: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="col-span-3 md:col-span-2 space-y-1">
                        <Label className="text-xs text-muted-foreground">RPE</Label>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          step={0.5}
                          className="h-9"
                          value={item.rpeTarget ?? ''}
                          placeholder="–"
                          onChange={(e) =>
                            updateItem(bIdx, iIdx, {
                              rpeTarget: e.target.value ? parseFloat(e.target.value) : undefined,
                            })
                          }
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive hover:text-destructive"
                          onClick={() => removeItem(bIdx, iIdx)}
                          disabled={block.items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => addItem(bIdx)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Exercise
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {hasInvalidItem && (
            <p className="text-xs text-muted-foreground">
              Tip: rows without an exercise selected will be discarded on save.
            </p>
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting
              ? isEditing ? 'Saving…' : 'Creating…'
              : isEditing ? 'Save Changes' : 'Create Workout'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkoutDialog;
