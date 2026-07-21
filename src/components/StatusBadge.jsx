export default function StatusBadge({ value }) {
  if (!value) return null;
  return <span className={"badge badge-" + value}>{value}</span>;
}
