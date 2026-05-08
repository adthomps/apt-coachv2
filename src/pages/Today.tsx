import React, { useMemo, useState } from 'react';
import { Scale } from 'lucide-react';
import Layout from '@/components/Layout';
import PageHeader from '@/components/common/PageHeader';
import SectionCard from '@/components/common/SectionCard';
import NutritionBar from '@/components/daily/NutritionBar';
import MealCard from '@/components/daily/MealCard';
import DailyTrainingCard from '@/components/daily/DailyTrainingCard';
import DailySignals from '@/components/daily/DailySignals';
import MetricExplainer from '@/components/health/MetricExplainer';
import NutritionTargetsPanel from '@/components/daily/NutritionTargetsPanel';
import { Input } from '@/components/ui/input';
import { useDailyLog, useAddMeal, useDeleteMeal, useLogWeight, useSnapshots, useSchedule, useSessions, useActiveNutritionGoal } from '@/hooks/use-api-queries';
import { computeNutritionTargets, defaultTargets } from '@/lib/nutrition-targets';
import type { MealSlot, ProgressCompare, Snapshot } from '@/lib/api/types';
import { MEAL_SLOT_LABELS } from '@/lib/api/types';

const todayStr = () => new Date().toISOString().slice(0, 10);

const formatDate = () => {
  const d = new Date();
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

const isWithings = (s: Snapshot) => (s.provider || '').toLowerCase() === 'withings';

const Today: React.FC = () => {
  const date = todayStr();
  const { data: log } = useDailyLog(date);
  const { data: snapshots = [] } = useSnapshots();
  const { data: scheduleEntries = [] } = useSchedule();
  const { data: sessions = [] } = useSessions();
  const { data: activeGoal = null } = useActiveNutritionGoal(date);
  const addMeal = useAddMeal();
  const deleteMeal = useDeleteMeal();
  const logWeight = useLogWeight();

  const [weightInput, setWeightInput] = useState('');

  // Latest DEXA snapshot for nutrition targets
  const dexaSnapshots = useMemo(
    () => snapshots.filter(s => !isWithings(s)).sort((a, b) => b.scanDate.localeCompare(a.scanDate)),
    [snapshots],
  );
  const latestDexa = dexaSnapshots[0];
  const previousDexa = dexaSnapshots[1];

  // Build compare if we have two scans
  const compare = useMemo<ProgressCompare | undefined>(() => {
    if (!latestDexa || !previousDexa) return undefined;
    const cur = latestDexa.bodyComposition;
    const prev = previousDexa.bodyComposition;
    return {
      currentSnapshot: latestDexa,
      previousSnapshot: previousDexa,
      changes: {
        totalMass: { value: cur.totalMass - prev.totalMass, percentage: ((cur.totalMass - prev.totalMass) / prev.totalMass) * 100 },
        fatMass: { value: cur.fatMass - prev.fatMass, percentage: ((cur.fatMass - prev.fatMass) / prev.fatMass) * 100 },
        leanMass: { value: cur.leanMass - prev.leanMass, percentage: ((cur.leanMass - prev.leanMass) / prev.leanMass) * 100 },
        bodyFatPercentage: { value: cur.bodyFatPercentage - prev.bodyFatPercentage, percentage: cur.bodyFatPercentage - prev.bodyFatPercentage },
        regionalChanges: [],
      },
      timeSpanDays: Math.round((new Date(latestDexa.scanDate).getTime() - new Date(previousDexa.scanDate).getTime()) / 86400000),
    };
  }, [latestDexa, previousDexa]);

  const targets = useMemo(() => {
    if (!latestDexa) return defaultTargets();
    return computeNutritionTargets(latestDexa, compare, activeGoal ?? undefined);
  }, [latestDexa, compare, activeGoal]);

  // Consumed totals
  const consumed = useMemo(() => {
    if (!log) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const allMeals = Object.values(log.meals).flat();
    return allMeals.reduce(
      (acc, m) => ({ calories: acc.calories + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [log]);

  // Today's schedule + session
  const todayEntry = useMemo(() => scheduleEntries.find(e => e.date.slice(0, 10) === date), [scheduleEntries, date]);
  const todaySession = useMemo(() => {
    if (!todayEntry?.sessionId) return undefined;
    return sessions.find(s => s.id === todayEntry.sessionId);
  }, [todayEntry, sessions]);

  const handleWeightBlur = () => {
    const w = parseFloat(weightInput);
    if (w > 0) logWeight.mutate({ date, weight: w });
  };

  const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <PageHeader title={`Today — ${formatDate()}`} />
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={log?.bodyWeight ? `${log.bodyWeight} lbs` : 'Morning weight (lbs)'}
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              onBlur={handleWeightBlur}
              onKeyDown={e => e.key === 'Enter' && handleWeightBlur()}
              className="w-40 h-8 text-sm"
              type="number"
              min={0}
            />
          </div>
        </div>

        {/* Nutrition Summary */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Nutrition</h2>
          </div>
          <NutritionBar consumed={consumed} targets={targets} />
          <div className="mt-3">
            <NutritionTargetsPanel targets={targets} activeGoal={activeGoal} />
          </div>
          <div className="mt-2">
            <MetricExplainer
              title="How your targets are calculated"
              compact
              explanation={{
                what: targets.reasoning,
                why: 'Targets are derived from your latest DEXA scan, current goal phase, and any manual overrides.',
                focus: ['Hit your protein target first — it\'s the most important macro for body recomposition.'],
              }}
            />
          </div>
        </section>

        {/* Meal Log */}
        <SectionCard title="Meals">
          <div className="divide-y divide-border">
            {slots.map(slot => (
              <MealCard
                key={slot}
                slot={slot}
                slotLabel={MEAL_SLOT_LABELS[slot]}
                entries={log?.meals[slot] ?? []}
                onAdd={data => addMeal.mutate({ date, slot, entry: data })}
                onDelete={mealId => deleteMeal.mutate({ date, slot, mealId })}
              />
            ))}
          </div>
        </SectionCard>

        {/* Today's Training */}
        <DailyTrainingCard todayEntry={todayEntry} todaySession={todaySession} />

        {/* Daily Signals */}
        <DailySignals consumed={consumed} targets={targets} />
      </div>
    </Layout>
  );
};

export default Today;
