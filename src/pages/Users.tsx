import { useCallback, useEffect, useState } from "react";
import { api, buildQuery, type Paginated, type ApiError } from "@/lib/api";
import type { AdminUser } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { ActiveBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";

interface UsersPageProps {
  roleId: number;
  title: string;
  subtitle: string;
}

export function UsersPage({ roleId, title, subtitle }: UsersPageProps) {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Paginated<AdminUser>>(
        `/admin/users${buildQuery({ page, perPage: 10, search, role_id: roleId })}`
      );
      setRows(res.data ?? []);
      setTotalPages(res.meta?.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleId]);

  useEffect(() => {
    setPage(1);
  }, [roleId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(u: AdminUser) {
    setBusyId(u.id);
    try {
      const nextStatus = u.status_id === 1 ? 0 : 1;
      await api.patch(`/admin/users/${u.id}/status`, { status_id: nextStatus });
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
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="mb-4">
            <Input
              placeholder="Cari nama / email…"
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
                <TH>Email</TH>
                <TH>Phone</TH>
                <TH>Status</TH>
                <TH>Joined</TH>
                <TH>Action</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TR><TD className="text-muted-foreground" colSpan={6}>Loading…</TD></TR>
              ) : rows.length === 0 ? (
                <TR><TD className="text-muted-foreground" colSpan={6}>Tidak ada data.</TD></TR>
              ) : (
                rows.map((u) => (
                  <TR key={u.id}>
                    <TD className="font-medium">{u.full_name || "-"}</TD>
                    <TD className="text-muted-foreground">{u.email}</TD>
                    <TD className="text-muted-foreground">{u.phone_number || "-"}</TD>
                    <TD><ActiveBadge statusId={u.status_id} /></TD>
                    <TD className="text-muted-foreground">{formatDate(u.created_at)}</TD>
                    <TD>
                      <Button
                        variant={u.status_id === 1 ? "outline" : "default"}
                        size="sm"
                        disabled={busyId === u.id}
                        onClick={() => toggleStatus(u)}
                      >
                        {u.status_id === 1 ? "Nonaktifkan" : "Aktifkan"}
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
