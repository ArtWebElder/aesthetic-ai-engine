import { useState } from 'react';
import { X, FolderPlus, Wand2, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Step {
  icon: typeof FolderPlus;
  label: string;
  done: boolean;
  action?: () => void;
  actionLabel?: string;
}

interface GettingStartedBannerProps {
  hasProjects: boolean;
  hasGenerations: boolean;
  onCreateProject: () => void;
}

export function GettingStartedBanner({ hasProjects, hasGenerations, onCreateProject }: GettingStartedBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const steps: Step[] = [
    { icon: FolderPlus, label: 'Create a project', done: hasProjects, action: onCreateProject, actionLabel: 'Create' },
    { icon: Wand2, label: 'Generate variations', done: hasGenerations },
    { icon: Download, label: 'Export your assets', done: false },
  ];

  const completedCount = steps.filter(s => s.done).length;

  // Hide if all done
  if (completedCount === steps.length) return null;

  return (
    <div className="relative bg-card border border-border/50 rounded-xl p-5 animate-fade-in">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Getting started</span>
        <span className="text-[10px] text-muted-foreground">·</span>
        <span className="text-[10px] text-muted-foreground">{completedCount}/{steps.length}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {steps.map((step, i) => (
          <div
            key={step.label}
            className={`flex-1 flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-200 ${
              step.done
                ? 'border-primary/20 bg-primary/[0.04]'
                : 'border-border/50 bg-muted/20'
            }`}
          >
            <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
              step.done
                ? 'bg-primary/15 text-primary'
                : 'bg-muted/60 text-muted-foreground'
            }`}>
              {step.done ? <Check className="h-3.5 w-3.5" /> : <step.icon className="h-3.5 w-3.5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${step.done ? 'line-through text-muted-foreground' : ''}`}>
                {step.label}
              </p>
            </div>
            {!step.done && step.action && (
              <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0" onClick={step.action}>
                {step.actionLabel}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
