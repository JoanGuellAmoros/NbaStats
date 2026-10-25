import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { XIcon } from "./icons";
import { SyncControls } from "./SyncControls";

export function SyncPanel() {
  const { panelOpen, closePanel } = useData();

  useEffect(() => {
    if (!panelOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [panelOpen, closePanel]);

  if (!panelOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={closePanel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sync-panel-title"
        className="animate-rise max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0b0c11] p-5 shadow-2xl shadow-black/60 sm:rounded-3xl sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-400">
              Només manual
            </p>
            <h2
              id="sync-panel-title"
              className="mt-1 text-xl font-semibold tracking-tight text-white"
            >
              Actualitza les dades
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Tria què vols descarregar. Res no es demana fins que prems el
              botó.
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost -mr-2 -mt-1 px-2"
            onClick={closePanel}
            aria-label="Tanca el panell"
          >
            <XIcon className="size-5" />
          </button>
        </header>

        <SyncControls />

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <Link
            to="/dades"
            className="text-xs font-medium text-zinc-400 transition-colors hover:text-orange-400"
            onClick={closePanel}
          >
            Gestiona l&apos;emmagatzematge →
          </Link>
          <button type="button" className="btn-secondary" onClick={closePanel}>
            Tanca
          </button>
        </div>
      </div>
    </div>
  );
}
