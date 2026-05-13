import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import type { HealthCheckin, HealthSourceId } from '@/lib/api/types';
import { HEALTH_SOURCE_META } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface Props {
  source: HealthSourceId;
  latest?: HealthCheckin;
  onImport?: () => void;
  className?: string;
}

function summary(checkin?: HealthCheckin): string {
  if (!checkin) return 'No readings yet';
  const bits: string[] = [];
  if (checkin.weightLbs !== undefined) bits.push(`${checkin.weightLbs.toFixed(1)} lbs`);
  if (checkin.bodyFatPct !== undefined) bits.push(`${checkin.bodyFatPct.toFixed(1)}% BF`);
  if (checkin.systolicMmHg !== undefined && checkin.diastolicMmHg !== undefined)
    bits.push(`${checkin.systolicMmHg}/${checkin.diastolicMmHg} mmHg`);
  if (checkin.bloodOxygenPct !== undefined) bits.push(`SpO₂ ${checkin.bloodOxygenPct.toFixed(0)}%`);
  if (checkin.bodyTempF !== undefined) bits.push(`${checkin.bodyTempF.toFixed(1)}°F`);
  if (checkin.muscleQualityMQ !== undefined) bits.push(`MQ ${checkin.muscleQualityMQ}`);
  if (checkin.lumenLevel !== undefined) bits.push(`Lumen ${checkin.morningLumenLevel ?? '–'}→${checkin.lumenLevel}`);
  if (checkin.pulseBpm !== undefined && bits.length === 0) bits.push(`${checkin.pulseBpm} bpm`);
  return bits.join(' · ') || 'Reading recorded';
}

const HealthSourceCard: React.FC<Props> = ({ source, latest, onImport, className }) => {
  const meta = HEALTH_SOURCE_META[source];
  return (
    <Card className={cn('apt-hover-lift', className)}>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-foreground">{meta.label}</h4>
              <Badge variant={meta.tier === 'truth' ? 'default' : 'secondary'} className="text-[10px] uppercase tracking-wide">
                {meta.tier === 'truth' ? 'Ground truth' : 'Context'}
              </Badge>
              {meta.beta && <Badge variant="outline" className="text-[10px]">Beta</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
          </div>
        </div>
        <div className="rounded-md bg-muted/40 p-3">
          <div className="text-sm font-medium text-foreground tabular-nums">{summary(latest)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {latest
              ? `${format(new Date(latest.date), 'MMM d')} · ${formatDistanceToNow(new Date(latest.createdAt))} ago`
              : `Cadence: ${meta.cadence.replace('_', ' ')}`}
          </div>
        </div>
        {onImport && (
          <Button variant="outline" size="sm" className="w-full" onClick={onImport}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />Import
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthSourceCard;
