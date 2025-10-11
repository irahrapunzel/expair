const STATUS_VARIANTS = {
  success: "bg-green-500/20 text-green-400 border-green-500/30",
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  danger: "bg-red-500/20 text-red-400 border-red-500/30",
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  default: "bg-white/10 text-white/60 border-white/20",
};

const STATUS_MAP = {
  Accepted: "success",
  Approved: "success",
  Complete: "success",
  Active: "success",
  Rejected: "warning",
  Pending: "warning",
  Suspended: "warning",
  Banned: "danger",
  Partial: "info",
  "N/A": "default",
};

export default function StatusPill({ status, variant }) {
  const variantKey = variant || STATUS_MAP[status] || "default";
  const styles = STATUS_VARIANTS[variantKey];

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles}`}>
      {status}
    </span>
  );
}



