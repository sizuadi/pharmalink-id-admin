import { useCallback, useEffect, useState } from "react";
import { api, assetUrl, buildQuery, type Paginated } from "@/lib/api";
import type { Prescription } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Modal, DetailRow } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";

const STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED"];

function PrescriptionStatusBadge({ status }: { status: string }) {
  const tone =
    status === "APPROVED" ? "success" : status === "REJECTED" ? "danger" : "warning";
  return <Badge tone={tone}>{status}</Badge>;
}

export function Prescriptions() {
  const [rows, setRows] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("");
  const [detail, setDetail] = useState<Prescription | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Paginated<Prescription>>(
        `/admin/prescriptions${buildQuery({ page, perPage: 10, status })}`
      );
      setRows(res.data ?? []);
      setTotalPages(res.meta?.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Prescriptions</h1>
        <p className="text-sm text-muted-foreground">Pantau resep yang diunggah pasien</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="mb-4">
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Semua status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <Table>
            <THead>
              <TR>
                <TH>Order</TH>
                <TH>Customer</TH>
                <TH>Status</TH>
                <TH>Direview</TH>
                <TH>Diunggah</TH>
                <TH className="text-right">Action</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TR><TD className="text-muted-foreground" colSpan={6}>Loading…</TD></TR>
              ) : rows.length === 0 ? (
                <TR><TD className="text-muted-foreground" colSpan={6}>Tidak ada resep.</TD></TR>
              ) : (
                rows.map((p) => (
                  <TR key={p.id}>
                    <TD className="font-mono text-xs">
                      {p.transaction?.transaction_code?.slice(0, 8) ?? `#${p.transaction_id}`}
                    </TD>
                    <TD>{p.transaction?.user?.full_name ?? "-"}</TD>
                    <TD><PrescriptionStatusBadge status={p.status} /></TD>
                    <TD className="text-muted-foreground">
                      {p.reviewed_at ? formatDate(p.reviewed_at) : "Belum"}
                    </TD>
                    <TD className="text-muted-foreground">{formatDate(p.created_at)}</TD>
                    <TD>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => setDetail(p)}>
                          Lihat resep
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

      {detail && (
        <Modal
          open
          title="Detail Resep"
          description={detail.transaction?.transaction_code}
          onClose={() => setDetail(null)}
        >
          <div className="space-y-4">
            <dl className="divide-y divide-border">
              <DetailRow label="Status">
                <PrescriptionStatusBadge status={detail.status} />
              </DetailRow>
              <DetailRow label="Pasien">{detail.transaction?.user?.full_name ?? "-"}</DetailRow>
              <DetailRow label="Catatan apoteker">{detail.notes || "-"}</DetailRow>
              <DetailRow label="Direview">
                {detail.reviewed_at ? formatDate(detail.reviewed_at) : "Belum direview"}
              </DetailRow>
              <DetailRow label="Diunggah">{formatDate(detail.created_at)}</DetailRow>
            </dl>

            {detail.image_url ? (
              <a href={assetUrl(detail.image_url)} target="_blank" rel="noreferrer">
                <img
                  src={assetUrl(detail.image_url)}
                  alt="Resep"
                  className="max-h-[50vh] w-full rounded-md border border-border object-contain"
                />
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">Tidak ada gambar resep.</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
