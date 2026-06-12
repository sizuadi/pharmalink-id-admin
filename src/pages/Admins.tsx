import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { api, buildQuery, type Paginated, type Single, type ApiError } from "@/lib/api";
import type { AdminUser } from "@/lib/types";
import { ROLE } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Modal, Field } from "@/components/ui/modal";
import { ActiveBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";

export function Admins() {
  const { user: me } = useAuth();
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Paginated<AdminUser>>(
        `/admin/admins${buildQuery({ page, search })}`
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

  async function toggleStatus(u: AdminUser) {
    setBusyId(u.id);
    try {
      const nextStatus = u.status_id === 1 ? 0 : 1;
      await api.put(`/admin/admins/${u.id}/status`, { status_id: nextStatus });
      await load();
    } catch (err) {
      alert((err as ApiError)?.message ?? "Gagal memperbarui status");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(u: AdminUser) {
    if (!confirm(`Hapus admin "${u.full_name || u.email}"?`)) return;
    setBusyId(u.id);
    try {
      await api.delete(`/admin/admins/${u.id}`);
      await load();
    } catch (err) {
      alert((err as ApiError)?.message ?? "Gagal menghapus admin");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Admins</h1>
          <p className="text-sm text-muted-foreground">Kelola akun administrator</p>
        </div>
        <Button onClick={() => setCreating(true)}>Tambah Admin</Button>
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
                <TH>Status</TH>
                <TH>Joined</TH>
                <TH className="text-right">Action</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TR><TD className="text-muted-foreground" colSpan={5}>Loading…</TD></TR>
              ) : rows.length === 0 ? (
                <TR><TD className="text-muted-foreground" colSpan={5}>Tidak ada admin.</TD></TR>
              ) : (
                rows.map((u) => {
                  const isSelf = me?.id === u.id;
                  return (
                    <TR key={u.id}>
                      <TD className="font-medium">
                        {u.full_name || "-"}
                        {isSelf && (
                          <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                            Anda
                          </span>
                        )}
                      </TD>
                      <TD className="text-muted-foreground">{u.email}</TD>
                      <TD><ActiveBadge statusId={u.status_id} /></TD>
                      <TD className="text-muted-foreground">{formatDate(u.created_at)}</TD>
                      <TD>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditAdmin(u)}>
                            Edit
                          </Button>
                          <Button
                            variant={u.status_id === 1 ? "outline" : "default"}
                            size="sm"
                            disabled={busyId === u.id || isSelf}
                            onClick={() => toggleStatus(u)}
                          >
                            {u.status_id === 1 ? "Nonaktifkan" : "Aktifkan"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busyId === u.id || isSelf}
                            onClick={() => remove(u)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  );
                })
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

      {creating && (
        <AdminFormModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}
      {editAdmin && (
        <AdminFormModal
          admin={editAdmin}
          onClose={() => setEditAdmin(null)}
          onSaved={() => {
            setEditAdmin(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function AdminFormModal({
  admin,
  onClose,
  onSaved,
}: {
  admin?: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!admin;
  const [form, setForm] = useState({
    full_name: admin?.full_name ?? "",
    email: admin?.email ?? "",
    password: "",
    password_confirmation: "",
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    if (!isEdit && form.password !== form.password_confirmation) {
      alert("Konfirmasi password tidak cocok");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        const payload: Record<string, unknown> = {
          full_name: form.full_name,
          email: form.email,
        };
        if (form.password) payload.password = form.password;
        await api.put(`/admin/admins/${admin!.id}`, payload);
      } else {
        await api.post(`/admin/admins`, {
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          password_confirmation: form.password_confirmation,
          role_id: ROLE.ADMIN,
        });
      }
      onSaved();
    } catch (err) {
      alert((err as ApiError)?.message ?? "Gagal menyimpan admin");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      title={isEdit ? "Edit Admin" : "Tambah Admin"}
      description={isEdit ? `#${admin!.id} · ${admin!.email}` : undefined}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nama lengkap">
          <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label={isEdit ? "Password baru (opsional)" : "Password"}>
          <Input
            type="password"
            placeholder={isEdit ? "Kosongkan jika tidak diubah" : ""}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
          />
        </Field>
        {!isEdit && (
          <Field label="Konfirmasi password">
            <Input
              type="password"
              value={form.password_confirmation}
              onChange={(e) => set("password_confirmation", e.target.value)}
            />
          </Field>
        )}
      </div>
    </Modal>
  );
}
