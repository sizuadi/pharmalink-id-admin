import { useCallback, useEffect, useState } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { api, buildQuery, type Single, type Paginated, type ApiError } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

// Mirrors backend NotificationValidation.CREATE_BROADCAST.
const AUDIENCE_OPTIONS = [
  { value: "ALL", label: "Semua pengguna" },
  { value: "PATIENT", label: "Pasien" },
  { value: "PHARMACIST", label: "Apoteker" },
  { value: "CUSTOM", label: "Pengguna tertentu (ID)" },
] as const;

const CATEGORY_OPTIONS = [
  "TRANSACTION",
  "PAYMENT",
  "DELIVERY",
  "MEDICINE",
  "PAYOUT",
  "SECURITY",
  "SYSTEM",
  "PROMOTION",
];
const CHANNEL_OPTIONS = ["IN_APP", "EMAIL", "SMS", "PUSH"];
const PRIORITY_OPTIONS = ["LOW", "NORMAL", "HIGH", "CRITICAL"];

type AudienceType = (typeof AUDIENCE_OPTIONS)[number]["value"];

interface BroadcastResult {
  id: number;
  audience_type: string;
  type: string;
  category: string;
  channel: string;
  priority: string;
  title: string;
  status: string;
  total_targeted: number;
  total_sent: number;
  total_failed: number;
  created_at: string;
}

interface BroadcastListItem {
  id: number;
  audience_type: string;
  type: string;
  category: string;
  channel: string;
  priority: string;
  title: string;
  status: string;
  total_targeted: number;
  total_sent: number;
  total_failed: number;
  created_at: string;
}

function BroadcastStatusBadge({ status }: { status: string }) {
  const s = (status ?? "").toUpperCase();
  const tone =
    s === "COMPLETED" ? "success" : s === "FAILED" ? "danger" : "warning";
  return <Badge tone={tone}>{status}</Badge>;
}

const fieldClass =
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-sm font-medium">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

export function Notifications() {
  const [audienceType, setAudienceType] = useState<AudienceType>("ALL");
  const [customIds, setCustomIds] = useState("");
  const [type, setType] = useState("ADMIN_BROADCAST");
  const [category, setCategory] = useState("");
  const [channel, setChannel] = useState("");
  const [priority, setPriority] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [dataJson, setDataJson] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BroadcastResult | null>(null);

  // ----- Broadcast list + filters -----
  const [list, setList] = useState<BroadcastListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [fAudience, setFAudience] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [sort, setSort] = useState("created_at:desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const [sortName, sortBy] = sort.split(":");
      const res = await api.get<Paginated<BroadcastListItem>>(
        `/admin/admins/notifications/broadcast${buildQuery({
          page,
          perPage: 10,
          audience_type: fAudience,
          category: fCategory,
          status: fStatus,
          sortName,
          sortBy,
        })}`
      );
      setList(res.data ?? []);
      setTotalPages(res.meta?.totalPages ?? 1);
    } finally {
      setListLoading(false);
    }
  }, [page, fAudience, fCategory, fStatus, sort]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  function parseCustomIds(raw: string): number[] {
    return raw
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => Number.isInteger(n) && n > 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    // Client-side validation mirroring the backend rules.
    if (title.trim().length < 2) return setError("Judul minimal 2 karakter.");
    if (message.trim().length < 2) return setError("Pesan minimal 2 karakter.");
    if (type.trim().length < 2) return setError("Tipe notifikasi minimal 2 karakter.");

    let recipientIds: number[] = [];
    if (audienceType === "CUSTOM") {
      recipientIds = parseCustomIds(customIds);
      if (recipientIds.length === 0) {
        return setError("Masukkan minimal satu ID pengguna yang valid untuk audiens CUSTOM.");
      }
    }

    if (dataJson.trim()) {
      try {
        JSON.parse(dataJson);
      } catch {
        return setError("Data JSON tidak valid.");
      }
    }

    const body: Record<string, unknown> = {
      audience_type: audienceType,
      type: type.trim(),
      title: title.trim(),
      message: message.trim(),
    };
    if (category) body.category = category;
    if (channel) body.channel = channel;
    if (priority) body.priority = priority;
    if (dataJson.trim()) body.data_json = dataJson.trim();
    if (expiresAt) body.expires_at = new Date(expiresAt).toISOString();
    if (audienceType === "CUSTOM") body.custom_recipient_ids = recipientIds;

    setSubmitting(true);
    try {
      const res = await api.post<Single<BroadcastResult>>(
        "/admin/admins/notifications/broadcast",
        body
      );
      setResult(res.data);
      // Reset the message fields but keep audience/type for repeated sends.
      setTitle("");
      setMessage("");
      setDataJson("");
      setExpiresAt("");
      if (audienceType === "CUSTOM") setCustomIds("");
      // Refresh the history list so the new broadcast shows up.
      setPage(1);
      loadList();
    } catch (err) {
      setError((err as ApiError)?.message ?? "Gagal mengirim broadcast.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Broadcast Notification</h1>
        <p className="text-sm text-muted-foreground">
          Kirim notifikasi ke pengguna aplikasi
        </p>
      </div>

      {result && (
        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="flex items-start gap-3 pt-5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="text-sm">
              <p className="font-medium text-emerald-700 dark:text-emerald-400">
                Broadcast berhasil dibuat (#{result.id})
              </p>
              <p className="mt-1 text-muted-foreground">
                Audiens <b>{result.audience_type}</b> · Status <b>{result.status}</b> ·
                Target <b>{result.total_targeted}</b> pengguna
                {result.total_sent > 0 ? ` · Terkirim ${result.total_sent}` : ""}
                {result.total_failed > 0 ? ` · Gagal ${result.total_failed}` : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-3 pt-5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pesan Baru</CardTitle>
          <CardDescription>
            Field bertanda <span className="text-destructive">*</span> wajib diisi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Audience */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label required>Audiens</Label>
                <select
                  className={fieldClass}
                  value={audienceType}
                  onChange={(e) => setAudienceType(e.target.value as AudienceType)}
                >
                  {AUDIENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label required>Tipe</Label>
                <Input
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="ADMIN_BROADCAST"
                  maxLength={64}
                />
              </div>
            </div>

            {audienceType === "CUSTOM" && (
              <div>
                <Label required>ID Pengguna (pisahkan dengan koma)</Label>
                <Input
                  value={customIds}
                  onChange={(e) => setCustomIds(e.target.value)}
                  placeholder="contoh: 12, 34, 56"
                />
              </div>
            )}

            {/* Title + message */}
            <div>
              <Label required>Judul</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul notifikasi"
                maxLength={256}
              />
            </div>
            <div>
              <Label required>Pesan</Label>
              <textarea
                className={`${fieldClass} min-h-[110px] resize-y`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Isi pesan notifikasi…"
                maxLength={5000}
              />
            </div>

            {/* Optional metadata */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Kategori</Label>
                <select
                  className={fieldClass}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">—</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Channel</Label>
                <select
                  className={fieldClass}
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                >
                  <option value="">—</option>
                  {CHANNEL_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Prioritas</Label>
                <select
                  className={fieldClass}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="">—</option>
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Kedaluwarsa (opsional)</Label>
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              <div>
                <Label>Data JSON (opsional)</Label>
                <Input
                  value={dataJson}
                  onChange={(e) => setDataJson(e.target.value)}
                  placeholder='{"order_id": 123}'
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                <Send className="h-4 w-4" />
                {submitting ? "Mengirim…" : "Kirim Broadcast"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Broadcast</CardTitle>
          <CardDescription>Daftar notifikasi broadcast yang pernah dikirim.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <Select
              value={fAudience}
              onChange={(e) => { setPage(1); setFAudience(e.target.value); }}
            >
              <option value="">Semua audiens</option>
              {AUDIENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
            <Select
              value={fCategory}
              onChange={(e) => { setPage(1); setFCategory(e.target.value); }}
            >
              <option value="">Semua kategori</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Select
              value={fStatus}
              onChange={(e) => { setPage(1); setFStatus(e.target.value); }}
            >
              <option value="">Semua status</option>
              {["QUEUED", "PROCESSING", "COMPLETED", "FAILED"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <Select
              value={sort}
              onChange={(e) => { setPage(1); setSort(e.target.value); }}
            >
              <option value="created_at:desc">Terbaru</option>
              <option value="created_at:asc">Terlama</option>
              <option value="total_targeted:desc">Target terbanyak</option>
            </Select>
          </div>

          <Table>
            <THead>
              <TR>
                <TH>Judul</TH>
                <TH>Audiens</TH>
                <TH>Kategori</TH>
                <TH>Status</TH>
                <TH>Target</TH>
                <TH>Tanggal</TH>
              </TR>
            </THead>
            <TBody>
              {listLoading ? (
                <TR><TD className="text-muted-foreground" colSpan={6}>Loading…</TD></TR>
              ) : list.length === 0 ? (
                <TR><TD className="text-muted-foreground" colSpan={6}>Belum ada broadcast.</TD></TR>
              ) : (
                list.map((b) => (
                  <TR key={b.id}>
                    <TD className="max-w-[260px] truncate font-medium">{b.title}</TD>
                    <TD className="text-muted-foreground">{b.audience_type}</TD>
                    <TD className="text-muted-foreground">{b.category}</TD>
                    <TD><BroadcastStatusBadge status={b.status} /></TD>
                    <TD className="text-muted-foreground">
                      {b.total_targeted}
                      {b.total_failed > 0 ? ` (gagal ${b.total_failed})` : ""}
                    </TD>
                    <TD className="text-muted-foreground">{formatDate(b.created_at)}</TD>
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
