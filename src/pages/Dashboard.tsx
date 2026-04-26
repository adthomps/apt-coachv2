import React from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import PageHeader from '@/components/common/PageHeader';
import SectionCard from '@/components/common/SectionCard';
import EmptyState from '@/components/common/EmptyState';
import AIInsightsPanel from '@/components/AIInsightsPanel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity, ArrowRight, Calendar, Dumbbell, Percent, Scale,
  TrendingDown, TrendingUp, Upload, Minus,
} from 'lucide-react';
import { useSnapshots, useBloodPanels, useSchedule } from '@/hooks/use-api-queries';
import { snapshotApi } from '@/lib/api';
import { getBodyScanInsights, getBloodPanelInsights, type Insight } from '@/lib/ai/insights';
import type { ProgressCompare } from '@/lib/api/types';

const Dashboard = () => {
  const { user } = useAuth();
  const { data: snapshots = [], isLoading: snapsLoading } = useSnapshots();
  const { data: bloodPanels = [] } = useBloodPanels();
  const { data: scheduleEntries = [] } = useSchedule();

  const [compare, setCompare] = React.useState<ProgressCompare | null>(null);
  const latestSnapshot = snapshots[0] || null;
  const latestPanel = bloodPanels[0] || null;

  React.useEffect(() => {
    if (snapshots.length > 1) {
      snapshotApi
        .compare(snapshots[0].id, 'last')
        .then(setCompare)
        .catch(() => setCompare(null));
    } else {
      setCompare(null);
    }
  }, [snapshots]);

  const insights: Insight[] = React.useMemo(() => {
    const out: Insight[] = [];
    if (latestSnapshot) out.push(...getBodyScanInsights(latestSnapshot, compare ?? undefined));
    if (latestPanel) out.push(...getBloodPanelInsights(latestPanel));
    return out.slice(0, 6);
  }, [latestSnapshot, latestPanel, compare]);

  const heroInsight = insights[0];
  const restInsights = insights.slice(1);

  // Schedule: next + recent
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = React.useMemo(
    () =>
      scheduleEntries
        .filter((e) => e.status === 'scheduled' && e.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [scheduleEntries, today],
  );
  const nextSession = upcoming[0] || null;

  const completedCount = scheduleEntries.filter((e) => e.status === 'completed').length;
  const totalScheduled = scheduleEntries.length;
  const adherenceRate = totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 0;

  if (snapsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Loading…</div>
        </div>
      </Layout>
    );
  }

  // First-run state — guide to import
  if (!latestSnapshot) {
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
              description="Import your first body scan to unlock evidence-based recommendations, training adjustments, and food guidance."
              action={
                <Link to="/admin">
                  <Button size="lg">
                    <Upload className="mr-2 h-4 w-4" />Import Health Data
                  </Button>
                </Link>
              }
            />
          </SectionCard>
        </div>
      </Layout>
    );
  }

  const bc = latestSnapshot.bodyComposition;

  const formatChange = (v: number, suffix = '') =>
    `${v > 0 ? '+' : ''}${v.toFixed(1)}${suffix}`;
  const changeTone = (v: number, invert = false) => {
    if (Math.abs(v) < 0.5) return 'text-muted-foreground';
    const positive = invert ? v < 0 : v > 0;
    return positive ? 'text-success' : 'text-destructive';
  };
  const TrendIcon = ({ v }: { v: number }) =>
    v > 0.5 ? <TrendingUp className="h-3.5 w-3.5" /> :
    v < -0.5 ? <TrendingDown className="h-3.5 w-3.5" /> :
    <Minus className="h-3.5 w-3.5" />;

  return (
    <Layout>
      <div className="space-y-8">
        <PageHeader
          title="Command Center"
          description={`Hey ${user?.name?.split(' ')[0] || 'there'} — here's what your data says today.`}
        />

        {/* Band 1 — Hero Insight */}
        {heroInsight ? (
          <SectionCard
            title="Today's Headline Insight"
            description="The single most relevant signal from your latest data."
          >
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="outline" className="capitalize mb-2">
                    {heroInsight.category}
                  </Badge>
                  <h3 className="text-lg font-semibold text-foreground">{heroInsight.title}</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{heroInsight.rationale}</p>
              <div className="text-xs text-muted-foreground pt-3 border-t border-border/60">
                <span className="font-medium text-foreground">Evidence:</span>{' '}
                {heroInsight.evidence.label}{' '}
                <span className="font-mono text-foreground">{heroInsight.evidence.value}</span>
                {heroInsight.evidence.reference && <> · ref {heroInsight.evidence.reference}</>}
                {heroInsight.evidence.date && (
                  <> · {format(new Date(heroInsight.evidence.date), 'MMM d, yyyy')}</>
                )}
              </div>
            </div>
          </SectionCard>
        ) : null}

        {/* Band 2 — Body KPIs */}
        <SectionCard
          title="Body Composition"
          description={`Latest scan ${format(new Date(latestSnapshot.scanDate), 'MMM d, yyyy')}${
            latestSnapshot.provider ? ` · ${latestSnapshot.provider}` : ''
          }`}
          action={
            <Link to="/health">
              <Button variant="ghost" size="sm" className="text-xs">
                View health data <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          }
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiCard
              icon={<Scale className="h-4 w-4 text-muted-foreground" />}
              label="Weight"
              value={`${bc.totalMass.toFixed(1)} lbs`}
              change={
                compare && (
                  <span className={`flex items-center gap-1 ${changeTone(compare.changes.totalMass.value)}`}>
                    <TrendIcon v={compare.changes.totalMass.value} />
                    {formatChange(compare.changes.totalMass.value, ' lbs')}
                  </span>
                )
              }
            />
            <KpiCard
              icon={<Percent className="h-4 w-4 text-muted-foreground" />}
              label="Body Fat"
              value={`${bc.bodyFatPercentage.toFixed(1)}%`}
              change={
                compare && (
                  <span className={`flex items-center gap-1 ${changeTone(compare.changes.bodyFatPercentage.value, true)}`}>
                    <TrendIcon v={-compare.changes.bodyFatPercentage.value} />
                    {formatChange(compare.changes.bodyFatPercentage.value, '%')}
                  </span>
                )
              }
            />
            <KpiCard
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              label="Lean Mass"
              value={`${bc.leanMass.toFixed(1)} lbs`}
              change={
                compare && (
                  <span className={`flex items-center gap-1 ${changeTone(compare.changes.leanMass.value)}`}>
                    <TrendIcon v={compare.changes.leanMass.value} />
                    {formatChange(compare.changes.leanMass.value, ' lbs')}
                  </span>
                )
              }
            />
            <KpiCard
              icon={<TrendingDown className="h-4 w-4 text-muted-foreground" />}
              label="Fat Mass"
              value={`${bc.fatMass.toFixed(1)} lbs`}
              change={
                compare && (
                  <span className={`flex items-center gap-1 ${changeTone(compare.changes.fatMass.value, true)}`}>
                    <TrendIcon v={-compare.changes.fatMass.value} />
                    {formatChange(compare.changes.fatMass.value, ' lbs')}
                  </span>
                )
              }
            />
            <KpiCard
              icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
              label="Adherence"
              value={`${adherenceRate}%`}
              change={
                <span className="text-muted-foreground">
                  {completedCount}/{totalScheduled} sessions
                </span>
              }
            />
          </div>
        </SectionCard>

        {/* Band 3 — Next Session + Supporting Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <SectionCard
              title="Next Session"
              description={nextSession ? format(parseISO(nextSession.date), 'EEEE, MMM d') : 'No upcoming work'}
            >
              {nextSession ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">
                      {nextSession.workoutName || 'Workout'}
                    </span>
                  </div>
                  {nextSession.notes && (
                    <p className="text-xs text-muted-foreground italic">"{nextSession.notes}"</p>
                  )}
                  <div className="flex gap-2">
                    <Link to={`/workouts/${nextSession.workoutId}/start`} className="flex-1">
                      <Button size="sm" className="w-full">Start</Button>
                    </Link>
                    <Link to="/schedule">
                      <Button size="sm" variant="outline">View week</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Calendar className="h-8 w-8" />}
                  title="No sessions scheduled"
                  description="Plan a workout to keep adherence on track."
                  action={
                    <Link to="/schedule">
                      <Button size="sm">Open schedule</Button>
                    </Link>
                  }
                />
              )}
            </SectionCard>
          </div>

          <div className="lg:col-span-2">
            <AIInsightsPanel
              insights={restInsights}
              title="Supporting Insights"
              description="Additional signals from your scans and blood panels — every recommendation cites its source."
              emptyTitle="Add more data for richer insights"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, change }) => (
  <Card>
    <CardContent className="pt-5 pb-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {change && <div className="text-xs mt-1">{change}</div>}
    </CardContent>
  </Card>
);

export default Dashboard;
