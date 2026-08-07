import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const Toggle = ({ checked, onChange, label, disabled, className }: ToggleProps) => (
  <label
    className={cn(
      "inline-flex items-center gap-2.5 cursor-pointer select-none",
      disabled && "opacity-50 cursor-not-allowed",
      className
    )}
  >
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-creatyng-accent/20",
        checked ? "bg-creatyng-accent" : "bg-[hsl(var(--border))]"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-card shadow-sm transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
    {label && (
      <span className="text-sm text-[#5a5a60]">{label}</span>
    )}
  </label>
);

export default Toggle;
