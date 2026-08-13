import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// P4.7 — Cards sociais nativos para Instagram (bíblia §3.16)
// Schema partilhado (cliente/servidor) dos parâmetros da rota de geração de
// imagem e utilitário RGPD de deteção de escalões de formação jovem.
// ─────────────────────────────────────────────────────────────────────────────

export const TIPOS_CARD = ["resultado", "mvp", "ranking"] as const;
export type TipoCard = (typeof TIPOS_CARD)[number];

export const LABEL_TIPO_CARD: Record<TipoCard, string> = {
  resultado: "Resultado",
  mvp: "MVP do jogo",
  ranking: "Top 5 marcadores",
};

/**
 * Parâmetros de query da rota `GET /api/social/card`.
 *  • `resultado` e `mvp` exigem `jogoId`.
 *  • `ranking` exige `escalaoId` + `epocaId`.
 *  • `token` (verificação anti-scraping) é sempre obrigatório.
 */
export const cardQuerySchema = z
  .object({
    tipo: z.enum(TIPOS_CARD),
    jogoId: z.string().min(1).optional(),
    escalaoId: z.string().min(1).optional(),
    epocaId: z.string().min(1).optional(),
    token: z.string().min(1, "Token em falta"),
  })
  .superRefine((val, ctx) => {
    if (val.tipo === "resultado" || val.tipo === "mvp") {
      if (!val.jogoId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["jogoId"],
          message: "jogoId é obrigatório para este tipo de card",
        });
      }
    } else if (val.tipo === "ranking") {
      if (!val.escalaoId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["escalaoId"],
          message: "escalaoId é obrigatório para o card de ranking",
        });
      }
      if (!val.epocaId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["epocaId"],
          message: "epocaId é obrigatório para o card de ranking",
        });
      }
    }
  });

export type CardQuery = z.infer<typeof cardQuerySchema>;

/**
 * RGPD (bíblia §3.16 / §11): os cards sociais NUNCA podem expor dados de
 * atletas menores. Um escalão é considerado de formação jovem quando o seu
 * nome corresponde a um escalão sub-14 (ou inferior) ou a uma das categorias
 * tradicionais de formação (petizes, traquinas, benjamins, infantis, escolas,
 * minis, mirins).
 *
 * A deteção é tolerante a variações de escrita ("Sub-12", "sub 12", "SUB12").
 * O limiar sub-≤14 apanha também sub-9/11/13 (todos menores) por segurança.
 */
export function eEscalaoFormacaoJovem(nome: string): boolean {
  if (!nome) return false;
  const normalizado = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const categoriasJovens = [
    "petiz",
    "traquina",
    "benjamim",
    "benjamin",
    "infanti", // "Infantil"/"Infantis" (Sub-13) — não colide com "Infanto-juvenil" (>14)
    "escola",
    "mini",
    "mirim", // "Mirim"/"Pré-mirim"
    "bambi",
  ];
  if (categoriasJovens.some((c) => normalizado.includes(c))) return true;

  // "sub-14", "sub 14", "sub14" → captura a idade.
  const m = normalizado.match(/sub[\s-]?(\d{1,2})/);
  if (m) {
    const idade = Number.parseInt(m[1], 10);
    if (!Number.isNaN(idade) && idade <= 14) return true;
  }
  return false;
}
