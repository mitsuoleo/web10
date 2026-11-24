import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { API_URL, TEXTO } from './api.config';

/** Dados do cliente logado (nunca guardamos a senha). */
export interface Usuario {
  codigo: number;
  nome: string;
  email: string;
  documento: string;
  telefone: string;
  logradouro: string;
  iniciais: string;
}

/** Dados enviados no cadastro. `documento` é o CPF. */
export interface NovoCliente {
  nome: string;
  email: string;
  senha: string;
  documento: string;
  telefone: string;
  logradouro: string;
}

/** Cliente como o backend (ClienteController) devolve. A senha nunca vem na resposta. */
interface ClienteApi {
  codigo: number;
  nome: string | null;
  email: string | null;
  documento: string | null;
  telefone: string | null;
  logradouro: string | null;
}

const CHAVE_SESSAO = 'anelar.usuario';

/** Gera as iniciais a partir do nome. Exemplo: "João Silva" -> "JS". */
export function gerarIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private navegador = isPlatformBrowser(inject(PLATFORM_ID));
  private url = `${API_URL}/cliente`;

  private _usuarioLogado = signal<Usuario | null>(this.lerSessao());
  readonly usuarioLogado = this._usuarioLogado.asReadonly();

  /**
   * POST /api/cliente - cadastra o cliente. Emite a mensagem do servidor em caso de sucesso
   * e dá erro (com a mensagem do servidor) se, por exemplo, o e-mail já estiver cadastrado.
   */
  cadastrar(dados: NovoCliente): Observable<string> {
    return this.http.post(this.url, dados, TEXTO).pipe(
      map(msg => {
        if (!/gravado com sucesso/i.test(msg)) throw new Error(msg);
        return msg;
      })
    );
  }

  /**
   * POST /api/cliente/login - emite true e guarda o usuário se as credenciais estiverem corretas
   * (e o cliente ativo); caso contrário o backend devolve um cliente vazio e emitimos false.
   */
  login(email: string, senha: string): Observable<boolean> {
    return this.http.post<ClienteApi>(`${this.url}/login`, { email, senha }).pipe(
      map(c => {
        if (!c || !(c.codigo > 0)) return false;
        this.definirUsuario({
          codigo: c.codigo,
          nome: c.nome ?? '',
          email: c.email ?? email,
          documento: c.documento ?? '',
          telefone: c.telefone ?? '',
          logradouro: c.logradouro ?? '',
          iniciais: gerarIniciais(c.nome ?? email),
        });
        return true;
      })
    );
  }

  /**
   * PATCH /api/cliente/alterarSenha - define a nova senha confirmando e-mail + CPF.
   * Dá erro com a mensagem do servidor se os dados não conferirem.
   */
  alterarSenha(email: string, documento: string, novaSenha: string): Observable<string> {
    return this.http.patch(`${this.url}/alterarSenha`, { email, documento, senha: novaSenha }, TEXTO).pipe(
      map(msg => {
        if (!/senha foi alterada/i.test(msg)) throw new Error(msg);
        return msg;
      })
    );
  }

  /**
   * PATCH /api/cliente/resetarSenha - volta a senha para a padrão do servidor e exige trocar
   * a senha de novo (o cliente fica inativo até o alterarSenha). Sem envio de e-mail ainda.
   */
  resetarSenha(email: string): Observable<string> {
    return this.http.patch(`${this.url}/resetarSenha`, { email }, TEXTO);
  }

  /** Remove o usuário logado. */
  logout(): void {
    this.definirUsuario(null);
  }

  /** true se existe um usuário logado. */
  get estaLogado(): boolean {
    return this._usuarioLogado() !== null;
  }

  private definirUsuario(usuario: Usuario | null) {
    this._usuarioLogado.set(usuario);
    if (!this.navegador) return;
    try {
      if (usuario) localStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario));
      else localStorage.removeItem(CHAVE_SESSAO);
    } catch { /* armazenamento indisponível: segue só em memória */ }
  }

  private lerSessao(): Usuario | null {
    if (!this.navegador) return null;
    try {
      const bruto = localStorage.getItem(CHAVE_SESSAO);
      return bruto ? (JSON.parse(bruto) as Usuario) : null;
    } catch {
      return null;
    }
  }
}
