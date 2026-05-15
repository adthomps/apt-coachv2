import React, { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import NutritionBar from '@/components/daily/NutritionBar';
import MealCard from '@/components/daily/MealCard';
import DailyTrainingCard from '@/components/daily/DailyTrainingCard';
import SectionCard from '@/components/common/SectionCard';
import NutritionTargetsPanel from '@/components/daily/NutritionTargetsPanel';
import TodayHeader from '@/components/daily/TodayHeader';
import AIDirectionBanner from '@/components/daily/AIDirectionBanner';
import DailyInputsCard, { countLoggedInputs, DAILY_INPUT_TOTAL } from '@/components/daily/DailyInputsCard';
import MiniMonthCalendar from '@/components/daily/MiniMonthCalendar';
import YearMonthSignalsCard, { type Signal } from '@/components/daily/YearMonthSignalsCard';
import ChangesTodayCard, { type ChangeNote } from '@/components/daily/ChangesTodayCard';
import MonthDirectionCard, { type DirectionTile } from '@/components/daily/MonthDirectionCard';
import DayGoalsCard, { type DayGoal } from '@/components/daily/DayGoalsCard';
import {
  useDailyLog, useAddMeal, useUpdateMeal, useDeleteMeal, useSnapshots, useSchedule,
  useSessions, useActiveNutritionGoal, useBloodPanels,
} from '@/hooks/use-api-queries';
import { computeNutritionTargets, defaultTargets } from '@/lib/nutrition-targets';
import { getRecommendation } from '@/lib/protocol';
import type { MealSlot, ProgressCompare, Snapshot } from '@/lib/api/types';
import { MEAL_SLOT_LABELS } from '@/lib/api/types';

const todayStr = () => new Date().toISOString().slice(0, 10);
const isWithings = (s: Snapshot) => (s.provider || '').toLowerCase() === 'withings';

const Today: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const date = params.get('date') ?? todayStr();
  const setDate = (d: string) => {
    const next = new URLSearchParams(params);
    if (d === todayStr()) next.delete('date'); else next.set('date', d);
    setParams(next, { replace: true });
  };

  const { data: log } = useDailyLog(date);
  const { data: snapshots = [] } = useSnapshots();
  const { data: scheduleEntries = [] } = useSchedule();
  const { data: sessions = [] } = useSessions();
  const { data: bloodPanels = [] } = useBloodPanels();
  const { data: activeGoal = null } = useActiveNutritionGoal(date);
  const addMeal = useAddMeal();
  const updateMeal = useUpdateMeal();
  const deleteMeal = useDeleteMeal();

  const [aiRefreshedAt, setAiRefreshedAt] = useState<string>(() => new Date().toISOString());
  const [refreshing, setRefreshing] = useState(false);

  // DEXA snapshots → nutrition targets
  const dexaSnapshots = useMemo(
    () => snapshots.filter(s => !isWithings(s)).sort((a, b) => b.scanDate.localeCompare(a.scanDate)),
    [snapshots],
  );
  const latestDexa = dexaSnapshots[0];
  const previousDexa = dexaSnapshots[1];

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

  const consumed = useMemo(() => {
    if (!log) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return Object.values(log.meals).flat().reduce(
      (a, m) => ({ calories: a.calories + m.calories, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [log]);

  const todayEntry = useMemo(() => scheduleEntries.find(e => e.date.slice(0, 10) === date), [scheduleEntries, date]);
  const todaySession = useMemo(
    () => todayEntry?.sessionId ? sessions.find(s => s.id === todayEntry.sessionId) : undefined,
    [todayEntry, sessions],
  );

  const recommendation = useMemo(
    () => latestDexa ? getRecommendation(latestDexa, compare) : undefined,
    [latestDexa, compare],
  );

  // Year/Month signals derived from compare + latest blood panel
  const signals = useMemo<Signal[]>(() => {
    const out: Signal[] = [];
    if (compare) {
      const fm = compare.changes.fatMass.value;
      out.push({
        id: 'fat',
        status: fm > 0.5 ? 'act' : fm < -0.5 ? 'good' : 'watch',
        title: fm > 0 ? 'Fat mass rising' : 'Fat mass holding',
        detail: `${fm > 0 ? '+' : ''}${fm.toFixed(1)} lbs since last DEXA · ${compare.timeSpanDays}d`,
        source: 'DEXA monthly',
      });
      const lm = compare.changes.leanMass.value;
      out.push({
        id: 'lean',
        status: lm > 0 ? 'good' : lm < -0.5 ? 'act' : 'watch',
        title: lm >= 0 ? 'Lean mass holding' : 'Lean mass declining',
        detail: `${lm > 0 ? '+' : ''}${lm.toFixed(1)} lbs since last DEXA`,
        source: 'DEXA monthly',
      });
    }
    const latestPanel = bloodPanels.slice().sort((a, b) => b.panelDate.localeCompare(a.panelDate))[0];
    if (latestPanel) {
      const oor = latestPanel.markers.filter(m => m.status === 'outOfRange').length;
      out.push({
        id: 'panel',
        status: oor >= 3 ? 'act' : oor > 0 ? 'watch' : 'good',
        title: oor === 0 ? 'Blood markers in range' : 'Markers out of range',
        detail: `${latestPanel.markers.length} markers · ${oor} OOR`,
        source: 'Rythm monthly',
      });
    }
    if (latestDexa?.boneDensity?.tScore != null) {
      const t = latestDexa.boneDensity.tScore;
      out.push({
        id: 'bone',
        status: t >= -1 ? 'good' : t >= -2.5 ? 'watch' : 'act',
        title: 'Bone density',
        detail: `T-score ${t.toFixed(1)}${latestDexa.boneDensity.zScore != null ? ` · Z-score ${latestDexa.boneDensity.zScore.toFixed(1)}` : ''}`,
        source: 'DEXA',
      });
    }
    return out;
  }, [compare, bloodPanels, latestDexa]);

  // Daily change notes
  const changeNotes = useMemo<ChangeNote[]>(() => {
    const notes: ChangeNote[] = [];
    const proteinGap = targets.protein - consumed.protein;
    const carbOver = consumed.carbs - targets.carbs;
    if (proteinGap > 20) {
      notes.push({
        id: 'n1', category: 'nutrition',
        label: 'Protein gap',
        body: `Protein still ${Math.round(proteinGap)}g short — plan a post-session shake or cottage cheese.`,
      });
    } else if (carbOver > 20) {
      notes.push({
        id: 'n1', category: 'nutrition',
        label: 'Carbs over',
        body: `Carbs ${Math.round(carbOver)}g over target — opt for vegetable-based dinner rather than starchy carbs.`,
      });
    } else if (consumed.calories > 0) {
      notes.push({
        id: 'n1', category: 'nutrition',
        label: 'Nutrition',
        body: 'Macros are tracking on target — keep meal timing consistent through the evening.',
      });
    }

    if (todaySession) {
      const wt = todaySession.workoutName ?? 'Today\'s session';
      notes.push({
        id: 'n2', category: 'training',
        label: 'Training',
        body: `${wt}. RPE 7–8 max given recovery pressure. Add a 15-min Z2 warm-up to support cardiometabolic markers.`,
      });
    } else if (todayEntry) {
      notes.push({
        id: 'n2', category: 'training',
        label: 'Training',
        body: 'Scheduled session not started yet — open Training when ready.',
      });
    }

    const completed = scheduleEntries.filter(e => e.status === 'completed').length;
    const planned = scheduleEntries.length || 1;
    notes.push({
      id: 'n3', category: 'week',
      label: 'Week direction',
      body: `${completed} of ${planned} sessions complete this cycle. Aim to close remaining Z2 minutes for cardio direction.`,
    });
    return notes;
  }, [targets, consumed, todaySession, todayEntry, scheduleEntries]);

  const loggedCount = countLoggedInputs(log?.vitals, log?.bodyWeight);

  // Month direction tiles
  const monthTiles = useMemo<DirectionTile[]>(() => {
    const tiles: DirectionTile[] = [];
    if (compare) {
      const fmPct = compare.changes.fatMass.percentage;
      tiles.push({
        id: 'fat', label: 'Fat trend',
        value: `${fmPct >= 0 ? '+' : ''}${fmPct.toFixed(1)}%`,
        sub: fmPct > 0 ? 'up' : fmPct < 0 ? 'down' : 'flat',
        trend: fmPct > 0 ? 'up' : fmPct < 0 ? 'down' : 'flat',
        status: fmPct > 0.5 ? 'act' : fmPct < 0 ? 'good' : 'watch',
      });
      const lm = compare.changes.leanMass.value;
      tiles.push({
        id: 'lean', label: 'Lean',
        value: `${lm >= 0 ? '+' : ''}${lm.toFixed(1)} lbs`,
        sub: lm >= 0 ? 'good' : 'watch',
        status: lm >= 0 ? 'good' : 'watch',
      });
    }
    const latestPanel = bloodPanels.slice().sort((a, b) => b.panelDate.localeCompare(a.panelDate))[0];
    if (latestPanel) {
      const oor = latestPanel.markers.filter(m => m.status === 'outOfRange').length;
      tiles.push({
        id: 'oor', label: 'OOR', value: String(oor),
        sub: 'blood panel',
        status: oor >= 3 ? 'act' : oor > 0 ? 'watch' : 'good',
      });
    }
    const completed = scheduleEntries.filter(e => e.status === 'completed').length;
    const planned = scheduleEntries.length || 0;
    tiles.push({
      id: 'sessions', label: 'Sessions',
      value: `${completed}/${planned || '—'}`,
      sub: planned ? `${Math.round((completed / planned) * 100)}%` : 'no plan',
      status: planned && completed / planned >= 0.7 ? 'good' : 'watch',
    });
    return tiles;
  }, [compare, bloodPanels, scheduleEntries]);

  // Day goals
  const dayGoals = useMemo<DayGoal[]>(() => {
    const proteinRem = Math.max(targets.protein - consumed.protein, 0);
    const stepGoal = 8000;
    const steps = log?.vitals?.stepsCount ?? 0;
    const waterGoal = 2.5; // L
    const waterOz = log?.vitals?.waterIntakeOz ?? 0;
    const waterL = waterOz * 0.0295735;
    const sessionTime = todaySession ? 'completed' : todayEntry ? 'scheduled' : 'no session';
    return [
      {
        id: 'protein', label: 'Protein target',
        target: `${targets.protein}g`,
        status: `${consumed.protein}g logged · ${Math.round(proteinRem)}g remaining`,
        tone: proteinRem === 0 ? 'good' : 'pending',
      },
      {
        id: 'steps', label: 'Step target',
        target: stepGoal.toLocaleString(),
        status: `${steps.toLocaleString()} so far`,
        tone: steps >= stepGoal ? 'good' : 'pending',
      },
      {
        id: 'water', label: 'Water target',
        target: `${waterGoal.toFixed(1)} L`,
        status: waterOz > 0 ? `${waterL.toFixed(1)} L logged` : 'not yet logged',
        tone: waterL >= waterGoal ? 'good' : 'pending',
      },
      {
        id: 'session', label: 'Session',
        target: todaySession?.workoutName ?? todayEntry?.notes ?? '—',
        status: sessionTime,
        tone: 'info',
      },
    ];
  }, [targets, consumed, log, todaySession, todayEntry]);

  const refreshAI = () => {
    setRefreshing(true);
    setTimeout(() => {
      setAiRefreshedAt(new Date().toISOString());
      setRefreshing(false);
    }, 600);
  };

  const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-300">
        <TodayHeader
          date={date}
          loggedCount={loggedCount}
          totalCount={DAILY_INPUT_TOTAL}
          aiRefreshedAt={aiRefreshedAt}
          onChangeDate={setDate}
          onRefreshAI={refreshAI}
          refreshing={refreshing}
        />

        {recommendation && (
          <AIDirectionBanner text={recommendation.reasoning} refreshedAt={aiRefreshedAt} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT — 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            <DailyInputsCard date={date} vitals={log?.vitals} bodyWeight={log?.bodyWeight} />

            <SectionCard
              title={
                <span className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">
                  Nutrition Goals
                </span>
              }
            >
              <div className="space-y-4">
                <NutritionTargetsPanel targets={targets} activeGoal={activeGoal} />
                <NutritionBar consumed={consumed} targets={targets} />
              </div>
            </SectionCard>

            <DayGoalsCard goals={dayGoals} onEdit={() => navigate('/settings')} />

            <SectionCard
              title={
                <span className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">
                  Meals · {Math.round(consumed.calories).toLocaleString()} kcal
                </span>
              }
            >
              <div className="divide-y divide-border">
                {slots.map(slot => (
                  <MealCard
                    key={slot}
                    slot={slot}
                    slotLabel={MEAL_SLOT_LABELS[slot]}
                    entries={log?.meals[slot] ?? []}
                    onAdd={data => addMeal.mutate({ date, slot, entry: data })}
                    onUpdate={(mealId, data) => updateMeal.mutate({ date, slot, mealId, patch: data })}
                    onDelete={mealId => deleteMeal.mutate({ date, slot, mealId })}
                  />
                ))}
              </div>
            </SectionCard>

            <DailyTrainingCard todayEntry={todayEntry} todaySession={todaySession} />
          </div>

          {/* RIGHT — 1/3 */}
          <div className="space-y-6">
            <MiniMonthCalendar
              selectedDate={date}
              onSelect={setDate}
              status={log ? { [date]: loggedCount === DAILY_INPUT_TOTAL ? 'complete' : loggedCount > 0 ? 'partial' : undefined } as Record<string, 'complete' | 'partial'> : {}}
              
            />
            <YearMonthSignalsCard signals={signals} onMoreInfo={() => navigate('/health')} />
            <MonthDirectionCard tiles={monthTiles} />
            <ChangesTodayCard notes={changeNotes} onRefresh={refreshAI} refreshing={refreshing} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Today;
