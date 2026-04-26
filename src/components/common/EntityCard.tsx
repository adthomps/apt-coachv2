import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EntityCardProps {
  title: string;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  meta?: React.ReactNode;
  body?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

/** APT entity card — standard list item. Used by Library / Workouts / Programs / lists. */
const EntityCard: React.FC<EntityCardProps> = ({
  title, subtitle, badge, meta, body, footer, onClick, selected, className,
}) => {
  const interactive = !!onClick;
  return (
    <Card
      onClick={onClick}
      className={cn(
        'apt-hover-lift transition-shadow',
        interactive && 'cursor-pointer',
        selected && 'border-primary ring-1 ring-primary/30',
        className,
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight truncate">{title}</CardTitle>
            {subtitle && <CardDescription className="text-sm mt-1">{subtitle}</CardDescription>}
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      </CardHeader>
      {(meta || body || footer) && (
        <CardContent className="space-y-3">
          {meta && <div className="flex items-center gap-3 text-sm">{meta}</div>}
          {body}
          {footer && <div className="flex gap-2 pt-1">{footer}</div>}
        </CardContent>
      )}
    </Card>
  );
};

export default EntityCard;
