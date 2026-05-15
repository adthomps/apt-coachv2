import React from 'react';
import { Info } from 'lucide-react';
import SectionCard from '@/components/common/SectionCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type SignalStatus = 'act' | 'watch' | 'good';

export interface Signal {
  id: string;
  status: SignalStatus;
  title: string;
  detail: string;
  source: string;
}

interface Props {
  signals: Signal[];
  onMoreInfo?: () => void;
}

const STATUS_META: Record<SignalStatus, { label: string; cls: string; dot: string }> = {
  act:   { label: 'Act',   cls: 'bg-destructive/15 text-destructive border-destructive/30', dot: 'bg-destructive' },
  watch: { label: 'Watch', cls: 'bg-warning/15 text-warning border-warning/30',       dot: 'bg-warning' },
  good:  { label: 'Good',  cls: 'bg-success/15 text-success border-success/30',             dot: 'bg-success' },
};

const YearMonthSignalsCard: React.FC<Props> = ({ signals, onMoreInfo }) => {
  const sources = Array.from(new Set(signals.map(s => s.source))).join(' | ');
  return (
    <SectionCard
      title={
        <span className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">
          Year / Month Signals
        </span>
      }
      actions={
        <Button variant="outline" size="sm" onClick={onMoreInfo}>
          <Info className="h-3.5 w-3.5 mr-1.5" /> More info
        </Button>
      }
      description={sources && <span className="text-xs text-muted-foreground">{sources}</span>}
    >
      {signals.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          No ground-truth signals yet — import a DEXA or blood panel to see trends.
        </div>
      ) : (
        <ul className="space-y-3">
          {signals.map(s => {
            const meta = STATUS_META[s.status];
            return (
              <li key={s.id} className="flex items-start gap-2.5">
                <span className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', meta.dot)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-foreground">{s.title}</div>
                    <Badge variant="outline" className={cn('text-[10px] uppercase tracking-wide', meta.cls)}>
                      {meta.label}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.detail}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
};

export default YearMonthSignalsCard;
