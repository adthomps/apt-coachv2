import React from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Sparkles, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  date: string; // YYYY-MM-DD
  loggedCount: number;
  totalCount: number;
  aiRefreshedAt?: string; // ISO
  onChangeDate: (date: string) => void;
  onRefreshAI: () => void;
  onBackfill?: () => void;
  refreshing?: boolean;
}

const fmtTime = (iso?: string) => iso ? format(parseISO(iso), 'HH:mm') : '—';
const shift = (date: string, days: number) =>
  format(addDays(parseISO(date), days), 'yyyy-MM-dd');

const todayStr = () => format(new Date(), 'yyyy-MM-dd');

const TodayHeader: React.FC<Props> = ({
  date, loggedCount, totalCount, aiRefreshedAt, onChangeDate, onRefreshAI, refreshing,
}) => {
  const pending = Math.max(totalCount - loggedCount, 0);
  const heading = format(parseISO(date), 'EEEE, MMMM d');
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{heading}</h1>
        <p className="text-xs text-muted-foreground mt-1 tabular-nums">
          {loggedCount} of {totalCount} inputs logged
          {pending > 0 && <> · <span className="text-amber-500">{pending} pending</span></>}
          {' '}· AI refreshed {fmtTime(aiRefreshedAt)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onChangeDate(shift(date, -1))}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
        </Button>
        <Button variant="outline" size="sm" onClick={() => onChangeDate(todayStr())} disabled={date === todayStr()}>
          Today
        </Button>
        <Button variant="outline" size="sm" onClick={() => onChangeDate(shift(date, 1))}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
        <Button variant="outline" size="sm" onClick={onRefreshAI} disabled={refreshing}>
          <Sparkles className="h-4 w-4 mr-1.5" /> Refresh AI
        </Button>
      </div>
    </div>
  );
};

export default TodayHeader;
