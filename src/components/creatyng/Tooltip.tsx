import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const sideClasses = {
  top:    "-top-2 left-1/2 -translate-x-1/2 -translate-y-full",
  bottom: "-bottom-2 left-1/2 -translate-x-1/2 translate-y-full",
  left:   "top-1/2 -left-2 -translate-x-full -translate-y-1/2",
  right:  "top-1/2 -right-2 translate-x-full -translate-y-1/2",
};

const arrowClasses = {
  top:    "bottom-[-4px] left-1/2 -translate-x-1/2 border-t-[#141417]",
  bottom: "top-[-4px] left-1/2 -translate-x-1/2 border-b-[#141417]",
  left:   "right-[-4px] top-1/2 -translate-y-1/2 border-l-[#141417]",
  right:  "left-[-4px] top-1/2 -translate-y-1/2 border-r-[#141417]",
};

const Tooltip = ({ content, children, side = "top", className }: TooltipProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && (
        <div
          className={cn(
            "absolute z-50 px-2.5 py-1.5 rounded-lg bg-[#141417] text-white text-xs font-medium whitespace-nowrap",
            "shadow-[0_8px_30px_rgba(0,0,0,0.10)] animate-fade-in pointer-events-none",
            sideClasses[side],
            className
          )}
        >
          {content}
          <span
            className={cn(
              "absolute w-0 h-0 border-4 border-transparent",
              arrowClasses[side]
            )}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
