import { useCallback, useEffect, useState } from "react";
import { api, buildQuery, type Paginated, type ApiError } from "@/lib/api";
import type { Pharmacy } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ActiveBadge } from "@/components/StatusBadge";

export function Pharmacies() {
  const [rows, setRows] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Paginated<Pharmacy>>(
        `/admin/pharmacies${buildQuery({ page, perPage: 10, search })}`
      );
      setRows(res.data ?? []);
      setTotalPages(res.meta?.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(p: Pharmacy) {
    setBusyId(p.id);
    try {
      const nextStatus = p.status_id === 1 ? 0 : 1;
      await api.patch(`/admin/pharmacies/${p.id}/status`, { status_id: nextStatus });
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
        <h1 className="text-2xl font-semibold">Pharmacies</h1>
        <p className="text-sm text-muted-foreground">Kelola apotek terdaftar</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="mb-4">
            <Input
              placeholder="Cari apotek…"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="max-w-xs"
            />
          </div>

          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Phone</TH>
                <TH>Address</TH>
                <TH>Hours</TH>
                <TH>Status</TH>
                <TH>Action</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TR><TD className="text-muted-foreground" colSpan={6}>Loading…</TD></TR>
              ) : rows.length === 0 ? (
                <TR><TD className="text-muted-foreground" colSpan={6}>Tidak ada apotek.</TD></TR>
              ) : (
                rows.map((p) => (
                  <TR key={p.id}>
                    <TD className="font-medium">{p.name}</TD>
                    <TD className="text-muted-foreground">{p.phone_number || "-"}</TD>
                    <TD className="max-w-[220px] truncate text-muted-foreground">{p.address || "-"}</TD>
                    <TD className="text-muted-foreground">
                      {p.start_day && p.start_time
                        ? `${p.start_day}–${p.end_day} · ${p.start_time}-${p.end_time}`
                        : "-"}
                    </TD>
                    <TD><ActiveBadge statusId={p.status_id} /></TD>
                    <TD>
                      <Button
                        variant={p.status_id === 1 ? "outline" : "default"}
                        size="sm"
                        disabled={busyId === p.id}
                        onClick={() => toggleStatus(p)}
                      >
                        {p.status_id === 1 ? "Nonaktifkan" : "Aktifkan"}
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
