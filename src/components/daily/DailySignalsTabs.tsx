import React, { useEffect, useState } from 'react';
import { Apple, Scale, Flame } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SourceBadge from '@/components/health/SourceBadge';
import { useUpdateDailyVitals } from '@/hooks/use-api-queries';
import type { DailyVitals, HealthSourceId } from '@/lib/api/types';

interface Field {
  key: keyof Omit<DailyVitals, 'notes'>;
  label: string;
  unit?: string;
  step?: string;
}

interface SourceGroup {
  id: HealthSourceId;
  fields: Field[];
}

const APPLE_FIELDS: Field[] = [
  { key: 'stepsCount', label: 'Steps' },
  { key: 'bloodGlucoseMgDl', label: 'Blood Glucose', unit: 'mg/dL', step: '0.1' },
  { key: 'bloodOxygenPct', label: 'Blood Oxygen', unit: '%', step: '0.1' },
  { key: 'respiratoryRateBrpm', label: 'Respiratory Rate', unit: 'brpm', step: '0.1' },
  { key: 'sleepScore', label: 'Sleep Score', unit: '/100' },
  { key: 'sleepHours', label: 'Sleep', unit: 'hrs', step: '0.1' },
  { key: 'restingHeartRate', label: 'Resting HR', unit: 'bpm' },
  { key: 'waterIntakeOz', label: 'Water', unit: 'oz', step: '0.1' },
];

const WITHINGS_FIELDS: Field[] = [
  { key: 'systolicMmHg', label: 'BP Systolic', unit: 'mmHg' },
  { key: 'diastolicMmHg', label: 'BP Diastolic', unit: 'mmHg' },
  { key: 'bodyTempF', label: 'Body Temp', unit: '°F', step: '0.1' },
  { key: 'waistCircumferenceIn', label: 'Waist', unit: 'in', step: '0.1' },
];

const SOURCE_TABS: { value: string; label: string; icon: React.ReactNode; source: HealthSourceId; fields: Field[]; hint: string }[] = [
  { value: 'apple', label: 'Apple Health', icon: <Apple className="h-3.5 w-3.5" />, source: 'apple_health', fields: APPLE_FIELDS, hint: 'Steps, glucose, SpO2, ECG, sleep, water.' },
  { value: 'withings', label: 'Withings', icon: <Scale className="h-3.5 w-3.5" />, source: 'withings_scale', fields: WITHINGS_FIELDS, hint: 'BP (BPM Vision), body temp (BeamO), waist.' },
];

interface Props {
  date: string;
  vitals?: DailyVitals;
}

const DailySignalsTabs: React.FC<Props> = ({ date, vitals }) => {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const update = useUpdateDailyVitals();

  useEffect(() => {
    const next: Record<string, string> = {};
    [...APPLE_FIELDS, ...WITHINGS_FIELDS].forEach(f => {
      const v = vitals?.[f.key];
      next[f.key] = v === undefined || v === null ? '' : String(v);
    });
    setDraft(next);
  }, [vitals]);

  const commit = (key: string) => {
    const raw = draft[key];
    const num = raw === '' ? undefined : Number(raw);
    if (raw !== '' && Number.isNaN(num)) return;
    const current = vitals?.[key as keyof DailyVitals];
    if (current === num) return;
    update.mutate({ date, vitals: { [key]: num } as DailyVitals });
  };

  return (
    <Tabs defaultValue="apple" className="w-full">
      <TabsList className="grid grid-cols-3 w-full sm:w-auto">
        {SOURCE_TABS.map(t => (
          <TabsTrigger key={t.value} value={t.value} className="text-xs gap-1.5">
            {t.icon}{t.label}
          </TabsTrigger>
        ))}
        <TabsTrigger value="lumen" className="text-xs gap-1.5">
          <Flame className="h-3.5 w-3.5" />Lumen
        </TabsTrigger>
      </TabsList>

      {SOURCE_TABS.map(tab => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <SourceBadge source={tab.source} />
              <span className="text-xs text-muted-foreground">{tab.hint}</span>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Manual entry</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tab.fields.map(f => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {f.label}{f.unit ? ` (${f.unit})` : ''}
                </Label>
                <Input
                  type="number"
                  step={f.step ?? '1'}
                  value={draft[f.key] ?? ''}
                  onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}
                  onBlur={() => commit(f.key)}
                  onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  placeholder="—"
                  className="h-9 text-sm tabular-nums"
                />
              </div>
            ))}
          </div>
        </TabsContent>
      ))}

      <TabsContent value="lumen" className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <SourceBadge source="lumen" />
          <span className="text-xs text-muted-foreground">Metabolic flexibility (1 fat-burn → 5 carb-burn).</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Lumen readings are imported from JSON in <span className="font-medium">Admin → Imports → Lumen</span>.
          Per-reading entry coming soon.
        </p>
      </TabsContent>
    </Tabs>
  );
};

export default DailySignalsTabs;
