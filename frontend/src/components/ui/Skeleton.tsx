export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = 'h-4 w-full' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-md bg-surface-3 motion-safe:animate-pulse ${className}`.trim()}
    />
  );
}
