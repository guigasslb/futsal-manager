# Avaliação — Miguel Ferreira, Treinador Solo Seniores (42 anos)

> Liga Distrital · Nível 2 FPF · utilizador individual, €4.99/mês do meu bolso · 8 anos de Excel nas costas.
> Analisei o código como quem se senta à secretária no domingo à noite a preparar a semana.

## Pago €4.99/mês por isto? **SIM COM RESERVAS**

Cinco euros é o preço de dois cafés e meio — não é por aí que me perco. Se isto me poupa as duas horas de domingo a colar células no Excel e me dá um relatório com o emblema para mandar à direção, pago sem pestanejar. **Mas** compro a organização, não a análise: por baixo do capô os analíticos são de formação, não de equipa sénior. Pago pela arrumação e pela partilha; continuo a abrir o Excel quando quero pensar a sério sobre a equipa.

## Periodização — Serve um treinador sério com Nível 2 FPF?

Serve para **arrumar o calendário**, não para **periodizar**. Sejamos honestos sobre o que isto é.

O que encontrei (`lib/actions/periodizacao.ts`, modelo `Planeamento`): crio planos semanais ou mensais, ligo-os a um período (Preparatório / Competitivo / Transição), meto um número de mesociclo e um de microciclo, datas, e uma caixa de texto de objetivos. As sessões de treino penduram-se no plano (`planeamentoId`) e há um `sugerirPlaneamento` que me pré-preenche as datas e incrementa o microciclo a partir do último — isso é jeitoso, poupa cliques.

Agora o problema, e é de fundo:

- **Mesociclo e microciclo são dois inteiros soltos.** Escrevo "Meso 3, Micro 2" à mão. Não há árvore, não há hierarquia real, não há um mesociclo que *contenha* os seus microciclos. É uma etiqueta, não uma estrutura.
- **Não existe carga. Nenhuma.** Fui procurar `carga`, `intensidade`, `RPE`, `volume`, `ACWR` — não existe em lado nenhum do código. A sessão só tem `duracaoMin`. Não marco intensidade, não marco carga percebida, não vejo a curva da semana. Para um Nível 2, periodização sem gestão de carga é um calendário bonito. Onde está o meu MD-1, MD-2, MD-3? Onde vejo se a semana está a subir para o jogo ou a descarregar?
- **A lista de periodização mostra-me... o número de sessões por plano** (`PlaneamentoLista.tsx`, linha "· N sessão(ões)"). É o único "analítico" da periodização. Não há gráfico de carga semanal, não há distribuição de conteúdos por microciclo, não há nada que um preparador físico reconheça.

Veredicto: para o treinador que quer um sítio para dizer "esta semana é competitiva, micro 4, objetivo pressão alta" — chega e sobra. Para quem periodiza a sério com controlo de carga — **fica a meio caminho e o pedaço que falta é precisamente o que interessa**.

## Analytics — Profundidade para Seniores

| Análise que preciso | Disponível? | Qualidade |
|---|---|---|
| Evolução individual por época | **Sim** | Boa no básico — golos, assistências, tempo de jogo por bloco, presença mensal, evolução jogo-a-jogo, comparação com a média da equipa. Só que trata "golos/assistências" como se fosse tudo o que um sénior produz. |
| Rendimento coletivo (resultados) | **Sim** | Razoável — V/E/D, golos marcados/sofridos e médias, taxa de presença, top-10 marcadores/assistentes, mais utilizados, eventos por tipo. Dá para a direção. Sem xG, sem eficácia, sem análise posicional. |
| Comparação entre jogadores | **Parcial** | Fraca. Tenho rankings top-10 e "atleta vs média da equipa". Não consigo pôr o Zé ao lado do Tó, lado a lado, nas métricas que escolho. |
| Análise por competição | **Não** | Inexistente na prática. O jogo *sabe* a que competição pertence (`competicaoId`), mas o `analise.ts` **nunca** filtra nem agrupa por competição. Não separo Campeonato de Taça. Para mim isto é básico. |
| Carga de treino por atleta | **Não** | Inexistente. Não há modelo de carga. O máximo que tenho é a taxa de presença. Quem treinou mais, quem está em risco, minutos+treino acumulados — nada. |

O prego no caixão: **as métricas que eu próprio crio nunca aparecem nos analíticos.** Confirmei no código — `valoresMetricas` é gravado por jogo (`jogos.ts`, `JogoDetalhe.tsx`) mas o `analise.ts` **nunca as lê**. Ou seja: são write-only. Registo "Remates" e "Recuperações" jogo a jogo e depois... não há evolução, não há ranking, não há relatório que as mostre. Enterro dados que nunca mais vejo. Isto para mim é quase pior do que não existir.

## O que a app faz melhor que o meu Excel

Com honestidade, há coisas que me impressionam:

- **O relatório partilhável com o emblema e um link.** `gerarRelatorioPartilhado` cria um snapshot imutável, com token não-adivinhável e data de expiração, e serve uma página pública sem login. Isto no Excel não existe — mando um PDF feio ou um screenshot. Poder mandar à direção um link com a cara do clube, que não muda depois de gerado, é genuinamente melhor. Isto sozinho quase justifica os cinco euros.
- **A taxa de presença bem feita.** Conta as sessões *desde o ingresso* do atleta (`dataIngresso`), não desde o início da época. No Excel eu fazia batota com isto e dava sempre mal. Aqui está certo.
- **Tempo de jogo por blocos.** Em vez de fingir que cronometro minuto-a-minuto (que nunca faço), marco "meia parte", "bloco 10min". É realista para futsal e soma no acumulado. Inteligente.
- **Não fundir homónimos.** Os rankings agregam por `atletaId`, não por nome. Tenho dois "João Silva" no plantel e o Excel misturava-os. Detalhe, mas denota cuidado.
- **Está tudo ligado.** Convocatória → estatísticas → agregado → perfil, num sítio só. O meu Excel são sete separadores que se desalinham sozinhos.

## O que ainda não substitui o Excel

- **Carga de treino.** Enquanto não houver RPE/intensidade/volume por sessão e uma curva semanal, o controlo de carga fica na minha folha. É o meu trabalho de treinador de seniores.
- **As minhas métricas próprias.** Crio "Remates", "Recuperações de bola", "Duelos ganhos" nas Definições (só tipo Número / Sim-Não / Escala 1-5), registo-as no jogo — e depois não as vejo em lado nenhum. Até isto entrar nos analíticos, a análise fina volta para o Excel.
- **Rendimento por competição.** Quero ver o que a equipa rende no Campeonato vs Taça vs particulares. A app junta tudo no mesmo saco. Excel.
- **Comparação direta entre jogadores.** Pôr dois ou três atletas lado a lado nas métricas que eu escolher, para decidir quem joga. A app dá-me rankings e média da equipa, não o confronto direto.
- **Análise de adversário.** Vejo os jogos no YouTube e tomo notas estruturadas. Há `observacoes` de adversário no modelo, mas nada que se aproxime de scouting a sério com padrões. Continua no meu caderno + Excel.

## O gap mais crítico para mim

> **"Deixem-me criar as minhas próprias métricas E vê-las nos analíticos e nos relatórios — hoje registo 'remates' e 'recuperações' que a app engole e nunca me devolve; enquanto as minhas métricas forem write-only e não houver controlo de carga por sessão, isto é um arquivador com bom design, não a ferramenta de análise que um treinador de seniores com Nível 2 usa a sério."**
