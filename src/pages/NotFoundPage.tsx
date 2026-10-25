import { Link } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";

export default function NotFoundPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
      <EmptyState
        title="Pàgina no trobada"
        description="La ruta que has obert no existeix. Torna a l'inici per continuar consultant les estadístiques."
        action={
          <Link to="/" className="btn-primary">
            Torna a l&apos;inici
          </Link>
        }
      />
    </div>
  );
}
