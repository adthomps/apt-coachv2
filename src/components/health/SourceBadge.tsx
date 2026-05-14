import React from 'react';
import { Badge } from '@/components/ui/badge';
import { HEALTH_SOURCE_META, type HealthSourceId } from '@/lib/api/types';

interface Props {
  source: HealthSourceId;
  showCadence?: boolean;
  className?: string;
}

/**
 * APT-style source attribution chip. Ground-truth sources get a primary border,
 * context sources stay muted so the visual hierarchy reads at a glance.
 */
const SourceBadge: React.FC<Props> = ({ source, showCadence = false, className }) => {
  const meta = HEALTH_SOURCE_META[source];
  if (!meta) return null;
  const isTruth = meta.tier === 'truth';
  return (
    <Badge
      variant="outline"
      className={
        (isTruth
          ? 'border-primary/40 text-primary bg-primary/5'
          : 'border-border text-muted-foreground bg-muted/40') +
        ' text-[10px] font-medium tracking-wide uppercase ' +
        (className ?? '')
      }
    >
      {meta.shortLabel}
      {meta.beta && <span className="ml-1 opacity-70">beta</span>}
      {showCadence && <span className="ml-1.5 opacity-70">· {meta.cadence}</span>}
    </Badge>
  );
};

export default SourceBadge;
