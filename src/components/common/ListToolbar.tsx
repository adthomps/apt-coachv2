import React from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface FilterChip {
  value: string;
  label: string;
}

interface ListToolbarProps {
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  filters?: FilterChip[];
  selectedFilter?: string;
  onFilterChange?: (v: string) => void;
  resultCount?: number;
  resultLabel?: string;
  action?: React.ReactNode;
}

/** Shared list toolbar: search + filter chips + result count + optional action. APT-aligned. */
const ListToolbar: React.FC<ListToolbarProps> = ({
  searchValue, onSearchChange, searchPlaceholder = 'Search...',
  filters, selectedFilter, onFilterChange,
  resultCount, resultLabel = 'results', action,
}) => (
  <div className="space-y-3">
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {filters && filters.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((f) => (
              <Button
                key={f.value}
                variant={selectedFilter === f.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange?.(f.value)}
                className="whitespace-nowrap text-xs"
              >
                {f.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    {typeof resultCount === 'number' && (
      <div className="text-sm text-muted-foreground px-1">
        {resultCount} {resultLabel}
      </div>
    )}
  </div>
);

export default ListToolbar;
