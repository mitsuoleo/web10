import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap, throwError } from 'rxjs';
import { API_URL, TEXTO, extrairCodigo } from './api.config';
import { Produto } from './cesta.service';
import { Usuario } from './auth.service';

export const STATUS_AGUARDANDO = 'Aguardando Pagamento';
export const STATUS_CONFIRMADO = 'Pagamento Confirmado';

export interface ItemPedidoApi {
  codigoItemPedido?: number;
  codigoProduto: number;
  quantidade: number;
  valor: number;
}

/** Pedido como o backend (PedidoController) devolve. */
export interface PedidoApi {
  codigoPedido: number;
  valorTotal: number;
  entrega: string | null;
  obs: string | null;
  dataPedido: string | number | null;
  codigoCliente: number;
  status: string | null;
  formaPagamento: string | null;
  parcelas: number;
  itens: ItemPedidoApi[];
}

/** Pedido no formato usado pelas telas. */
export interface Pedido {
  id: number;
  data: string;
  status: string;
  total: number;
  codigoCliente: number;
  itens: ItemPedidoApi[];
  formaPagamento?: string;
  parcelas?: number;
}

/** Formata a data do backend ("2026-11-24" ou epoch) como dd/mm/aaaa, sem deslocar por fuso. */
export function formatarData(valor: string | number | null): string {
  if (valor === null || valor === undefined || valor === '') return '';
  if (typeof valor === 'number') return new Date(valor).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : valor;
}

function paraPedido(p: PedidoApi): Pedido {
  return {
    id: p.codigoPedido,
    data: formatarData(p.dataPedido),
    status: p.status || STATUS_AGUARDANDO,
    total: p.valorTotal,
    codigoCliente: p.codigoCliente,
    itens: p.itens ?? [],
    formaPagamento: p.formaPagamento ?? undefined,
    parcelas: p.parcelas > 1 ? p.parcelas : undefined,
  };
}

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private http = inject(HttpClient);
  private url = `${API_URL}/pedido`;

  /**
   * POST /api/pedido - grava o pedido do cliente com os itens da cesta (itens repetidos viram
   * uma linha com quantidade). Emite o código do pedido criado.
   */
  criar(itens: Produto[], total: number, cliente: Usuario): Observable<number> {
    const porProduto = new Map<number, ItemPedidoApi>();
    for (const p of itens) {
      const atual = porProduto.get(p.id);
      if (atual) atual.quantidade++;
      else porProduto.set(p.id, { codigoProduto: p.id, quantidade: 1, valor: p.preco });
    }
    const corpo = {
      valorTotal: total,
      entrega: cliente.logradouro,
      obs: '',
      codigoCliente: cliente.codigo,
      status: STATUS_AGUARDANDO,
      itens: [...porProduto.values()],
    };
    return this.http.post(this.url, corpo, TEXTO).pipe(map(extrairCodigo));
  }

  /** GET /api/pedido/cliente/{codigo} - pedidos do cliente, do mais recente para o mais antigo. */
  listarDoCliente(codigoCliente: number): Observable<Pedido[]> {
    return this.http.get<PedidoApi[]>(`${this.url}/cliente/${codigoCliente}`).pipe(map(l => l.map(paraPedido)));
  }

  /** GET /api/pedido/{codigo} - o backend devolve um objeto vazio (codigoPedido 0) se não existir. */
  obter(id: number): Observable<Pedido | null> {
    return this.http
      .get<PedidoApi>(`${this.url}/${id}`)
      .pipe(map(p => (p && p.codigoPedido > 0 ? paraPedido(p) : null)));
  }

  /**
   * PUT /api/pedido - registra a forma de pagamento e muda o status para "Pagamento Confirmado".
   * Busca o pedido atual antes, porque o PUT grava o objeto inteiro.
   */
  confirmarPagamento(id: number, formaPagamento: string, parcelas?: number): Observable<string> {
    return this.http.get<PedidoApi>(`${this.url}/${id}`).pipe(
      switchMap(atual => {
        if (!atual || !(atual.codigoPedido > 0)) return throwError(() => new Error('Pedido não encontrado!'));
        const atualizado: PedidoApi = {
          ...atual,
          formaPagamento,
          parcelas: parcelas ?? 1,
          status: STATUS_CONFIRMADO,
        };
        return this.http.put(this.url, atualizado, TEXTO);
      }),
      map(msg => {
        if (!/alterado com sucesso/i.test(msg)) throw new Error(msg);
        return msg;
      })
    );
  }

  /** DELETE /api/pedido/{codigo} */
  excluir(id: number): Observable<string> {
    return this.http.delete(`${this.url}/${id}`, TEXTO);
  }
}
