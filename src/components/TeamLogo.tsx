import { useState } from "react";
import type { Team } from "@/lib/types";
import { cn } from "@/lib/format";

export function TeamLogo({
  team,
  size = 40,
  className,
}: {
  team?: Team | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = !failed ? team?.logo : undefined;

  if (!src) {
    return (
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full border border-white/10 text-[10px] font-semibold text-zinc-300",
          className,
        )}
        style={{
          width: size,
          height: size,
          backgroundColor: team?.color ? `${team.color}22` : undefined,
        }}
      >
        {team?.abbreviation ?? "?"}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={team?.name ?? "Escut de l'equip"}
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
