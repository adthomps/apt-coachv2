import React, { useEffect, useMemo, useState } from 'react';
import { Flame } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useUpdateDailyVitals } from '@/hooks/use-api-queries';
import {
  type DailyVitals, type LumenEvent, type LumenReading,
  LUMEN_EVENTS, LUMEN_EVENT_LABELS, LUMEN_LEVEL_DEFINITIONS,
} from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface Props {
  date: string;
  vitals?: DailyVitals;
}

type LevelKey = 1 | 2 | 3 | 4 | 5;

const LEVELS: LevelKey[] = [1, 2, 3, 4, 5];

const LumenEventsEditor: React.FC<Props> = ({ date, vitals }) => {
  const update = useUpdateDailyVitals();

  const initial = useMemo(() => {
    const map = new Map<LumenEvent, LumenReading>();
    (vitals?.lumenReadings ?? []).forEach(r => map.set(r.event, r));
    return LUMEN_EVENTS.map<LumenReading>(ev => map.get(ev) ?? { event: ev });
  }, [vitals?.lumenReadings]);

  const [readings, setReadings] = useState<LumenReading[]>(initial);
  useEffect(() => setReadings(initial), [initial]);

  const setLevel = (event: LumenEvent, level: LevelKey | undefined) => {
    setReadings(prev => prev.map(r => r.event === event ? { ...r, level } : r));
  };
  const setTime = (event: LumenEvent, time: string) => {
    setReadings(prev => prev.map(r => r.event === event ? { ...r, time: time || undefined } : r));
  };

  const persist = (next: LumenReading[]) => {
    const filled = next.filter(r => r.level != null || r.time || r.notes);
    const wakeUp = next.find(r => r.event === 'wake_up')?.level;
    const peak = next.reduce<LevelKey | undefined>(
      (max, r) => (r.level != null && (max == null || r.level > max)) ? r.level : max,
      undefined,
    );
    update.mutate({
      date,
      vitals: {
        lumenReadings: filled,
        lumenMorningLevel: wakeUp,
        lumenPeakLevel: peak,
      } as DailyVitals,
    });
  };

  const handleLevel = (event: LumenEvent, level: LevelKey | undefined) => {
    const next = readings.map(r => r.event === event ? { ...r, level } : r);
    setReadings(next);
    persist(next);
  };

  return (
    <div className="space-y-4">
      {/* Score legend */}
      <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
          Score legend
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {LEVELS.map(n => {
            const def = LUMEN_LEVEL_DEFINITIONS[n];
            return (
              <li key={n} className="rounded-md bg-card/60 border border-border/40 px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary text-[11px] font-semibold tabular-nums">{n}</span>
                  <span className="text-xs font-medium text-foreground">{def.label}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{def.detail}</div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Per-event rows */}
      <div className="space-y-2">
        {readings.map(r => {
          const def = r.level != null ? LUMEN_LEVEL_DEFINITIONS[r.level] : undefined;
          return (
            <div
              key={r.event}
              className={cn(
                'grid grid-cols-12 gap-2 items-center rounded-md border border-border/50 bg-card/40 px-3 py-2',
                r.level != null && 'bg-primary/5 border-primary/30',
              )}
            >
              <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
                <Flame className={cn('h-3.5 w-3.5', r.level != null ? 'text-primary' : 'text-muted-foreground')} />
                <span className="text-sm font-medium text-foreground">{LUMEN_EVENT_LABELS[r.event]}</span>
              </div>

              <div className="col-span-5 sm:col-span-3">
                <Label className="sr-only">Level</Label>
                <Select
                  value={r.level != null ? String(r.level) : '__none'}
                  onValueChange={v => handleLevel(r.event, v === '__none' ? undefined : (Number(v) as LevelKey))}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">—</SelectItem>
                    {LEVELS.map(n => (
                      <SelectItem key={n} value={String(n)}>
                        {n} · {LUMEN_LEVEL_DEFINITIONS[n].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-4 sm:col-span-2">
                <Label className="sr-only">Time</Label>
                <Input
                  type="time"
                  value={r.time ?? ''}
                  onChange={e => setTime(r.event, e.target.value)}
                  onBlur={() => persist(readings)}
                  className="h-8 text-sm tabular-nums"
                />
              </div>

              <div className="col-span-12 sm:col-span-4 text-[11px] text-muted-foreground">
                {def ? `${def.label} — ${def.detail}` : 'Not logged'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => { const cleared = LUMEN_EVENTS.map<LumenReading>(ev => ({ event: ev })); setReadings(cleared); persist(cleared); }}>
          Clear all
        </Button>
      </div>
    </div>
  );
};

export default LumenEventsEditor;
