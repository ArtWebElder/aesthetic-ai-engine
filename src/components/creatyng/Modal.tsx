import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

const Modal = ({ open, onClose, title, children, size = "md", className }: ModalProps) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          "relative w-full bg-white rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.18)]",
          "animate-modal-in",
          sizeClasses[size],
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[rgba(20,20,23,0.06)]">
            <h2 className="text-base font-semibold text-[#141417]">{title}</h2>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-[#8e8e96] hover:bg-[rgba(20,20,23,0.05)] hover:text-[#141417] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className={cn(!title && "relative", "p-6")}>
          {!title && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 h-7 w-7 rounded-lg flex items-center justify-center text-[#8e8e96] hover:bg-[rgba(20,20,23,0.05)] hover:text-[#141417] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
