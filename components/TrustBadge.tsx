type TrustBadgeProps = {
  icon: string;
  title: string;
  subtitle: string;
};

export function TrustBadge({ icon, title, subtitle }: TrustBadgeProps) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-2xl)] border border-accent/30 bg-white dark:bg-neutral-100 px-4 py-3 shadow-base">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-primary/10 text-lg">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-primary">{title}</p>
        <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>
      </div>
    </div>
  );
}
