import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, HeartPulse, Moon, Footprints, Ruler } from 'lucide-react';
import SectionCard from '@/components/common/SectionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUpdateDailyVitals } from '@/hooks/use-api-queries';
import type { DailyVitals } from '@/lib/api/types';

interface Props {
  date: string;
  vitals?: DailyVitals;
}

type Field = {
  key: keyof Omit<DailyVitals, 'notes'>;
  label: string;
  unit?: string;
  step?: string;
};

const GROUPS: { title: string; icon: React.ReactNode; fields: Field[] }[] = [
  {
    title: 'Cardiovascular',
    icon: <HeartPulse className="h-4 w-4 text-primary" />,
    fields: [
      { key: 'restingHeartRate', label: 'Resting HR', unit: 'bpm' },
      { key: 'systolicMmHg', label: 'BP Systolic', unit: 'mmHg' },
      { key: 'diastolicMmHg', label: 'BP Diastolic', unit: 'mmHg' },
      { key: 'bloodOxygenPct', label: 'Blood Oxygen', unit: '%', step: '0.1' },
    ],
  },
  {
    title: 'Recovery',
    icon: <Moon className="h-4 w-4 text-primary" />,
    fields: [
      { key: 'sleepScore', label: 'Sleep Score', unit: '/100' },
      { key: 'sleepHours', label: 'Sleep', unit: 'hrs', step: '0.1' },
      { key: 'respiratoryRateBrpm', label: 'Respiratory Rate', unit: 'brpm', step: '0.1' },
      { key: 'bodyTempF', label: 'Body Temp', unit: '°F', step: '0.1' },
    ],
  },
  {
    title: 'Activity',
    icon: <Footprints className="h-4 w-4 text-primary" />,
    fields: [
      { key: 'stepsCount', label: 'Steps', unit: '' },
    ],
  },
  {
    title: 'Body',
    icon: <Ruler className="h-4 w-4 text-primary" />,
    fields: [
      { key: 'waistCircumferenceIn', label: 'Waist', unit: 'in', step: '0.1' },
    ],
  },
];

const ALL_FIELDS = GROUPS.flatMap(g => g.fields);

const DailyVitalsPanel: React.FC<Props> = ({ date, vitals }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const update = useUpdateDailyVitals();

  useEffect(() => {
    const next: Record<string, string> = {};
    ALL_FIELDS.forEach(f => {
      const v = vitals?.[f.key];
      next[f.key] = v === undefined || v === null ? '' : String(v);
    });
    setDraft(next);
  }, [vitals]);

  const loggedCount = ALL_FIELDS.filter(f => vitals?.[f.key] !== undefined && vitals?.[f.key] !== null).length;

  const commit = (key: string) => {
    const raw = draft[key];
    const num = raw === '' ? undefined : Number(raw);
    if (raw !== '' && Number.isNaN(num)) return;
    const current = vitals?.[key as keyof DailyVitals];
    if (current === num) return;
    update.mutate({ date, vitals: { [key]: num } as DailyVitals });
  };

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-primary" />
          Daily Vitals
          <span className="text-xs text-muted-foreground font-normal">
            {loggedCount}/{ALL_FIELDS.length} logged
          </span>
        </span>
      }
      actions={
        <Button variant="ghost" size="sm" onClick={() => setOpen(o => !o)}>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      }
      description={open ? undefined : 'Tap to log Apple Health–style daily readings (SpO2, BP, sleep, steps, …).'}
    >
      {open && (
        <div className="space-y-5">
          {GROUPS.map(group => (
            <div key={group.title} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                {group.icon}{group.title}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {group.fields.map(f => (
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
                      className="h-9 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
};

export default DailyVitalsPanel;
