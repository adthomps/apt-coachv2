import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ComparisonWindowPopover, { type CompareOption } from './ComparisonWindowPopover';

export interface UsedInLink {
  label: string;
  href: string;
}

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
  /** Back-references — renders a "Used in" strip at the bottom of the page. */
  usedIn?: UsedInLink[];
  children: React.ReactNode;
}

const SourcePageShell: React.FC<Props> = ({
  metaLine, compare, insightsCount, onInsightsClick, usedIn, children,
}) => (
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

    {usedIn && usedIn.length > 0 && (
      <div className="pt-4 mt-2 border-t border-border/60 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
        <span className="uppercase tracking-wide font-semibold text-[10px]">Used in</span>
        {usedIn.map(link => (
          <Link
            key={link.href}
            to={link.href}
            className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-accent hover:bg-accent/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {link.label}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        ))}
      </div>
    )}
  </div>
);

export default SourcePageShell;
