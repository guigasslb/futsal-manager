# Avaliação — André Costa, Treinador Sub-17 no Clube (38 anos)

## A app eleva o meu trabalho? [PARCIALMENTE]
Para análise de rendimento, sim — dá-me coisas que no Excel me levavam horas: evolução por época, resultados ao longo do ano, rankings de marcadores, comparação de cada miúdo com a média da equipa e relatórios partilháveis com a cara do clube. O que ainda me trava é não conseguir cortar a análise por competição, não haver comparação direta jogador-a-jogador, e as métricas que eu invento não aparecerem nos gráficos da época. Uso-a a sério para gestão e relatório; para a análise fina de scouting continuo com o caderno e o Excel ao lado.

## Analytics — Profundidade Real
| Análise que preciso | Disponível? | Localização no código | Qualidade |
|---|---|---|---|
| Evolução individual por época | SIM | `lib/actions/analise.ts` → `obterAnaliticoAtleta()` (recebe `epocaId`); painel em `components/analiticos/PainelAtleta.tsx` | Boa. Evolução jogo-a-jogo (golos, assistências, defesas), presença mensal, tempo de jogo agregado e caderneta. Filtra por escalão ou vista conjunta. |
| Rendimento coletivo (resultados ao longo da época) | SIM | `obterAnaliticoEscalao()` (`analise.ts:482`); `PainelEscalao.tsx` | Muito boa. V/E/D, golos marcados/sofridos totais e médias, `resultados[]` ordenado por data, presença mensal, distribuição de tipos de treino, rankings de marcadores/assistentes/mais utilizados. |
| Comparação entre jogadores | PARCIALMENTE | `comparacaoEquipa` + rankings em `obterAnaliticoAtleta`/`obterAnaliticoEscalao`; `PainelAtleta.tsx:82` | Comparo cada atleta com a **média da equipa** (golos, presença, tempo) e tenho rankings (top 10 marcadores/assistentes/utilização). NÃO há vista lado-a-lado de dois atletas escolhidos por mim. |
| Análise por competição | NÃO | `analise.ts` filtra sempre por `epocaId` + `escalaoId`; `Jogo.competicao` e o model `Competicao` existem mas os analíticos ignoram-nos | Gap real. Não separo campeonato de taça/torneio. Um 5-2 num torneio de fim de semana pesa igual a um jogo de campeonato. |
| Golos marcados vs sofridos (tendência) | SIM | `obterAnaliticoEscalao` → `resultados[]` (por jogo, ordenado por data) + `golosMarcadosMedia`/`golosSofridosMedia` | Boa. Tenho a série jogo-a-jogo e as médias; dá para ler a tendência ao longo da época. |

## Métricas Configuráveis
Consigo, sim — e é dos pontos fortes. Em **Definições → Métricas** (`app/(app)/definicoes/metricas/page.tsx`, action `criarMetrica` em `lib/actions/metricas.ts`) crio métricas próprias com nome livre (até 60 caracteres) e um de três tipos: **Número**, **Sim/Não** ou **Escala 1-5** (`lib/schemas/metrica.ts` → enum `TipoMetrica`). Posso ativar/desativar, reordenar, e ficam guardadas por atleta em cada jogo (`ValorMetrica`, capturadas na grelha de estatísticas em `JogoDetalhe.tsx` → `CampoMetrica`). Assim crio "Recuperações", "Remates bloqueados", "Duelos ganhos", "1x1 ganhos" à vontade. Nota: **assistências, golos, defesas e faltas já são campos nativos** da grelha, não preciso de métrica para esses.

**A limitação que me incomoda:** essas métricas que eu invento são **registadas mas não agregadas nos analíticos**. Os painéis de época/escalão só somam golos, assistências, defesas e tempo — as minhas métricas custom não geram tendência nem ranking na página de analíticos. Ou seja: capturo "Recuperações" jogo a jogo, mas não vejo a evolução de recuperações do Rúben ao longo da época sem exportar à mão. É meio caminho andado.

## Trabalho com Assistente (Bruno)
Dois utilizadores funcionam bem em termos de **acesso**: há `MembroClube` + perfis (`lib/permissoes-catalogo.ts`), e o perfil **Adjunto** deixa o Bruno marcar presenças, registar estatísticas e mexer na caderneta nos escalões atribuídos, sem lhe dar as chaves todas do clube. Isso está bem pensado e é melhor que partilhar um Excel no Drive.

**Dois problemas sérios:**
1. **Sem histórico de quem fez o quê.** Procurei — não existe audit log nenhum (`criadoPor`/`atualizadoPor`/registo de atividade não existem no schema; só `Sessao` e `RelatorioPartilhado` guardam o *criador*, mais nada). Se o Bruno mudar uma estatística ou apagar um convocado, não fica rasto de quem foi nem do valor anterior. Para trabalho a dois isto é um risco.
2. **Escrita em simultâneo é "o último a gravar ganha".** As server actions fazem upsert sem deteção de conflito nem bloqueio otimista. Se eu e o Bruno estivermos a editar a grelha de estatísticas do mesmo jogo ao mesmo tempo, o que gravar por último apaga o trabalho do outro, sem aviso.

## O que a app faz melhor que o Excel
- **Relatórios partilháveis com snapshot imutável** (`gerarRelatorioPartilhado`): gero um link com token não-adivinhável, com as cores e logótipo do clube, para mostrar à direção ou aos pais — e fica congelado no tempo. No Excel isto não existe.
- **Resultados V/E/D + golos marcados/sofridos calculados automaticamente** por escalão e por época, com médias e rankings de marcadores/assistentes já prontos.
- **Comparar cada atleta com a média da equipa** num painel, sem eu montar fórmulas.
- **Presença cruzada com data de ingresso** (não penaliza quem entrou a meio) — detalhe que no Excel toda a gente esquece.
- **Imprimir / Guardar PDF** dos analíticos e relatórios (`BotaoImprimir` → `window.print()`).
- **Permissões por escalão** para o adjunto, em vez de partilhar o ficheiro inteiro.

## O que ainda não substitui o Excel
- **Análise por competição** — não consigo isolar o campeonato do resto. Mantém-me no Excel para separar contextos.
- **Comparação direta de dois jogadores lado a lado** — só tenho rankings e comparação-vs-média.
- **Tendências das minhas métricas custom** (recuperações, remates bloqueados ao longo da época) — capturo mas não vejo evoluir; se quero o gráfico, exporto à mão.
- **Relatório de jogo exportável como documento** — o relatório do jogo (`JogoDetalhe` → aba Relatório, texto até 5000 caracteres + cronologia + scouting) é bom para reflexão minha, mas **não tem botão de exportar/PDF próprio** como os analíticos têm; os relatórios partilháveis são a nível de época/escalão/clube, não por jogo.
- **Scouting de vídeo** — tenho observações de adversário e link de vídeo do jogo, mas a análise fina de padrões do adversário (o que faço no YouTube) continua fora da app.

## O gap mais crítico para um treinador Sub-17 sério
"Dar vida analítica às métricas que eu próprio crio e permitir cortar tudo por competição — sem isso, a app regista dados que eu depois tenho de ir buscar ao Excel para transformar em decisão."
