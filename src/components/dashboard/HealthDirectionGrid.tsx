import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Activity, ArrowRight, Droplets, Percent, Scale, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import SectionCard from '@/components/common/SectionCard';
import StatusBadge from '@/components/common/StatusBadge';
import KpiStat from '@/components/health/KpiStat';
import MetricExplainer from '@/components/health/MetricExplainer';
import type { Snapshot, BloodPanel, ProgressCompare } from '@/lib/api/types';
import type { Insight } from '@/lib/ai/insights';
import type { MetricKey } from '@/lib/health/metric-glossary';

type Status = 'optimal' | 'average' | 'outOfRange' | 'muted';

const STATUS_LABEL: Record<Status, string> = {
  optimal: 'Optimal',
  average: 'Watch',
  outOfRange: 'Concern',
  muted: 'No data',
};

interface Props {
  latestDexa: Snapshot | null;
  latestWithings: Snapshot | null;
  latestPanel: BloodPanel | null;
  bodyInsights: Insight[];
  panelInsights: Insight[];
  /** Optional DEXA compare to power deltas in KPI tiles. */
  compare?: ProgressCompare | null;
}

interface SourceCardProps {
  title: string;
  icon: React.ReactNode;
  status: Status;
  meta: string | null;
  kpis: React.ReactNode;
  priority: string | null;
  priorityKey?: MetricKey;
  food: string | null;
}

/** One source card. Header (title + status), KPI strip (shared KpiStat), priority + food, footer link. */
const SourceCard: React.FC<SourceCardProps> = ({ title, icon, status, meta, kpis, priority, priorityKey, food }) => (
  <Card className="apt-hover-lift transition-shadow flex flex-col">
    <CardContent className="pt-5 space-y-4 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-muted-foreground">{icon}</span>
          <h4 className="text-sm font-semibold text-foreground truncate">{title}</h4>
        </div>
        <StatusBadge tone={status} label={STATUS_LABEL[status]} />
      </div>

      {/* KPI strip — shared KpiStat primitives */}
      <div className="grid grid-cols-2 gap-2">{kpis}</div>

      {/* Priority + Food */}
      <div className="space-y-2 flex-1">
        {priority && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Priority Action</p>
            <p className="text-sm text-foreground leading-snug">{priority}</p>
            {priorityKey && <MetricExplainer metricKey={priorityKey} compact title="Why this is the priority" />}
          </div>
        )}
        {food && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Food Guidance</p>
            <p className="text-xs text-muted-foreground leading-snug">{food}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <span className="text-[11px] text-muted-foreground">{meta ?? '—'}</span>
        <Link to="/health" className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
          Open <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </CardContent>
  </Card>
);

const HealthDirectionGrid: React.FC<Props> = ({
  latestDexa, latestWithings, latestPanel, bodyInsights, panelInsights, compare,
}) => {
  // ---------- DEXA ----------
  const dexaStatus: Status = !latestDexa
    ? 'muted'
    : latestDexa.bodyComposition.bodyFatPercentage > 25 ? 'outOfRange'
      : latestDexa.bodyComposition.bodyFatPercentage > 18 ? 'average'
        : 'optimal';
  const dexaTopTraining = bodyInsights.find((i) => i.category === 'training');
  const dexaTopFood = bodyInsights.find((i) => i.category === 'food');

  // ---------- Rythm (Blood) ----------
  const oor = latestPanel?.markers.filter((m) => m.status === 'outOfRange').length ?? 0;
  const rythmStatus: Status = !latestPanel
    ? 'muted'
    : oor >= 3 ? 'outOfRange'
      : oor > 0 ? 'average'
        : 'optimal';
  const rythmTopMarker = panelInsights[0];

  // ---------- Withings ----------
  const withingsStatus: Status = !latestWithings ? 'muted' : 'average';

  return (
    <SectionCard
      title="Health Direction"
      description="One status, signals, and action per data source — using the same KPI cards as the Health page."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* DEXA */}
        <SourceCard
          title="DEXA (BodySpec)"
          icon={<Activity className="h-4 w-4" />}
          status={dexaStatus}
          meta={latestDexa ? format(new Date(latestDexa.scanDate), 'MMM d, yyyy') : null}
          priority={dexaTopTraining?.title ?? (latestDexa ? null : 'Import a DEXA scan to set a baseline.')}
          food={dexaTopFood?.title ?? null}
          kpis={
            latestDexa ? (
              <>
                <KpiStat
                  icon={<Percent />}
                  label="Body Fat"
                  value={`${latestDexa.bodyComposition.bodyFatPercentage.toFixed(1)}%`}
                  delta={compare?.changes.bodyFatPercentage.value}
                  deltaSuffix="%"
                  invertDelta
                  metricKey="body_fat"
                />
                <KpiStat
                  icon={<TrendingUp />}
                  label="Lean Mass"
                  value={`${latestDexa.bodyComposition.leanMass.toFixed(1)} lbs`}
                  delta={compare?.changes.leanMass.value}
                  deltaSuffix=" lbs"
                  metricKey="lean_mass"
                />
              </>
            ) : null
          }
        />

        {/* Rythm Health */}
        <SourceCard
          title="Rythm Health (Blood)"
          icon={<Droplets className="h-4 w-4" />}
          status={rythmStatus}
          meta={latestPanel ? format(new Date(latestPanel.panelDate), 'MMM d, yyyy') : null}
          priority={
            latestPanel
              ? (rythmTopMarker?.title ? `Address ${rythmTopMarker.title}` : 'All markers in range — keep current habits.')
              : 'Import a blood panel to surface marker insights.'
          }
          food={rythmTopMarker?.actions?.[0] ?? null}
          kpis={
            latestPanel ? (
              <>
                <KpiStat
                  icon={<Droplets />}
                  label="Markers"
                  value={latestPanel.markers.length}
                />
                <KpiStat
                  icon={<Activity />}
                  label="Out of Range"
                  value={<span className={oor > 0 ? 'text-destructive' : 'text-success'}>{oor}</span>}
                  metricKey="markers_out_of_range"
                />
              </>
            ) : null
          }
        />

        {/* Withings */}
        <SourceCard
          title="Withings (Smart Scale)"
          icon={<Scale className="h-4 w-4" />}
          status={withingsStatus}
          meta={latestWithings ? format(new Date(latestWithings.scanDate), 'MMM d, yyyy') : null}
          priority={latestWithings ? 'Use as a daily trend check between DEXA scans.' : 'Log a smart-scale reading to track between scans.'}
          food={null}
          kpis={
            latestWithings ? (
              <>
                <KpiStat
                  icon={<Scale />}
                  label="Weight"
                  value={`${latestWithings.bodyComposition.totalMass.toFixed(1)} lbs`}
                  metricKey="weight"
                />
                <KpiStat
                  icon={<Percent />}
                  label="Body Fat"
                  value={`${latestWithings.bodyComposition.bodyFatPercentage.toFixed(1)}%`}
                  metricKey="body_fat"
                />
              </>
            ) : null
          }
        />
      </div>
    </SectionCard>
  );
};

export default HealthDirectionGrid;
