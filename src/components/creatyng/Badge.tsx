import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "accent" | "success" | "error" | "warning" | "purple";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  "bg-[rgba(20,20,23,0.06)] text-[#5a5a60]",
  accent:   "bg-creatyng-accent-pale text-creatyng-accent",
  success:  "bg-[#D1FAE5] text-[#065F46]",
  error:    "bg-[#FEE2E2] text-[#991B1B]",
  warning:  "bg-[#FEF3C7] text-[#92400E]",
  purple:   "bg-[#EDE9FE] text-creatyng-purple",
};

const Badge = ({ variant = "default", className, children, ...props }: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
      variantClasses[variant],
      className
    )}
    {...props}
  >
    {children}
  </span>
);

export default Badge;
