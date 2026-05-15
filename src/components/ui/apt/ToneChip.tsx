/**
 * APT UI: ToneChip
 * ----------------
 * Single source of truth for value-compare and status chips.
 * Always uses semantic tokens — never raw color literals.
 *
 * Tones map to APT design conventions (`references/design-tokens.json`):
 *   fav      → success token  (improvement)
 *   unfav    → destructive    (regression)
 *   warning  → warning        (watch range)
 *   neutral  → muted          (no signal / unchanged)
 *   info     → primary        (informational)
 *   accent   → accent         (selected / active)
 */
import * as React from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ChipTone = 'fav' | 'unfav' | 'warning' | 'neutral' | 'info' | 'accent';

const toneClass: Record<ChipTone, string> = {
  fav:       'bg-success/15 text-success border-success/20',
  unfav:     'bg-destructive/15 text-destructive border-destructive/20',
  warning:   'bg-warning/15 text-warning border-warning/20',
  neutral:   'bg-muted text-muted-foreground border-border',
  info:      'bg-primary/15 text-primary border-primary/20',
  accent:    'bg-accent/15 text-accent border-accent/30',
};

const arrowFor = (dir?: 'up' | 'down' | 'flat') => {
  if (dir === 'up') return <ArrowUp className="h-3 w-3" aria-hidden />;
  if (dir === 'down') return <ArrowDown className="h-3 w-3" aria-hidden />;
  if (dir === 'flat') return <Minus className="h-3 w-3" aria-hidden />;
  return null;
};

export interface ToneChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone: ChipTone;
  direction?: 'up' | 'down' | 'flat';
  /** Accessible label override (defaults to children text). */
  ariaLabel?: string;
  /** Compact padding for inline use in dense tables. */
  dense?: boolean;
}

const ToneChip = React.forwardRef<HTMLSpanElement, ToneChipProps>(
  ({ tone, direction, dense, className, children, ariaLabel, ...rest }, ref) => (
    <span
      ref={ref}
      role="status"
      aria-label={ariaLabel ?? (typeof children === 'string' ? children : undefined)}
      className={cn(
        'inline-flex items-center gap-1 rounded-md border tabular-nums font-medium',
        dense ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        toneClass[tone],
        className,
      )}
      {...rest}
    >
      {arrowFor(direction)}
      {children}
    </span>
  ),
);
ToneChip.displayName = 'ToneChip';

export default ToneChip;
