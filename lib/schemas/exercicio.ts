import { z } from "zod";

// ─── Diagrama de campo (secção 13.3) ────────────────────────────────────────

const pontoSchema = z.object({ x: z.number(), y: z.number() });

const corJogadorSchema = z.enum(["azul", "vermelho", "amarelo", "verde"]);

const jogadorSchema = z.object({
  id: z.string(),
  tipo: z.literal("jogador"),
  x: z.number().min(0).max(400),
  y: z.number().min(0).max(200),
  numero: z.number().int().optional(),
  cor: corJogadorSchema,
  posicao: z.enum(["GR", "fixo", "ala", "pivo"]).optional(),
});

const bolaSchema = z.object({
  id: z.string(),
  tipo: z.literal("bola"),
  x: z.number().min(0).max(400),
  y: z.number().min(0).max(200),
});

const coneSchema = z.object({
  id: z.string(),
  tipo: z.literal("cone"),
  x: z.number().min(0).max(400),
  y: z.number().min(0).max(200),
});

const balizaSchema = z.object({
  id: z.string(),
  tipo: z.literal("baliza"),
  x: z.number().min(0).max(400),
  y: z.number().min(0).max(200),
  orientacao: z.enum(["horizontal", "vertical"]),
});

const setaSchema = z.object({
  id: z.string(),
  tipo: z.literal("seta"),
  estilo: z.enum(["movimento", "passe", "conducao"]),
  cor: z.string(),
  pontos: z.array(pontoSchema).min(2),
});

const linhaSchema = z.object({
  id: z.string(),
  tipo: z.literal("linha"),
  cor: z.string(),
  pontos: z.array(pontoSchema).min(2),
});

const textoSchema = z.object({
  id: z.string(),
  tipo: z.literal("texto"),
  x: z.number().min(0).max(400),
  y: z.number().min(0).max(200),
  conteudo: z.string().max(120),
});

export const elementoCampoSchema = z.discriminatedUnion("tipo", [
  jogadorSchema,
  bolaSchema,
  coneSchema,
  balizaSchema,
  setaSchema,
  linhaSchema,
  textoSchema,
]);

// Passo de animação (secção 11.2 da bíblia): posições dos elementos neste passo.
const passoAnimacaoSchema = z.object({
  id: z.string(),
  ordem: z.number().int(),
  posicoes: z.array(
    z.object({ elementoId: z.string(), x: z.number(), y: z.number() }),
  ),
  duracaoMs: z.number().int().min(100).max(10000).optional(),
});

// Retrocompatível: versão 1 (estático) ou 2 (com passos opcionais).
export const diagramaSchema = z.object({
  versao: z.union([z.literal(1), z.literal(2)]),
  elementos: z.array(elementoCampoSchema),
  passos: z.array(passoAnimacaoSchema).optional(),
});

export type PassoAnimacao = z.infer<typeof passoAnimacaoSchema>;

export type CorJogador = z.infer<typeof corJogadorSchema>;
export type Jogador = z.infer<typeof jogadorSchema>;
export type Bola = z.infer<typeof bolaSchema>;
export type Cone = z.infer<typeof coneSchema>;
export type Baliza = z.infer<typeof balizaSchema>;
export type Seta = z.infer<typeof setaSchema>;
export type Linha = z.infer<typeof linhaSchema>;
export type Texto = z.infer<typeof textoSchema>;
export type ElementoCampo = z.infer<typeof elementoCampoSchema>;
export type DiagramaCampo = z.infer<typeof diagramaSchema>;

export const DIAGRAMA_VAZIO: DiagramaCampo = { versao: 1, elementos: [] };

export const exercicioSchema = z.object({
  nome: z.string().min(1, "O nome é obrigatório").max(100),
  descricao: z.string().max(2000).optional(),
  objetivo: z.string().max(500).optional(),
  duracaoMin: z
    .number()
    .int()
    .min(1, "A duração deve ser pelo menos 1 minuto")
    .max(180, "A duração máxima é 180 minutos")
    .optional(),
  categoriaPrincipal: z
    .enum(["ATAQUE", "DEFESA", "TRANSICAO", "BOLAS_PARADAS", "FISICO", "GUARDA_REDES", "OUTRO"])
    .optional(),
  subcategoriaId: z.string().cuid().nullable().optional(),
  diagrama: diagramaSchema.optional(),
});

export type ExercicioInput = z.infer<typeof exercicioSchema>;

// Re-exportado para retrocompatibilidade com imports que usavam LABEL_CATEGORIA/CATEGORIAS.
// Mapeia para o novo enum CategoriaExercicioPrincipal.
export { LABEL_CATEGORIA_PRINCIPAL as LABEL_CATEGORIA, CATEGORIAS_PRINCIPAIS as CATEGORIAS } from "@/lib/schemas/subcategoria";
