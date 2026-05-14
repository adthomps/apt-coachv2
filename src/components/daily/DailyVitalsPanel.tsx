import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HeartPulse } from 'lucide-react';
import SectionCard from '@/components/common/SectionCard';
import { Button } from '@/components/ui/button';
import DailySignalsTabs from './DailySignalsTabs';
import type { DailyVitals } from '@/lib/api/types';

interface Props {
  date: string;
  vitals?: DailyVitals;
}

const COUNT_KEYS: (keyof Omit<DailyVitals, 'notes'>)[] = [
  'stepsCount','bloodGlucoseMgDl','bloodOxygenPct','respiratoryRateBrpm','sleepScore','sleepHours',
  'restingHeartRate','waterIntakeOz','systolicMmHg','diastolicMmHg','bodyTempF','waistCircumferenceIn',
];

const DailyVitalsPanel: React.FC<Props> = ({ date, vitals }) => {
  const [open, setOpen] = useState(false);
  const loggedCount = COUNT_KEYS.filter(k => vitals?.[k] !== undefined && vitals?.[k] !== null).length;

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-primary" />
          Daily Signals
          <span className="text-xs text-muted-foreground font-normal">
            {loggedCount}/{COUNT_KEYS.length} logged
          </span>
        </span>
      }
      actions={
        <Button variant="ghost" size="sm" onClick={() => setOpen(o => !o)}>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      }
      description={open ? undefined : 'Apple Health, Withings, Lumen — daily readings grouped by source.'}
    >
      {open && <DailySignalsTabs date={date} vitals={vitals} />}
    </SectionCard>
  );
};

export default DailyVitalsPanel;
