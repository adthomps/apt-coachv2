import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Activity, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import PageHeader from '@/components/common/PageHeader';
import SectionCard from '@/components/common/SectionCard';
import EmptyState from '@/components/common/EmptyState';
import AIInsightsPanel from '@/components/AIInsightsPanel';
import AIHealthSummaryCard from '@/components/dashboard/AIHealthSummaryCard';
import SignalChipStrip, { type SignalChip } from '@/components/dashboard/SignalChipStrip';
import SourceSummaryCard, { type SourceStat } from '@/components/dashboard/SourceSummaryCard';
import StatTilesCard, { type StatTile } from '@/components/dashboard/StatTilesCard';
import HealthDirectionGrid from '@/components/dashboard/HealthDirectionGrid';
import { Button } from '@/components/ui/button';
import {
  useSnapshots, useBloodPanels, useSchedule, useSessions, useDailyLog,
} from '@/hooks/use-api-queries';
import { snapshotApi } from '@/lib/api';
import { getBodyScanInsights, getBloodPanelInsights, type Insight } from '@/lib/ai/insights';
import { computeSessionSnapshot } from '@/lib/ai/session-insights';
import type { ProgressCompare, Snapshot } from '@/lib/api/types';

const isWithings = (s: Snapshot) => (s.provider || '').toLowerCase() === 'withings';
const todayStr = () => new Date().toISOString().slice(0, 10);

function computeStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;
  const set = new Set(completedDates.map(d => d.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  if (!set.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: snapshots = [], isLoading: snapsLoading } = useSnapshots();
  const { data: bloodPanels = [] } = useBloodPanels();
  const { data: scheduleEntries = [] } = useSchedule();
  const { data: sessions = [] } = useSessions();
  const { data: todayLog } = useDailyLog(todayStr());

  const dexaSnapshots = React.useMemo(
    () => snapshots.filter(s => !isWithings(s)).sort((a, b) => b.scanDate.localeCompare(a.scanDate)),
    [snapshots],
  );
  const withingsSnapshots = React.useMemo(
    () => snapshots.filter(isWithings).sort((a, b) => b.scanDate.localeCompare(a.scanDate)),
    [snapshots],
  );

  const latestDexa = dexaSnapshots[0] ?? null;
  const latestWithings = withingsSnapshots[0] ?? null;
  const latestPanel = bloodPanels.slice().sort((a, b) => b.panelDate.localeCompare(a.panelDate))[0] ?? null;

  const [compare, setCompare] = React.useState<ProgressCompare | null>(null);
  React.useEffect(() => {
    if (latestDexa && dexaSnapshots.length > 1) {
      snapshotApi.compare(latestDexa.id, 'last').then(setCompare).catch(() => setCompare(null));
    } else {
      setCompare(null);
    }
  }, [latestDexa, dexaSnapshots.length]);

  const bodyInsights: Insight[] = React.useMemo(
    () => (latestDexa ? getBodyScanInsights(latestDexa, compare ?? undefined) : []),
    [latestDexa, compare],
  );
  const panelInsights: Insight[] = React.useMemo(
    () => (latestPanel ? getBloodPanelInsights(latestPanel) : []),
    [latestPanel],
  );

  const headline: Insight | null = bodyInsights[0] ?? panelInsights[0] ?? null;
  const supportingInsights: Insight[] = React.useMemo(() => {
    const all = [...bodyInsights, ...panelInsights];
    return headline ? all.filter(i => i.id !== headline.id).slice(0, 6) : all.slice(0, 6);
  }, [bodyInsights, panelInsights, headline]);

  // Schedule + adherence
  const completedScheduleCount = scheduleEntries.filter(e => e.status === 'completed').length;
  const totalScheduled = scheduleEntries.length;
  const adherenceRate = totalScheduled > 0 ? Math.round((completedScheduleCount / totalScheduled) * 100) : 0;

  const completedSessions = sessions
    .filter(s => s.status === 'completed')
    .sort((a, b) => (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt));
  const completedDates = completedSessions.map(s => s.completedAt ?? s.startedAt);
  const streak = computeStreak(completedDates);
  const lastSession = completedSessions[0] ?? null;
  const lastVolume = lastSession ? computeSessionSnapshot(lastSession).totalVolume : 0;

  const today = todayStr();
  const upcoming = scheduleEntries
    .filter(e => e.status === 'scheduled' && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextEntry = upcoming[0];

  // ---------- Signal chips ----------
  const oor = latestPanel?.markers.filter(m => m.status === 'outOfRange').length ?? 0;
  const apoB = latestPanel?.markers.find(m => /apo\s*b/i.test(m.name));
  const chips: SignalChip[] = [];
  if (compare) {
    const fat = compare.changes.fatMass.value;
    const lean = compare.changes.leanMass.value;
    chips.push({
      id: 'fat',
      label: `Fat ${fat >= 0 ? '+' : ''}${fat.toFixed(1)} lbs`,
      tone: fat > 0.5 ? 'destructive' : fat < -0.5 ? 'success' : 'muted',
      trend: fat > 0 ? 'up' : fat < 0 ? 'down' : undefined,
    });
    chips.push({
      id: 'lean',
      label: `Lean ${lean >= 0 ? '+' : ''}${lean.toFixed(1)} lbs`,
      tone: lean >= 0 ? 'success' : 'warning',
      trend: lean > 0 ? 'up' : lean < 0 ? 'down' : undefined,
    });
  }
  if (latestPanel) {
    chips.push({
      id: 'oor',
      label: `${oor} marker${oor === 1 ? '' : 's'} OOR`,
      tone: oor >= 3 ? 'destructive' : oor > 0 ? 'warning' : 'success',
    });
  }
  if (totalScheduled > 0) {
    chips.push({
      id: 'adh',
      label: `${adherenceRate}% adherence`,
      tone: adherenceRate >= 80 ? 'success' : adherenceRate >= 50 ? 'primary' : 'warning',
    });
  }
  if (streak > 0) {
    chips.push({ id: 'streak', label: `Streak ${streak}d`, tone: 'muted' });
  }
  if (apoB) {
    chips.push({
      id: 'apob',
      label: `ApoB ${apoB.value}`,
      tone: apoB.status === 'outOfRange' ? 'destructive' : apoB.status === 'optimal' ? 'success' : 'muted',
      trend: apoB.status === 'outOfRange' ? 'up' : undefined,
    });
  }

  // ---------- Hero card ----------
  const evidenceParts: string[] = [];
  if (compare) {
    const f = compare.changes.fatMass;
    evidenceParts.push(`Fat ${f.value >= 0 ? '+' : ''}${f.value.toFixed(1)} lbs (${f.percentage >= 0 ? '+' : ''}${f.percentage.toFixed(1)}%)`);
    const l = compare.changes.leanMass;
    evidenceParts.push(`Lean ${l.value >= 0 ? '+' : ''}${l.value.toFixed(1)} lbs`);
  }
  if (apoB) evidenceParts.push(`ApoB ${apoB.value} ${apoB.unit ?? ''} ${apoB.status === 'outOfRange' ? 'OOR' : ''}`.trim());
  if (latestDexa) evidenceParts.push(`DEXA ${format(new Date(latestDexa.scanDate), 'MMM yyyy')}`);
  if (latestPanel) evidenceParts.push(`Blood panel ${format(new Date(latestPanel.panelDate), 'MMM yyyy')}`);

  const sources: string[] = [];
  if (latestDexa) sources.push('DEXA');
  if (latestPanel) sources.push('Blood panel');
  if (latestWithings) sources.push('Withings');

  const heroStatus: 'optimal' | 'average' | 'outOfRange' =
    oor >= 3 || (compare && compare.changes.fatMass.value > 1)
      ? 'outOfRange'
      : oor > 0 || (compare && compare.changes.fatMass.value > 0.5)
      ? 'average'
      : 'optimal';

  // ---------- Source cards ----------
  const dexaStats: [SourceStat, SourceStat] | null = latestDexa
    ? [
        {
          label: 'Body fat',
          value: `${latestDexa.bodyComposition.bodyFatPercentage.toFixed(1)}%`,
          delta: compare
            ? {
                text: `${compare.changes.bodyFatPercentage.value >= 0 ? '↑ +' : '↓ '}${compare.changes.bodyFatPercentage.value.toFixed(1)}%`,
                tone: compare.changes.bodyFatPercentage.value > 0 ? 'destructive' : 'success',
              }
            : undefined,
        },
        {
          label: 'Lean mass',
          value: latestDexa.bodyComposition.leanMass.toFixed(1),
          delta: compare
            ? {
                text: `${compare.changes.leanMass.value >= 0 ? '↑ +' : '↓ '}${compare.changes.leanMass.value.toFixed(1)} lbs`,
                tone: compare.changes.leanMass.value >= 0 ? 'success' : 'warning',
              }
            : undefined,
        },
      ]
    : null;

  const dexaTopFood = bodyInsights.find(i => i.category === 'food');
  const dexaPriorityTitle = bodyInsights[0]?.title ?? 'Stay the course';
  const dexaPriorityBody = dexaTopFood?.actions?.[0] ?? 'Hit protein target daily to protect lean mass.';
  const dexaStatus: 'optimal' | 'average' | 'outOfRange' | 'muted' =
    !latestDexa ? 'muted'
    : latestDexa.bodyComposition.bodyFatPercentage > 25 ? 'outOfRange'
    : latestDexa.bodyComposition.bodyFatPercentage > 18 ? 'average'
    : 'optimal';

  const rythmStatus: 'optimal' | 'average' | 'outOfRange' | 'muted' =
    !latestPanel ? 'muted' : oor >= 3 ? 'outOfRange' : oor > 0 ? 'average' : 'optimal';
  const rythmTopMarker = panelInsights[0];
  const optimalCount = latestPanel?.markers.filter(m => m.status === 'optimal').length ?? 0;
  const rythmStats: [SourceStat, SourceStat] | null = latestPanel
    ? [
        { label: 'Optimal', value: <span className="text-success">{optimalCount}</span>, delta: { text: `of ${latestPanel.markers.length}`, tone: 'muted' } },
        { label: 'Out of range', value: <span className={oor > 0 ? 'text-destructive' : 'text-success'}>{oor}</span>, delta: { text: 'markers', tone: 'muted' } },
      ]
    : null;

  const withingsStale = latestWithings ? daysAgo(latestWithings.scanDate) : null;
  const withingsStatus: 'optimal' | 'average' | 'outOfRange' | 'muted' =
    !latestWithings ? 'muted'
    : (withingsStale ?? 0) > 7 ? 'average'
    : 'optimal';
  const withingsStats: [SourceStat, SourceStat] | null = latestWithings
    ? [
        { label: 'Weight', value: `${latestWithings.bodyComposition.totalMass.toFixed(1)}`, delta: { text: 'lbs', tone: 'muted' } },
        {
          label: 'Body fat',
          value: <span className="text-warning">{latestWithings.bodyComposition.bodyFatPercentage.toFixed(1)}%</span>,
          delta: { text: '↑ trend', tone: 'warning' },
        },
      ]
    : null;

  // ---------- Bottom row ----------
  const trainingTiles: StatTile[] = [
    { label: 'Adherence', value: `${adherenceRate}%`, sub: `${completedScheduleCount} / ${totalScheduled}`, tone: adherenceRate >= 80 ? 'success' : adherenceRate >= 50 ? 'warning' : 'destructive' },
    { label: 'Volume', value: lastVolume.toLocaleString(), sub: 'lbs last session' },
    { label: 'Streak', value: `${streak}d`, tone: streak > 0 ? 'success' : 'default' },
    {
      label: 'Next',
      value: nextEntry ? (nextEntry.date.slice(0, 10) === today ? 'Today' : format(new Date(nextEntry.date), 'EEE')) : '—',
      sub: nextEntry?.workoutName ?? 'no plan',
      tone: nextEntry ? 'success' : 'default',
    },
  ];

  const v = todayLog?.vitals;
  const appleTiles: StatTile[] = [
    { label: 'Steps', value: v?.stepsCount?.toLocaleString() ?? '—' },
    { label: 'Sleep', value: v?.sleepScore ?? (v?.sleepHours ? `${v.sleepHours}h` : '—'), tone: v?.sleepScore && v.sleepScore >= 75 ? 'success' : 'default' },
    { label: 'Blood O₂', value: v?.bloodOxygenPct ? `${v.bloodOxygenPct}%` : '—', tone: v?.bloodOxygenPct && v.bloodOxygenPct >= 95 ? 'success' : 'default' },
    { label: 'Resp. rate', value: v?.respiratoryRateBrpm ? v.respiratoryRateBrpm.toFixed(1) : '—' },
  ];

  if (snapsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Loading…</div>
        </div>
      </Layout>
    );
  }

  if (!latestDexa && !latestPanel && !latestWithings) {
    return (
      <Layout>
        <div className="space-y-8">
          <PageHeader
            title="Welcome to APT Coach"
            description="Body-composition-aware coaching grounded in your real data."
          />
          <SectionCard>
            <EmptyState
              icon={<Activity className="h-12 w-12" />}
              title="No health data yet"
              description="Import your first body scan, blood panel, or smart-scale reading to unlock evidence-based coaching."
              action={
                <Link to="/admin?tab=imports">
                  <Button size="lg"><Upload className="mr-2 h-4 w-4" /> Import Health Data</Button>
                </Link>
              }
            />
          </SectionCard>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Command Center"
          description={`Hey ${user?.name?.split(' ')[0] || 'there'} — here's what your data says today.`}
        />

        {/* 1. Hero AI Summary */}
        <AIHealthSummaryCard
          headline={headline}
          evidenceParts={evidenceParts}
          sources={sources}
          status={heroStatus}
        />

        {/* 2. Signal chip strip */}
        <SignalChipStrip chips={chips} />

        {/* 3. 3-up source cards (mock style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SourceSummaryCard
            title="DEXA"
            status={dexaStatus}
            stats={dexaStats ?? [
              { label: 'Body fat', value: '—' },
              { label: 'Lean mass', value: '—' },
            ]}
            priorityTitle={latestDexa ? dexaPriorityTitle : 'Import a DEXA scan'}
            priorityBody={latestDexa ? dexaPriorityBody : 'Set a baseline to unlock body composition insights.'}
            meta={latestDexa ? format(new Date(latestDexa.scanDate), 'MMM d, yyyy') : null}
            href="/health"
          />
          <SourceSummaryCard
            title="Rythm Health"
            status={rythmStatus}
            stats={rythmStats ?? [
              { label: 'Optimal', value: '—' },
              { label: 'Out of range', value: '—' },
            ]}
            priorityTitle={latestPanel ? (rythmTopMarker?.title ?? 'All markers in range') : 'Import a blood panel'}
            priorityBody={latestPanel ? (rythmTopMarker?.actions?.[0] ?? 'Keep current habits.') : 'Surface marker insights and direction.'}
            meta={latestPanel ? format(new Date(latestPanel.panelDate), 'MMM d, yyyy') : null}
            href="/health"
          />
          <SourceSummaryCard
            title="Withings"
            status={withingsStatus}
            stats={withingsStats ?? [
              { label: 'Weight', value: '—' },
              { label: 'Body fat', value: '—' },
            ]}
            priorityTitle={withingsStale != null && withingsStale > 7 ? 'Daily trend check' : 'Daily trend check'}
            priorityBody={withingsStale != null && withingsStale > 7
              ? `Data stale — ${withingsStale} days ago. Refresh sync.`
              : 'Use as a daily trend check between DEXA scans.'}
            meta={latestWithings ? `${format(new Date(latestWithings.scanDate), 'MMM d, yyyy')}${withingsStale != null && withingsStale > 7 ? ' · stale' : ''}` : null}
            href="/health"
          />
        </div>

        {/* 4. Bottom row: Training Pulse + Apple Health + Supporting Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <StatTilesCard title="Training Pulse" tiles={trainingTiles} />
          <StatTilesCard title="Apple Health · Today" tiles={appleTiles} />
          {supportingInsights.length > 0 ? (
            <AIInsightsPanel
              insights={supportingInsights.slice(0, 3)}
              title="Supporting Insights"
              description="Evidence-cited signals."
              emptyTitle="No additional signals"
            />
          ) : (
            <SectionCard
              title={
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Supporting Insights
                </span>
              }
            >
              <p className="text-xs text-muted-foreground italic">No additional signals yet.</p>
            </SectionCard>
          )}
        </div>

        {/* 5. Detailed Health Direction grid (kept) */}
        <HealthDirectionGrid
          latestDexa={latestDexa}
          latestWithings={latestWithings}
          latestPanel={latestPanel}
          bodyInsights={bodyInsights}
          panelInsights={panelInsights}
          compare={compare}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
