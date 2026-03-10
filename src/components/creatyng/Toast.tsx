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

const typeConfig: Record<ToastType, { icon: typeof CheckCircle; classes: string }> = {
  success: { icon: CheckCircle, classes: "border-creatyng-success/30 bg-[#F0FDF4]" },
  error:   { icon: XCircle,     classes: "border-creatyng-error/30 bg-[#FFF1F1]" },
  warning: { icon: AlertTriangle, classes: "border-creatyng-warning/30 bg-[#FFFBEB]" },
  info:    { icon: Info,         classes: "border-creatyng-info/30 bg-[#F0FDFF]" },
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
      <p className="text-sm text-[#141417] flex-1">{message}</p>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDismiss?.(), 300);
        }}
        className="shrink-0 text-[#8e8e96] hover:text-[#141417] transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default Toast;
