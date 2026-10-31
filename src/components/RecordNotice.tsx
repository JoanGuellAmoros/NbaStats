import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { formatDateShort } from "@/lib/format";
import { recordValue } from "@/lib/records";
import { TeamLogo } from "./TeamLogo";
import { BasketballIcon, XIcon } from "./icons";

function joinNames(names: string[]): string {
  if (names.length === 0) return "—";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} i ${names[names.length - 1]}`;
}

export function RecordNotice() {
  const { recordBreaks, dismissRecordBreaks } = useData();

  useEffect(() => {
    if (recordBreaks.length === 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismissRecordBreaks();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [recordBreaks.length, dismissRecordBreaks]);

  if (recordBreaks.length === 0) return null;

  const title =
    recordBreaks.length === 1
      ? recordBreaks[0].equalled
        ? "Rècord igualat!"
        : "Rècord superat!"
      : `${recordBreaks.length} rècords ${
          recordBreaks.some((entry) => !entry.equalled)
            ? "batuts"
            : "igualats"
        }!`;

  return (
    <div
      data-record-notice="true"
      className="fixed inset-0 z-[75] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={dismissRecordBreaks}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-notice-title"
        className="animate-rise max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-orange-400/25 bg-[#0b0c11] p-5 shadow-2xl shadow-black/60 sm:rounded-3xl sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange-400/15 text-orange-300">
              <BasketballIcon className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-400">
                Fites del dia
              </p>
              <h2
                id="record-notice-title"
                className="mt-1 text-xl font-semibold tracking-tight text-white"
              >
                {title}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Amb els boxscores que acabes de descarregar s&apos;ha millorat
                o igualat el millor registre que tenies desat.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-ghost -mr-2 -mt-1 px-2"
            onClick={dismissRecordBreaks}
            aria-label="Tanca l'avís de rècords"
          >
            <XIcon className="size-5" />
          </button>
        </header>

        <ul className="space-y-2.5">
          {recordBreaks.map((entry) => {
            const verb = entry.equalled ? "ha igualat" : "ha superat";

            return (
            <li
              key={`${entry.scope}:${entry.categoryKey}:${entry.gameId}:${entry.name}`}
              data-record-break={entry.categoryKey}
            >
              <Link
                to={`/partits/${entry.gameId}`}
                onClick={dismissRecordBreaks}
                className="card flex items-center gap-3 p-3 transition-colors hover:border-orange-400/30 hover:bg-zinc-900/70"
              >
                <TeamLogo team={entry.team} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    {entry.scope === "team"
                      ? "Rècord d'equip"
                      : "Rècord individual"}{" "}
                    · {entry.short}
                  </p>
                  <p className="mt-0.5 text-sm leading-snug text-zinc-300">
                    {entry.scope === "team" ? (
                      <>
                        L&apos;equip{" "}
                        <span className="font-semibold text-white">
                          {entry.name}
                        </span>{" "}
                        {verb} el rècord de {entry.label.toLowerCase()}.
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-white">
                          {entry.name}
                        </span>{" "}
                        {verb} el rècord de {entry.label.toLowerCase()}.
                      </>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    Abans:{" "}
                    <span
                      className="text-zinc-400"
                      data-record-previous={entry.previousNames.join("|")}
                    >
                      {joinNames(entry.previousNames)}
                    </span>{" "}
                    · {recordValue(entry, entry.previous)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="text-2xl font-semibold tabular-nums text-orange-300">
                    {recordValue(entry, entry.value)}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {formatDateShort(entry.date)}
                  </span>
                </div>
              </Link>
            </li>
            );
          })}
        </ul>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <Link
            to="/records"
            className="text-xs font-medium text-zinc-400 transition-colors hover:text-orange-400"
            onClick={dismissRecordBreaks}
          >
            Veure tots els rècords →
          </Link>
          <button
            type="button"
            className="btn-secondary"
            onClick={dismissRecordBreaks}
          >
            Tanca
          </button>
        </div>
      </div>
    </div>
  );
}
