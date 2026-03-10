import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Button from "./Button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}

const EmptyState = ({ icon, title, description, ctaLabel, onCta, className }: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center text-center py-16 px-6 gap-4",
      className
    )}
  >
    {icon && (
      <div className="h-14 w-14 rounded-2xl bg-creatyng-accent-pale flex items-center justify-center text-creatyng-accent">
        {icon}
      </div>
    )}
    <div className="flex flex-col gap-1.5">
      <h3 className="text-sm font-semibold text-[#141417]">{title}</h3>
      {description && (
        <p className="text-sm text-[#8e8e96] max-w-xs">{description}</p>
      )}
    </div>
    {ctaLabel && onCta && (
      <Button variant="primary" size="sm" onClick={onCta}>
        {ctaLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
