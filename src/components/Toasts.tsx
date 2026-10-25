import { useData, type ToastTone } from "@/context/DataContext";
import { CheckIcon, InfoIcon, XIcon } from "./icons";
import { cn } from "@/lib/format";

const TONES: Record<ToastTone, string> = {
  info: "border-white/10 bg-zinc-900 text-zinc-200",
  success: "border-emerald-400/25 bg-emerald-950/90 text-emerald-100",
  error: "border-red-400/25 bg-red-950/90 text-red-100",
};

export function Toasts() {
  const { toasts, dismissToast } = useData();

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[24rem]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "animate-rise pointer-events-auto flex w-full items-start gap-2.5 rounded-2xl border p-3 text-xs leading-relaxed shadow-2xl shadow-black/40 backdrop-blur",
            TONES[toast.tone],
          )}
          role="status"
        >
          {toast.tone === "success" ? (
            <CheckIcon className="mt-0.5 size-4 shrink-0" />
          ) : (
            <InfoIcon className="mt-0.5 size-4 shrink-0" />
          )}
          <p className="flex-1">{toast.message}</p>
          <button
            type="button"
            className="rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
            onClick={() => dismissToast(toast.id)}
            aria-label="Tanca l'avís"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
