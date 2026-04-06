export type GradingCriteriaValues = {
  preWeight: number;
  postWeight: number;
  passThreshold: number;
};

export function ScoreRow({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number | null | undefined;
  suffix?: string;
}) {
  const display = value != null ? `${value.toFixed(1)}${suffix}` : "-";
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--border)] py-3 last:border-0 last:pb-0">
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
      <span className="text-lg font-semibold tabular-nums text-[var(--foreground)]">{display}</span>
    </div>
  );
}

export function FinalScoreBar({
  final,
  passThreshold,
  compact = false,
}: {
  final: number | null;
  passThreshold: number;
  compact?: boolean;
}) {
  if (final == null) return null;
  const pctWidth = Math.min(100, Math.max(0, final));
  const marginTop = compact ? "mt-4" : "mt-8";
  const barH = compact ? "h-2.5" : "h-3";
  const scaleText = compact ? "text-[0.65rem]" : "text-xs";

  return (
    <div className={marginTop}>
      <div className={`mb-1.5 flex justify-between ${scaleText} text-[var(--text-muted)]`}>
        <span>0</span>
        <span className="font-medium text-[var(--warning-amber)]">حد الاجتياز {passThreshold}%</span>
        <span>100</span>
      </div>
      <div className={`relative ${barH} overflow-hidden rounded-full bg-[var(--surface-muted)]`}>
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
          style={{ width: `${pctWidth}%` }}
        />
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-0.5 rounded-full bg-[var(--warning-amber)]"
          style={{ insetInlineStart: `${passThreshold}%` }}
          title={`حد الاجتياز ${passThreshold}%`}
        />
      </div>
    </div>
  );
}

export function GradingCriteriaReadOnly({
  config,
  showHeading = true,
  className = "",
}: {
  config: GradingCriteriaValues;
  showHeading?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      {showHeading ? (
        <>
          <h2 className="mb-1 text-base font-bold text-[var(--primary-strong)]">معايير الدورة</h2>
          <p className="mb-4 text-xs text-[var(--text-muted)]">الأوزان المعتمدة لحساب الدرجة النهائية.</p>
        </>
      ) : null}
      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-2 flex justify-between text-sm text-[var(--text-muted)]">
            <span>قبلي</span>
            <span className="font-semibold text-[var(--foreground)]">{config.preWeight}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
            <div
              className="h-full rounded-full bg-[var(--primary-soft)] ring-1 ring-inset ring-[var(--border)]"
              style={{ width: `${config.preWeight}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-2 flex justify-between text-sm text-[var(--text-muted)]">
            <span>بعدي</span>
            <span className="font-semibold text-[var(--foreground)]">{config.postWeight}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
            <div
              className="h-full rounded-full bg-[var(--primary)]/35 ring-1 ring-inset ring-[var(--border-strong)]"
              style={{ width: `${config.postWeight}%` }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 px-3 py-2 text-sm">
          <span className="text-[var(--text-muted)]">درجة الاجتياز: </span>
          <span className="font-bold tabular-nums text-[var(--foreground)]">{config.passThreshold}%</span>
        </div>
      </div>
    </div>
  );
}
