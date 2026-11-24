import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URL, TEXTO, extrairCodigo } from './api.config';
import { Produto } from './cesta.service';

/** Produto como o backend (ProdutoController) devolve. */
export interface ProdutoApi {
  codigo: number;
  nome: string;
  descritivo: string;
  valor: number;
  valorPromo: number;
  quantidade: number;
  destaque: number;
  imagem?: string | null;
}

/** Imagem usada quando o produto não tem foto cadastrada. */
export const IMAGEM_PADRAO = '/logotipo.png';

/** Converte o produto da API para o modelo usado pelas telas (vitrine, cesta). */
export function paraProduto(p: ProdutoApi): Produto {
  const emPromocao = p.valorPromo > 0 && p.valorPromo < p.valor;
  return {
    id: p.codigo,
    nome: p.nome,
    desc: p.descritivo ?? '',
    preco: emPromocao ? p.valorPromo : p.valor,
    img: p.imagem || IMAGEM_PADRAO,
  };
}

@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private http = inject(HttpClient);
  private url = `${API_URL}`;

  /** GET /api/produtos - todos os produtos. */
  listar(): Observable<Produto[]> {
    return this.http.get<ProdutoApi[]>(`${this.url}/produtos`).pipe(map(l => l.map(paraProduto)));
  }

  /** GET /api/produto/vitrine - produtos em destaque, na ordem da vitrine. */
  vitrine(): Observable<Produto[]> {
    return this.http.get<ProdutoApi[]>(`${this.url}/produto/vitrine`).pipe(map(l => l.map(paraProduto)));
  }

  /** GET /api/produto/busca/{termo} - busca no nome e no descritivo. Termo vazio devolve a vitrine. */
  buscar(termo: string): Observable<Produto[]> {
    const limpo = termo.replace(/[\\/]/g, ' ').trim();
    if (!limpo) return this.vitrine();
    return this.http
      .get<ProdutoApi[]>(`${this.url}/produto/busca/${encodeURIComponent(limpo)}`)
      .pipe(map(l => l.map(paraProduto)));
  }

  /** GET /api/produto/{codigo} - o backend devolve um objeto vazio (codigo 0) se não existir. */
  obter(codigo: number): Observable<Produto | null> {
    return this.http
      .get<ProdutoApi>(`${this.url}/produto/${codigo}`)
      .pipe(map(p => (p && p.codigo > 0 ? paraProduto(p) : null)));
  }

  /** POST /api/produto - devolve o código gerado. */
  cadastrar(produto: Omit<ProdutoApi, 'codigo'>): Observable<number> {
    return this.http.post(`${this.url}/produto`, produto, TEXTO).pipe(map(extrairCodigo));
  }

  /** PUT /api/produto - o produto precisa ter o código. */
  alterar(produto: ProdutoApi): Observable<string> {
    return this.http.put(`${this.url}/produto`, produto, TEXTO);
  }

  /** DELETE /api/produto/{codigo} */
  excluir(codigo: number): Observable<string> {
    return this.http.delete(`${this.url}/produto/${codigo}`, TEXTO);
  }
}
