/**
 * APT AI Insights — adapter layer.
 *
 * Produces structured Insight objects with REQUIRED evidence citations.
 * No insight without evidence — enforces "no guessing or hyperbole" rule.
 *
 * Today: wraps the deterministic engines (protocol.ts, blood-marker-engine.ts).
 * Future: swap implementation for an LLM-grounded version. UI does not change.
 */

import type {
  Snapshot,
  ProgressCompare,
  BloodPanel,
  AdaptiveRecommendation,
} from '@/lib/api/types';
import { evaluateBloodPanel } from '@/lib/blood-marker-engine';
import { getRecommendation } from '@/lib/protocol';
import { resolveMarkerKey, type MetricKey } from '@/lib/health/metric-glossary';

export type InsightCategory = 'food' | 'training' | 'schedule' | 'lifestyle';
export type InsightSeverity = 'info' | 'attention' | 'urgent';

export interface InsightEvidence {
  source: 'body_scan' | 'blood_panel' | 'session' | 'schedule';
  label: string;
  value: string;
  reference?: string;
  date?: string;
}

export interface Insight {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  rationale: string;
  evidence: InsightEvidence;
  actions?: string[];
  /** Optional glossary key — drives the "The science" disclosure on the card. */
  metricKey?: MetricKey;
  /** Or pass an inline science block when no glossary key fits. */
  science?: { what: string; why: string; focus: string[] };
}

let counter = 0;
const nextId = () => `ins_${Date.now()}_${++counter}`;

function categoryOf(rec: AdaptiveRecommendation): InsightCategory {
  switch (rec.type) {
    case 'food_guidance':
      return 'food';
    case 'schedule_optimization':
      return 'schedule';
    case 'blood_marker_insight':
      return 'lifestyle';
    default:
      return 'training';
  }
}

function severityOf(rec: AdaptiveRecommendation): InsightSeverity {
  if (rec.confidenceScore >= 0.8) return 'attention';
  if (rec.confidenceScore >= 0.7) return 'info';
  return 'info';
}

/** Insights from a body composition scan. Requires at minimum the snapshot itself. */
export function getBodyScanInsights(
  snapshot: Snapshot,
  compare?: ProgressCompare,
): Insight[] {
  const insights: Insight[] = [];
  const rec = getRecommendation(snapshot, compare);

  // Headline insight — the recommendation itself, grounded in scan deltas.
  insights.push({
    id: nextId(),
    category: 'training',
    severity: rec.action === 'continue' ? 'info' : 'attention',
    title:
      rec.action === 'continue'
        ? 'Stay the course'
        : rec.action === 'switch'
          ? 'Consider switching programs'
          : 'New program recommended',
    rationale: rec.reasoning,
    evidence: compare
      ? {
          source: 'body_scan',
          label: 'Lean / fat mass change',
          value: `${compare.changes.leanMass.value > 0 ? '+' : ''}${compare.changes.leanMass.value.toFixed(1)} lbs lean, ${compare.changes.fatMass.value > 0 ? '+' : ''}${compare.changes.fatMass.value.toFixed(1)} lbs fat over ${compare.timeSpanDays} days`,
          date: snapshot.scanDate,
        }
      : {
          source: 'body_scan',
          label: 'Latest scan',
          value: `${snapshot.bodyComposition.bodyFatPercentage.toFixed(1)}% body fat, ${snapshot.bodyComposition.leanMass.toFixed(1)} lbs lean`,
          date: snapshot.scanDate,
        },
    metricKey: compare ? 'lean_mass' : 'body_fat',
  });

  // Food suggestions — each tied to the snapshot.
  for (const fs of rec.foodSuggestions) {
    const fsKey: MetricKey | undefined =
      fs.category === 'protein' ? 'lean_mass'
      : fs.category === 'fat' ? 'body_fat'
      : undefined;
    insights.push({
      id: nextId(),
      category: 'food',
      severity: 'info',
      title: fs.title,
      rationale: fs.description,
      evidence: {
        source: 'body_scan',
        label: 'Body composition',
        value: `${snapshot.bodyComposition.bodyFatPercentage.toFixed(1)}% BF, ${snapshot.bodyComposition.leanMass.toFixed(1)} lbs lean`,
        date: snapshot.scanDate,
      },
      metricKey: fsKey,
    });
  }

  return insights.filter((i) => !!i.evidence?.value);
}

/** Insights from a blood panel. Each tied to a specific marker reading. */
export function getBloodPanelInsights(panel: BloodPanel): Insight[] {
  const recs = evaluateBloodPanel(panel);

  return recs
    .map<Insight | null>((rec) => {
      // Find the marker the engine reasoned about by name in the rationale.
      const marker = panel.markers.find((m) =>
        rec.rationale.toLowerCase().includes(m.marker.toLowerCase()),
      );
      if (!marker) return null; // No evidence → drop.

      return {
        id: rec.id,
        category: categoryOf(rec),
        severity: severityOf(rec),
        title: marker.marker,
        rationale: rec.rationale,
        actions: rec.foodSuggestion ? [rec.foodSuggestion] : undefined,
        evidence: {
          source: 'blood_panel',
          label: marker.marker,
          value: `${marker.value} ${marker.unit}`,
          reference: marker.referenceRange,
          date: marker.time,
        },
      };
    })
    .filter((i): i is Insight => i !== null);
}
