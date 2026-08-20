import { listarTodasLicencas } from "@/lib/actions/admin-licencas";
import { TabelaLicencas } from "@/components/admin/TabelaLicencas";

// /admin — Gestão de Licenças (backoffice de plataforma, Fase 3).
// Server Component: lê todas as licenças (cross-tenant) e delega a UI de
// gestão à TabelaLicencas (Client Component, escrita via Server Actions).
export default async function AdminLicencasPage() {
  const res = await listarTodasLicencas();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#141210]">
          Gestão de Licenças
        </h1>
        <p className="mt-1 text-corpo-sec text-cinza-600">
          Todas as licenças da plataforma. Altera o estado ou a data de fim.
        </p>
      </div>

      {res.sucesso ? (
        <TabelaLicencas licencas={res.dados} />
      ) : (
        <p
          role="alert"
          className="rounded-lg border border-vermelho-600/20 bg-vermelho-600/5 px-4 py-8 text-center text-corpo-sec text-vermelho-600"
        >
          {res.erro}
        </p>
      )}
    </section>
  );
}
