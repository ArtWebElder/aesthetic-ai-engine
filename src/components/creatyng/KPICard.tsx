import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: number;
  icon?: ReactNode;
  className?: string;
}

const KPICard = ({ label, value, trend, icon, className }: KPICardProps) => {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  const isNeutral = trend !== undefined && trend === 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-4 bg-white rounded-2xl border border-[rgba(20,20,23,0.06)]",
        "shadow-[0_1px_3px_rgba(20,20,23,0.04)] hover:shadow-[0_8px_24px_rgba(20,20,23,0.08)]",
        "transition-shadow duration-200",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8e8e96]">{label}</span>
        {icon && (
          <div className="h-8 w-8 rounded-xl bg-creatyng-accent-pale flex items-center justify-center text-creatyng-accent">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-semibold text-[#141417]">{value}</span>
        {trend !== undefined && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              isPositive && "text-creatyng-success",
              isNegative && "text-creatyng-error",
              isNeutral && "text-[#8e8e96]"
            )}
          >
            {isPositive && <TrendingUp className="h-3 w-3" />}
            {isNegative && <TrendingDown className="h-3 w-3" />}
            {isNeutral && <Minus className="h-3 w-3" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
