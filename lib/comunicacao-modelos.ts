// Modelos de comunicação de arranque (bíblia §3.9, §8.12).
// Módulo PURO (sem imports de prisma/auth/next) — usável no seed (tsx),
// no servidor (Server Actions) e nos testes.
//
// A app GERA texto formatado para o utilizador partilhar no WhatsApp —
// não envia mensagens nem integra qualquer API de mensagens.
//
// Placeholders: sintaxe {{nomeDoCampo}} (ver `substituirPlaceholders`).

import type { TipoComunicacao } from "@prisma/client";

export type ModeloComunicacaoSeed = {
  tipo: TipoComunicacao;
  nome: string;
  template: string;
};

export const MODELOS_COMUNICACAO_SEED: readonly ModeloComunicacaoSeed[] = [
  {
    tipo: "CONVOCATORIA",
    nome: "Convocatória padrão",
    template:
      "🏃 *CONVOCATÓRIA — {{nomeEquipa}}*\n" +
      "📅 {{diaSemana}}, {{data}} às {{hora}}\n" +
      "📍 {{local}}\n" +
      "\n" +
      "*Convocados:*\n" +
      "{{listaConvocados}}\n" +
      "\n" +
      "Presença confirmada até {{prazoConfirmacao}}.\n" +
      "\n" +
      "_{{nomeTreinador}}_",
  },
  {
    tipo: "CANCELAMENTO",
    nome: "Cancelamento padrão",
    template:
      "⚠️ *CANCELAMENTO — {{nomeEquipa}}*\n" +
      "\n" +
      "O {{tipoCancelamento}} de {{diaSemana}}, {{data}} está CANCELADO.\n" +
      "\n" +
      "Motivo: {{motivo}}\n" +
      "\n" +
      "_{{nomeTreinador}}_",
  },
  {
    tipo: "MUDANCA_HORARIO",
    nome: "Mudança de horário padrão",
    template:
      "🕒 *MUDANÇA DE HORÁRIO — {{nomeEquipa}}*\n" +
      "\n" +
      "O {{tipoEvento}} de {{diaSemana}}, {{data}} muda de horário.\n" +
      "\n" +
      "⏱️ Antes: {{horaAnterior}}\n" +
      "✅ Agora: {{horaNova}}\n" +
      "📍 {{local}} (sem alteração)\n" +
      "\n" +
      "Motivo: {{motivo}}\n" +
      "\n" +
      "_{{nomeTreinador}}_",
  },
  {
    tipo: "MUDANCA_LOCAL",
    nome: "Mudança de local padrão",
    template:
      "📍 *MUDANÇA DE LOCAL — {{nomeEquipa}}*\n" +
      "\n" +
      "O {{tipoEvento}} de {{diaSemana}}, {{data}} às {{hora}} muda de local.\n" +
      "\n" +
      "❌ Antes: {{localAnterior}}\n" +
      "✅ Agora: {{localNovo}}\n" +
      "\n" +
      "{{indicacoesAcesso}}\n" +
      "\n" +
      "Motivo: {{motivo}}\n" +
      "\n" +
      "_{{nomeTreinador}}_",
  },
  {
    tipo: "RESULTADO",
    nome: "Resultado de jogo padrão",
    template:
      "⚽ *RESULTADO — {{nomeEquipa}}*\n" +
      "{{competicao}} · {{diaSemana}}, {{data}}\n" +
      "\n" +
      "*{{equipaCasa}} {{golosCasa}} — {{golosFora}} {{equipaFora}}*\n" +
      "\n" +
      "🥅 Marcadores: {{marcadores}}\n" +
      "🎯 Assistências: {{assistencias}}\n" +
      "\n" +
      "{{comentarioTreinador}}\n" +
      "\n" +
      "_{{nomeTreinador}}_",
  },
  {
    tipo: "AVISO_GERAL",
    nome: "Aviso geral padrão",
    template:
      "📢 *AVISO — {{nomeEquipa}}*\n" +
      "\n" +
      "{{assunto}}\n" +
      "\n" +
      "{{mensagem}}\n" +
      "\n" +
      "{{prazoResposta}}\n" +
      "\n" +
      "_{{nomeTreinador}}_",
  },
  {
    tipo: "CALENDARIO_MENSAL",
    nome: "Calendário mensal padrão",
    template:
      "📅 *CALENDÁRIO {{mesAno}} — {{nomeEquipa}}*\n" +
      "\n" +
      "{{listaEventos}}\n" +
      "\n" +
      "_Actualizado em {{dataActualizacao}}_",
  },
];
