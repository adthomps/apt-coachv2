import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Activity, ArrowRight, Droplets, Scale } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SectionCard from '@/components/common/SectionCard';
import type { Snapshot, BloodPanel } from '@/lib/api/types';
import type { Insight } from '@/lib/ai/insights';

type Status = 'optimal' | 'watch' | 'concern' | 'no-data';

interface CardSpec {
  key: 'dexa' | 'rythm' | 'withings';
  title: string;
  icon: React.ReactNode;
  status: Status;
  signals: string[];
  priority: string | null;
  food: string | null;
  meta: string | null;
}

const STATUS_LABEL: Record<Status, string> = {
  optimal: 'Optimal',
  watch: 'Watch',
  concern: 'Concern',
  'no-data': 'No data',
};
const STATUS_TONE: Record<Status, string> = {
  optimal: 'border-success/40 bg-success/10 text-success',
  watch: 'border-primary/40 bg-primary/10 text-primary',
  concern: 'border-destructive/40 bg-destructive/10 text-destructive',
  'no-data': 'border-border bg-muted/30 text-muted-foreground',
};

interface Props {
  latestDexa: Snapshot | null;
  latestWithings: Snapshot | null;
  latestPanel: BloodPanel | null;
  bodyInsights: Insight[];
  panelInsights: Insight[];
}

const HealthDirectionGrid: React.FC<Props> = ({
  latestDexa, latestWithings, latestPanel, bodyInsights, panelInsights,
}) => {
  // ---------- DEXA card ----------
  const dexa: CardSpec = (() => {
    if (!latestDexa) return {
      key: 'dexa', title: 'DEXA (BodySpec)', icon: <Activity className="h-4 w-4" />,
      status: 'no-data', signals: [], priority: 'Import a DEXA scan to set a baseline.', food: null, meta: null,
    };
    const bf = latestDexa.bodyComposition.bodyFatPercentage;
    const status: Status = bf > 25 ? 'concern' : bf > 18 ? 'watch' : 'optimal';
    const top = bodyInsights.find((i) => i.category === 'training');
    const food = bodyInsights.find((i) => i.category === 'food');
    return {
      key: 'dexa', title: 'DEXA (BodySpec)', icon: <Activity className="h-4 w-4" />,
      status,
      signals: [
        `${bf.toFixed(1)}% BF`,
        `${latestDexa.bodyComposition.leanMass.toFixed(1)} lbs lean`,
      ],
      priority: top?.title ?? null,
      food: food?.title ?? null,
      meta: format(new Date(latestDexa.scanDate), 'MMM d, yyyy'),
    };
  })();

  // ---------- Rythm Health card ----------
  const rythm: CardSpec = (() => {
    if (!latestPanel) return {
      key: 'rythm', title: 'Rythm Health (Blood)', icon: <Droplets className="h-4 w-4" />,
      status: 'no-data', signals: [], priority: 'Import a blood panel to surface marker insights.', food: null, meta: null,
    };
    const oor = latestPanel.markers.filter((m) => m.status === 'outOfRange').length;
    const status: Status = oor >= 3 ? 'concern' : oor > 0 ? 'watch' : 'optimal';
    const topMarker = panelInsights[0];
    return {
      key: 'rythm', title: 'Rythm Health (Blood)', icon: <Droplets className="h-4 w-4" />,
      status,
      signals: [
        `${oor} out of range`,
        `${latestPanel.markers.length} markers`,
      ],
      priority: topMarker?.title ? `Address ${topMarker.title}` : 'All markers in range — keep current habits.',
      food: topMarker?.actions?.[0] ?? null,
      meta: format(new Date(latestPanel.panelDate), 'MMM d, yyyy'),
    };
  })();

  // ---------- Withings card ----------
  const withings: CardSpec = (() => {
    if (!latestWithings) return {
      key: 'withings', title: 'Withings (Smart Scale)', icon: <Scale className="h-4 w-4" />,
      status: 'no-data', signals: [], priority: 'Log a smart-scale reading to track between scans.', food: null, meta: null,
    };
    return {
      key: 'withings', title: 'Withings (Smart Scale)', icon: <Scale className="h-4 w-4" />,
      status: 'watch',
      signals: [
        `${latestWithings.bodyComposition.totalMass.toFixed(1)} lbs`,
        `${latestWithings.bodyComposition.bodyFatPercentage.toFixed(1)}% BF`,
      ],
      priority: 'Use as a daily trend check between DEXA scans.',
      food: null,
      meta: format(new Date(latestWithings.scanDate), 'MMM d, yyyy'),
    };
  })();

  const cards: CardSpec[] = [dexa, rythm, withings];

  return (
    <SectionCard
      title="Health Direction"
      description="One status, signal, and action per data source — DEXA, Rythm, Withings."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.key} className="apt-hover-lift transition-shadow">
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted-foreground">{c.icon}</span>
                  <h4 className="text-sm font-semibold text-foreground truncate">{c.title}</h4>
                </div>
                <Badge variant="outline" className={`text-[10px] ${STATUS_TONE[c.status]}`}>
                  {STATUS_LABEL[c.status]}
                </Badge>
              </div>

              {c.signals.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {c.signals.map((s, i) => (
                    <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted/40 text-foreground">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {c.priority && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Priority Action</p>
                  <p className="text-sm text-foreground leading-snug">{c.priority}</p>
                </div>
              )}

              {c.food && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Food Guidance</p>
                  <p className="text-xs text-muted-foreground leading-snug">{c.food}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-[11px] text-muted-foreground">{c.meta ?? '—'}</span>
                <Link to="/health" className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
                  Open <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionCard>
  );
};

export default HealthDirectionGrid;
