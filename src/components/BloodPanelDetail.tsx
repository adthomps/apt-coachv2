import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Minus } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import RangeBar from '@/components/health/RangeBar';
import MetricExplainer from '@/components/health/MetricExplainer';
import type { BloodPanel, BloodMarkerCategory, BloodMarkerStatus } from '@/lib/api/types';
import { BLOOD_MARKER_CATEGORIES, BLOOD_MARKER_CATEGORY_LABELS } from '@/lib/api/types';
import { resolveMarkerKey } from '@/lib/health/metric-glossary';

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

  const renderMarker = (m: BloodPanel['markers'][number], i: number) => {
    const glossaryKey = resolveMarkerKey(m.marker);
    return (
      <div key={i} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
        {statusIcon(m.status)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm text-foreground">{m.marker}</span>
            <StatusBadge tone={m.status} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {m.value} <span className="text-muted-foreground font-normal">{m.unit}</span>
            </span>
            <span className="text-xs text-muted-foreground">Ref: {m.referenceRange}</span>
          </div>
          <RangeBar value={m.value} min={m.referenceMin} max={m.referenceMax} status={m.status} className="mt-1" />
          {glossaryKey && <MetricExplainer metricKey={glossaryKey} compact title="About this marker" />}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {categories.map(category => {
        const catMarkers = getMarkersForCategory(category);
        if (catMarkers.length === 0) return null;
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">{BLOOD_MARKER_CATEGORY_LABELS[category]}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">{catMarkers.map(renderMarker)}</div>
            </CardContent>
          </Card>
        );
      })}

      {uncategorized.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Other Markers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">{uncategorized.map(renderMarker)}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BloodPanelDetail;
