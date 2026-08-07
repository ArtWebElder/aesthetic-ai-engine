import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
}

// O toast assenta no card escuro e recebe só um véu da cor do tipo.
// (Valores arbitrários do Tailwind não aceitam espaço — use `_` no lugar.)
const typeConfig: Record<ToastType, { icon: typeof CheckCircle; classes: string }> = {
  success: { icon: CheckCircle,   classes: "border-creatyng-success/30 bg-card bg-[linear-gradient(hsl(152_60%_45%/0.12),hsl(152_60%_45%/0.12))]" },
  error:   { icon: XCircle,       classes: "border-creatyng-error/30 bg-card bg-[linear-gradient(hsl(0_72%_51%/0.12),hsl(0_72%_51%/0.12))]" },
  warning: { icon: AlertTriangle, classes: "border-creatyng-warning/30 bg-card bg-[linear-gradient(hsl(38_92%_50%/0.12),hsl(38_92%_50%/0.12))]" },
  info:    { icon: Info,          classes: "border-creatyng-info/30 bg-card bg-[linear-gradient(hsl(190_90%_50%/0.12),hsl(190_90%_50%/0.12))]" },
};

const iconColorMap: Record<ToastType, string> = {
  success: "text-creatyng-success",
  error:   "text-creatyng-error",
  warning: "text-creatyng-warning",
  info:    "text-creatyng-info",
};

const Toast = ({ message, type = "info", duration = 3500, onDismiss }: ToastProps) => {
  const [visible, setVisible] = useState(true);
  const config = typeConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss?.(), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3.5 pr-4 rounded-xl border shadow-[0_8px_30px_rgba(0,0,0,0.10)] max-w-sm w-full",
        "transition-all duration-300",
        config.classes,
        visible ? "animate-toast-in opacity-100" : "opacity-0 translate-x-4"
      )}
    >
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", iconColorMap[type])} />
      <p className="text-sm text-foreground flex-1">{message}</p>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDismiss?.(), 300);
        }}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default Toast;
