import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
}

const StatCard = ({ title, value, icon: Icon, subtitle }: StatCardProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-5 hover-lift">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{title}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-heading font-semibold">{value}</div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
};

export default StatCard;
