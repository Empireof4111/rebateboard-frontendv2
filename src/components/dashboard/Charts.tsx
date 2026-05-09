export function MiniLineChart({
  data,
  color = "rgb(16,185,129)",
  height = 120,
}: {
  data: { label: string; amount: number }[];
  color?: string;
  height?: number;
}) {
  const w = 320;
  const h = height;
  const pad = 16;
  const max = Math.max(...data.map((d) => d.amount), 1);
  const coords = data.map((d, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(data.length - 1, 1);
    const y = h - pad - (d.amount / max) * (h - pad * 2);
    return { x, y };
  });
  const points = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const last = coords[coords.length - 1];
  const gid = `lg-${color.replace(/[^a-z0-9]/gi, "")}-${height}`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* baseline grid */}
        {[0.25, 0.5, 0.75].map((p) => (
          <line
            key={p}
            x1={pad}
            x2={w - pad}
            y1={pad + (h - pad * 2) * p}
            y2={pad + (h - pad * 2) * p}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="2 4"
          />
        ))}
        <polygon
          points={`${pad},${h - pad} ${points} ${w - pad},${h - pad}`}
          fill={`url(#${gid})`}
        />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {last && (
          <>
            <circle cx={last.x} cy={last.y} r="6" fill={color} opacity="0.18" />
            <circle cx={last.x} cy={last.y} r="3" fill={color} />
          </>
        )}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

export function SourceBars({
  data,
  color = "from-emerald-500 to-emerald-300",
}: {
  data: { source: string; amount: number }[];
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.source}>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-white/90">{d.source}</span>
            <span className="font-semibold text-white tabular-nums">
              ${d.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${color} transition-[width] duration-700 ease-out`}
              style={{ width: `${(d.amount / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
