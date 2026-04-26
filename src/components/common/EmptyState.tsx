import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/** APT empty state — icon + heading + 1 sentence + 1 CTA. */
const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <Card className="text-center py-12">
    <CardContent className="space-y-4">
      {icon && <div className="mx-auto text-muted-foreground/50 flex justify-center">{icon}</div>}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="flex justify-center">{action}</div>}
    </CardContent>
  </Card>
);

export default EmptyState;
