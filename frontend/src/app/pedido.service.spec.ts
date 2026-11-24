import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from './api.config';
import { Produto } from './cesta.service';
import { Usuario } from './auth.service';
import { PedidoService, formatarData } from './pedido.service';

const cliente: Usuario = { codigo: 7, nome: 'A B', email: 'a@a.com', documento: '1', telefone: '2', logradouro: 'Rua A, 1', iniciais: 'AB' };
const anel: Produto = { id: 2, nome: 'Anel', desc: '', preco: 100, img: '' };
const colar: Produto = { id: 5, nome: 'Colar', desc: '', preco: 250, img: '' };

describe('PedidoService', () => {
  let servico: PedidoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servico = TestBed.inject(PedidoService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('formata a data sem deslocar o dia por fuso', () => {
    expect(formatarData('2026-11-24')).toBe('24/11/2026');
    expect(formatarData('2026-11-24T00:00:00.000+00:00')).toBe('24/11/2026');
    expect(formatarData(null)).toBe('');
  });

  it('criar agrupa itens repetidos e envia cliente, entrega e status', () => {
    let codigo = 0;
    servico.criar([anel, colar, anel], 450, cliente).subscribe(c => (codigo = c));
    const req = http.expectOne(`${API_URL}/pedido`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.codigoCliente).toBe(7);
    expect(req.request.body.valorTotal).toBe(450);
    expect(req.request.body.entrega).toBe('Rua A, 1');
    expect(req.request.body.status).toBe('Aguardando Pagamento');
    expect(req.request.body.itens).toEqual([
      { codigoProduto: 2, quantidade: 2, valor: 100 },
      { codigoProduto: 5, quantidade: 1, valor: 250 },
    ]);
    req.flush('Pedido gravado com sucesso! 12');
    expect(codigo).toBe(12);
  });

  it('listarDoCliente converte os pedidos da API', () => {
    let lista: ReturnType<typeof Array<unknown>> = [];
    servico.listarDoCliente(7).subscribe(l => (lista = l));
    http.expectOne(`${API_URL}/pedido/cliente/7`).flush([
      { codigoPedido: 3, valorTotal: 450, dataPedido: '2026-11-24', codigoCliente: 7, status: null, parcelas: 0, itens: [] },
    ]);
    expect(lista).toEqual([jasmineLike(3)]);
  });

  it('confirmarPagamento busca o pedido e faz PUT com forma, parcelas e novo status', () => {
    let msg = '';
    servico.confirmarPagamento(3, 'parcelado', 4).subscribe(m => (msg = m));
    http.expectOne(`${API_URL}/pedido/3`).flush({
      codigoPedido: 3, valorTotal: 450, dataPedido: '2026-11-24', codigoCliente: 7, status: 'Aguardando Pagamento',
      formaPagamento: null, parcelas: 0, itens: [{ codigoItemPedido: 9, codigoProduto: 2, quantidade: 1, valor: 100 }],
    });
    const put = http.expectOne(`${API_URL}/pedido`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.status).toBe('Pagamento Confirmado');
    expect(put.request.body.formaPagamento).toBe('parcelado');
    expect(put.request.body.parcelas).toBe(4);
    expect(put.request.body.itens.length).toBe(1);
    put.flush('Pedido alterado com sucesso! 3');
    expect(msg).toContain('alterado com sucesso');
  });

  it('confirmarPagamento dá erro se o pedido não existe', () => {
    let erro = '';
    servico.confirmarPagamento(99, 'pix').subscribe({ error: (e: Error) => (erro = e.message) });
    http.expectOne(`${API_URL}/pedido/99`).flush({ codigoPedido: 0 });
    expect(erro).toBe('Pedido não encontrado!');
  });
});

// compara só os campos relevantes da conversão
function jasmineLike(id: number) {
  return {
    id, data: '24/11/2026', status: 'Aguardando Pagamento', total: 450, codigoCliente: 7,
    itens: [], formaPagamento: undefined, parcelas: undefined,
  };
}
