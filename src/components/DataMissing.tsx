import { useData } from "@/context/DataContext";
import { EmptyState } from "./EmptyState";
import { RefreshIcon } from "./icons";

export function DataMissing({
  title = "Encara no hi ha dades en memòria",
  description,
}: {
  title?: string;
  description?: string;
}) {
  const { openPanel, online } = useData();

  return (
    <EmptyState
      title={title}
      description={
        description ??
        (online
          ? "L'app no fa cap petició automàtica. Prem el botó per descarregar les estadístiques i desar-les al navegador."
          : "Ara mateix estàs offline i aquestes dades encara no s'han descarregat. Quan recuperis la connexió, prem Actualitza.")
      }
      icon={<RefreshIcon className="size-6" />}
      action={
        <button type="button" className="btn-primary" onClick={openPanel}>
          <RefreshIcon className="size-4" />
          Actualitza les dades
        </button>
      }
    />
  );
}
