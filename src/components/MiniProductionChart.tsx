const data = [3, 5, 2, 7, 4, 6, 8];
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const max = Math.max(...data);
const total = data.reduce((a, b) => a + b, 0);

const MiniProductionChart = () => (
  <div className="space-y-2.5">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Weekly output</span>
      <span className="text-xs text-muted-foreground tabular-nums">{total} total</span>
    </div>

    <div className="flex items-center justify-between gap-1.5">
      {data.map((v, i) => {
        const intensity = v / max;
        // Map intensity to opacity: min 0.12, max 1
        const opacity = 0.12 + intensity * 0.88;

        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="relative group">
              <div
                className="h-8 w-8 rounded-full transition-all duration-200 group-hover:scale-110"
                style={{
                  backgroundColor: `hsl(var(--primary) / ${opacity})`,
                }}
              />
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium tabular-nums opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-foreground whitespace-nowrap">
                {v}
              </span>
            </div>
            <span className="text-[9px] text-muted-foreground/60">{days[i]}</span>
          </div>
        );
      })}
    </div>
  </div>
);

export default MiniProductionChart;
