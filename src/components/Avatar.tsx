import { useState } from "react";
import { assetUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const text = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return text.toUpperCase() || "?";
}

interface AvatarProps {
  name?: string | null;
  pictureUrl?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, pictureUrl, size = 36, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const url = assetUrl(pictureUrl);
  const dimension = { width: size, height: size };

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name ?? ""}
        onError={() => setFailed(true)}
        className={cn("shrink-0 rounded-full border border-border object-cover", className)}
        style={dimension}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary",
        className
      )}
      style={{ ...dimension, fontSize: Math.max(11, size * 0.34) }}
    >
      {initials(name)}
    </div>
  );
}
