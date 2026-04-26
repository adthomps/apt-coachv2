import React from 'react';
import { format } from 'date-fns';
import { Activity, ArrowRight, Calendar, Compass, Dumbbell, Flame, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SectionCard from '@/components/common/SectionCard';
import DeltaValue from '@/components/health/DeltaValue';
import type { Insight } from '@/lib/ai/insights';
import type { Snapshot, BloodPanel, ProgressCompare } from '@/lib/api/types';

interface Props {
  headline: Insight | null;
  latestSnapshot: Snapshot | null;
  latestPanel: BloodPanel | null;
  latestWithings: Snapshot | null;
  compare: ProgressCompare | null;
  adherenceRate: number;
  completedCount: number;
  totalScheduled: number;
  nextSessionLabel: string | null;
  streak: number;
}

const Chip: React.FC<{ icon?: React.ReactNode; tone?: 'default' | 'success' | 'warn'; children: React.ReactNode }> = ({
  icon, tone = 'default', children,
}) => {
  const toneClass =
    tone === 'success' ? 'border-success/30 bg-success/10 text-success'
    : tone === 'warn' ? 'border-destructive/30 bg-destructive/10 text-destructive'
    : 'border-border bg-muted/40 text-foreground';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${toneClass}`}>
      {icon}{children}
    </span>
  );
};

const HealthCommandSummary: React.FC<Props> = ({
  headline, latestSnapshot, latestPanel, latestWithings, compare,
  adherenceRate, completedCount, totalScheduled, nextSessionLabel, streak,
}) => {
  // ---------- Active Health Signals ----------
  const signals: React.ReactNode[] = [];
  if (compare) {
    const lean = compare.changes.leanMass.value;
    const fat = compare.changes.fatMass.value;
    if (Math.abs(lean) >= 0.5) {
      signals.push(
        <Chip key="lean">
          Lean <DeltaValue value={lean} suffix=" lbs" className="text-xs" />
        </Chip>,
      );
    }
    if (Math.abs(fat) >= 0.5) {
      signals.push(
        <Chip key="fat">
          Fat <DeltaValue value={fat} suffix=" lbs" invert className="text-xs" />
        </Chip>,
      );
    }
  }
  if (latestPanel) {
    const oor = latestPanel.markers.filter((m) => m.status === 'outOfRange').length;
    if (oor > 0) {
      signals.push(
        <Chip key="oor" tone="warn" icon={<Activity className="h-3 w-3" />}>
          {oor} marker{oor === 1 ? '' : 's'} out of range
        </Chip>,
      );
    } else {
      signals.push(<Chip key="oor-ok" tone="success" icon={<Activity className="h-3 w-3" />}>Markers in range</Chip>);
    }
  }
  if (signals.length === 0) {
    signals.push(<Chip key="hold">Hold steady — no major shifts</Chip>);
  }

  // ---------- Current inputs ----------
  const inputs: { label: string; value: string }[] = [];
  if (latestSnapshot) inputs.push({ label: 'DEXA', value: format(new Date(latestSnapshot.scanDate), 'MMM d, yyyy') });
  if (latestWithings) inputs.push({ label: 'Withings', value: format(new Date(latestWithings.scanDate), 'MMM d, yyyy') });
  if (latestPanel) inputs.push({ label: 'Blood Panel', value: format(new Date(latestPanel.panelDate), 'MMM d, yyyy') });

  return (
    <SectionCard
      variant="feature"
      title={
        <span className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" /> Health Command Summary
        </span>
      }
      description="Where you stand right now, and what to do about it — grounded in your latest data."
      actions={
        <Link to="/health">
          <Button variant="ghost" size="sm" className="text-xs">
            Open Health <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      }
    >
      {/* Headline insight as the lead */}
      {headline && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 mb-5">
          <div className="flex items-start gap-2 mb-1.5">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <Badge variant="outline" className="capitalize mb-1.5 text-[10px]">{headline.category}</Badge>
              <h3 className="text-base font-semibold text-foreground leading-tight">{headline.title}</h3>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{headline.rationale}</p>
          <p className="text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/60">
            <span className="font-medium text-foreground">Evidence:</span>{' '}
            {headline.evidence.label}{' '}
            <span className="font-mono text-foreground">{headline.evidence.value}</span>
            {headline.evidence.date && <> · {format(new Date(headline.evidence.date), 'MMM d, yyyy')}</>}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Active Health Signals */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Active Signals
          </h4>
          <div className="flex flex-wrap gap-1.5 mb-3">{signals}</div>
          {inputs.length > 0 && (
            <div className="text-[11px] text-muted-foreground space-y-0.5">
              <p className="font-medium text-foreground mb-1">Current inputs</p>
              {inputs.map((i) => (
                <div key={i.label} className="flex justify-between">
                  <span>{i.label}</span><span className="font-mono">{i.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Direction */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Priority Direction
          </h4>
          <div className="space-y-2">
            {headline ? (
              <p className="text-sm text-foreground leading-relaxed">
                {headline.actions?.[0] ?? headline.rationale.split('.')[0] + '.'}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add a body scan or blood panel to surface a priority direction.
              </p>
            )}
            {latestSnapshot && (
              <Chip icon={<Flame className="h-3 w-3" />}>
                Protein target ~{Math.round(latestSnapshot.bodyComposition.leanMass)} g/day
              </Chip>
            )}
          </div>
        </div>

        {/* Training Continuity */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Training Continuity
          </h4>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{adherenceRate}%</span>
              <span className="text-xs text-muted-foreground">adherence ({completedCount}/{totalScheduled})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Chip icon={<Dumbbell className="h-3 w-3" />}>Streak {streak}d</Chip>
              {nextSessionLabel && (
                <Chip icon={<Calendar className="h-3 w-3" />}>Next: {nextSessionLabel}</Chip>
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

export default HealthCommandSummary;
