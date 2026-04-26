import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import PageHeader from '@/components/common/PageHeader';
import SectionCard from '@/components/common/SectionCard';
import EmptyState from '@/components/common/EmptyState';
import AIInsightsPanel from '@/components/AIInsightsPanel';
import HealthCommandSummary from '@/components/dashboard/HealthCommandSummary';
import HealthDirectionGrid from '@/components/dashboard/HealthDirectionGrid';
import TrainingSection from '@/components/dashboard/TrainingSection';
import { Button } from '@/components/ui/button';
import {
  useSnapshots, useBloodPanels, useSchedule, useSessions,
} from '@/hooks/use-api-queries';
import { snapshotApi } from '@/lib/api';
import { getBodyScanInsights, getBloodPanelInsights, type Insight } from '@/lib/ai/insights';
import type { ProgressCompare, Snapshot } from '@/lib/api/types';

const isWithings = (s: Snapshot) => (s.provider || '').toLowerCase() === 'withings';

/** Consecutive-day completed-session streak, walking back from today (or yesterday). */
function computeStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;
  const set = new Set(completedDates.map((d) => d.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  if (!set.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: snapshots = [], isLoading: snapsLoading } = useSnapshots();
  const { data: bloodPanels = [] } = useBloodPanels();
  const { data: scheduleEntries = [] } = useSchedule();
  const { data: sessions = [] } = useSessions();

  const dexaSnapshots = React.useMemo(
    () => snapshots.filter((s) => !isWithings(s)).sort((a, b) => b.scanDate.localeCompare(a.scanDate)),
    [snapshots],
  );
  const withingsSnapshots = React.useMemo(
    () => snapshots.filter(isWithings).sort((a, b) => b.scanDate.localeCompare(a.scanDate)),
    [snapshots],
  );

  const latestDexa = dexaSnapshots[0] ?? null;
  const latestWithings = withingsSnapshots[0] ?? null;
  const latestPanel = bloodPanels[0] ?? null;

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
    return headline ? all.filter((i) => i.id !== headline.id).slice(0, 6) : all.slice(0, 6);
  }, [bodyInsights, panelInsights, headline]);

  // Schedule + adherence
  const today = new Date().toISOString().slice(0, 10);
  const completedScheduleCount = scheduleEntries.filter((e) => e.status === 'completed').length;
  const totalScheduled = scheduleEntries.length;
  const adherenceRate = totalScheduled > 0 ? Math.round((completedScheduleCount / totalScheduled) * 100) : 0;
  const upcoming = scheduleEntries
    .filter((e) => e.status === 'scheduled' && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextSessionLabel = upcoming[0]
    ? new Date(upcoming[0].date).toLocaleDateString(undefined, { weekday: 'short' })
    : null;

  const completedDates = sessions
    .filter((s) => s.status === 'completed')
    .map((s) => s.completedAt ?? s.startedAt);
  const streak = computeStreak(completedDates);

  if (snapsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Loading…</div>
        </div>
      </Layout>
    );
  }

  // First-run: no data anywhere
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
                  <Button size="lg">
                    <Upload className="mr-2 h-4 w-4" /> Import Health Data
                  </Button>
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
      <div className="space-y-8">
        <PageHeader
          title="Command Center"
          description={`Hey ${user?.name?.split(' ')[0] || 'there'} — here's what your data says today.`}
        />

        {/* 1. Health Command Summary (with embedded headline) */}
        <HealthCommandSummary
          headline={headline}
          latestSnapshot={latestDexa}
          latestPanel={latestPanel}
          latestWithings={latestWithings}
          compare={compare}
          adherenceRate={adherenceRate}
          completedCount={completedScheduleCount}
          totalScheduled={totalScheduled}
          nextSessionLabel={nextSessionLabel}
          streak={streak}
        />

        {/* 2. Health Direction (Dexa · Rythm · Withings) */}
        <HealthDirectionGrid
          latestDexa={latestDexa}
          latestWithings={latestWithings}
          latestPanel={latestPanel}
          bodyInsights={bodyInsights}
          panelInsights={panelInsights}
        />

        {/* 3. Training */}
        <TrainingSection
          scheduleEntries={scheduleEntries}
          sessions={sessions}
          adherenceRate={adherenceRate}
          completedCount={completedScheduleCount}
          totalScheduled={totalScheduled}
        />

        {/* 4. Supporting Insights */}
        {supportingInsights.length > 0 && (
          <AIInsightsPanel
            insights={supportingInsights}
            title="Supporting Insights"
            description="Every recommendation cites the scan or marker it came from."
            emptyTitle="No additional signals"
          />
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
