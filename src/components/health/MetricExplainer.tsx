import React from 'react';
import { ChevronDown, Info, Target, BookOpen } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { METRIC_GLOSSARY, type MetricKey, type MetricExplanation } from '@/lib/health/metric-glossary';

interface MetricExplainerProps {
  /** Glossary key — preferred. */
  metricKey?: MetricKey;
  /** Or pass an inline explanation directly. */
  explanation?: MetricExplanation;
  /** Optional title override; defaults to "What this means". */
  title?: string;
  className?: string;
  /** Compact = smaller padding for inline use under a KpiStat. */
  compact?: boolean;
}

/**
 * APT shared expandable disclosure for any health metric.
 * Renders "What it is", "Why it matters", and "Focus / suggested changes"
 * pulled from the central glossary so Dashboard and Health stay in sync.
 */
const MetricExplainer: React.FC<MetricExplainerProps> = ({
  metricKey, explanation, title = 'What this means', className, compact = false,
}) => {
  const data = explanation ?? (metricKey ? METRIC_GLOSSARY[metricKey] : undefined);
  if (!data) return null;

  return (
    <Collapsible className={cn('border-t border-border/60 mt-2 pt-2', className)}>
      <CollapsibleTrigger asChild>
        <button
          className="w-full flex items-center justify-between text-left group text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label={title}
        >
          <span className="inline-flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            {title}
            {data.range && <span className="font-mono text-[10px] text-muted-foreground/80">· {data.range}</span>}
          </span>
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className={cn('mt-2 space-y-2.5', compact ? 'text-xs' : 'text-sm')}>
        <section>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5 inline-flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> What it is
          </p>
          <p className="text-foreground leading-relaxed">{data.what}</p>
        </section>
        <section>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Why it matters</p>
          <p className="text-foreground leading-relaxed">{data.why}</p>
        </section>
        {data.focus.length > 0 && (
          <section>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5 inline-flex items-center gap-1">
              <Target className="h-3 w-3" /> Suggested focus
            </p>
            <ul className="space-y-0.5">
              {data.focus.map((f, i) => (
                <li key={i} className="flex gap-2 text-foreground leading-relaxed">
                  <span className="text-primary shrink-0">→</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default MetricExplainer;
