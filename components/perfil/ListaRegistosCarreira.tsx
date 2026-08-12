import { Trophy, CalendarRange } from "lucide-react";
import { obterRegistosCarreira } from "@/lib/actions/perfis";
import { EstadoErro, EstadoVazio } from "@/components/layout/EstadosUI";
import { RegistoCarreiraAcoes } from "./RegistoCarreiraAcoes";

/**
 * Lista o histórico de carreira do treinador (P2.4 — §8.17).
 * Server Component: obtém os registos do utilizador autenticado e delega
 * a interatividade (editar/eliminar) a um componente cliente por item.
 */
export async function ListaRegistosCarreira() {
  const res = await obterRegistosCarreira();
  if (!res.sucesso) return <EstadoErro mensagem={res.erro} />;

  const registos = res.dados;

  if (registos.length === 0) {
    return (
      <EstadoVazio
        titulo="Sem registos de carreira"
        descricao="Adiciona as tuas passagens por clubes e escalões — o teu percurso viaja contigo."
      />
    );
  }

  return (
    <ul className="animar-cascata space-y-2">
      {registos.map((r) => (
        <li key={r.id} className="card-base flex items-start gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-corpo font-semibold text-cinza-900">{r.clube}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-legenda text-cinza-500">
              <span>{r.escalao}</span>
              <span className="inline-flex items-center gap-1">
                <CalendarRange className="h-3.5 w-3.5" />
                {r.epocaInicio}
                {r.epocaFim ? ` — ${r.epocaFim}` : " — Em curso"}
              </span>
            </div>
            {r.conquistas && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-corpo-sec text-cinza-700">
                <Trophy className="h-4 w-4 text-primary" />
                {r.conquistas}
              </p>
            )}
            {r.notas && (
              <p className="mt-1 text-corpo-sec text-cinza-600">{r.notas}</p>
            )}
          </div>

          <RegistoCarreiraAcoes registo={r} />
        </li>
      ))}
    </ul>
  );
}
