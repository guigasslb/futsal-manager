// lib/crypto.ts
// Encriptação at-rest de credenciais sensíveis (ex.: refreshToken da integração
// Google Calendar — bíblia §3.12). Módulo puro (sem "use server"), usado apenas
// em código de servidor.
//
// Estratégia:
//   • Se ENCRYPTION_KEY (hex de 64 chars = 32 bytes) estiver definida → AES-256-GCM.
//   • Em produção sem ENCRYPTION_KEY → erro explícito (a app não arranca sem
//     encriptação real).
//   • Em desenvolvimento sem ENCRYPTION_KEY → Base64 simples com aviso
//     (graceful degradation aceitável para dev local).
//
// O texto encriptado é auto-descritivo (prefixo por esquema) para que
// `desencriptar` saiba como o descodificar independentemente do estado atual
// da chave.

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGORITMO = "aes-256-gcm";
const IV_BYTES = 12; // recomendado para GCM
const PREFIXO_GCM = "gcm";
const PREFIXO_B64 = "b64";

let avisoBase64Emitido = false;

/**
 * Devolve a chave de 32 bytes se ENCRYPTION_KEY for válida.
 * Em produção, lança erro se a chave estiver ausente ou vazia (a app não deve
 * arrancar sem encriptação real). Em desenvolvimento, devolve null para permitir
 * o fallback Base64.
 */
function obterChave(): Buffer | null {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ENCRYPTION_KEY ausente ou vazia em produção: a aplicação não pode " +
          "arrancar sem encriptação real. Definir uma string hexadecimal de 64 " +
          "caracteres (32 bytes). Gerar com `openssl rand -hex 32`.",
      );
    }
    return null;
  }

  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      "ENCRYPTION_KEY inválida: tem de ser uma string hexadecimal de 64 caracteres (32 bytes).",
    );
  }
  return Buffer.from(hex, "hex");
}

function avisarBase64(): void {
  if (avisoBase64Emitido) return;
  avisoBase64Emitido = true;
  console.warn(
    "[crypto] ENCRYPTION_KEY ausente — a usar codificação Base64 (NÃO SEGURA). " +
      "Definir ENCRYPTION_KEY (hex de 64 caracteres) em produção.",
  );
}

/**
 * Encripta `texto`. Devolve uma string auto-descritiva:
 *   • `gcm:<ivHex>:<tagHex>:<dadosHex>` quando há ENCRYPTION_KEY.
 *   • `b64:<base64>` como fallback de desenvolvimento.
 */
export function encriptar(texto: string): string {
  const chave = obterChave();

  if (!chave) {
    avisarBase64();
    const b64 = Buffer.from(texto, "utf8").toString("base64");
    return `${PREFIXO_B64}:${b64}`;
  }

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITMO, chave, iv);
  const encriptado = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    PREFIXO_GCM,
    iv.toString("hex"),
    tag.toString("hex"),
    encriptado.toString("hex"),
  ].join(":");
}

/**
 * Desencripta um valor produzido por `encriptar`. Suporta ambos os esquemas
 * (GCM e Base64) através do prefixo.
 */
export function desencriptar(texto: string): string {
  const [prefixo, ...resto] = texto.split(":");

  if (prefixo === PREFIXO_B64) {
    return Buffer.from(resto.join(":"), "base64").toString("utf8");
  }

  if (prefixo === PREFIXO_GCM) {
    const chave = obterChave();
    if (!chave) {
      throw new Error(
        "Não é possível desencriptar: valor cifrado com AES-256-GCM mas ENCRYPTION_KEY ausente.",
      );
    }
    const [ivHex, tagHex, dadosHex] = resto;
    if (!ivHex || !tagHex || !dadosHex) {
      throw new Error("Formato de texto cifrado (gcm) inválido.");
    }
    const decipher = createDecipheriv(ALGORITMO, chave, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const decifrado = Buffer.concat([
      decipher.update(Buffer.from(dadosHex, "hex")),
      decipher.final(),
    ]);
    return decifrado.toString("utf8");
  }

  throw new Error("Formato de texto cifrado desconhecido.");
}
