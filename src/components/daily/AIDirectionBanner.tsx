import React from 'react';
import { format, parseISO } from 'date-fns';
import { Sparkles } from 'lucide-react';

interface Props {
  text: string;
  refreshedAt?: string;
}

const AIDirectionBanner: React.FC<Props> = ({ text, refreshedAt }) => (
  <div className="rounded-lg border-l-2 border-primary bg-primary/[0.04] px-4 py-3">
    <div className="flex items-center gap-2 text-xs font-medium text-primary mb-1">
      <Sparkles className="h-3.5 w-3.5" />
      Today's direction
      {refreshedAt && (
        <span className="text-muted-foreground font-normal">
          · AI · last refreshed {format(parseISO(refreshedAt), 'HH:mm')}
        </span>
      )}
    </div>
    <p className="text-sm text-foreground leading-relaxed">{text}</p>
  </div>
);

export default AIDirectionBanner;
