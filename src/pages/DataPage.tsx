import { useRef, useState } from "react";
import { useData } from "@/context/DataContext";
import { useCacheSummary } from "@/hooks/useCache";
import { formatBytes, formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { SyncControls } from "@/components/SyncControls";
import { Badge, Spinner } from "@/components/ui";
import {
  AlertIcon,
  DatabaseIcon,
  DownloadIcon,
  TrashIcon,
  UploadIcon,
} from "@/components/icons";

export default function DataPage() {
  const {
    lastSyncAt,
    storage,
    entryCount,
    exportBackup,
    importBackup,
    clearAll,
    requestPersistence,
    online,
    syncStatus,
  } = useData();
  const summary = useCacheSummary();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importing, setImporting] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const running = syncStatus === "running";
  const usedPercent =
    storage && storage.quota > 0
      ? Math.min(100, (storage.usage / storage.quota) * 100)
      : 0;

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    try {
      await importBackup(file);
    } catch {
      // El context ja mostra el toast d'error corresponent.
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearAll();
      setConfirmingClear(false);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      <PageHeader
        eyebrow="Memòria de l'app"
        title="Dades i emmagatzematge"
        description="Tot el que veus es guarda al navegador (IndexedDB). Aquí pots actualitzar-ho, exportar-ho o esborrar-ho."
        action={
          <Badge tone={online ? "green" : "red"}>
            {online ? "En línia" : "Offline"}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-soft px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">
            Última actualització
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {lastSyncAt ? formatDateTime(lastSyncAt) : "Mai"}
          </p>
        </div>
        <div className="card-soft px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">
            Blocs desats
          </p>
          <p className="mt-1 text-sm font-semibold text-white">{entryCount}</p>
        </div>
        <div className="card-soft px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">
            Espai utilitzat
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {storage ? formatBytes(storage.usage) : "—"}
          </p>
          {storage && storage.quota > 0 && (
            <div className="mt-2">
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: `${Math.max(usedPercent, 1)}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-zinc-600">
                de {formatBytes(storage.quota)}
              </p>
            </div>
          )}
        </div>
        <div className="card-soft px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">
            Persistència
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {storage?.persisted ? "Activada" : "No garantida"}
          </p>
          <button
            type="button"
            className="mt-1.5 text-[11px] font-medium text-orange-400 transition-colors hover:text-orange-300"
            onClick={requestPersistence}
          >
            Demana persistència
          </button>
        </div>
      </div>

      <section className="card mt-6 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white">
          Actualitza les dades
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          Aquesta app no fa cap petició automàtica. Tria el rang i prem el
          botó.
        </p>
        <div className="mt-5">
          <SyncControls showMeta={false} />
        </div>
      </section>

      <section className="card mt-6 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Què hi ha a la memòria
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Resum dels blocs desats al navegador.
            </p>
          </div>
          <DatabaseIcon className="size-5 text-zinc-500" />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Classificació", summary.standings],
            ["Dies de partits", summary.days],
            ["Rànquings", summary.leaders],
            ["Fitxes d'equip", summary.teams],
            ["Fitxes de jugador", summary.players],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
            >
              <dt className="text-[11px] text-zinc-500">{label}</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums text-white">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card mt-6 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white">
          Backup i manteniment
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          La memòria és per navegador i per origen. Exporta un JSON si vols
          moure les dades a un altre navegador o fer una còpia de seguretat.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={exportBackup}
            disabled={entryCount === 0}
          >
            <DownloadIcon className="size-4" />
            Exporta el backup
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing || running}
          >
            {importing ? (
              <Spinner className="size-4" />
            ) : (
              <UploadIcon className="size-4" />
            )}
            Importa un backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => handleImport(event.target.files?.[0])}
          />

          {!confirmingClear ? (
            <button
              type="button"
              className="btn-danger"
              onClick={() => setConfirmingClear(true)}
              disabled={entryCount === 0 || running}
            >
              <TrashIcon className="size-4" />
              Esborra totes les dades
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 p-2">
              <span className="px-1 text-xs text-red-200">
                Segur? Això no desinstal·la l&apos;app, només esborra les dades.
              </span>
              <button
                type="button"
                className="btn-danger px-2.5 py-1.5 text-xs"
                onClick={handleClear}
                disabled={clearing}
              >
                {clearing ? <Spinner className="size-3.5" /> : null}
                Sí, esborra-ho
              </button>
              <button
                type="button"
                className="btn-ghost px-2 py-1.5 text-xs"
                onClick={() => setConfirmingClear(false)}
                disabled={clearing}
              >
                Cancel·la
              </button>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px] leading-relaxed text-zinc-400">
          <AlertIcon className="mt-0.5 size-4 shrink-0 text-orange-400" />
          <p>
            Si esborres les dades, l&apos;app continuarà instal·lada i
            funcionant, però les pàgines mostraran l&apos;estat buit fins que
            tornis a actualitzar amb connexió.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-xs leading-relaxed text-zinc-500">
        <h2 className="text-sm font-semibold text-white">
          Com funciona l&apos;offline
        </h2>
        <ul className="mt-3 space-y-2">
          <li>
            <span className="text-zinc-300">App shell:</span> el service worker
            guarda HTML, JavaScript, CSS, fonts i icones perquè l&apos;app
            obri sense xarxa.
          </li>
          <li>
            <span className="text-zinc-300">Estadístiques:</span> només
            s&apos;actualitzen en prémer el botó. Es desen a IndexedDB i es
            llegeixen sempre d&apos;allà.
          </li>
          <li>
            <span className="text-zinc-300">Imatges:</span> els logos i les
            fotos d&apos;ESPN es cachegen automàticament pel navegador quan es
            mostren per primera vegada.
          </li>
        </ul>
      </section>
    </div>
  );
}
