import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ComparisonWindowPopover, { type CompareOption } from './ComparisonWindowPopover';

interface Props {
  /** Top meta line e.g. "SCAN: Feb 27, 2026 · BodySpec · COMPARING vs Oct 25, 2025 (125 days)". */
  metaLine: React.ReactNode;
  /** Comparison popover config. Pass null to hide. */
  compare?: {
    value: string | null;
    onChange: (id: string | null) => void;
    autoLabel?: string;
    items?: CompareOption[];
    presets?: CompareOption[];
    triggerLabel?: string;
  } | null;
  insightsCount?: number;
  onInsightsClick?: () => void;
  children: React.ReactNode;
}

const SourcePageShell: React.FC<Props> = ({ metaLine, compare, insightsCount, onInsightsClick, children }) => (
  <div className="space-y-5">
    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{metaLine}</div>

    {(compare || onInsightsClick) && (
      <div className="flex flex-wrap items-center gap-2">
        {compare && <ComparisonWindowPopover {...compare} />}
        {onInsightsClick && (
          <Button variant="outline" size="sm" className="h-9" onClick={onInsightsClick}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
            AI insights{typeof insightsCount === 'number' ? ` · ${insightsCount}` : ''}
          </Button>
        )}
      </div>
    )}

    {children}
  </div>
);

export default SourcePageShell;
