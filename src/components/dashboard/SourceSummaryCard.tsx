import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/common/StatusBadge';
import MetricExplainer from '@/components/health/MetricExplainer';
import type { MetricKey } from '@/lib/health/metric-glossary';
import { cn } from '@/lib/utils';

type Status = 'optimal' | 'average' | 'outOfRange' | 'muted';

const STATUS_LABEL: Record<Status, string> = {
  optimal: 'Optimal',
  average: 'Watch',
  outOfRange: 'Concern',
  muted: 'No data',
};

export interface SourceStat {
  label: string;
  value: React.ReactNode;
  delta?: { text: string; tone: 'success' | 'destructive' | 'warning' | 'muted' };
}

interface Props {
  title: string;
  status: Status;
  stats: [SourceStat, SourceStat];
  priorityTitle: string;
  priorityBody: string;
  priorityMetricKey?: MetricKey;
  food?: string | null;
  meta: string | null;
  href: string;
}

const DELTA_CLASS = {
  success: 'text-success',
  destructive: 'text-destructive',
  warning: 'text-warning',
  muted: 'text-muted-foreground',
};

const SourceSummaryCard: React.FC<Props> = ({
  title, status, stats, priorityTitle, priorityBody, priorityMetricKey, food, meta, href,
}) => (
  <Card className="apt-hover-lift flex flex-col">
    <CardContent className="pt-5 flex-1 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <StatusBadge tone={status} label={STATUS_LABEL[status]} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {stats.map((s, i) => (
          <div key={i} className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
            <div className="text-2xl font-bold text-foreground tabular-nums leading-tight mt-0.5">{s.value}</div>
            {s.delta && (
              <div className={cn('text-[11px] mt-0.5 tabular-nums', DELTA_CLASS[s.delta.tone])}>
                {s.delta.text}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Priority Action</p>
          <p className="text-sm font-semibold text-foreground leading-snug">{priorityTitle}</p>
          <p className="text-xs text-muted-foreground leading-snug mt-1">{priorityBody}</p>
          {priorityMetricKey && (
            <MetricExplainer metricKey={priorityMetricKey} compact title="Why this is the priority" />
          )}
        </div>
        {food && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Food Guidance</p>
            <p className="text-xs text-muted-foreground leading-snug">{food}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <span className="text-[11px] text-muted-foreground">{meta ?? '—'}</span>
        <Link to={href}>
          <Button variant="outline" size="sm" className="text-xs">
            Open <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
);

export default SourceSummaryCard;

