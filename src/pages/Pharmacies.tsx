import { useCallback, useEffect, useState } from "react";
import { api, buildQuery, type Paginated, type Single, type ApiError } from "@/lib/api";
import type { Pharmacy, PharmacyDetail } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Modal, DetailRow, Field } from "@/components/ui/modal";
import { ActiveBadge } from "@/components/StatusBadge";
import { formatDate, formatRupiah } from "@/lib/utils";

export function Pharmacies() {
  const [rows, setRows] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [editPharmacy, setEditPharmacy] = useState<Pharmacy | null>(null);

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
                <TH className="text-right">Action</TH>
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
                    <TD className="font-medium">{p.name || "-"}</TD>
                    <TD className="text-muted-foreground">{p.phone_number || "-"}</TD>
                    <TD className="max-w-[220px] truncate text-muted-foreground">{p.address || "-"}</TD>
                    <TD className="text-muted-foreground">
                      {p.start_day && p.start_time
                        ? `${p.start_day}–${p.end_day} · ${p.start_time}-${p.end_time}`
                        : "-"}
                    </TD>
                    <TD><ActiveBadge statusId={p.status_id} /></TD>
                    <TD>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDetailId(p.id)}>
                          Detail
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditPharmacy(p)}>
                          Edit
                        </Button>
                        <Button
                          variant={p.status_id === 1 ? "outline" : "default"}
                          size="sm"
                          disabled={busyId === p.id}
                          onClick={() => toggleStatus(p)}
                        >
                          {p.status_id === 1 ? "Nonaktifkan" : "Aktifkan"}
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

      {detailId !== null && (
        <PharmacyDetailModal pharmacyId={detailId} onClose={() => setDetailId(null)} />
      )}
      {editPharmacy && (
        <PharmacyEditModal
          pharmacy={editPharmacy}
          onClose={() => setEditPharmacy(null)}
          onSaved={() => {
            setEditPharmacy(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function PharmacyDetailModal({ pharmacyId, onClose }: { pharmacyId: number; onClose: () => void }) {
  const [data, setData] = useState<PharmacyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get<Single<PharmacyDetail>>(`/admin/pharmacies/${pharmacyId}`)
      .then((res) => active && setData(res.data))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [pharmacyId]);

  return (
    <Modal open title="Detail Apotek" onClose={onClose} className="max-w-2xl">
      {loading || !data ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <StatBox label="Apoteker" value={String(data.stats.pharmacist_count)} />
            <StatBox label="Transaksi" value={String(data.stats.transactions)} />
            <StatBox label="Pendapatan" value={formatRupiah(data.stats.revenue)} />
          </div>

          <dl className="divide-y divide-border">
            <DetailRow label="Nama">{data.name || "-"}</DetailRow>
            <DetailRow label="Telepon">{data.phone_number || "-"}</DetailRow>
            <DetailRow label="Alamat">{data.address || "-"}</DetailRow>
            <DetailRow label="Jam buka">
              {data.start_day
                ? `${data.start_day}–${data.end_day} · ${data.start_time}-${data.end_time}`
                : "-"}
            </DetailRow>
            <DetailRow label="Rating">
              {data.rating_avg ? `${data.rating_avg.toFixed(1)} (${data.rating_count})` : "Belum ada"}
            </DetailRow>
            <DetailRow label="Lokasi">
              {data.latitude != null && data.longitude != null
                ? `${data.latitude}, ${data.longitude}`
                : "-"}
            </DetailRow>
            <DetailRow label="Status">
              <ActiveBadge statusId={data.status_id} />
            </DetailRow>
            <DetailRow label="Deskripsi">{data.description || "-"}</DetailRow>
          </dl>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Apoteker di apotek ini</h3>
            {data.pharmacists.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada apoteker terdaftar.</p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Nama</TH>
                    <TH>Email</TH>
                    <TH>Telepon</TH>
                    <TH>Status</TH>
                  </TR>
                </THead>
                <TBody>
                  {data.pharmacists.map((ph) => (
                    <TR key={ph.id}>
                      <TD className="font-medium">{ph.full_name || "-"}</TD>
                      <TD className="text-muted-foreground">{ph.email}</TD>
                      <TD className="text-muted-foreground">{ph.phone_number || "-"}</TD>
                      <TD><ActiveBadge statusId={ph.status_id} /></TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function PharmacyEditModal({
  pharmacy,
  onClose,
  onSaved,
}: {
  pharmacy: Pharmacy;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: pharmacy.name ?? "",
    phone_number: pharmacy.phone_number ?? "",
    address: pharmacy.address ?? "",
    description: pharmacy.description ?? "",
    start_day: pharmacy.start_day ?? "",
    end_day: pharmacy.end_day ?? "",
    start_time: pharmacy.start_time ?? "",
    end_time: pharmacy.end_time ?? "",
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setSaving(true);
    try {
      await api.patch(`/admin/pharmacies/${pharmacy.id}`, form);
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
      title="Edit Apotek"
      description={`#${pharmacy.id}`}
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
        <Field label="Nama apotek">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Telepon">
          <Input value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} />
        </Field>
        <Field label="Alamat">
          <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field label="Deskripsi">
          <Input value={form.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hari buka">
            <Input placeholder="Senin" value={form.start_day} onChange={(e) => set("start_day", e.target.value)} />
          </Field>
          <Field label="Hari tutup">
            <Input placeholder="Sabtu" value={form.end_day} onChange={(e) => set("end_day", e.target.value)} />
          </Field>
          <Field label="Jam buka">
            <Input placeholder="08:00" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} />
          </Field>
          <Field label="Jam tutup">
            <Input placeholder="17:00" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
