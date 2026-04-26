import React from 'react';
import { Lightbulb, Utensils, Dumbbell, Calendar, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SectionCard from '@/components/common/SectionCard';
import EmptyState from '@/components/common/EmptyState';
import type { Insight, InsightCategory, InsightSeverity } from '@/lib/ai/insights';
import { format } from 'date-fns';

interface AIInsightsPanelProps {
  insights: Insight[];
  title?: string;
  description?: string;
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
              <Badge variant="outline" className="text-xs capitalize shrink-0">
                {ins.category}
              </Badge>
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
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

export default AIInsightsPanel;
