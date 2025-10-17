import { TextLineSkeleton, CardSkeleton } from "@/components/ui/Shimmer";

export default function ReportsHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <TextLineSkeleton width="35%" />
      <div className="flex flex-wrap gap-3">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}