// /admin/monitorizacao — Monitorização (backoffice de plataforma).
// Fase 4: liga a ferramentas externas de observabilidade (Vercel Analytics e
// Sentry). A app não faz logging próprio — apenas encaminha para os dashboards
// externos. SENTRY_DSN é uma variável de servidor (sem prefixo NEXT_PUBLIC_),
// pelo que pode ser lida aqui num Server Component sem expor ao cliente.

// URL base do dashboard do Sentry. Nunca expomos o DSN em si no link.
const SENTRY_DASHBOARD_URL = "https://sentry.io";
const VERCEL_ANALYTICS_URL = "https://vercel.com/analytics";

export default function AdminMonitorizacaoPage() {
  const sentryConfigurado = Boolean(process.env.SENTRY_DSN);

  return (
    <section>
      <h1 className="font-display text-2xl font-bold tracking-tight text-[#141210]">
        Monitorização
      </h1>
      <p className="mt-2 text-sm text-[#57514A]">
        Observabilidade da plataforma através de ferramentas externas.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* Cartão 1 — Vercel Analytics */}
        <article className="flex flex-col rounded-2xl border border-[#E4E1DB] bg-[#F7F5F2] p-6">
          <h2 className="font-display text-lg font-bold tracking-tight text-[#141210]">
            Vercel Analytics
          </h2>
          <p className="mt-2 flex-1 text-sm text-[#57514A]">
            Métricas de performance e tráfego no dashboard da Vercel.
          </p>
          <a
            href={VERCEL_ANALYTICS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#141210] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#34302A]"
          >
            Abrir no Vercel ↗
          </a>
        </article>

        {/* Cartão 2 — Sentry */}
        <article className="flex flex-col rounded-2xl border border-[#E4E1DB] bg-[#F7F5F2] p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg font-bold tracking-tight text-[#141210]">
              Sentry — Monitorização de Erros
            </h2>
            {!sentryConfigurado && (
              <span className="shrink-0 rounded-full bg-[#FBEECB] px-2.5 py-0.5 text-xs font-semibold text-[#8A5A06]">
                Por configurar
              </span>
            )}
          </div>

          {sentryConfigurado ? (
            <>
              <p className="mt-2 flex-1 text-sm text-[#57514A]">
                Erros e exceções capturados no dashboard do Sentry.
              </p>
              <a
                href={SENTRY_DASHBOARD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#141210] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#34302A]"
              >
                Abrir no Sentry ↗
              </a>
            </>
          ) : (
            <p className="mt-2 flex-1 rounded-lg border border-dashed border-[#E4E1DB] bg-white px-4 py-3 text-sm text-[#57514A]">
              Sentry não configurado. Ver{" "}
              <code className="rounded bg-[#EDEBE7] px-1 py-0.5 text-xs text-[#141210]">
                docs/DEPLOY.md §6
              </code>
              .
            </p>
          )}

          <p className="mt-4 text-xs text-[#98938D]">
            Setup pendente — ver docs/DEPLOY.md §6
          </p>
        </article>
      </div>
    </section>
  );
}
