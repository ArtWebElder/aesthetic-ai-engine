import { LucideIcon, Sparkles } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = Sparkles, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-14 text-center animate-fade-in">
      <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-5">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-heading font-semibold text-lg">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 mb-6 max-w-xs mx-auto">{description}</p>
      )}
      {action && !description && <div className="mt-6">{action}</div>}
      {action && description && <div>{action}</div>}
    </div>
  );
}
