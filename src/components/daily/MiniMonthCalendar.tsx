import React, { useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, parseISO, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionCard from '@/components/common/SectionCard';
import { cn } from '@/lib/utils';

interface Props {
  selectedDate: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  /** Map of YYYY-MM-DD → 'complete' | 'partial' */
  status?: Record<string, 'complete' | 'partial'>;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const MiniMonthCalendar: React.FC<Props> = ({ selectedDate, onSelect, status = {}, onBackfill }) => {
  const sel = parseISO(selectedDate);
  const [cursor, setCursor] = useState(() => startOfMonth(sel));

  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return (
    <SectionCard
      title={
        <span className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">
          {format(cursor, 'MMMM yyyy')}
        </span>
      }
      actions={
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCursor(subMonths(cursor, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCursor(addMonths(cursor, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground uppercase">
          {WEEKDAYS.map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map(d => {
            const iso = format(d, 'yyyy-MM-dd');
            const inMonth = isSameMonth(d, cursor);
            const isSelected = isSameDay(d, sel);
            const dayStatus = status[iso];
            return (
              <button
                key={iso}
                onClick={() => onSelect(iso)}
                className={cn(
                  'relative aspect-square flex items-center justify-center text-xs rounded-md transition-colors',
                  inMonth ? 'text-foreground' : 'text-muted-foreground/40',
                  isSelected
                    ? 'bg-primary/10 ring-1 ring-primary text-primary font-semibold'
                    : 'hover:bg-muted/50',
                )}
              >
                {format(d, 'd')}
                {dayStatus && inMonth && (
                  <span className={cn(
                    'absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full',
                    dayStatus === 'complete' ? 'bg-success' : 'bg-amber-500',
                  )} />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Complete</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Partial</span>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={onBackfill}>
          <CalendarDays className="h-4 w-4 mr-1.5" /> View / back fill past days
        </Button>
      </div>
    </SectionCard>
  );
};

export default MiniMonthCalendar;
