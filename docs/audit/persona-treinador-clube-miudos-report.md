# Avaliação — Joana Rodrigues, Treinadora de Benjamins no Clube (28 anos)

> Perfil testado: **Treinador Principal** (âmbito `PROPRIOS_ESCALOES`, só o meu escalão Sub-10).
> Contexto: tudo no telemóvel, a caminho do pavilhão, com 16 miúdos de 9 anos à espera.

## A app facilita ou complica a minha vida? [NEUTRO]
Para marcar quem veio ao treino, até me safa — abre e já toda a gente está "presente", só mexo em quem faltou.
Mas a coisa que eu faço todas as sextas — mandar a convocatória para o grupo do WhatsApp — o botão nem sequer me aparece. Isso tira-me metade da confiança na app.

## Fluxos Diários
| Tarefa | Funciona? | É rápida? | Mobile OK? | Notas |
|---|---|---|---|---|
| Criar sessão de treino | Sim | Média | Sim | Formulário limpo, `datetime-local` usa o seletor nativo do telemóvel. Só me pede data, hora e escalão como obrigatórios. Mas o **primeiro campo é "Tipo de sessão"** e aparece-me um aviso amarelo "Recomendado associar a um planeamento" — para mim é ruído, não sei o que é periodização nem quero saber. |
| Marcar presenças (16 miúdos) | Sim | Rápida | Sim | **Não tenho de tocar 16 vezes**: todos entram como "Presente" por defeito, só mudo os que faltaram. Cada aluno tem um menu de estado (área de toque de 44px, largura total no telemóvel) e, se marco falta, aparece o motivo. Rodapé mostra "X presentes · Y faltas". Bom. |
| Ver plantel do meu escalão | Sim | Rápida | Sim | Vejo só o meu escalão (âmbito próprio). Tenho pesquisa por nome. Chega para o que preciso. |
| Lançar jogo + resultado | Sim | Média | Sim | Consigo criar jogo, convocar e meter resultado/estatísticas. Muitos campos (métricas, minutos, GR) — para Benjamins é mais do que preciso, mas posso ignorar. |
| Gerar convocatória para WhatsApp | **NÃO (bloqueado)** | — | — | **O botão "Gerar convocatória" não me aparece.** Precisa da permissão `COMUNICACOES_GERIR`, que o meu perfil (Treinador Principal) não tem — só o Diretor Técnico e o Admin é que têm. A app até gera um texto bonito e abre o WhatsApp com ele preenchido... mas eu nunca lá chego. |

## Permissões — O que posso e não posso fazer
**O que posso** (tudo dentro do meu escalão): gerir plantel, criar/editar treinos, marcar presenças, gerir jogos e convocatórias (a seleção interna de quem vai), lançar estatísticas, caderneta, exercícios, ver relatórios, scouting, periodização.

**O que NÃO posso e me faz falta a sério:**
- **Gerar comunicações / convocatória para WhatsApp** (`COMUNICACOES_GERIR`) — esta é a que dói. É a tarefa mais repetitiva da minha semana e é exatamente a que me está vedada. Ter de pedir ao Diretor Técnico para mandar a convocatória de cada jogo dos meus miúdos é absurdo.
- **Criar lembretes para a equipa** (`LEMBRETES_EQUIPA_GERIR`) — gostava de avisar os pais, mas não é o fim do mundo.

**O que tenho a mais / não me interessa:** promover atletas à equipa principal (não faz sentido em Benjamins), modelo de jogo, periodização avançada. Não incomoda estar lá, mas polui.

## O que faria a diferença para mim
- **Dar `COMUNICACOES_GERIR` ao perfil Treinador Principal por defeito** (ou, no mínimo, deixar o Admin ativá-la sem ter de inventar um perfil à mão). Sem isto, a app falha no meu caso de uso número 1. Notar que eu **já tenho** `CONVOCATORIA_GERIR` — decido quem é convocado — mas não posso gerar a mensagem dessa mesma convocatória. É incoerente.
- Um botão **"Gerar convocatória" a partir do jogo** que me apareça sempre (já existe o componente `ConvocatoriaWhatsApp`, só está escondido por permissão).
- Tirar-me da frente o aviso amarelo do planeamento quando crio um treino simples — ou pelo menos não o mostrar a quem tem escalões de formação.
- Uma **ação "Marcar todos presentes / limpar"** explícita no marcador de presenças, para os dias em que quero repor tudo rápido (hoje é implícito no defeito, mas não há botão).

## Dificuldades que um treinador não-técnico teria
- **"Tipo de sessão", "Planeamento", "Periodização", "Microciclo"** — vocabulário de treinador de seniores. Para quem só quer marcar o treino de terça, é uma barreira logo no primeiro campo.
- A convocatória bloqueada **sem qualquer mensagem** — não me diz "não tens permissão", simplesmente o botão não existe. Vou pensar que a app não faz isso e desisto, quando na verdade faz.
- No jogo, a grelha de estatísticas (minutos, blocos de tempo, defesas de GR, métricas configuráveis) é intimidante para quem treina miúdos de 9 anos e só quer registar "ganhámos 5-3".

## Coordenação com o Diretor Técnico
- **O que eu meto fica visível para o DT?** Sim. O DT tem âmbito `TODO_CLUBE`, portanto vê tudo o que registo nos meus Benjamins — presenças, jogos, caderneta. Boa, não tenho de reportar à parte.
- **Vejo o calendário de outros escalões (saber se o pavilhão está ocupado)?** Só se o Admin tiver marcado esses escalões como "visíveis a outros treinadores" — e essa opção **nem sequer tem ecrã na app** que eu veja. Não existe calendário geral do clube nem noção de "pavilhão ocupado": o local é só texto livre ("Pavilhão Municipal"). Ou seja, para saber se o pavilhão está livre à terça às 18h, continuo a mandar mensagem no grupo dos treinadores. A app não me ajuda nisto.

## Veredicto
"Se o clube me obrigasse a usar isto, eu: **usava para as presenças e para os jogos, sem grande resistência — isso está bem pensado para o telemóvel.** Mas ia reclamar alto por não poder mandar a convocatória para o WhatsApp: é a coisa que faço todas as semanas e é logo a que me tiram das mãos. Enquanto isso não mudar, a app poupa-me uns toques mas não me tira o trabalho de cima — e é isso que eu queria."
