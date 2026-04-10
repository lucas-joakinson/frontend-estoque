interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'primary' | 'muted';
}

export const Badge = ({ children, variant = 'primary' }: BadgeProps) => {
  const variants = {
    primary: 'bg-[hsla(270,80%,68%,0.15)] text-[var(--primary)]',
    success: 'bg-[rgba(34,197,94,0.15)] text-[var(--success)]',
    danger: 'bg-[rgba(239,68,68,0.15)] text-[var(--danger)]',
    muted: 'bg-[var(--border)] text-[var(--text-muted)]',
  };

  return (
    <span className={`px-2 py-1 rounded-[4px] text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
};
