import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

/** APT page header — one per page. Title + description + optional actions. */
const PageHeader: React.FC<PageHeaderProps> = ({ title, description, icon, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center gap-2">
        {icon}
        {title}
      </h1>
      {description && (
        <p className="text-muted-foreground leading-relaxed mt-1">{description}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
