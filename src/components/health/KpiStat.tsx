import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import DeltaValue from './DeltaValue';
import { cn } from '@/lib/utils';

interface KpiStatProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  delta?: number;
  deltaSuffix?: string;
  /** When true, a negative delta is "good". */
  invertDelta?: boolean;
  className?: string;
}

/** APT shared at-a-glance KPI card. Same shape across all health tabs. */
const KpiStat: React.FC<KpiStatProps> = ({
  icon, label, value, delta, deltaSuffix = '', invertDelta = false, className,
}) => (
  <Card className={cn('apt-hover-lift', className)}>
    <CardContent className="pt-6">
      <div className="flex items-center gap-2 mb-1 text-muted-foreground">
        <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
      {typeof delta === 'number' && (
        <DeltaValue value={delta} suffix={deltaSuffix} invert={invertDelta} />
      )}
    </CardContent>
  </Card>
);

export default KpiStat;
