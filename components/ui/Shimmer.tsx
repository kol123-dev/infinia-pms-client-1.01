import React from "react";

type ShimmerProps = {
  className?: string;
  style?: React.CSSProperties;
};

export function Shimmer({ className = "", style }: ShimmerProps) {
  return <div className={`shimmer ${className}`} style={style} />;
}

// Example skeletons
export function TextLineSkeleton({ width = "100%" }: { width?: string }) {
  return <Shimmer className="h-4 rounded-md mb-2" style={{ width }} />;
}

export function AvatarSkeleton() {
  return <Shimmer className="h-10 w-10 rounded-full" />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-white/10 p-4">
      <div className="flex gap-4 items-center mb-3">
        <AvatarSkeleton />
        <div className="flex-1">
          <TextLineSkeleton width="60%" />
          <TextLineSkeleton width="40%" />
        </div>
      </div>
      <TextLineSkeleton width="90%" />
      <TextLineSkeleton width="75%" />
    </div>
  );
}