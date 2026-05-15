import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Droplets, Upload } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import SectionCard from '@/components/common/SectionCard';
import { Button } from '@/components/ui/button';
import SourcePageShell from '../SourcePageShell';
import KpiHeroTile from '../KpiHeroTile';
import BloodPanelDetail from '@/components/BloodPanelDetail';
import AIInsightsPanel from '@/components/AIInsightsPanel';
import { useBloodPanels } from '@/hooks/use-api-queries';
import { getBloodPanelInsights } from '@/lib/ai/insights';

const RythmBloodView: React.FC = () => {
  const { data: panels = [] } = useBloodPanels();
  const sorted = useMemo(() => [...panels].sort((a, b) => b.panelDate.localeCompare(a.panelDate)), [panels]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);

  const selected = (selectedId ? sorted.find(p => p.id === selectedId) : sorted[0]) || null;
  const previous = compareId ? sorted.find(p => p.id === compareId) : sorted.find(p => p.id !== selected?.id);

  const insights = useMemo(() => (selected ? getBloodPanelInsights(selected) : []), [selected]);

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={<Droplets className="h-12 w-12" />}
        title="No blood panels yet"
        description="Import a Rythm Health blood panel from Admin."
        action={<Link to="/admin?tab=imports&source=blood_panel"><Button><Upload className="mr-2 h-4 w-4" />Import Blood Panel</Button></Link>}
      />
    );
  }
  if (!selected) return null;

  const total = selected.markers.length;
  const optimal = selected.markers.filter(m => m.status === 'optimal').length;
  const flagged = selected.markers.filter(m => m.status === 'outOfRange').length;
  const watch = selected.markers.filter(m => m.status === 'average').length;
  const score = total > 0 ? Math.round((optimal / total) * 100) : 0;

  const compareItems = sorted.filter(p => p.id !== selected.id).map(p => ({
    id: p.id,
    label: format(new Date(p.panelDate), 'MMM d, yyyy'),
    hint: `${p.markers.filter(m => m.status === 'outOfRange').length} flagged`,
  }));

  // Top 3 changed markers vs previous
  const topChanges = useMemo(() => {
    if (!previous) return [];
    return selected.markers
      .map(m => {
        const prev = previous.markers.find(p => p.marker === m.marker);
        if (!prev) return null;
        const delta = m.value - prev.value;
        return { marker: m.marker, current: m.value, prev: prev.value, delta, unit: m.unit, status: m.status };
      })
      .filter(Boolean)
      .sort((a, b) => Math.abs((b!.delta / Math.max(b!.prev, 0.001))) - Math.abs((a!.delta / Math.max(a!.prev, 0.001))))
      .slice(0, 3) as Array<{ marker: string; current: number; prev: number; delta: number; unit: string; status: string }>;
  }, [selected, previous]);

  const meta = (
    <>
      PANEL: {format(new Date(selected.panelDate), 'MMM d, yyyy').toUpperCase()} · RYTHM HEALTH
      {previous && ` · COMPARING vs ${format(new Date(previous.panelDate), 'MMM d, yyyy').toUpperCase()}`}
    </>
  );

  return (
    <SourcePageShell
      metaLine={meta}
      compare={{ value: compareId, onChange: setCompareId, autoLabel: 'Previous panel (auto)', items: compareItems }}
      insightsCount={insights.length}
      onInsightsClick={() => document.getElementById('insights')?.scrollIntoView({ behavior: 'smooth' })}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiHeroTile label="Total markers" value={total} />
        <KpiHeroTile label="Optimal" value={optimal} valueTone="success" favTone="fav" />
        <KpiHeroTile label="Flagged" value={flagged} valueTone={flagged > 0 ? 'destructive' : 'default'} favTone={flagged > 0 ? 'unfav' : 'neutral'} />
        <KpiHeroTile label="Panel score" value={`${score}%`} valueTone={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'destructive'} />
      </div>

      {watch > 0 && (
        <div className="text-xs text-muted-foreground">
          {watch} marker{watch === 1 ? '' : 's'} in watch range — review trend column.
        </div>
      )}

      {topChanges.length > 0 && (
        <SectionCard>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">Top changes vs previous panel</div>
          <div className="grid md:grid-cols-3 gap-3">
            {topChanges.map(c => (
              <div key={c.marker} className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground truncate">{c.marker}</div>
                <div className="text-xl font-bold text-foreground tabular-nums">{c.current.toFixed(1)} <span className="text-xs text-muted-foreground">{c.unit}</span></div>
                <div className={`text-xs tabular-nums ${c.delta > 0 ? 'text-success' : 'text-destructive'}`}>
                  {c.delta > 0 ? '+' : ''}{c.delta.toFixed(1)} {c.unit} vs prior
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <BloodPanelDetail panel={selected} />

      <div id="insights">
        <AIInsightsPanel insights={insights} description="Each insight cites the marker, value, and reference range that triggered it." emptyTitle="All markers in optimal range" />
      </div>
    </SourcePageShell>
  );
};

export default RythmBloodView;
