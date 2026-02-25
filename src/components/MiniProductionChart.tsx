const data = [3, 5, 2, 7, 4, 6, 8];
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const max = Math.max(...data);
const h = 64;
const w = 160;
const padY = 8;
const stepX = w / (data.length - 1);

const points = data.map((v, i) => {
  const x = i * stepX;
  const y = h - padY - ((v / max) * (h - padY * 2));
  return `${x},${y}`;
});

const polyline = points.join(' ');

const MiniProductionChart = () => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Weekly output</span>
      <span className="text-xs text-muted-foreground">{data.reduce((a, b) => a + b, 0)} total</span>
    </div>
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon
        points={`0,${h} ${polyline} ${w},${h}`}
        fill="url(#chartGlow)"
      />
      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dots */}
      {data.map((v, i) => {
        const x = i * stepX;
        const y = h - padY - ((v / max) * (h - padY * 2));
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="2.5"
            fill="hsl(var(--background))"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
    <div className="flex justify-between">
      {days.map((d) => (
        <span key={d} className="text-[9px] text-muted-foreground/60">{d}</span>
      ))}
    </div>
  </div>
);

export default MiniProductionChart;
