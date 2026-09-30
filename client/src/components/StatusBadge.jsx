export const STATUS_LABELS = {
  in_stock: 'In stock',
  assigned: 'Assigned',
  in_repair: 'In repair',
  retired: 'Retired',
};

export default function StatusBadge({ status }) {
  return <span className={`status status-${status}`}>{STATUS_LABELS[status] || status}</span>;
}
