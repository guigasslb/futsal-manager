// Catálogo de capacidades e perfis de arranque (secção 6 da bíblia).
// Módulo PURO (sem imports de auth/prisma/next) — usável no seed e no cliente.

export const CAPACIDADES = [
  // Estrutura do clube (sempre nível clube)
  "CLUBE_BRANDING",
  "CLUBE_ESCALOES",
  "CLUBE_EPOCAS",
  "CLUBE_UTILIZADORES",
  "CLUBE_PERFIS",
  "CATALOGO_METRICAS",
  "CATALOGO_HABILIDADES",
  // Dados de equipa (sujeitas ao âmbito do perfil)
  "PLANTEL_GERIR",
  "TREINOS_GERIR",
  "PRESENCAS_MARCAR",
  "PERIODIZACAO_GERIR",
  "MODELO_JOGO_GERIR",
  "JOGOS_GERIR",
  "CONVOCATORIA_GERIR",
  "ESTATISTICAS_GERIR",
  "COMPETICOES_GERIR",
  "SCOUTING_GERIR",
  "CADERNETA_GERIR",
  "REUNIOES_GERIR",
  // Transversais
  "EXERCICIOS_GERIR",
  "RELATORIOS_VER",
] as const;

export type Capacidade = (typeof CAPACIDADES)[number];

// Rótulos pt-PT para a UI de perfis.
export const LABEL_CAPACIDADE: Record<Capacidade, string> = {
  CLUBE_BRANDING: "Branding (cores e logótipo)",
  CLUBE_ESCALOES: "Gerir escalões",
  CLUBE_EPOCAS: "Gerir épocas",
  CLUBE_UTILIZADORES: "Gerir utilizadores",
  CLUBE_PERFIS: "Gerir perfis",
  CATALOGO_METRICAS: "Gerir métricas",
  CATALOGO_HABILIDADES: "Gerir habilidades",
  PLANTEL_GERIR: "Gerir plantel",
  TREINOS_GERIR: "Gerir treinos",
  PRESENCAS_MARCAR: "Marcar presenças",
  PERIODIZACAO_GERIR: "Gerir periodização",
  MODELO_JOGO_GERIR: "Gerir modelo de jogo",
  JOGOS_GERIR: "Gerir jogos",
  CONVOCATORIA_GERIR: "Gerir convocatórias",
  ESTATISTICAS_GERIR: "Registar estatísticas",
  COMPETICOES_GERIR: "Gerir competições",
  SCOUTING_GERIR: "Observação de adversários",
  CADERNETA_GERIR: "Gerir caderneta",
  REUNIOES_GERIR: "Gerir reuniões",
  EXERCICIOS_GERIR: "Gerir exercícios",
  RELATORIOS_VER: "Ver relatórios",
};

export const CAPACIDADES_ESTRUTURA: Capacidade[] = [
  "CLUBE_BRANDING",
  "CLUBE_ESCALOES",
  "CLUBE_EPOCAS",
  "CLUBE_UTILIZADORES",
  "CLUBE_PERFIS",
  "CATALOGO_METRICAS",
  "CATALOGO_HABILIDADES",
];

// Capacidades cujo alcance é limitado pelo âmbito PROPRIOS_ESCALOES.
export const CAPACIDADES_POR_ESCALAO: Capacidade[] = [
  "PLANTEL_GERIR",
  "TREINOS_GERIR",
  "PRESENCAS_MARCAR",
  "PERIODIZACAO_GERIR",
  "MODELO_JOGO_GERIR",
  "JOGOS_GERIR",
  "CONVOCATORIA_GERIR",
  "ESTATISTICAS_GERIR",
  "COMPETICOES_GERIR",
  "SCOUTING_GERIR",
  "CADERNETA_GERIR",
  "REUNIOES_GERIR",
];

const CAPACIDADES_DADOS_EQUIPA = CAPACIDADES_POR_ESCALAO;

export type PerfilArranque = {
  nome: string;
  descricao: string;
  ambito: "TODO_CLUBE" | "PROPRIOS_ESCALOES";
  capacidades: Capacidade[];
};

// Modelos de arranque editáveis criados com cada clube (secção 6.5).
export const PERFIS_ARRANQUE: PerfilArranque[] = [
  {
    nome: "Administrador",
    descricao: "Controlo total do clube.",
    ambito: "TODO_CLUBE",
    capacidades: [...CAPACIDADES],
  },
  {
    nome: "Diretor Técnico",
    descricao: "Escreve em todos os escalões; estrutura do clube configurável pelo admin.",
    ambito: "TODO_CLUBE",
    capacidades: [
      ...CAPACIDADES_DADOS_EQUIPA,
      "CATALOGO_METRICAS",
      "CATALOGO_HABILIDADES",
      "EXERCICIOS_GERIR",
      "RELATORIOS_VER",
    ],
  },
  {
    nome: "Treinador Principal",
    descricao: "Controlo total dos escalões atribuídos.",
    ambito: "PROPRIOS_ESCALOES",
    capacidades: [
      ...CAPACIDADES_DADOS_EQUIPA,
      "EXERCICIOS_GERIR",
      "RELATORIOS_VER",
    ],
  },
  {
    nome: "Adjunto",
    descricao: "Operação do dia-a-dia dos escalões atribuídos.",
    ambito: "PROPRIOS_ESCALOES",
    capacidades: [
      "TREINOS_GERIR",
      "PRESENCAS_MARCAR",
      "ESTATISTICAS_GERIR",
      "CADERNETA_GERIR",
      "EXERCICIOS_GERIR",
    ],
  },
];
