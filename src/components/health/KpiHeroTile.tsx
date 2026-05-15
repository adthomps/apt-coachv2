import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import MetricExplainer from './MetricExplainer';
import type { MetricKey } from '@/lib/health/metric-glossary';

export type FavTone = 'fav' | 'unfav' | 'neutral';

interface KpiHeroTileProps {
  label: string;
  value: React.ReactNode;
  /** Numeric delta. Sign is preserved for arrow direction. */
  delta?: number;
  deltaSuffix?: string;
  /** When true, a negative delta is "good" (e.g. body fat %, fat mass). */
  invertDelta?: boolean;
  /** Override tone label; otherwise computed from delta + invertDelta. */
  favTone?: FavTone;
  /** Tone for the value text itself (mock uses warning for elevated BF, etc). */
  valueTone?: 'default' | 'success' | 'warning' | 'destructive';
  metricKey?: MetricKey;
  className?: string;
}

const VALUE_CLASS = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
};

const TONE_CLASS: Record<FavTone, string> = {
  fav: 'bg-success/15 text-success border-success/20',
  unfav: 'bg-destructive/15 text-destructive border-destructive/20',
  neutral: 'bg-muted text-muted-foreground border-border',
};

const TONE_LABEL: Record<FavTone, string> = { fav: 'Fav', unfav: 'Unfav', neutral: '—' };

function deriveTone(delta: number | undefined, invert: boolean): FavTone {
  if (delta === undefined || delta === 0) return 'neutral';
  const positiveIsGood = !invert;
  const isGood = positiveIsGood ? delta > 0 : delta < 0;
  return isGood ? 'fav' : 'unfav';
}

const KpiHeroTile: React.FC<KpiHeroTileProps> = ({
  label, value, delta, deltaSuffix = '', invertDelta = false, favTone, valueTone = 'default', metricKey, className,
}) => {
  const tone = favTone ?? deriveTone(delta, invertDelta);
  const arrowDir = delta === undefined ? null : delta >= 0 ? 'up' : 'down';
  const arrowClass = tone === 'fav' ? 'text-success' : tone === 'unfav' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <Card className={cn('apt-hover-lift', className)}>
      <CardContent className="pt-4 pb-4 space-y-1.5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={cn('text-3xl font-bold tabular-nums leading-tight', VALUE_CLASS[valueTone])}>
          {value}
        </div>
        {(delta !== undefined || favTone) && (
          <div className="flex items-center gap-1.5 text-xs">
            {arrowDir === 'up' && <ArrowUp className={cn('h-3 w-3', arrowClass)} />}
            {arrowDir === 'down' && <ArrowDown className={cn('h-3 w-3', arrowClass)} />}
            {delta !== undefined && (
              <span className={cn('tabular-nums', arrowClass)}>
                {delta > 0 ? '+' : ''}{delta.toFixed(Math.abs(delta) < 10 ? 1 : 0)}{deltaSuffix}
              </span>
            )}
            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium border', TONE_CLASS[tone])}>
              {TONE_LABEL[tone]}
            </span>
          </div>
        )}
        {metricKey && <MetricExplainer metricKey={metricKey} compact />}
      </CardContent>
    </Card>
  );
};

export default KpiHeroTile;
