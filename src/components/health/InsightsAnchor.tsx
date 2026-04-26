import React from 'react';
import { Sparkles, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InsightsAnchorProps {
  /** Element id to scroll to. Defaults to "insights". */
  targetId?: string;
  count?: number;
}

/** APT shared "Jump to AI insights ↓" affordance — same on every health tab. */
const InsightsAnchor: React.FC<InsightsAnchorProps> = ({ targetId = 'insights', count }) => {
  const handleClick = () => {
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <Button
      variant="link"
      size="sm"
      onClick={handleClick}
      className="h-auto p-0 text-primary"
    >
      <Sparkles className="mr-1.5 h-4 w-4" />
      Jump to AI Insights{typeof count === 'number' ? ` (${count})` : ''}
      <ArrowDown className="ml-1 h-3.5 w-3.5" />
    </Button>
  );
};

export default InsightsAnchor;
