import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import SectionCard from '@/components/common/SectionCard';
import type { NutritionTargets } from '@/lib/api/types';

interface DailySignalsProps {
  consumed: { calories: number; protein: number; carbs: number; fat: number };
  targets: NutritionTargets;
}

const DailySignals: React.FC<DailySignalsProps> = ({ consumed, targets }) => {
  const signals: { icon: React.ReactNode; text: string; tone: 'warn' | 'info' }[] = [];

  const proteinGap = targets.protein - consumed.protein;
  if (proteinGap > 30) {
    signals.push({ icon: <AlertTriangle className="h-4 w-4 text-amber-500" />, text: `You're ${proteinGap}g short on protein — prioritize a high-protein meal.`, tone: 'warn' });
  }

  const calGap = targets.calories - consumed.calories;
  if (calGap > 500) {
    signals.push({ icon: <TrendingDown className="h-4 w-4 text-muted-foreground" />, text: `${calGap} calories remaining — don't skip meals if on a maintenance or surplus goal.`, tone: 'info' });
  } else if (calGap < -300) {
    signals.push({ icon: <TrendingUp className="h-4 w-4 text-amber-500" />, text: `${Math.abs(calGap)} calories over target — consider lighter choices for remaining meals.`, tone: 'warn' });
  }

  if (consumed.protein >= targets.protein && consumed.calories <= targets.calories + 100) {
    signals.push({ icon: <TrendingUp className="h-4 w-4 text-primary" />, text: 'On track — protein target hit and calories in range.', tone: 'info' });
  }

  if (signals.length === 0) {
    signals.push({ icon: <Minus className="h-4 w-4 text-muted-foreground" />, text: 'Log meals to see real-time nutrition signals.', tone: 'info' });
  }

  return (
    <SectionCard title="Daily Signals">
      <ul className="space-y-2">
        {signals.slice(0, 3).map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
            <span className="mt-0.5 shrink-0">{s.icon}</span>
            <span>{s.text}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
};

export default DailySignals;
