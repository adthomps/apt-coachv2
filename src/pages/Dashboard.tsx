import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Activity, TrendingUp, TrendingDown, Minus, Scale, Percent, Utensils,
  ArrowRight, Dumbbell, Lightbulb, Upload, Zap, Calendar, CheckCircle,
  XCircle, Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useSnapshots, useAdaptiveRecommendations, useSchedule } from '@/hooks/use-api-queries';
import { snapshotApi } from '@/lib/api';
import { getRecommendation } from '@/lib/protocol';
import type { ProgressCompare, Recommendation } from '@/lib/api/types';
import { format } from 'date-fns';

const INSIGHT_ICONS: Record<string, React.ReactNode> = {
  weight_progression: <TrendingUp className="h-4 w-4 text-primary" />,
  rep_adjustment: <Target className="h-4 w-4 text-warning" />,
  volume_adjustment: <Dumbbell className="h-4 w-4 text-accent" />,
  exercise_substitution: <ArrowRight className="h-4 w-4 text-muted-foreground" />,
  schedule_optimization: <Calendar className="h-4 w-4 text-warning" />,
  program_adjustment: <Activity className="h-4 w-4 text-destructive" />,
  food_guidance: <Utensils className="h-4 w-4 text-warning" />,
  training_insight: <Zap className="h-4 w-4 text-primary" />,
};

const Dashboard = () => {
  const { user } = useAuth();
  const { data: snapshots = [], isLoading: snapsLoading } = useSnapshots();
  const { data: adaptiveRecs = [] } = useAdaptiveRecommendations();
  const { data: scheduleEntries = [] } = useSchedule();

  const [compare, setCompare] = React.useState<ProgressCompare | null>(null);
  const [recommendation, setRecommendation] = React.useState<Recommendation | null>(null);

  const latestSnapshot = snapshots[0] || null;

  // Load comparison when snapshots change
  React.useEffect(() => {
    if (snapshots.length > 1) {
      snapshotApi.compare(snapshots[0].id, 'last').then(comp => {
        setCompare(comp);
        setRecommendation(getRecommendation(snapshots[0], comp, 'Upper/Lower Recomp'));
      }).catch(() => setCompare(null));
    } else if (snapshots.length === 1) {
      setRecommendation(getRecommendation(snapshots[0], undefined, 'Upper/Lower Recomp'));
    }
  }, [snapshots]);

  const formatChange = (v: number, suffix = '') => `${v > 0 ? '+' : ''}${v.toFixed(1)}${suffix}`;
  const changeColor = (v: number, invert = false) => {
    const positive = invert ? v < 0 : v > 0;
    if (Math.abs(v) < 0.5) return 'text-muted-foreground';
    return positive ? 'text-success' : 'text-destructive';
  };
  const trendIcon = (v: number) => {
    if (v > 0.5) return <TrendingUp className="h-4 w-4" />;
    if (v < -0.5) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const completedCount = scheduleEntries.filter(e => e.status === 'completed').length;
  const totalScheduled = scheduleEntries.length;
  const adherenceRate = totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 0;

  if (snapsLoading) {
    return <Layout><div className="flex items-center justify-center h-96"><div className="animate-pulse text-muted-foreground">Loading command center...</div></div></Layout>;
  }

  if (!latestSnapshot) {
    return (
      <Layout>
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">Welcome to APT Fitness Coach</h2>
            <p className="text-muted-foreground">Your body-composition-aware coaching system</p>
          </div>
          <Card className="text-center py-16">
            <CardContent>
              <Activity className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">No Snapshots Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Import your first BodySpec scan to unlock personalized program recommendations, body composition tracking, and food suggestions.
              </p>
              <Link to="/snapshots">
                <Button size="lg">
                  <Upload className="mr-2 h-5 w-5" />Import Your First Snapshot
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const bc = latestSnapshot.bodyComposition;

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-1">Command Center</h2>
          <p className="text-muted-foreground">
            Hey {user?.name?.split(' ')[0]} — here's your body composition overview and coaching recommendations.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Weight</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{bc.totalMass.toFixed(1)} lbs</div>
              {compare && <div className={`text-sm flex items-center gap-1 ${changeColor(compare.changes.totalMass.value)}`}>{trendIcon(compare.changes.totalMass.value)}{formatChange(compare.changes.totalMass.value, ' lbs')}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Body Fat</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{bc.bodyFatPercentage.toFixed(1)}%</div>
              {compare && <div className={`text-sm flex items-center gap-1 ${changeColor(compare.changes.bodyFatPercentage.value, true)}`}>{trendIcon(-compare.changes.bodyFatPercentage.value)}{formatChange(compare.changes.bodyFatPercentage.value, '%')}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Lean Mass</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{bc.leanMass.toFixed(1)} lbs</div>
              {compare && <div className={`text-sm flex items-center gap-1 ${changeColor(compare.changes.leanMass.value)}`}>{trendIcon(compare.changes.leanMass.value)}{formatChange(compare.changes.leanMass.value, ' lbs')}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Fat Mass</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{bc.fatMass.toFixed(1)} lbs</div>
              {compare && <div className={`text-sm flex items-center gap-1 ${changeColor(compare.changes.fatMass.value, true)}`}>{trendIcon(-compare.changes.fatMass.value)}{formatChange(compare.changes.fatMass.value, ' lbs')}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Adherence</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{adherenceRate}%</div>
              <div className="text-sm text-muted-foreground">{completedCount}/{totalScheduled} sessions</div>
            </CardContent>
          </Card>
        </div>

        {/* Training Insights */}
        {adaptiveRecs.length > 0 && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Training Insights
                <Badge variant="secondary">{adaptiveRecs.length}</Badge>
              </CardTitle>
              <CardDescription>Adaptive recommendations based on your performance, adherence, and body composition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {adaptiveRecs.slice(0, 5).map(rec => (
                  <div key={rec.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                    <div className="mt-0.5 shrink-0">{INSIGHT_ICONS[rec.type] || <Zap className="h-4 w-4 text-muted-foreground" />}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs capitalize">{rec.type.replace(/_/g, ' ')}</Badge>
                        {rec.targetExerciseName && <span className="text-xs font-medium text-foreground">{rec.targetExerciseName}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{rec.rationale}</p>
                      {rec.suggestedWeight && (
                        <div className="mt-1.5 text-sm font-medium text-primary">
                          Suggested: {rec.suggestedWeight} lbs
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedule Overview */}
        {scheduleEntries.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">No Schedule Yet</h3>
              <p className="text-muted-foreground mb-4">Create a training schedule to track adherence and plan your week.</p>
              <Link to="/schedule"><Button size="sm">Set Up Schedule <ArrowRight className="ml-2 h-3 w-3" /></Button></Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Recent Schedule
                </CardTitle>
                <Link to="/schedule">
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                    View Full Schedule <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {scheduleEntries.slice(0, 10).map(entry => (
                  <Link key={entry.id} to={`/schedule?date=${entry.date}`}>
                    <div className={`p-2.5 rounded-lg border text-center text-sm cursor-pointer hover:shadow-sm transition-shadow ${
                      entry.status === 'completed' ? 'border-accent/30 bg-accent/5' :
                      entry.status === 'skipped' ? 'border-destructive/30 bg-destructive/5' :
                      entry.status === 'scheduled' ? 'border-primary/30 bg-primary/5' :
                      'border-border bg-muted/20'
                    }`}>
                      <div className="text-xs text-muted-foreground">{format(new Date(entry.date), 'MMM d')}</div>
                      <div className="font-medium text-foreground text-xs mt-0.5 truncate">{entry.workoutName || 'Workout'}</div>
                      <div className="mt-1">
                        {entry.status === 'completed' && <CheckCircle className="h-3.5 w-3.5 text-accent mx-auto" />}
                        {entry.status === 'skipped' && <XCircle className="h-3.5 w-3.5 text-destructive mx-auto" />}
                        {entry.status === 'scheduled' && <Calendar className="h-3.5 w-3.5 text-primary mx-auto" />}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-accent" />Completed
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-destructive" />Skipped
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-primary" />Scheduled
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Progress Compare */}
          {compare && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Progress Compare
                </CardTitle>
                <CardDescription>
                  vs. scan from {format(new Date(compare.previousSnapshot.scanDate), 'MMM d, yyyy')} ({compare.timeSpanDays} days)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Lean Mass Ratio</span>
                      <span className="font-medium">{((bc.leanMass / bc.totalMass) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(bc.leanMass / bc.totalMass) * 100} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Fat Mass Ratio</span>
                      <span className="font-medium">{bc.bodyFatPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={bc.bodyFatPercentage} className="h-3" />
                  </div>
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-medium mb-3 text-foreground">Key Regional Changes</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {compare.changes.regionalChanges.map(r => (
                        <div key={r.region} className="p-3 bg-muted/30 rounded-lg">
                          <div className="text-xs text-muted-foreground capitalize">{r.region}</div>
                          <div className="flex gap-3 mt-1 text-sm">
                            <span className={changeColor(r.leanChange)}>Lean {formatChange(r.leanChange)}</span>
                            <span className={changeColor(r.fatChange, true)}>Fat {formatChange(r.fatChange)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Snapshot info */}
          <Card className={compare ? '' : 'lg:col-span-2'}>
            <CardHeader>
              <CardTitle>Current Snapshot</CardTitle>
              <CardDescription>
                {format(new Date(latestSnapshot.scanDate), 'MMMM d, yyyy')}
                {latestSnapshot.provider && ` • ${latestSnapshot.provider}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-muted-foreground">Weight</div>
                  <div className="font-semibold text-foreground">{bc.totalMass.toFixed(1)} lbs</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-muted-foreground">Body Fat</div>
                  <div className="font-semibold text-foreground">{bc.bodyFatPercentage.toFixed(1)}%</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-muted-foreground">Lean Mass</div>
                  <div className="font-semibold text-foreground">{bc.leanMass.toFixed(1)} lbs</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-muted-foreground">Bone Mass</div>
                  <div className="font-semibold text-foreground">{bc.boneMass.toFixed(1)} lbs</div>
                </div>
              </div>
              <Link to="/snapshots">
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View All Snapshots <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recommendation */}
        {recommendation && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  Recommended Action
                </CardTitle>
                <Badge variant="outline" className="w-fit capitalize">
                  {recommendation.action === 'continue' ? '✅ Continue' : recommendation.action === 'switch' ? '🔄 Switch' : '🆕 Generate New'}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{recommendation.reasoning}</p>
                {recommendation.programName && (
                  <div className="mt-4">
                    <Link to="/programs">
                      <Button size="sm">
                        View Program <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-warning" />
                  Food Suggestions
                </CardTitle>
                <CardDescription>Practical nutrition guidance based on your composition</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendation.foodSuggestions.map((fs, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                      <Lightbulb className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-foreground">{fs.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{fs.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
