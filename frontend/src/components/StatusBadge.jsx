const STATUS_STYLE = {
  Paid: { color: 'var(--color-hold)', label: 'Locked in escrow' },
  Delivered: { color: 'var(--color-hold)', label: 'Awaiting confirmation' },
  Released: { color: 'var(--color-release)', label: 'Released' },
  Refunded: { color: 'var(--color-muted)', label: 'Refunded' },
  Disputed: { color: 'var(--color-danger)', label: 'Disputed' },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLE[status] || { color: 'var(--color-muted)', label: status };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: style.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: style.color }} />
      {style.label}
    </span>
  );
}