import { ReactNode } from 'react';

interface SectionHeaderProps {
  label: string;
  action?: ReactNode;
}

export function SectionHeader({ label, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      {action}
    </div>
  );
}
