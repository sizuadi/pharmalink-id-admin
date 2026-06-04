import { useCallback, useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { api, buildQuery, type Paginated, type Single, type ApiError } from "@/lib/api";
import type { Review } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className="h-4 w-4"
          fill={n <= value ? "currentColor" : "none"}
          color={n <= value ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))"}
        />
      ))}
    </span>
  );
}

export function Reviews() {
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Paginated<Review>>(
        `/admin/reviews${buildQuery({ page, perPage: 10 })}`
      );
      setRows(res.data ?? []);
      setTotalPages(res.meta?.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(r: Review) {
    if (!confirm("Hapus ulasan ini?")) return;
    setBusyId(r.id);
    try {
      await api.delete<Single<null>>(`/admin/reviews/${r.id}`);
      await load();
    } catch (err) {
      alert((err as ApiError)?.message ?? "Gagal menghapus ulasan");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reviews</h1>
        <p className="text-sm text-muted-foreground">Moderasi ulasan pelanggan</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <Table>
            <THead>
              <TR>
                <TH>Pharmacy</TH>
                <TH>Customer</TH>
                <TH>Rating</TH>
                <TH>Comment</TH>
                <TH>Date</TH>
                <TH>Action</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TR><TD className="text-muted-foreground" colSpan={6}>Loading…</TD></TR>
              ) : rows.length === 0 ? (
                <TR><TD className="text-muted-foreground" colSpan={6}>Belum ada ulasan.</TD></TR>
              ) : (
                rows.map((r) => (
                  <TR key={r.id}>
                    <TD className="font-medium">{r.pharmacy?.name ?? "-"}</TD>
                    <TD className="text-muted-foreground">{r.user?.full_name ?? "-"}</TD>
                    <TD><Stars value={r.rating} /></TD>
                    <TD className="max-w-[260px] text-muted-foreground">{r.comment || "-"}</TD>
                    <TD className="text-muted-foreground">{formatDate(r.created_at)}</TD>
                    <TD>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => remove(r)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Sebelumnya
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Berikutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
