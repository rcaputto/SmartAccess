type AccessCodeStatus =
  | "PENDING"
  | "GENERATED"
  | "SENT"
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "FAILED";

const statusStyles: Record<AccessCodeStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  GENERATED: "bg-blue-100 text-blue-800",
  SENT: "bg-indigo-100 text-indigo-800",
  ACTIVE: "bg-green-100 text-green-800",
  EXPIRED: "bg-gray-200 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
  FAILED: "bg-red-200 text-red-900",
};

export default function AccessCodeStatusBadge({
  status,
}: {
  status: AccessCodeStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}