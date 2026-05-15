import React from 'react';

interface Props {
  /** Seconds in zones [Z1, Z2, Z3, Z4, Z5]. */
  zones: [number, number, number, number, number];
}

const ZONE_META = [
  { label: 'Z1', hint: 'Recovery',   color: 'bg-muted-foreground/50' },
  { label: 'Z2', hint: 'Endurance',  color: 'bg-success/70' },
  { label: 'Z3', hint: 'Tempo',      color: 'bg-accent/70' },
  { label: 'Z4', hint: 'Threshold',  color: 'bg-warning/80' },
  { label: 'Z5', hint: 'VO2 max',    color: 'bg-destructive/80' },
];

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
};

const HeartRateZoneBar: React.FC<Props> = ({ zones }) => {
  const total = zones.reduce((a, b) => a + b, 0);
  if (total === 0) {
    return <p className="text-xs text-muted-foreground">No HR zone data for this session.</p>;
  }
  return (
    <div className="space-y-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full border border-border">
        {zones.map((s, i) => (
          <div
            key={i}
            className={ZONE_META[i].color}
            style={{ width: `${(s / total) * 100}%` }}
            title={`${ZONE_META[i].label} ${ZONE_META[i].hint} — ${fmt(s)}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2 text-[11px]">
        {zones.map((s, i) => (
          <div key={i} className="text-center">
            <div className="font-medium text-foreground">{ZONE_META[i].label}</div>
            <div className="tabular-nums text-muted-foreground">{fmt(s)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeartRateZoneBar;
