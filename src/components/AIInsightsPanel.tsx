import React from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, Utensils, Dumbbell, Calendar, Heart, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SectionCard from '@/components/common/SectionCard';
import EmptyState from '@/components/common/EmptyState';
import MetricExplainer from '@/components/health/MetricExplainer';
import type { Insight, InsightCategory, InsightSeverity, InsightSource } from '@/lib/ai/insights';
import { format } from 'date-fns';

const SOURCE_LABEL: Record<InsightSource, string> = {
  dexa: 'DEXA',
  rythm: 'Rythm Health',
  withings: 'Withings',
  apple: 'Apple / MyChart',
  skulpt: 'Skulpt',
  lumen: 'Lumen',
};

interface AIInsightsPanelProps {
  insights: Insight[];
  title?: React.ReactNode;
  description?: React.ReactNode;
  emptyTitle?: string;
}

const CATEGORY_ICON: Record<InsightCategory, React.ReactNode> = {
  food: <Utensils className="h-4 w-4" />,
  training: <Dumbbell className="h-4 w-4" />,
  schedule: <Calendar className="h-4 w-4" />,
  lifestyle: <Heart className="h-4 w-4" />,
};

const SEVERITY_TONE: Record<InsightSeverity, string> = {
  info: 'bg-muted/40',
  attention: 'bg-warning/10 border-warning/30',
  urgent: 'bg-destructive/10 border-destructive/30',
};

const SEVERITY_LABEL: Record<InsightSeverity, string> = {
  info: 'Informational',
  attention: 'Attention',
  urgent: 'Urgent',
};

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  insights,
  title = 'AI Insights',
  description = 'Actionable recommendations grounded in your real data.',
  emptyTitle = 'No insights yet',
}) => {
  if (insights.length === 0) {
    return (
      <SectionCard title={title} description={description}>
        <EmptyState
          icon={<Lightbulb className="h-10 w-10" />}
          title={emptyTitle}
          description="Once data is available, recommendations grounded in your readings will appear here."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title={title} description={description}>
      <div className="space-y-3">
        {insights.map((ins) => (
          <div
            key={ins.id}
            className={`rounded-lg border border-border p-4 space-y-2 ${SEVERITY_TONE[ins.severity]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-muted-foreground">{CATEGORY_ICON[ins.category]}</span>
                <span className="font-medium text-foreground truncate">{ins.title}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {ins.sourceTab && (
                  <Link
                    to={`/health?source=${ins.sourceTab}`}
                    className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent hover:bg-accent/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`See in Health · ${SOURCE_LABEL[ins.sourceTab]}`}
                  >
                    {SOURCE_LABEL[ins.sourceTab]}
                    <ArrowUpRight className="h-2.5 w-2.5" />
                  </Link>
                )}
                <Badge variant="outline" className="text-xs capitalize">
                  {ins.category}
                </Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{ins.rationale}</p>

            {ins.actions && ins.actions.length > 0 && (
              <ul className="text-xs text-foreground space-y-1 pl-1">
                {ins.actions.map((a, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Evidence citation — required */}
            <div className="text-xs text-muted-foreground pt-2 border-t border-border/60">
              <span className="font-medium text-foreground">Evidence:</span>{' '}
              {ins.evidence.label}{' '}
              <span className="font-mono text-foreground">{ins.evidence.value}</span>
              {ins.evidence.reference && (
                <> · ref {ins.evidence.reference}</>
              )}
              {ins.evidence.date && (
                <> · {format(new Date(ins.evidence.date), 'MMM d, yyyy')}</>
              )}
              <span className="ml-2 italic">({SEVERITY_LABEL[ins.severity]})</span>
            </div>

            {(ins.metricKey || ins.science) && (
              <MetricExplainer
                metricKey={ins.metricKey}
                explanation={ins.science}
                title="The science"
                compact
              />
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

export default AIInsightsPanel;
