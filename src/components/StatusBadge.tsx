import type { Document } from "@/db/schema";

const labels: Record<Document["status"], { text: string; className: string }> = {
  draft: { text: "Draft", className: "bg-line text-ink-muted" },
  sent: { text: "Awaiting signatures", className: "bg-sign text-sign-ink" },
  awaiting_countersign: { text: "Your turn", className: "bg-info text-info-ink" },
  completed: { text: "Completed", className: "bg-ok text-ok-ink" },
};

export function StatusBadge({ status }: { status: Document["status"] }) {
  const { text, className } = labels[status];
  return <span className={`tag ${className}`}>{text}</span>;
}
