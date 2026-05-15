import React from 'react';
import { Activity, Droplets, Heart, Scale, Pencil, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';

export type HealthSourceTab = 'dexa' | 'rythm' | 'apple' | 'withings' | 'skulpt' | 'lumen';
export type WithingsSegment = 'scale' | 'bpm' | 'beamo';

const TABS: { id: HealthSourceTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dexa',     label: 'DEXA',           icon: Activity },
  { id: 'rythm',    label: 'Rythm Health',   icon: Droplets },
  { id: 'apple',    label: 'Apple / MyChart',icon: Heart },
  { id: 'withings', label: 'Withings',       icon: Scale },
  { id: 'skulpt',   label: 'Skulpt Chisel',  icon: Pencil },
  { id: 'lumen',    label: 'Lumen',          icon: Wind },
];

const WITHINGS_SEGMENTS: { id: WithingsSegment; label: string }[] = [
  { id: 'scale', label: 'Scale / Body Scan' },
  { id: 'bpm',   label: 'BPM Vision' },
  { id: 'beamo', label: 'BeamO' },
];

interface Props {
  active: HealthSourceTab;
  onChange: (tab: HealthSourceTab) => void;
  withingsSegment?: WithingsSegment;
  onWithingsSegmentChange?: (seg: WithingsSegment) => void;
}

const HealthSourceTabs: React.FC<Props> = ({ active, onChange, withingsSegment = 'scale', onWithingsSegmentChange }) => (
  <div className="space-y-3">
    <div className="flex flex-wrap gap-2">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'bg-accent/15 text-accent border-accent/40'
                : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>

    {active === 'withings' && onWithingsSegmentChange && (
      <div className="flex items-center gap-1 text-xs text-muted-foreground border-l-2 border-primary/40 pl-3">
        {WITHINGS_SEGMENTS.map((s, i) => {
          const isActive = withingsSegment === s.id;
          return (
            <React.Fragment key={s.id}>
              {i > 0 && <span className="opacity-40">·</span>}
              <button
                type="button"
                onClick={() => onWithingsSegmentChange(s.id)}
                className={cn(
                  'px-2 py-1 rounded-md transition-colors',
                  isActive ? 'text-foreground font-semibold bg-muted/60' : 'hover:text-foreground',
                )}
              >
                {s.label}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    )}
  </div>
);

export default HealthSourceTabs;
