/**
 * WithingsImportDialog — manual entry for a Withings smart-scale reading.
 *
 * Withings exposes weight, fat %, fat mass, lean (muscle) mass, and bone mass.
 * Stored as a Snapshot with provider="Withings" and empty regionalData so it
 * lives alongside DEXA scans but renders on its own Health tab.
 */

import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Scale } from 'lucide-react';
import { useCreateSnapshot } from '@/hooks/use-api-queries';
import { toast } from '@/hooks/use-toast';

interface WithingsImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const KG_TO_LBS = 2.20462;
const DEFAULT_BONE_LBS = 7.0;

const WithingsImportDialog: React.FC<WithingsImportDialogProps> = ({ open, onOpenChange }) => {
  const createMutation = useCreateSnapshot();

  const [scanDate, setScanDate] = useState(new Date().toISOString().split('T')[0]);
  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs');
  const [weight, setWeight] = useState('');
  const [bodyFatPct, setBodyFatPct] = useState('');
  const [leanMass, setLeanMass] = useState('');
  const [boneMass, setBoneMass] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setScanDate(new Date().toISOString().split('T')[0]);
    setUnit('lbs'); setWeight(''); setBodyFatPct(''); setLeanMass(''); setBoneMass(''); setNotes('');
    setError(null);
  };

  const handleSave = async () => {
    setError(null);
    const w = parseFloat(weight);
    const bf = parseFloat(bodyFatPct);
    if (!scanDate) { setError('Reading date is required.'); return; }
    if (!Number.isFinite(w) || w <= 0) { setError('Weight must be a positive number.'); return; }
    if (!Number.isFinite(bf) || bf < 1 || bf > 70) { setError('Body fat % must be between 1 and 70.'); return; }

    const factor = unit === 'kg' ? KG_TO_LBS : 1;
    const totalLbs = +(w * factor).toFixed(1);
    const fatLbs = +((totalLbs * bf) / 100).toFixed(1);
    const lean = leanMass ? +(parseFloat(leanMass) * factor).toFixed(1) : +(totalLbs - fatLbs - DEFAULT_BONE_LBS).toFixed(1);
    const bone = boneMass ? +(parseFloat(boneMass) * factor).toFixed(1) : DEFAULT_BONE_LBS;

    try {
      await createMutation.mutateAsync({
        scanDate,
        provider: 'Withings',
        bodyComposition: {
          totalMass: totalLbs,
          fatMass: fatLbs,
          leanMass: lean,
          boneMass: bone,
          bodyFatPercentage: bf,
        },
        regionalData: [],
        rawJson: JSON.stringify({ source: 'withings', unit, weight: w, bodyFatPct: bf, leanMass, boneMass }),
        notes: notes || undefined,
      });
      toast({ title: 'Withings reading saved', description: `${totalLbs} lbs · ${bf}% BF` });
      reset();
      onOpenChange(false);
    } catch {
      toast({ title: 'Could not save reading', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />Add Withings Reading
          </DialogTitle>
          <DialogDescription>
            Manual entry from your Withings smart scale. Weight + body fat % are required; lean and bone mass are optional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wi-date">Reading Date</Label>
              <Input id="wi-date" type="date" value={scanDate} onChange={(e) => setScanDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Units</Label>
              <div className="flex gap-2">
                {(['lbs', 'kg'] as const).map((u) => (
                  <Button
                    key={u}
                    type="button"
                    size="sm"
                    variant={unit === u ? 'default' : 'outline'}
                    onClick={() => setUnit(u)}
                    className="flex-1 uppercase"
                  >
                    {u}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wi-weight">Weight ({unit})</Label>
              <Input id="wi-weight" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={unit === 'lbs' ? '185.0' : '84.0'} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wi-bf">Body Fat %</Label>
              <Input id="wi-bf" type="number" step="0.1" value={bodyFatPct} onChange={(e) => setBodyFatPct(e.target.value)} placeholder="18.5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wi-lean">Lean Mass ({unit}) — optional</Label>
              <Input id="wi-lean" type="number" step="0.1" value={leanMass} onChange={(e) => setLeanMass(e.target.value)} placeholder="auto" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wi-bone">Bone Mass ({unit}) — optional</Label>
              <Input id="wi-bone" type="number" step="0.1" value={boneMass} onChange={(e) => setBoneMass(e.target.value)} placeholder="auto" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wi-notes">Notes</Label>
            <Textarea id="wi-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Morning, fasted, post-bathroom…" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" onClick={handleSave} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Saving…' : 'Save Reading'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WithingsImportDialog;
