import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: string;
}

const Skeleton = ({ width, height, rounded = "rounded-lg", className, style, ...props }: SkeletonProps) => (
  <div
    className={cn(
      "relative overflow-hidden bg-[rgba(20,20,23,0.06)]",
      rounded,
      className
    )}
    style={{ width, height, ...style }}
    {...props}
  >
    <div
      className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent"
    />
  </div>
);

export default Skeleton;
