/**
 * Endereço base da API (backend Spring Boot "lojinha", porta 8081).
 * Se o backend rodar em outro host/porta, é só alterar aqui.
 */
export const API_URL = 'http://localhost:8081/api';

/** Os controllers do backend devolvem texto simples ("Cliente gravado com sucesso! 1"). */
export const TEXTO = { responseType: 'text' as const };

/** Extrai o código numérico no fim de mensagens como "Produto gravado com sucesso! 7". */
export function extrairCodigo(mensagem: string): number {
  const m = /(\d+)\s*$/.exec(mensagem);
  return m ? Number(m[1]) : 0;
}
