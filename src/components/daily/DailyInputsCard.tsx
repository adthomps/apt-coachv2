import React, { useState } from 'react';
import { Check, Clock, Scale, Activity, HeartPulse, Footprints, Thermometer, Moon, Droplets, Flame, Wind, Edit2, Waves } from 'lucide-react';
import SectionCard from '@/components/common/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import DailySignalsTabs from './DailySignalsTabs';
import { useUpdateDailyVitals, useLogWeight } from '@/hooks/use-api-queries';
import type { DailyVitals } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface Props {
  date: string;
  vitals?: DailyVitals;
  bodyWeight?: number;
}

type FieldKind = 'number' | 'bp' | 'select' | 'weight';

interface FieldDef {
  id: string;
  kind: FieldKind;
  label: string;
  short: string;
  source: string;
  icon: React.ReactNode;
  unit?: string;
  step?: string;
  vitalKey?: keyof DailyVitals;
  selectOptions?: { value: string; label: string }[];
  /** For number → format display value */
  format?: (v: number) => string;
  /** Headline = bigger KPI tile */
  headline?: boolean;
}

const FIELDS: FieldDef[] = [
  { id: 'weight', kind: 'weight', label: 'Weight', short: 'Weight', source: 'Withings Scale', icon: <Scale className="h-3.5 w-3.5" />, unit: 'lbs', step: '0.1', headline: true,
    format: v => `${v.toFixed(1)} lbs` },
  { id: 'withingsBodyFatPct', kind: 'number', vitalKey: 'withingsBodyFatPct', label: 'Body scan', short: 'Body scan', source: 'Withings Scale', icon: <Activity className="h-3.5 w-3.5" />, unit: '%', step: '0.1', headline: true,
    format: v => `${v.toFixed(1)}%` },
  { id: 'bp', kind: 'bp', label: 'Blood pressure', short: 'BP', source: 'Withings BPM Vision', icon: <HeartPulse className="h-3.5 w-3.5" />, headline: true,
    format: () => '' },
  { id: 'stepsCount', kind: 'number', vitalKey: 'stepsCount', label: 'Steps', short: 'Steps', source: 'Apple Health', icon: <Footprints className="h-3.5 w-3.5" />, headline: true,
    format: v => v.toLocaleString() },
  { id: 'bodyTempF', kind: 'number', vitalKey: 'bodyTempF', label: 'Temperature', short: 'Temp', source: 'Withings BeamO', icon: <Thermometer className="h-3.5 w-3.5" />, unit: '°F', step: '0.1',
    format: v => `${v.toFixed(1)}°F` },
  { id: 'lumenMorningLevel', kind: 'select', vitalKey: 'lumenMorningLevel', label: 'Lumen score', short: 'Lumen', source: 'Lumen', icon: <Flame className="h-3.5 w-3.5" />,
    selectOptions: [1,2,3,4,5].map(n => ({ value: String(n), label: `${n} ${n===1?'(fat)':n===5?'(carb)':''}` })),
    format: v => `Lvl ${v}` },
  { id: 'sleepScore', kind: 'number', vitalKey: 'sleepScore', label: 'Sleep score', short: 'Sleep', source: 'Apple Health', icon: <Moon className="h-3.5 w-3.5" />, unit: '/100',
    format: v => `${v}/100` },
  { id: 'waterIntakeOz', kind: 'number', vitalKey: 'waterIntakeOz', label: 'Water intake', short: 'Water', source: 'Apple Health', icon: <Droplets className="h-3.5 w-3.5" />, unit: 'oz', step: '0.1',
    format: v => `${v.toFixed(0)} oz` },
  { id: 'bloodGlucoseMgDl', kind: 'number', vitalKey: 'bloodGlucoseMgDl', label: 'Blood glucose', short: 'Glucose', source: 'Apple Health', icon: <Droplets className="h-3.5 w-3.5" />, unit: 'mg/dL', step: '0.1',
    format: v => `${v.toFixed(0)} mg/dL` },
  { id: 'bloodOxygenPct', kind: 'number', vitalKey: 'bloodOxygenPct', label: 'Blood oxygen', short: 'SpO₂', source: 'Apple Health', icon: <Wind className="h-3.5 w-3.5" />, unit: '%', step: '0.1',
    format: v => `${v.toFixed(0)}%` },
  { id: 'ecgRhythm', kind: 'select', vitalKey: 'ecgRhythm', label: 'ECG rhythm', short: 'ECG', source: 'Apple Health', icon: <Waves className="h-3.5 w-3.5" />,
    selectOptions: [
      { value: 'normal', label: 'Normal sinus' },
      { value: 'afib', label: 'AFib' },
      { value: 'inconclusive', label: 'Inconclusive' },
    ],
    format: v => String(v) },
  { id: 'respiratoryRateBrpm', kind: 'number', vitalKey: 'respiratoryRateBrpm', label: 'Respiratory rate', short: 'Resp', source: 'Apple Health', icon: <Wind className="h-3.5 w-3.5" />, unit: 'brpm', step: '0.1',
    format: v => `${v.toFixed(0)} brpm` },
  { id: 'restingHeartRate', kind: 'number', vitalKey: 'restingHeartRate', label: 'Resting HR', short: 'RHR', source: 'Apple Health', icon: <HeartPulse className="h-3.5 w-3.5" />, unit: 'bpm',
    format: v => `${v} bpm` },
];

function valueOf(f: FieldDef, vitals?: DailyVitals, weight?: number): number | string | undefined {
  if (f.id === 'bp') {
    const s = vitals?.systolicMmHg, d = vitals?.diastolicMmHg;
    if (s == null || d == null) return undefined;
    return `${s}/${d}`;
  }
  if (f.kind === 'weight') return weight ?? vitals?.withingsWeightLbs;
  return f.vitalKey ? (vitals?.[f.vitalKey] as number | string | undefined) : undefined;
}

interface ChipEditorProps {
  field: FieldDef;
  date: string;
  vitals?: DailyVitals;
  bodyWeight?: number;
  onClose: () => void;
}

const ChipEditor: React.FC<ChipEditorProps> = ({ field, date, vitals, bodyWeight, onClose }) => {
  const update = useUpdateDailyVitals();
  const logWeight = useLogWeight();

  const [num, setNum] = useState(() => {
    const v = valueOf(field, vitals, bodyWeight);
    return typeof v === 'number' ? String(v) : '';
  });
  const [systolic, setSystolic] = useState(() => vitals?.systolicMmHg?.toString() ?? '');
  const [diastolic, setDiastolic] = useState(() => vitals?.diastolicMmHg?.toString() ?? '');
  const [sel, setSel] = useState<string>(() => {
    const v = field.vitalKey ? vitals?.[field.vitalKey] : undefined;
    return v != null ? String(v) : '';
  });

  const save = () => {
    if (field.kind === 'weight') {
      const w = parseFloat(num);
      if (Number.isFinite(w) && w > 0) {
        logWeight.mutate({ date, weight: w });
        update.mutate({ date, vitals: { withingsWeightLbs: w } as DailyVitals });
      }
    } else if (field.kind === 'bp') {
      const s = parseInt(systolic, 10), d = parseInt(diastolic, 10);
      if (Number.isFinite(s) && Number.isFinite(d)) {
        update.mutate({ date, vitals: { systolicMmHg: s, diastolicMmHg: d } as DailyVitals });
      }
    } else if (field.kind === 'select' && field.vitalKey) {
      const isNumeric = field.selectOptions?.every(o => /^\d+$/.test(o.value)) ?? true;
      const v = sel === '' ? undefined : (isNumeric ? Number(sel) : sel);
      update.mutate({ date, vitals: { [field.vitalKey]: v } as DailyVitals });
    } else if (field.kind === 'number' && field.vitalKey) {
      const v = num === '' ? undefined : Number(num);
      if (num !== '' && Number.isNaN(v as number)) return;
      update.mutate({ date, vitals: { [field.vitalKey]: v } as DailyVitals });
    }
    onClose();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-foreground">
        {field.icon} {field.label}
        <span className="ml-auto text-[10px] text-muted-foreground uppercase tracking-wide">{field.source}</span>
      </div>
      {field.kind === 'bp' ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] text-muted-foreground">Systolic</Label>
            <Input type="number" value={systolic} onChange={e => setSystolic(e.target.value)} placeholder="120" autoFocus className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Diastolic</Label>
            <Input type="number" value={diastolic} onChange={e => setDiastolic(e.target.value)} placeholder="80" className="h-8 text-sm" />
          </div>
        </div>
      ) : field.kind === 'select' ? (
        <Select value={sel || '__none'} onValueChange={v => setSel(v === '__none' ? '' : v)}>
          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">—</SelectItem>
            {field.selectOptions!.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type="number"
          step={field.step ?? '1'}
          value={num}
          onChange={e => setNum(e.target.value)}
          autoFocus
          placeholder={field.unit ? `0 ${field.unit}` : '0'}
          className="h-8 text-sm tabular-nums"
        />
      )}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={save}>Save</Button>
      </div>
    </div>
  );
};

const StatusChip: React.FC<{
  field: FieldDef; date: string; vitals?: DailyVitals; bodyWeight?: number;
}> = ({ field, date, vitals, bodyWeight }) => {
  const [open, setOpen] = useState(false);
  const value = valueOf(field, vitals, bodyWeight);
  const logged = value != null && value !== '';
  const display = logged
    ? (typeof value === 'number' ? field.format!(value) : value)
    : 'pending';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
            logged
              ? 'border-success/40 bg-success/10 text-success hover:bg-success/15'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/15',
          )}
        >
          {logged ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
          <span>{field.short}</span>
          <span className="text-muted-foreground">·</span>
          <span className="tabular-nums">{display}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <ChipEditor field={field} date={date} vitals={vitals} bodyWeight={bodyWeight} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};

const HeadlineTile: React.FC<{
  field: FieldDef; date: string; vitals?: DailyVitals; bodyWeight?: number;
}> = ({ field, date, vitals, bodyWeight }) => {
  const [open, setOpen] = useState(false);
  const value = valueOf(field, vitals, bodyWeight);
  const logged = value != null && value !== '';
  const display = logged
    ? (typeof value === 'number' ? field.format!(value) : value)
    : '—';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-left rounded-md border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-colors p-3 group"
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{field.short}</span>
            <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className={cn('text-xl font-bold tabular-nums', logged ? 'text-foreground' : 'text-muted-foreground/60')}>
            {display}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{field.source}</div>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <ChipEditor field={field} date={date} vitals={vitals} bodyWeight={bodyWeight} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};

const DailyInputsCard: React.FC<Props> = ({ date, vitals, bodyWeight }) => {
  const headline = FIELDS.filter(f => f.headline);
  const chips = FIELDS;

  return (
    <SectionCard
      title={
        <span className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">
          Daily Inputs
        </span>
      }
      actions={
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit all
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Daily inputs · {date}</DialogTitle>
              <DialogDescription>Edit all signals across Apple Health, Withings, and Lumen.</DialogDescription>
            </DialogHeader>
            <div className="mt-2">
              <DailySignalsTabs date={date} vitals={vitals} bodyWeight={bodyWeight} />
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {chips.map(f => (
            <StatusChip key={f.id} field={f} date={date} vitals={vitals} bodyWeight={bodyWeight} />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/40">
          {headline.map(f => (
            <HeadlineTile key={f.id} field={f} date={date} vitals={vitals} bodyWeight={bodyWeight} />
          ))}
        </div>
      </div>
    </SectionCard>
  );
};

export const DAILY_INPUT_TOTAL = FIELDS.length;
export function countLoggedInputs(vitals?: DailyVitals, bodyWeight?: number) {
  return FIELDS.filter(f => {
    const v = valueOf(f, vitals, bodyWeight);
    return v != null && v !== '';
  }).length;
}

export default DailyInputsCard;
