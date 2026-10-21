const STYLE = {
  Paid: { color: 'var(--color-hold)', label: 'Locked in escrow' },
  Delivered: { color: 'var(--color-hold)', label: 'Delivered – awaiting buyer' },
  Released: { color: 'var(--color-release)', label: 'Completed – seller paid' },
  Refunded: { color: 'var(--color-muted)', label: 'Refunded' },
  Disputed: { color: 'var(--color-danger)', label: 'Disputed' },
  Pending: { color: 'var(--color-hold)', label: 'Pending' },
  Completed: { color: 'var(--color-release)', label: 'Completed' },
  Cancelled: { color: 'var(--color-muted)', label: 'Cancelled' },
  Rejected: { color: 'var(--color-danger)', label: 'Rejected' },
  Open: { color: 'var(--color-hold)', label: 'Open' },
  Resolved: { color: 'var(--color-release)', label: 'Resolved' },
};

export default function StatusBadge({ status }) {
  const s = STYLE[status] || { color: 'var(--color-muted)', label: status };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: s.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}
