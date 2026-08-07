import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "accent" | "success" | "error" | "warning" | "purple";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

// Tints sobre superfície escura: fundo em alpha da própria cor, texto na versão clara dela.
// (Valores arbitrários do Tailwind não aceitam espaço — use `_` no lugar.)
const variantClasses: Record<BadgeVariant, string> = {
  default:  "bg-muted text-muted-foreground",
  accent:   "bg-[hsl(var(--brand)/0.16)] text-[hsl(var(--brand))]",
  success:  "bg-[hsl(152_60%_45%/0.14)] text-[#6EE7A8]",
  error:    "bg-[hsl(0_72%_51%/0.14)] text-[#FCA5A5]",
  warning:  "bg-[hsl(38_92%_50%/0.14)] text-[#FBBF24]",
  purple:   "bg-[hsl(258_90%_66%/0.16)] text-[#C4B5FD]",
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
