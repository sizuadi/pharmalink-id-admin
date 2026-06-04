import { Badge } from "@/components/ui/badge";

export function TransactionStatusBadge({ status }: { status: string }) {
  const s = (status ?? "").toLowerCase();
  let tone: "success" | "warning" | "danger" | "muted" = "warning";
  if (s === "completed") tone = "success";
  else if (s === "cancelled" || s === "failed" || s === "refunded") tone = "danger";
  else if (s === "draft" || s === "waiting payment") tone = "muted";
  return <Badge tone={tone}>{status}</Badge>;
}

export function ActiveBadge({ statusId }: { statusId: number }) {
  return statusId === 1 ? (
    <Badge tone="success">Active</Badge>
  ) : (
    <Badge tone="danger">Inactive</Badge>
  );
}
