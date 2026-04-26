import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import DeltaValue from './DeltaValue';
import MetricExplainer from './MetricExplainer';
import { cn } from '@/lib/utils';
import type { MetricKey } from '@/lib/health/metric-glossary';

interface KpiStatProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  delta?: number;
  deltaSuffix?: string;
  /** When true, a negative delta is "good" (e.g. body fat %, fat mass). */
  invertDelta?: boolean;
  /** When true, delta is shown without good/bad coloring (e.g. total weight). */
  neutralDelta?: boolean;
  /** Optional glossary key — renders an expandable "What this means" disclosure. */
  metricKey?: MetricKey;
  className?: string;
}

/** APT shared at-a-glance KPI card. Same shape across all health surfaces. */
const KpiStat: React.FC<KpiStatProps> = ({
  icon, label, value, delta, deltaSuffix = '', invertDelta = false, neutralDelta = false,
  metricKey, className,
}) => (
  <Card className={cn('apt-hover-lift', className)}>
    <CardContent className="pt-6">
      <div className="flex items-center gap-2 mb-1 text-muted-foreground">
        <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
      {typeof delta === 'number' && (
        <DeltaValue value={delta} suffix={deltaSuffix} invert={invertDelta} neutral={neutralDelta} />
      )}
      {metricKey && <MetricExplainer metricKey={metricKey} compact />}
    </CardContent>
  </Card>
);

export default KpiStat;
