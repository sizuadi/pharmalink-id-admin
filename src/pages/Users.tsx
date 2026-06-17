import { useCallback, useEffect, useState } from "react";
import { api, buildQuery, type Paginated, type Single, type ApiError } from "@/lib/api";
import type { AdminUser } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Modal, DetailRow, Field } from "@/components/ui/modal";
import { ActiveBadge } from "@/components/StatusBadge";
import { Avatar } from "@/components/Avatar";
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
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("created_at:desc");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // User repo sorts by sortName=field, sortBy=direction.
      const [sortName, sortBy] = sort.split(":");
      const res = await api.get<Paginated<AdminUser>>(
        `/admin/users${buildQuery({
          page,
          perPage: 10,
          search,
          role_id: roleId,
          status_id: statusFilter,
          sortName,
          sortBy,
        })}`
      );
      setRows(res.data ?? []);
      setTotalPages(res.meta?.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleId, statusFilter, sort]);

  useEffect(() => {
    setPage(1);
  }, [roleId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(u: AdminUser) {
    setBusyId(u.id);
    try {
      // Status IDs mirror prisma/seeds/status.seed.ts: 1 = Active, 2 = Inactive.
      const nextStatus = u.status_id === 1 ? 2 : 1;
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
          <div className="mb-4 flex flex-wrap gap-2">
            <Input
              placeholder="Cari nama / email…"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="max-w-xs"
            />
            <Select
              value={statusFilter}
              onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
            >
              <option value="">Semua status</option>
              <option value="1">Aktif</option>
              <option value="2">Nonaktif</option>
            </Select>
            <Select
              value={sort}
              onChange={(e) => { setPage(1); setSort(e.target.value); }}
            >
              <option value="created_at:desc">Terbaru</option>
              <option value="created_at:asc">Terlama</option>
              <option value="full_name:asc">Nama A–Z</option>
              <option value="full_name:desc">Nama Z–A</option>
            </Select>
          </div>

          <Table>
            <THead>
              <TR>
                <TH>Foto</TH>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH>Phone</TH>
                <TH>Status</TH>
                <TH>Joined</TH>
                <TH className="text-right">Action</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TR><TD className="text-muted-foreground" colSpan={7}>Loading…</TD></TR>
              ) : rows.length === 0 ? (
                <TR><TD className="text-muted-foreground" colSpan={7}>Tidak ada data.</TD></TR>
              ) : (
                rows.map((u) => (
                  <TR key={u.id}>
                    <TD><Avatar name={u.full_name} pictureUrl={u.picture_url} /></TD>
                    <TD className="font-medium">{u.full_name || "-"}</TD>
                    <TD className="text-muted-foreground">{u.email}</TD>
                    <TD className="text-muted-foreground">{u.phone_number || "-"}</TD>
                    <TD><ActiveBadge statusId={u.status_id} /></TD>
                    <TD className="text-muted-foreground">{formatDate(u.created_at)}</TD>
                    <TD>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDetailUser(u)}>
                          Detail
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditUser(u)}>
                          Edit
                        </Button>
                        <Button
                          variant={u.status_id === 1 ? "outline" : "default"}
                          size="sm"
                          disabled={busyId === u.id}
                          onClick={() => toggleStatus(u)}
                        >
                          {u.status_id === 1 ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                      </div>
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

      {detailUser && (
        <UserDetailModal userId={detailUser.id} onClose={() => setDetailUser(null)} />
      )}
      {editUser && (
        <UserEditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => {
            setEditUser(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function UserDetailModal({ userId, onClose }: { userId: number; onClose: () => void }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get<Single<AdminUser>>(`/admin/users/${userId}`)
      .then((res) => active && setUser(res.data))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <Modal open title="Detail Pengguna" onClose={onClose}>
      {loading || !user ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
        <div className="mb-4 flex items-center gap-3">
          <Avatar name={user.full_name} pictureUrl={user.picture_url} size={64} />
          <div>
            <p className="font-medium">{user.full_name || "-"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <dl className="divide-y divide-border">
          <DetailRow label="ID">{user.id}</DetailRow>
          <DetailRow label="Nama">{user.full_name || "-"}</DetailRow>
          <DetailRow label="Email">{user.email}</DetailRow>
          <DetailRow label="Telepon">{user.phone_number || "-"}</DetailRow>
          <DetailRow label="Role">{user.role?.name ?? user.role_id}</DetailRow>
          <DetailRow label="Status">
            <ActiveBadge statusId={user.status_id} />
          </DetailRow>
          <DetailRow label="Tanggal lahir">{formatDate(user.date_of_birth)}</DetailRow>
          <DetailRow label="Alamat">{user.address || "-"}</DetailRow>
          {user.pharmacy && (
            <DetailRow label="Apotek">{user.pharmacy.name || `#${user.pharmacy.id}`}</DetailRow>
          )}
          <DetailRow label="Email terverifikasi">
            {user.email_verified_at ? formatDate(user.email_verified_at) : "Belum"}
          </DetailRow>
          <DetailRow label="Telepon terverifikasi">
            {user.phone_verified_at ? formatDate(user.phone_verified_at) : "Belum"}
          </DetailRow>
          <DetailRow label="Registrasi selesai">
            {user.registration_completed ? "Ya" : "Belum"}
          </DetailRow>
          <DetailRow label="Dibuat">{formatDate(user.created_at)}</DetailRow>
        </dl>
        </>
      )}
    </Modal>
  );
}

function UserEditModal({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    full_name: user.full_name ?? "",
    email: user.email ?? "",
    phone_number: user.phone_number ?? "",
    address: user.address ?? "",
    status_id: String(user.status_id),
    password: "",
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        full_name: form.full_name,
        email: form.email,
        status_id: Number(form.status_id),
      };
      if (form.phone_number) payload.phone_number = form.phone_number;
      if (form.address) payload.address = form.address;
      if (form.password) payload.password = form.password;
      await api.patch(`/admin/users/${user.id}`, payload);
      onSaved();
    } catch (err) {
      alert((err as ApiError)?.message ?? "Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      title="Edit Pengguna"
      description={`#${user.id} · ${user.email}`}
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
        <Field label="Telepon">
          <Input value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} />
        </Field>
        <Field label="Alamat">
          <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field label="Status">
          <select
            value={form.status_id}
            onChange={(e) => set("status_id", e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="1">Aktif</option>
            <option value="2">Nonaktif</option>
          </select>
        </Field>
        <Field label="Password baru (opsional)">
          <Input
            type="password"
            placeholder="Kosongkan jika tidak diubah"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
