import { useEffect, useState } from "react";
import { Users, Stethoscope, Building2, Receipt, CheckCircle2, Wallet } from "lucide-react";
import { api, type Single } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { TransactionStatusBadge } from "@/components/StatusBadge";
import { formatDate, formatRupiah } from "@/lib/utils";

const cards = [
  { key: "patients", label: "Patients", icon: Users },
  { key: "pharmacists", label: "Pharmacists", icon: Stethoscope },
  { key: "pharmacies", label: "Pharmacies", icon: Building2 },
  { key: "transactions", label: "Transactions", icon: Receipt },
  { key: "completed_transactions", label: "Completed", icon: CheckCircle2 },
] as const;

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Single<DashboardStats>>("/admin/dashboard")
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Ringkasan aktivitas platform</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {cards.map((c) => (
              <Card key={c.key}>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <c.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold leading-none">
                        {stats.totals[c.key as keyof typeof stats.totals]}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{c.label}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-bold leading-none">
                      {formatRupiah(stats.totals.revenue)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">GMV (Completed)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-bold leading-none text-primary">
                      {formatRupiah(stats.totals.platform_revenue)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Platform Revenue</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>Code</TH>
                    <TH>Customer</TH>
                    <TH>Pharmacy</TH>
                    <TH>Status</TH>
                    <TH>Total</TH>
                    <TH>Date</TH>
                  </TR>
                </THead>
                <TBody>
                  {stats.recent_transactions.map((t) => (
                    <TR key={t.id}>
                      <TD className="font-mono text-xs">{t.transaction_code.slice(0, 8)}</TD>
                      <TD>{t.user?.full_name ?? "-"}</TD>
                      <TD>{t.pharmacy?.name ?? "-"}</TD>
                      <TD><TransactionStatusBadge status={t.transaction_status} /></TD>
                      <TD className="font-medium">{formatRupiah(t.grand_total)}</TD>
                      <TD className="text-muted-foreground">{formatDate(t.transaction_date)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-destructive">Gagal memuat data.</p>
      )}
    </div>
  );
}
