import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[#5a5a60]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8e96] pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-9 rounded-lg border bg-white text-sm text-[#141417] placeholder:text-[#b5b5bb]",
              "border-[rgba(20,20,23,0.10)] focus:border-creatyng-accent focus:outline-none focus:ring-2 focus:ring-creatyng-accent/15",
              "transition-all duration-150",
              icon ? "pl-9 pr-3" : "px-3",
              error && "border-creatyng-error focus:border-creatyng-error focus:ring-creatyng-error/15",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-creatyng-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "CreatyngInput";

export default Input;
