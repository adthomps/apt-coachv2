import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, AlertTriangle, CheckCircle, Minus } from 'lucide-react';
import type { BloodPanel, BloodMarkerCategory, BloodMarkerStatus } from '@/lib/api/types';
import { BLOOD_MARKER_CATEGORIES, BLOOD_MARKER_CATEGORY_LABELS } from '@/lib/api/types';
import { format } from 'date-fns';

interface BloodPanelDetailProps {
  panel: BloodPanel;
}

const statusIcon = (status: BloodMarkerStatus) => {
  switch (status) {
    case 'optimal':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'average':
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    case 'outOfRange':
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
  }
};

const statusBadge = (status: BloodMarkerStatus) => {
  switch (status) {
    case 'optimal':
      return <Badge className="bg-success/20 text-success border-success/30 text-xs">Optimal</Badge>;
    case 'average':
      return <Badge variant="secondary" className="text-xs">Average</Badge>;
    case 'outOfRange':
      return <Badge variant="destructive" className="text-xs">Out of Range</Badge>;
  }
};

/** Visual bar showing where the value falls within the reference range */
const RangeBar: React.FC<{ value: number; min: number; max: number; status: BloodMarkerStatus }> = ({
  value, min, max, status,
}) => {
  const rangeSpan = max - min;
  if (rangeSpan <= 0) return null;

  // Extend display range 20% on each side
  const displayMin = min - rangeSpan * 0.2;
  const displayMax = max + rangeSpan * 0.2;
  const displaySpan = displayMax - displayMin;
  const position = Math.max(0, Math.min(100, ((value - displayMin) / displaySpan) * 100));

  const barColor = status === 'optimal'
    ? 'bg-success'
    : status === 'average'
      ? 'bg-muted-foreground'
      : 'bg-destructive';

  return (
    <div className="relative h-2 bg-muted rounded-full mt-1">
      {/* Reference range highlight */}
      <div
        className="absolute h-full bg-success/20 rounded-full"
        style={{
          left: `${((min - displayMin) / displaySpan) * 100}%`,
          width: `${(rangeSpan / displaySpan) * 100}%`,
        }}
      />
      {/* Value marker */}
      <div
        className={`absolute top-[-2px] h-3 w-3 rounded-full ${barColor} border-2 border-background`}
        style={{ left: `calc(${position}% - 6px)` }}
      />
    </div>
  );
};

const BloodPanelDetail: React.FC<BloodPanelDetailProps> = ({ panel }) => {
  const categories: BloodMarkerCategory[] = ['hormones', 'lipids', 'metabolic'];

  const getMarkersForCategory = (category: BloodMarkerCategory) => {
    const categoryMarkers = BLOOD_MARKER_CATEGORIES[category];
    return panel.markers.filter(m =>
      categoryMarkers.some(cm => m.marker.toLowerCase().includes(cm.toLowerCase()))
    );
  };

  const uncategorized = panel.markers.filter(m =>
    !categories.some(cat =>
      BLOOD_MARKER_CATEGORIES[cat].some(cm => m.marker.toLowerCase().includes(cm.toLowerCase()))
    )
  );

  const outOfRangeCount = panel.markers.filter(m => m.status === 'outOfRange').length;
  const optimalCount = panel.markers.filter(m => m.status === 'optimal').length;

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Markers</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{panel.markers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">Optimal</span>
            </div>
            <div className="text-2xl font-bold text-success">{optimalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Out of Range</span>
            </div>
            <div className="text-2xl font-bold text-destructive">{outOfRangeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Panel Date</span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {format(new Date(panel.panelDate), 'MMM d, yyyy')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category groups */}
      {categories.map(category => {
        const catMarkers = getMarkersForCategory(category);
        if (catMarkers.length === 0) return null;

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">{BLOOD_MARKER_CATEGORY_LABELS[category]}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {catMarkers.map((m, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                    {statusIcon(m.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm text-foreground">{m.marker}</span>
                        {statusBadge(m.status)}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-semibold text-foreground">
                          {m.value} <span className="text-muted-foreground font-normal">{m.unit}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">Ref: {m.referenceRange}</span>
                      </div>
                      <RangeBar value={m.value} min={m.referenceMin} max={m.referenceMax} status={m.status} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Uncategorized markers */}
      {uncategorized.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Other Markers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uncategorized.map((m, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                  {statusIcon(m.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-foreground">{m.marker}</span>
                      {statusBadge(m.status)}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-semibold text-foreground">
                        {m.value} <span className="text-muted-foreground font-normal">{m.unit}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">Ref: {m.referenceRange}</span>
                    </div>
                    <RangeBar value={m.value} min={m.referenceMin} max={m.referenceMax} status={m.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BloodPanelDetail;
