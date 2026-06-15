import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { api, type Single, type ApiError } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Settings = Record<string, string>;

const MAX_DISTANCE_KEY = "max_delivery_distance_km";

export function Settings() {
  const [maxDistance, setMaxDistance] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Single<Settings>>("/admin/settings");
        setMaxDistance(res.data?.[MAX_DISTANCE_KEY] ?? "");
      } catch (err) {
        setMessage({ type: "err", text: (err as ApiError)?.message ?? "Gagal memuat pengaturan" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    const value = Number(maxDistance);
    if (!Number.isFinite(value) || value <= 0 || value > 1000) {
      setMessage({ type: "err", text: "Jarak maksimal harus angka antara 1 dan 1000 km" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.patch<Single<Settings>>("/admin/settings", {
        [MAX_DISTANCE_KEY]: value,
      });
      setMaxDistance(res.data?.[MAX_DISTANCE_KEY] ?? String(value));
      setMessage({ type: "ok", text: "Pengaturan tersimpan" });
    } catch (err) {
      setMessage({ type: "err", text: (err as ApiError)?.message ?? "Gagal menyimpan pengaturan" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Konfigurasi platform</p>
      </div>

      <Card>
        <CardContent className="max-w-md space-y-4 pt-5">
          <div className="space-y-1.5">
            <label htmlFor="maxDistance" className="text-sm font-medium">
              Jarak maksimal apotek (km)
            </label>
            <Input
              id="maxDistance"
              type="number"
              min={1}
              max={1000}
              step="0.5"
              value={maxDistance}
              disabled={loading || saving}
              onChange={(e) => setMaxDistance(e.target.value)}
              placeholder="10"
            />
            <p className="text-xs text-muted-foreground">
              Pasien hanya melihat apotek (dan obatnya) dalam radius ini dari lokasinya.
            </p>
          </div>

          {message && (
            <p
              className={
                message.type === "ok"
                  ? "text-sm text-emerald-600"
                  : "text-sm text-destructive"
              }
            >
              {message.text}
            </p>
          )}

          <Button onClick={save} disabled={loading || saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
