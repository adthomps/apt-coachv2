import React from 'react';
import { Info } from 'lucide-react';

/**
 * Explains the source-of-truth hierarchy used across the Health hub:
 * DEXA + Rythm are ground truth; everything else is daily/contextual.
 */
const GroundTruthLegend: React.FC = () => (
  <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
    <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
    <div className="text-xs text-muted-foreground leading-relaxed">
      <span className="font-medium text-foreground">DEXA</span> and <span className="font-medium text-foreground">Rythm Health</span> are
      treated as ground truth — they drive your nutrition targets and marker insights. Daily devices
      (<span className="font-medium">Withings</span>, <span className="font-medium">Skulpt</span>, <span className="font-medium">Apple Health</span>, <span className="font-medium">Lumen</span>)
      overlay for context only and never change the math.
    </div>
  </div>
);

export default GroundTruthLegend;
