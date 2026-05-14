import React, { useEffect, useState } from 'react';
import { Apple, Scale, Flame, HeartPulse } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SourceBadge from '@/components/health/SourceBadge';
import { useUpdateDailyVitals, useLogWeight } from '@/hooks/use-api-queries';
import type { DailyVitals, HealthSourceId } from '@/lib/api/types';

type NumericKey = Exclude<keyof DailyVitals, 'notes' | 'ecgRhythm'>;

interface NumField {
  kind: 'number';
  key: NumericKey;
  label: string;
  unit?: string;
  step?: string;
}

interface SelectField {
  kind: 'select';
  key: keyof DailyVitals;
  label: string;
  options: { value: string; label: string }[];
}

interface WeightField {
  kind: 'weight';
  label: string;
  unit: string;
}

type Field = NumField | SelectField | WeightField;

const APPLE_FIELDS: Field[] = [
  { kind: 'number', key: 'stepsCount', label: 'Steps' },
  { kind: 'number', key: 'bloodGlucoseMgDl', label: 'Blood Glucose', unit: 'mg/dL', step: '0.1' },
  { kind: 'number', key: 'bloodOxygenPct', label: 'Blood Oxygen', unit: '%', step: '0.1' },
  { kind: 'number', key: 'respiratoryRateBrpm', label: 'Respiratory Rate', unit: 'brpm', step: '0.1' },
  { kind: 'number', key: 'sleepScore', label: 'Sleep Score', unit: '/100' },
  { kind: 'number', key: 'sleepHours', label: 'Sleep', unit: 'hrs', step: '0.1' },
  { kind: 'number', key: 'restingHeartRate', label: 'Resting HR', unit: 'bpm' },
  { kind: 'number', key: 'waterIntakeOz', label: 'Water', unit: 'oz', step: '0.1' },
  {
    kind: 'select', key: 'ecgRhythm', label: 'ECG Rhythm',
    options: [
      { value: '', label: '—' },
      { value: 'normal', label: 'Normal sinus' },
      { value: 'afib', label: 'AFib' },
      { value: 'inconclusive', label: 'Inconclusive' },
    ],
  },
];

const WITHINGS_FIELDS: Field[] = [
  { kind: 'weight', label: 'Weight', unit: 'lbs' },
  { kind: 'number', key: 'withingsBodyFatPct', label: 'Body Fat (Scan)', unit: '%', step: '0.1' },
  { kind: 'number', key: 'systolicMmHg', label: 'BP Systolic', unit: 'mmHg' },
  { kind: 'number', key: 'diastolicMmHg', label: 'BP Diastolic', unit: 'mmHg' },
  { kind: 'number', key: 'bodyTempF', label: 'Body Temp (BeamO)', unit: '°F', step: '0.1' },
  { kind: 'number', key: 'waistCircumferenceIn', label: 'Waist', unit: 'in', step: '0.1' },
];

const LUMEN_LEVEL_OPTIONS = [
  { value: '', label: '—' },
  { value: '1', label: '1 — Fat burn' },
  { value: '2', label: '2' },
  { value: '3', label: '3 — Mixed' },
  { value: '4', label: '4' },
  { value: '5', label: '5 — Carb burn' },
];

const LUMEN_FIELDS: Field[] = [
  { kind: 'select', key: 'lumenMorningLevel', label: 'Morning Reading', options: LUMEN_LEVEL_OPTIONS },
  { kind: 'select', key: 'lumenPeakLevel', label: 'Peak / Latest', options: LUMEN_LEVEL_OPTIONS },
];

const SOURCE_TABS: { value: string; label: string; icon: React.ReactNode; source: HealthSourceId; fields: Field[]; hint: string }[] = [
  { value: 'apple', label: 'Apple Health', icon: <Apple className="h-3.5 w-3.5" />, source: 'apple_health', fields: APPLE_FIELDS, hint: 'Steps, glucose, SpO2, ECG, sleep, water.' },
  { value: 'withings', label: 'Withings', icon: <Scale className="h-3.5 w-3.5" />, source: 'withings_scale', fields: WITHINGS_FIELDS, hint: 'Scale (weight + BF%), BPM Vision, BeamO temp.' },
  { value: 'lumen', label: 'Lumen', icon: <Flame className="h-3.5 w-3.5" />, source: 'lumen', fields: LUMEN_FIELDS, hint: 'Metabolic flexibility (1 fat-burn → 5 carb-burn).' },
];

interface Props {
  date: string;
  vitals?: DailyVitals;
  bodyWeight?: number;
}

const DailySignalsTabs: React.FC<Props> = ({ date, vitals, bodyWeight }) => {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [weightDraft, setWeightDraft] = useState('');
  const update = useUpdateDailyVitals();
  const logWeight = useLogWeight();

  useEffect(() => {
    const next: Record<string, string> = {};
    [...APPLE_FIELDS, ...WITHINGS_FIELDS, ...LUMEN_FIELDS].forEach(f => {
      if (f.kind === 'weight') return;
      const v = vitals?.[f.key];
      next[f.key as string] = v === undefined || v === null ? '' : String(v);
    });
    setDraft(next);
    setWeightDraft(bodyWeight ? String(bodyWeight) : '');
  }, [vitals, bodyWeight]);

  const commitNum = (key: NumericKey) => {
    const raw = draft[key];
    const num = raw === '' ? undefined : Number(raw);
    if (raw !== '' && Number.isNaN(num)) return;
    if (vitals?.[key] === num) return;
    update.mutate({ date, vitals: { [key]: num } as DailyVitals });
  };

  const commitSelect = (key: keyof DailyVitals, raw: string) => {
    const value = raw === '' ? undefined : (key === 'lumenMorningLevel' || key === 'lumenPeakLevel' ? Number(raw) : raw);
    if (vitals?.[key] === value) return;
    update.mutate({ date, vitals: { [key]: value } as DailyVitals });
  };

  const commitWeight = () => {
    const w = parseFloat(weightDraft);
    if (!Number.isFinite(w) || w <= 0) return;
    if (bodyWeight === w) return;
    logWeight.mutate({ date, weight: w });
    update.mutate({ date, vitals: { withingsWeightLbs: w } as DailyVitals });
  };

  const renderField = (f: Field) => {
    if (f.kind === 'weight') {
      return (
        <div key="weight" className="space-y-1">
          <Label className="text-xs text-muted-foreground">{f.label} ({f.unit})</Label>
          <Input
            type="number"
            step="0.1"
            value={weightDraft}
            onChange={e => setWeightDraft(e.target.value)}
            onBlur={commitWeight}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            placeholder="—"
            className="h-9 text-sm tabular-nums"
          />
        </div>
      );
    }
    if (f.kind === 'select') {
      const current = draft[f.key as string] ?? '';
      return (
        <div key={f.key as string} className="space-y-1">
          <Label className="text-xs text-muted-foreground">{f.label}</Label>
          <Select value={current || '__none'} onValueChange={v => {
            const next = v === '__none' ? '' : v;
            setDraft(d => ({ ...d, [f.key as string]: next }));
            commitSelect(f.key, next);
          }}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {f.options.map(o => (
                <SelectItem key={o.value || '__none'} value={o.value || '__none'}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    return (
      <div key={f.key} className="space-y-1">
        <Label className="text-xs text-muted-foreground">
          {f.label}{f.unit ? ` (${f.unit})` : ''}
        </Label>
        <Input
          type="number"
          step={f.step ?? '1'}
          value={draft[f.key] ?? ''}
          onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}
          onBlur={() => commitNum(f.key)}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          placeholder="—"
          className="h-9 text-sm tabular-nums"
        />
      </div>
    );
  };

  return (
    <Tabs defaultValue="apple" className="w-full">
      <TabsList className="grid grid-cols-3 w-full sm:w-auto">
        {SOURCE_TABS.map(t => (
          <TabsTrigger key={t.value} value={t.value} className="text-xs gap-1.5">
            {t.icon}{t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {SOURCE_TABS.map(tab => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <SourceBadge source={tab.source} />
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                {tab.value === 'lumen' && <HeartPulse className="h-3 w-3" />}
                {tab.hint}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Manual entry</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tab.fields.map(renderField)}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default DailySignalsTabs;
