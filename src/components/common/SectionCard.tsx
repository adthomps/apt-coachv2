import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'subtle' | 'feature';

interface SectionCardProps {
  variant?: Variant;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/** APT section card primitive. Wraps shadcn Card with one of three semantic variants. */
const VARIANT_CLASS: Record<Variant, string> = {
  default: '',
  subtle: 'bg-muted/30',
  feature: 'border-primary/30 bg-primary/[0.03] shadow-sm',
};

const SectionCard: React.FC<SectionCardProps> = ({
  variant = 'default', title, description, actions, children, className,
}) => (
  <Card className={cn(VARIANT_CLASS[variant], className)}>
    {(title || description || actions) && (
      <CardHeader className={cn(actions && 'flex flex-row items-start justify-between gap-3 space-y-0')}>
        <div className="space-y-1.5">
          {title && <CardTitle className="text-lg">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
      </CardHeader>
    )}
    <CardContent>{children}</CardContent>
  </Card>
);

export default SectionCard;
