import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-creatyng-accent text-white hover:brightness-110 active:scale-[0.98] shadow-[0_3px_10px_hsl(var(--brand) / 0.30)]",
  secondary:
    "bg-creatyng-dark text-white hover:bg-creatyng-dark/90 active:scale-[0.98]",
  outline:
    "border border-creatyng-accent text-creatyng-accent bg-creatyng-accent-pale hover:bg-creatyng-accent hover:text-white active:scale-[0.98]",
  ghost:
    "text-[#5a5a60] hover:bg-[rgba(20,20,23,0.05)] active:scale-[0.98]",
  danger:
    "bg-creatyng-error text-white hover:brightness-110 active:scale-[0.98]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-7 px-3 text-xs rounded-md gap-1.5",
  md: "h-9 px-4 text-sm rounded-lg gap-2",
  lg: "h-11 px-5 text-base rounded-xl gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, className, children, disabled, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 select-none disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "CreatyngButton";

export default Button;
