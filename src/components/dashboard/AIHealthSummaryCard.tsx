import React from 'react';
import { format } from 'date-fns';
import { FlaskConical, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/common/StatusBadge';
import MetricExplainer from '@/components/health/MetricExplainer';
import type { Insight } from '@/lib/ai/insights';

interface Props {
  headline: Insight | null;
  evidenceParts: string[];
  sources: string[];
  status: 'optimal' | 'average' | 'outOfRange';
}

const STATUS_LABEL: Record<Props['status'], string> = {
  optimal: 'On track',
  average: 'Watch',
  outOfRange: 'Concern',
};

const AIHealthSummaryCard: React.FC<Props> = ({ headline, evidenceParts, sources, status }) => {
  const [scienceOpen, setScienceOpen] = React.useState(false);

  return (
    <section className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Health Summary · AI
      </div>

      {headline ? (
        <>
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">
            {headline.title}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
            {headline.rationale}
          </p>
        </>
      ) : (
        <>
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">
            Add data to surface your direction
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Import a DEXA scan or blood panel to get a body-composition-aware summary.
          </p>
        </>
      )}

      {evidenceParts.length > 0 && (
        <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 font-mono text-xs text-foreground/90">
          <span className="text-muted-foreground">Evidence:</span>{' '}
          {evidenceParts.join(' · ')}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={status} label={STATUS_LABEL[status]} />
          {sources.length > 0 && (
            <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
              {sources.join(' · ')}
            </span>
          )}
        </div>
        {(headline?.metricKey || headline?.science) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScienceOpen(v => !v)}
            className="text-xs"
          >
            <FlaskConical className="mr-1.5 h-3.5 w-3.5" /> The science
          </Button>
        )}
      </div>

      {scienceOpen && headline && (
        <MetricExplainer
          metricKey={headline.metricKey}
          explanation={headline.science}
          title="The science"
          compact
        />
      )}
    </section>
  );
};

export default AIHealthSummaryCard;
