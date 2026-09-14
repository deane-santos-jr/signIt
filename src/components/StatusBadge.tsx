import type { Document } from "@/db/schema";

const labels: Record<Document["status"], { text: string; className: string }> = {
  draft: { text: "Draft", className: "bg-neutral-100 text-neutral-700" },
  sent: { text: "Awaiting signatures", className: "bg-amber-100 text-amber-800" },
  awaiting_countersign: {
    text: "Ready to countersign",
    className: "bg-blue-100 text-blue-800",
  },
  completed: { text: "Completed", className: "bg-green-100 text-green-800" },
};

export function StatusBadge({ status }: { status: Document["status"] }) {
  const { text, className } = labels[status];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {text}
    </span>
  );
}
