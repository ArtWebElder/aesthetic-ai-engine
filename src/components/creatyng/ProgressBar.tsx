import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: string;
  className?: string;
}

const ProgressBar = ({
  value,
  max = 100,
  label,
  showValue = false,
  color = "bg-creatyng-accent",
  className,
}: ProgressBarProps) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs text-[#5a5a60]">{label}</span>}
          {showValue && (
            <span className="text-xs font-medium text-[#141417]">{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-[rgba(20,20,23,0.06)] overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
