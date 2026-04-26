import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { snapshotImportSchema } from '@/lib/validations';
import { useCreateSnapshot, useAnalyzeSnapshot } from '@/hooks/use-api-queries';
import { toast } from '@/hooks/use-toast';
import { Upload, FileText } from 'lucide-react';

interface SnapshotImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const KG_TO_LBS = 2.20462;

const SnapshotImportDialog: React.FC<SnapshotImportDialogProps> = ({ open, onOpenChange }) => {
  const createMutation = useCreateSnapshot();
  const analyzeMutation = useAnalyzeSnapshot();

  // Form mode
  const [scanDate, setScanDate] = useState('');
  const [provider, setProvider] = useState('BodySpec');
  const [totalMass, setTotalMass] = useState('');
  const [fatMass, setFatMass] = useState('');
  const [leanMass, setLeanMass] = useState('');
  const [boneMass, setBoneMass] = useState('');
  const [bodyFatPct, setBodyFatPct] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // JSON mode
  const [jsonData, setJsonData] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const resetForm = () => {
    setScanDate(''); setProvider('BodySpec'); setTotalMass(''); setFatMass('');
    setLeanMass(''); setBoneMass(''); setBodyFatPct('');
    setFormError(null); setJsonData(''); setJsonError(null);
  };

  const handleFormSubmit = async () => {
    setFormError(null);
    const input = {
      scanDate, provider,
      totalMass: parseFloat(totalMass),
      fatMass: parseFloat(fatMass),
      leanMass: parseFloat(leanMass),
      boneMass: parseFloat(boneMass),
      bodyFatPct: parseFloat(bodyFatPct),
    };
    const result = snapshotImportSchema.safeParse(input);
    if (!result.success) {
      setFormError(result.error.errors[0]?.message || 'Validation failed');
      return;
    }
    await saveSnapshot(result.data as { scanDate: string; provider?: string; totalMass: number; fatMass: number; leanMass: number; boneMass: number; bodyFatPct: number });
  };

  const handleJsonSubmit = async () => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonData);
      const date = parsed.scan_date || parsed.scanDate || new Date().toISOString().split('T')[0];
      const prov = parsed.source || parsed.provider || 'BodySpec';
      const bc = parsed.body_composition || parsed;

      let tm = bc.total_mass_lbs || bc.totalMass;
      let fm = bc.fat_mass_lbs || bc.fatMass;
      let lm = bc.lean_mass_lbs || bc.leanMass;
      let bm = bc.bone_mass_lbs || bc.boneMass;

      if (!tm && (bc.total_mass_kg || bc.weight)) {
        tm = (bc.total_mass_kg || bc.weight) * KG_TO_LBS;
        fm = (bc.fat_mass_kg) * KG_TO_LBS;
        lm = (bc.lean_mass_kg) * KG_TO_LBS;
        bm = (bc.bone_mass_kg || 3.0) * KG_TO_LBS;
      }

      const input = {
        scanDate: date, provider: prov,
        totalMass: Number((tm || 0).toFixed(1)),
        fatMass: Number((fm || 0).toFixed(1)),
        leanMass: Number((lm || 0).toFixed(1)),
        boneMass: Number((bm || 0).toFixed(1)),
        bodyFatPct: bc.body_fat_pct || bc.bodyFatPercentage,
      };
      const result = snapshotImportSchema.safeParse(input);
      if (!result.success) {
        setJsonError(result.error.errors[0]?.message || 'Validation failed');
        return;
      }
      await saveSnapshot(result.data as { scanDate: string; provider?: string; totalMass: number; fatMass: number; leanMass: number; boneMass: number; bodyFatPct: number }, jsonData);
    } catch {
      setJsonError('Invalid JSON format.');
    }
  };

  const saveSnapshot = async (data: { scanDate: string; provider?: string; totalMass: number; fatMass: number; leanMass: number; boneMass: number; bodyFatPct: number }, rawJson?: string) => {
    try {
      const saved = await createMutation.mutateAsync({
        scanDate: data.scanDate,
        provider: data.provider,
        bodyComposition: {
          totalMass: data.totalMass,
          fatMass: data.fatMass,
          leanMass: data.leanMass,
          boneMass: data.boneMass,
          bodyFatPercentage: data.bodyFatPct,
        },
        regionalData: [],
        rawJson: rawJson || JSON.stringify(data),
      });
      try {
        const recs = await analyzeMutation.mutateAsync(saved.id);
        toast({ title: 'Snapshot saved', description: `${recs.length} insight${recs.length !== 1 ? 's' : ''} generated.` });
      } catch {
        toast({ title: 'Snapshot saved', description: 'Body composition data imported.' });
      }
      resetForm();
      onOpenChange(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to save snapshot.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Import Snapshot</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="form">
          <TabsList className="w-full">
            <TabsTrigger value="form" className="flex-1"><FileText className="mr-1.5 h-3.5 w-3.5" />Manual Entry</TabsTrigger>
            <TabsTrigger value="json" className="flex-1"><Upload className="mr-1.5 h-3.5 w-3.5" />Paste JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scan Date</Label>
                <Input type="date" value={scanDate} onChange={e => setScanDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Input value={provider} onChange={e => setProvider(e.target.value)} placeholder="BodySpec" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Mass (lbs)</Label>
                <Input type="number" step="0.1" value={totalMass} onChange={e => setTotalMass(e.target.value)} placeholder="185.0" />
              </div>
              <div className="space-y-2">
                <Label>Body Fat %</Label>
                <Input type="number" step="0.1" value={bodyFatPct} onChange={e => setBodyFatPct(e.target.value)} placeholder="15.0" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Fat Mass (lbs)</Label>
                <Input type="number" step="0.1" value={fatMass} onChange={e => setFatMass(e.target.value)} placeholder="27.0" />
              </div>
              <div className="space-y-2">
                <Label>Lean Mass (lbs)</Label>
                <Input type="number" step="0.1" value={leanMass} onChange={e => setLeanMass(e.target.value)} placeholder="150.0" />
              </div>
              <div className="space-y-2">
                <Label>Bone Mass (lbs)</Label>
                <Input type="number" step="0.1" value={boneMass} onChange={e => setBoneMass(e.target.value)} placeholder="7.0" />
              </div>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <Button className="w-full" onClick={handleFormSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save Snapshot'}
            </Button>
          </TabsContent>

          <TabsContent value="json" className="space-y-4 pt-4">
            <Textarea
              placeholder='{"source": "bodyspec", "scan_date": "2024-01-15", "total_mass_lbs": 181.9, ...}'
              value={jsonData}
              onChange={e => { setJsonData(e.target.value); setJsonError(null); }}
              rows={8}
              className="font-mono text-sm"
            />
            {jsonError && <p className="text-sm text-destructive">{jsonError}</p>}
            <Button className="w-full" onClick={handleJsonSubmit} disabled={!jsonData.trim() || createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Validate & Save'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SnapshotImportDialog;
