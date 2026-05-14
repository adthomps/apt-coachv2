import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HeartPulse } from 'lucide-react';
import SectionCard from '@/components/common/SectionCard';
import { Button } from '@/components/ui/button';
import DailySignalsTabs from './DailySignalsTabs';
import type { DailyVitals } from '@/lib/api/types';

interface Props {
  date: string;
  vitals?: DailyVitals;
  bodyWeight?: number;
}

const COUNT_KEYS: (keyof Omit<DailyVitals, 'notes'>)[] = [
  'stepsCount','bloodGlucoseMgDl','bloodOxygenPct','respiratoryRateBrpm','sleepScore','sleepHours',
  'restingHeartRate','waterIntakeOz','ecgRhythm','systolicMmHg','diastolicMmHg','bodyTempF',
  'waistCircumferenceIn','withingsBodyFatPct','withingsWeightLbs','lumenMorningLevel','lumenPeakLevel',
];

const DailyVitalsPanel: React.FC<Props> = ({ date, vitals, bodyWeight }) => {
  const [open, setOpen] = useState(true);
  const loggedCount = COUNT_KEYS.filter(k => vitals?.[k] !== undefined && vitals?.[k] !== null).length;
  const totalCount = COUNT_KEYS.length;

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-primary" />
          Daily Signals
          <span className="text-xs text-muted-foreground font-normal tabular-nums">
            {loggedCount}/{totalCount} logged
          </span>
        </span>
      }
      actions={
        <Button variant="ghost" size="sm" onClick={() => setOpen(o => !o)}>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      }
      description={open ? 'Apple Health, Withings, Lumen — daily readings grouped by source. Manual until device sync ships.' : undefined}
    >
      {open && <DailySignalsTabs date={date} vitals={vitals} bodyWeight={bodyWeight} />}
    </SectionCard>
  );
};

export default DailyVitalsPanel;
