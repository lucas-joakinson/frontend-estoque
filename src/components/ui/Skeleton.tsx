export const Skeleton = ({ className }: { className?: string }) => {
  return (
    <div className={`bg-[var(--bg-elevated)] animate-pulse rounded-[8px] ${className}`} />
  );
};
