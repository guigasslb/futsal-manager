// ROTA TEMPORÁRIA — seed de dados de demonstração.
// Remover após execução.
import { NextRequest, NextResponse } from "next/server";
import {
  PrismaClient,
  TipoParticipacao,
  EstadoParticipacao,
  EstadoPresenca,
  EstadoMembro,
  FormatoCompeticao,
  CasaFora,
  Utilizacao,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERFIS_ARRANQUE } from "@/lib/permissoes-catalogo";

const TOKEN = "sle2026-seed-9f3a";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== TOKEN) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const prisma = new PrismaClient();

  try {
    const jaExiste = await prisma.clube.findFirst({
      where: { nome: "Sport Lisboa e Évora" },
    });
    if (jaExiste) {
      return NextResponse.json({ ok: false, mensagem: "Clube já existe. Seed já foi executado." });
    }

    const BCRYPT_COST = 12;

    type AtletaSeed = {
      nome: string;
      numero: number;
      pct: number;
      golos: number;
    };

    const ATLETAS: AtletaSeed[] = [
      { nome: "Martim",     numero: 1,  pct: 70.00, golos: 0  },
      { nome: "Rodrigo",    numero: 2,  pct: 100.0, golos: 4  },
      { nome: "Beira",      numero: 3,  pct: 0.00,  golos: 12 },
      { nome: "Matheus",    numero: 4,  pct: 70.00, golos: 12 },
      { nome: "Laura",      numero: 5,  pct: 58.75, golos: 4  },
      { nome: "Santiago",   numero: 6,  pct: 73.75, golos: 30 },
      { nome: "Tiago",      numero: 7,  pct: 42.50, golos: 0  },
      { nome: "Boa Fé",     numero: 8,  pct: 68.75, golos: 2  },
      { nome: "Rendeiro",   numero: 9,  pct: 7.50,  golos: 3  },
      { nome: "Lipe",       numero: 10, pct: 60.00, golos: 0  },
      { nome: "Gabriel",    numero: 11, pct: 41.25, golos: 7  },
      { nome: "Rafael",     numero: 12, pct: 15.00, golos: 1  },
      { nome: "Henrique",   numero: 13, pct: 83.75, golos: 67 },
      { nome: "Davi",       numero: 14, pct: 87.50, golos: 42 },
      { nome: "Eduardo",    numero: 15, pct: 92.50, golos: 57 },
      { nome: "Enrico",     numero: 16, pct: 26.25, golos: 0  },
      { nome: "João Risso", numero: 17, pct: 73.75, golos: 33 },
      { nome: "Tariq",      numero: 18, pct: 76.25, golos: 54 },
      { nome: "Afonso",     numero: 19, pct: 38.75, golos: 3  },
      { nome: "Dinis",      numero: 20, pct: 42.50, golos: 5  },
      { nome: "Ruben",      numero: 21, pct: 75.00, golos: 8  },
    ];

    type CompeticaoSeed = {
      nome: string;
      formato: FormatoCompeticao;
      jogos: number; vitorias: number; empates: number; derrotas: number;
    };

    const COMPETICOES: CompeticaoSeed[] = [
      { nome: "Beja Cup Sub.9",                    formato: "TORNEIO", jogos: 4,  vitorias: 1,  empates: 0,  derrotas: 3  },
      { nome: "Elvas Golden Cup Energy",            formato: "TORNEIO", jogos: 6,  vitorias: 3,  empates: 1,  derrotas: 2  },
      { nome: "Évora Kids Cup Futsal Petizes",      formato: "TORNEIO", jogos: 4,  vitorias: 2,  empates: 0,  derrotas: 2  },
      { nome: "Évora Kids Cup Futsal Traquinas",    formato: "TORNEIO", jogos: 4,  vitorias: 4,  empates: 0,  derrotas: 0  },
      { nome: "Joga a Bola Futsal (Petizes)",       formato: "TORNEIO", jogos: 7,  vitorias: 5,  empates: 0,  derrotas: 2  },
      { nome: "Joga a Bola Futsal (Traquinas)",     formato: "LIGA",    jogos: 25, vitorias: 20, empates: 1,  derrotas: 4  },
      { nome: "Joga a Bola Petizes",               formato: "TORNEIO", jogos: 8,  vitorias: 1,  empates: 0,  derrotas: 7  },
      { nome: "Joga à Bola Traquinas",             formato: "LIGA",    jogos: 57, vitorias: 22, empates: 10, derrotas: 25 },
      { nome: "Liga Kuboo",                        formato: "LIGA",    jogos: 13, vitorias: 9,  empates: 1,  derrotas: 3  },
      { nome: "McDonald's Cup Salesianos de Évora",formato: "TORNEIO", jogos: 3,  vitorias: 0,  empates: 0,  derrotas: 3  },
    ];

    // Meses com treinos: Set(9) Out(9) Nov(8) Dez(7) Jan(8) Fev(8) Mar(9) Abr(9) Mai(7) Jun(6)
    const TREINOS_POR_MES: { ano: number; mes: number; count: number }[] = [
      { ano: 2025, mes: 9,  count: 9 },
      { ano: 2025, mes: 10, count: 9 },
      { ano: 2025, mes: 11, count: 8 },
      { ano: 2025, mes: 12, count: 7 },
      { ano: 2026, mes: 1,  count: 8 },
      { ano: 2026, mes: 2,  count: 8 },
      { ano: 2026, mes: 3,  count: 9 },
      { ano: 2026, mes: 4,  count: 9 },
      { ano: 2026, mes: 5,  count: 7 },
      { ano: 2026, mes: 6,  count: 6 },
    ];

    const ADVERSARIOS = [
      "Académica FC", "Lusitano FCV", "SC Farense", "GD Évora",
      "Portimonense", "CF Belenenses", "AA Coimbra", "SC Beja",
      "UD Oliveirense", "Vitória FC", "FC Alverca", "SC Braga",
      "AD Oeiras", "SL Benfica", "Sporting CP", "FC Porto",
      "CD Tondela", "GD Chaves", "SC Covilhã", "CD Nacional",
    ];

    // ─── CLUBE ───
    const clube = await prisma.clube.create({
      data: {
        nome: "Sport Lisboa e Évora",
        corPrimaria: "#CC0000",
        onboardingConcluido: true,
      },
    });

    // ─── PERFIS DE ARRANQUE ───
    const perfis: Record<string, string> = {};
    for (const p of PERFIS_ARRANQUE) {
      const criado = await prisma.perfil.create({
        data: {
          clubeId: clube.id,
          nome: p.nome,
          descricao: p.descricao,
          ambito: p.ambito,
          capacidades: p.capacidades,
          sistema: true,
        },
      });
      perfis[p.nome] = criado.id;
    }

    // ─── UTILIZADOR TREINADOR ───
    const passwordHash = await bcrypt.hash("SLE2026!", BCRYPT_COST);
    const user = await prisma.utilizador.upsert({
      where: { email: "treinador@sle.pt" },
      create: {
        email: "treinador@sle.pt",
        nome: "Treinador SLE",
        passwordHash,
      },
      update: {},
    });
    await prisma.membroClube.upsert({
      where: { utilizadorId_clubeId: { utilizadorId: user.id, clubeId: clube.id } },
      create: {
        utilizadorId: user.id,
        clubeId: clube.id,
        perfilId: perfis["Administrador"],
        estado: EstadoMembro.ATIVO,
      },
      update: {},
    });

    // ─── ÉPOCA ───
    const epoca = await prisma.epoca.create({
      data: {
        nome: "2025/2026",
        dataInicio: new Date("2025-09-01"),
        dataFim: new Date("2026-06-30"),
        ativa: true,
        clubeId: clube.id,
      },
    });

    // ─── ESCALÃO ───
    const escalao = await prisma.escalao.create({
      data: {
        nome: "Traquinas",
        ordem: 1,
        clubeId: clube.id,
      },
    });

    // ─── ATLETAS ───
    const atletaIds: Record<string, string> = {};
    for (const a of ATLETAS) {
      const atleta = await prisma.atleta.create({
        data: {
          nome: a.nome,
          numero: a.numero,
          clubeId: clube.id,
          escalaoId: escalao.id,
          epocaId: epoca.id,
          dataNascimento: new Date(`2017-${String((a.numero % 12) + 1).padStart(2, "0")}-${String((a.numero % 28) + 1).padStart(2, "0")}`),
          dataIngresso: new Date("2025-09-01"),
        },
      });
      await prisma.atletaEscalao.create({
        data: {
          atletaId: atleta.id,
          escalaoId: escalao.id,
          epocaId: epoca.id,
          tipo: TipoParticipacao.PRINCIPAL,
          estado: EstadoParticipacao.ATIVO,
        },
      });
      atletaIds[a.nome] = atleta.id;
    }

    // ─── COMPETIÇÕES ───
    const competicaoIds: Record<string, string> = {};
    for (const c of COMPETICOES) {
      const comp = await prisma.competicao.create({
        data: {
          nome: c.nome,
          formato: c.formato,
          epocaId: epoca.id,
          clubeId: clube.id,
          escalaoId: escalao.id,
        },
      });
      competicaoIds[c.nome] = comp.id;
    }

    // ─── SESSÕES DE TREINO ───
    const todasSessoes: { id: string; data: Date }[] = [];
    for (const { ano, mes, count } of TREINOS_POR_MES) {
      // Distribuir treinos pela semana (terça/quinta/sábado)
      const diasSemana = [2, 4, 6];
      let criados = 0;
      let semana = 1;
      while (criados < count) {
        for (const diaSem of diasSemana) {
          if (criados >= count) break;
          // Encontrar o primeiro dia com diaSemana=diaSem na semana `semana`
          const d = new Date(ano, mes - 1, 1);
          // Avançar para o diaSem correcto da semana `semana`
          while (d.getDay() !== diaSem) d.setDate(d.getDate() + 1);
          d.setDate(d.getDate() + (semana - 1) * 7);
          if (d.getMonth() + 1 !== mes) break;
          d.setHours(19, 0, 0, 0);
          const sessao = await prisma.sessao.create({
            data: {
              data: new Date(d),
              duracaoMin: 60,
              local: "Pavilhão Municipal de Évora",
              epocaId: epoca.id,
              escalaoId: escalao.id,
              criadorId: user.id,
            },
          });
          todasSessoes.push({ id: sessao.id, data: new Date(d) });
          criados++;
        }
        semana++;
      }
    }

    // Ordenar por data
    todasSessoes.sort((a, b) => a.data.getTime() - b.data.getTime());
    const totalSessoes = todasSessoes.length;

    // ─── PRESENÇAS ───
    for (const atletaSeed of ATLETAS) {
      const atletaId = atletaIds[atletaSeed.nome];
      const nPresentes = Math.round((atletaSeed.pct / 100) * totalSessoes);
      // Marcar presente nos primeiros nPresentes treinos (determinístico)
      for (let i = 0; i < totalSessoes; i++) {
        const estado = i < nPresentes ? EstadoPresenca.PRESENTE : EstadoPresenca.FALTA;
        await prisma.presenca.create({
          data: {
            sessaoId: todasSessoes[i].id,
            atletaId,
            estado,
            escalaoId: escalao.id,
          },
        });
      }
    }

    // ─── JOGOS COM ESTATÍSTICAS ───
    // 30 jogos distribuídos pelas competições com maior volume (Traquinas)
    const competicoesJogos = [
      { nome: "Joga à Bola Traquinas",          nJogos: 12 },
      { nome: "Joga a Bola Futsal (Traquinas)", nJogos: 8  },
      { nome: "Liga Kuboo",                      nJogos: 5  },
      { nome: "Évora Kids Cup Futsal Traquinas", nJogos: 2  },
      { nome: "Elvas Golden Cup Energy",         nJogos: 2  },
      { nome: "Beja Cup Sub.9",                  nJogos: 1  },
    ];

    // Ordem de convocatória: atletas com mais % de assiduidade primeiro
    const atletasOrdenados = [...ATLETAS].sort((a, b) => b.pct - a.pct);
    const atletasComGolos = ATLETAS.filter(a => a.golos > 0).sort((a, b) => b.golos - a.golos);

    // Distribuição de golos: proporção de golos por jogo por atleta
    const JOGOS_POR_ATLETA: Record<string, number> = {
      "Martim": 52, "Rodrigo": 109, "Beira": 19, "Matheus": 17,
      "Laura": 73, "Santiago": 92, "Tiago": 12, "Boa Fé": 42,
      "Rendeiro": 8, "Lipe": 27, "Gabriel": 32, "Rafael": 4,
      "Henrique": 93, "Davi": 83, "Eduardo": 93, "Enrico": 4,
      "João Risso": 45, "Tariq": 100, "Afonso": 27, "Dinis": 22, "Ruben": 59,
    };

    // Golos restantes por atleta (para distribuição determinística)
    const golosRestantes: Record<string, number> = {};
    for (const a of ATLETAS) golosRestantes[a.nome] = a.golos;

    let jogoIdx = 0;
    const dataBase = new Date("2025-10-04");

    for (const { nome: compNome, nJogos } of competicoesJogos) {
      const compId = competicaoIds[compNome];
      if (!compId) continue;
      const compSeed = COMPETICOES.find(c => c.nome === compNome)!;
      const ratioVit = compSeed.vitorias / compSeed.jogos;
      const ratioEmp = compSeed.empates / compSeed.jogos;

      for (let j = 0; j < nJogos; j++) {
        const dataJogo = new Date(dataBase);
        dataJogo.setDate(dataBase.getDate() + jogoIdx * 6);
        dataJogo.setHours(10, 0, 0, 0);

        // Resultado baseado no rácio da competição
        const rnd = (jogoIdx % 10) / 10;
        let golosCasa = 0, golosFora = 0;
        if (rnd < ratioVit) {
          golosCasa = 2 + (jogoIdx % 3); golosFora = jogoIdx % 2;
        } else if (rnd < ratioVit + ratioEmp) {
          golosCasa = 1; golosFora = 1;
        } else {
          golosCasa = jogoIdx % 2; golosFora = 2 + ((jogoIdx + 1) % 3);
        }

        const adversario = ADVERSARIOS[jogoIdx % ADVERSARIOS.length];
        const casaFora: CasaFora = jogoIdx % 2 === 0 ? CasaFora.CASA : CasaFora.FORA;
        const nossos = casaFora === CasaFora.CASA ? golosCasa : golosFora;
        const deles  = casaFora === CasaFora.CASA ? golosFora : golosCasa;

        const jogo = await prisma.jogo.create({
          data: {
            data: dataJogo,
            adversario,
            casaFora,
            golosMarcados: nossos,
            golosSofridos: deles,
            competicaoId: compId,
            epocaId: epoca.id,
            escalaoId: escalao.id,
            criadorId: user.id,
          },
        });

        // Convocatória: 12 atletas (os mais assíduos para este jogo)
        const convocados = atletasOrdenados.slice(0, 12);
        for (const a of convocados) {
          const atletaId = atletaIds[a.nome];
          await prisma.convocatoria.create({
            data: {
              jogoId: jogo.id,
              atletaId,
              convocado: true,
              titularPrevisto: a.pct >= 60,
            },
          });
        }

        // Distribuir golos da equipa pelos convocados com golos restantes
        let golosADistribuir = nossos;
        if (golosADistribuir > 0) {
          // Encontrar marcadores com golos restantes na convocatória
          const marcadores = atletasComGolos.filter(
            a => convocados.some(c => c.nome === a.nome) && golosRestantes[a.nome] > 0
          );
          for (const marcador of marcadores) {
            if (golosADistribuir <= 0) break;
            const golosJogo = Math.min(golosRestantes[marcador.nome] > 5 ? 2 : 1, golosADistribuir);
            await prisma.estatisticaAtleta.upsert({
              where: {
                jogoId_atletaId: { jogoId: jogo.id, atletaId: atletaIds[marcador.nome] },
              },
              create: {
                jogoId: jogo.id,
                atletaId: atletaIds[marcador.nome],
                golos: golosJogo,
                minutos: 20 + (jogoIdx % 15),
                utilizacao: marcador.pct >= 60 ? Utilizacao.TITULAR : Utilizacao.UTILIZADO,
              },
              update: { golos: golosJogo },
            });
            golosRestantes[marcador.nome] -= golosJogo;
            golosADistribuir -= golosJogo;
          }
        }

        // EstatísticaAtleta para outros convocados (minutos, sem golos)
        for (const a of convocados) {
          const atletaId = atletaIds[a.nome];
          const jaTemEstat = await prisma.estatisticaAtleta.findUnique({
            where: { jogoId_atletaId: { jogoId: jogo.id, atletaId } },
          });
          if (!jaTemEstat) {
            await prisma.estatisticaAtleta.create({
              data: {
                jogoId: jogo.id,
                atletaId,
                golos: 0,
                minutos: a.pct >= 60 ? 30 : 15,
                utilizacao: a.pct >= 60 ? Utilizacao.TITULAR : Utilizacao.UTILIZADO,
              },
            });
          }
        }

        jogoIdx++;
      }
    }

    return NextResponse.json({
      ok: true,
      mensagem: "Seed concluído com sucesso!",
      dados: {
        clube: "Sport Lisboa e Évora",
        login: "treinador@sle.pt / SLE2026!",
        atletas: ATLETAS.length,
        competicoes: COMPETICOES.length,
        sessoes: todasSessoes.length,
        jogos: jogoIdx,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, erro: msg }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
