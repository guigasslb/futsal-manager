import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encriptar, desencriptar } from "@/lib/crypto";
import {
  eventoParaSessao,
  eventoParaJogo,
  googleCalendarConfigurado,
  obterRedirectUri,
} from "@/lib/google-calendar";

// Chave de teste: 32 bytes em hex (64 chars).
const CHAVE_TESTE = "a".repeat(64);

describe("crypto — AES-256-GCM com ENCRYPTION_KEY", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = CHAVE_TESTE;
  });
  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  it("faz round-trip encriptar → desencriptar", () => {
    const original = "refresh-token-secreto-123";
    const cifrado = encriptar(original);
    expect(cifrado).not.toBe(original);
    expect(cifrado.startsWith("gcm:")).toBe(true);
    expect(desencriptar(cifrado)).toBe(original);
  });

  it("produz cifras diferentes para o mesmo texto (IV aleatório)", () => {
    const a = encriptar("igual");
    const b = encriptar("igual");
    expect(a).not.toBe(b);
    expect(desencriptar(a)).toBe("igual");
    expect(desencriptar(b)).toBe("igual");
  });

  it("suporta caracteres não-ASCII (pt-PT)", () => {
    const texto = "Convocatória — ação à noite, ção ñ";
    expect(desencriptar(encriptar(texto))).toBe(texto);
  });

  it("rejeita ENCRYPTION_KEY com formato inválido", () => {
    process.env.ENCRYPTION_KEY = "chave-curta";
    expect(() => encriptar("x")).toThrow(/ENCRYPTION_KEY inválida/);
  });

  it("falha a desencriptar GCM sem a chave presente", () => {
    const cifrado = encriptar("segredo");
    delete process.env.ENCRYPTION_KEY;
    expect(() => desencriptar(cifrado)).toThrow(/ENCRYPTION_KEY ausente/);
  });
});

describe("crypto — fallback Base64 sem ENCRYPTION_KEY", () => {
  beforeEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  it("faz round-trip com prefixo b64", () => {
    const cifrado = encriptar("token-dev");
    expect(cifrado.startsWith("b64:")).toBe(true);
    expect(desencriptar(cifrado)).toBe("token-dev");
  });

  it("desencripta corretamente valores com ':' no conteúdo", () => {
    const texto = "gcm:isto-parece-um-prefixo:mas-nao-e";
    expect(desencriptar(encriptar(texto))).toBe(texto);
  });
});

describe("google-calendar — mapeamento de eventos", () => {
  it("eventoParaSessao usa duração fornecida e título por omissão", () => {
    const inicio = new Date("2026-08-10T18:00:00.000Z");
    const evento = eventoParaSessao({ dataHora: inicio, duracaoMinutos: 60, local: "Pavilhão" });
    expect(evento.titulo).toBe("Treino");
    expect(evento.local).toBe("Pavilhão");
    expect(evento.inicio.toISOString()).toBe(inicio.toISOString());
    expect(evento.fim.getTime() - evento.inicio.getTime()).toBe(60 * 60_000);
  });

  it("eventoParaSessao usa duração padrão (90) quando ausente ou inválida", () => {
    const inicio = new Date("2026-08-10T18:00:00.000Z");
    const evento = eventoParaSessao({ dataHora: inicio });
    expect(evento.fim.getTime() - evento.inicio.getTime()).toBe(90 * 60_000);
    const evento2 = eventoParaSessao({ dataHora: inicio, duracaoMinutos: 0 });
    expect(evento2.fim.getTime() - evento2.inicio.getTime()).toBe(90 * 60_000);
  });

  it("eventoParaSessao usa o objetivo como título quando fornecido", () => {
    const evento = eventoParaSessao({
      titulo: "Pressing defensivo",
      dataHora: new Date("2026-08-10T18:00:00.000Z"),
    });
    expect(evento.titulo).toBe("Pressing defensivo");
  });

  it("eventoParaJogo formata o título com adversário e contexto casa/fora", () => {
    const inicio = new Date("2026-08-11T20:00:00.000Z");
    const casa = eventoParaJogo({ adversario: "Benfica", dataHora: inicio, casaOuFora: "CASA" });
    expect(casa.titulo).toBe("Jogo vs Benfica (Casa)");
    const fora = eventoParaJogo({ adversario: "Sporting", dataHora: inicio, casaOuFora: "FORA" });
    expect(fora.titulo).toBe("Jogo vs Sporting (Fora)");
    const semContexto = eventoParaJogo({ adversario: "Porto", dataHora: inicio });
    expect(semContexto.titulo).toBe("Jogo vs Porto");
    expect(casa.fim.getTime() - casa.inicio.getTime()).toBe(90 * 60_000);
  });
});

describe("google-calendar — configuração", () => {
  const CID = process.env.GOOGLE_CLIENT_ID;
  const CS = process.env.GOOGLE_CLIENT_SECRET;
  const URL = process.env.NEXTAUTH_URL;

  afterEach(() => {
    if (CID === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = CID;
    if (CS === undefined) delete process.env.GOOGLE_CLIENT_SECRET;
    else process.env.GOOGLE_CLIENT_SECRET = CS;
    if (URL === undefined) delete process.env.NEXTAUTH_URL;
    else process.env.NEXTAUTH_URL = URL;
  });

  it("googleCalendarConfigurado reflete presença das credenciais", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(googleCalendarConfigurado()).toBe(false);
    process.env.GOOGLE_CLIENT_ID = "cid";
    process.env.GOOGLE_CLIENT_SECRET = "cs";
    expect(googleCalendarConfigurado()).toBe(true);
  });

  it("obterRedirectUri compõe o URL do callback a partir de NEXTAUTH_URL", () => {
    process.env.NEXTAUTH_URL = "https://app.futsalcoach.pt/";
    expect(obterRedirectUri()).toBe("https://app.futsalcoach.pt/api/google/callback");
  });
});
