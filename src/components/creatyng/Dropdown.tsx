import { ReactNode, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  divider?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
}

const Dropdown = ({ trigger, items, align = "left", className }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            "absolute top-full mt-1.5 z-50 min-w-[160px] bg-card rounded-xl border border-[hsl(var(--border))]",
            "shadow-[0_8px_30px_rgba(0,0,0,0.10)] animate-dropdown-in py-1",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, i) => {
            if (item.divider) {
              return <div key={i} className="my-1 h-px bg-[hsl(var(--border))]" />;
            }
            return (
              <button
                key={i}
                disabled={item.disabled}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-100",
                  item.danger
                    ? "text-creatyng-error hover:bg-[#FFF1F1]"
                    : "text-foreground hover:bg-muted",
                  item.disabled && "opacity-40 cursor-not-allowed"
                )}
              >
                {item.icon && (
                  <span className="h-4 w-4 shrink-0 flex items-center justify-center">
                    {item.icon}
                  </span>
                )}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
