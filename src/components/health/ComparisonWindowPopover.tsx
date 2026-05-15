import React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface CompareOption {
  id: string;
  label: string;
  hint?: string;
}

interface Props {
  /** Current selected option id; null = first/auto. */
  value: string | null;
  onChange: (id: string | null) => void;
  /** Auto/default option label, e.g. "Previous reading". */
  autoLabel?: string;
  /** Discrete pickable items (specific dates). */
  items?: CompareOption[];
  /** Quick rolling-window presets like 7/30/90 days. */
  presets?: CompareOption[];
  /** Button label override (e.g. "Trend window"). */
  triggerLabel?: string;
}

const ComparisonWindowPopover: React.FC<Props> = ({
  value, onChange, autoLabel = 'Previous reading (auto)', items = [], presets = [], triggerLabel = 'Comparison window',
}) => {
  const allOptions = [{ id: '__auto__', label: autoLabel } as CompareOption, ...presets, ...items];
  const current = allOptions.find(o => o.id === (value ?? '__auto__'));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <span className="font-medium">{triggerLabel}</span>
          {current && <span className="text-muted-foreground text-xs ml-2 truncate max-w-[160px]">{current.label}</span>}
          <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-1">
        {presets.length > 0 && (
          <div className="px-2 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">Rolling window</div>
        )}
        {presets.map(o => (
          <Row key={o.id} option={o} active={(value ?? '__auto__') === o.id} onSelect={() => onChange(o.id)} />
        ))}
        <div className="px-2 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {items.length > 0 ? 'Pick a reading' : 'Default'}
        </div>
        <Row
          option={{ id: '__auto__', label: autoLabel }}
          active={value === null}
          onSelect={() => onChange(null)}
        />
        {items.map(o => (
          <Row key={o.id} option={o} active={value === o.id} onSelect={() => onChange(o.id)} />
        ))}
      </PopoverContent>
    </Popover>
  );
};

const Row: React.FC<{ option: CompareOption; active: boolean; onSelect: () => void }> = ({ option, active, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      'flex items-center justify-between gap-3 w-full px-2 py-1.5 rounded-md text-sm hover:bg-muted text-left',
      active && 'bg-muted',
    )}
  >
    <span className="flex items-center gap-2 min-w-0">
      <Check className={cn('h-3.5 w-3.5 shrink-0', active ? 'opacity-100 text-primary' : 'opacity-0')} />
      <span className="truncate">{option.label}</span>
    </span>
    {option.hint && <span className="text-xs text-muted-foreground shrink-0">{option.hint}</span>}
  </button>
);

export default ComparisonWindowPopover;
