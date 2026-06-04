import { useCallback, useEffect, useState } from "react";
import { api, buildQuery, type Paginated, type ApiError } from "@/lib/api";
import type { Transaction } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { TransactionStatusBadge } from "@/components/StatusBadge";
import { formatDate, formatRupiah } from "@/lib/utils";
import { STATUS_NAME, ALL_STATUS_IDS, getNextStatusIds } from "@/lib/orderStatus";

export function Transactions() {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusId, setStatusId] = useState<string>("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Paginated<Transaction>>(
        `/admin/transactions${buildQuery({ page, perPage: 10, search, status_id: statusId })}`
      );
      setRows(res.data ?? []);
      setTotalPages(res.meta?.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusId]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(t: Transaction, newStatusId: number) {
    setBusyId(t.id);
    try {
      await api.patch(`/admin/transactions/${t.id}/status`, { status_id: newStatusId });
      await load();
    } catch (err) {
      alert((err as ApiError)?.message ?? "Gagal memperbarui status");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <p className="text-sm text-muted-foreground">Pantau & kelola semua transaksi</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="mb-4 flex flex-wrap gap-3">
            <Input
              placeholder="Cari kode / pasien…"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="max-w-xs"
            />
            <select
              value={statusId}
              onChange={(e) => {
                setPage(1);
                setStatusId(e.target.value);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Semua status</option>
              {ALL_STATUS_IDS.map((id) => (
                <option key={id} value={id}>
                  {STATUS_NAME[id]}
                </option>
              ))}
            </select>
          </div>

          <Table>
            <THead>
              <TR>
                <TH>Code</TH>
                <TH>Customer</TH>
                <TH>Pharmacy</TH>
                <TH>Status</TH>
                <TH>Total</TH>
                <TH>Date</TH>
                <TH>Update</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TR>
                  <TD className="text-muted-foreground" colSpan={7}>Loading…</TD>
                </TR>
              ) : rows.length === 0 ? (
                <TR>
                  <TD className="text-muted-foreground" colSpan={7}>Tidak ada transaksi.</TD>
                </TR>
              ) : (
                rows.map((t) => {
                  const next = getNextStatusIds(t.status_id);
                  return (
                    <TR key={t.id}>
                      <TD className="font-mono text-xs">{t.transaction_code.slice(0, 8)}</TD>
                      <TD>{t.patient_name ?? "-"}</TD>
                      <TD>{t.pharmacy_name ?? "-"}</TD>
                      <TD><TransactionStatusBadge status={t.transaction_status} /></TD>
                      <TD className="font-medium">{formatRupiah(t.grand_total)}</TD>
                      <TD className="text-muted-foreground">{formatDate(t.transaction_date)}</TD>
                      <TD>
                        {next.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <select
                            disabled={busyId === t.id}
                            value=""
                            onChange={(e) => {
                              if (e.target.value) changeStatus(t, Number(e.target.value));
                            }}
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                          >
                            <option value="">Ubah ke…</option>
                            {next.map((id) => (
                              <option key={id} value={id}>
                                {STATUS_NAME[id]}
                              </option>
                            ))}
                          </select>
                        )}
                      </TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
