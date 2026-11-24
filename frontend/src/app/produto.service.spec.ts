import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from './api.config';
import { IMAGEM_PADRAO, ProdutoApi, ProdutoService, paraProduto } from './produto.service';

const base: ProdutoApi = {
  codigo: 1, nome: 'Anel', descritivo: 'Ouro 18k', valor: 1000, valorPromo: 900,
  quantidade: 5, destaque: 1, imagem: '/produtos/anel.jpg',
};

describe('ProdutoService', () => {
  let servico: ProdutoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servico = TestBed.inject(ProdutoService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('usa o valor promocional quando ele é menor que o valor', () => {
    expect(paraProduto(base).preco).toBe(900);
  });

  it('usa o valor cheio quando não há promoção', () => {
    expect(paraProduto({ ...base, valorPromo: 0 }).preco).toBe(1000);
    expect(paraProduto({ ...base, valorPromo: 1200 }).preco).toBe(1000);
  });

  it('usa a imagem padrão quando o produto não tem imagem', () => {
    expect(paraProduto({ ...base, imagem: null }).img).toBe(IMAGEM_PADRAO);
  });

  it('busca com termo vazio carrega a vitrine', () => {
    let resultado: unknown[] = [];
    servico.buscar('  ').subscribe(l => (resultado = l));
    http.expectOne(`${API_URL}/produto/vitrine`).flush([base]);
    expect(resultado.length).toBe(1);
  });

  it('busca com termo chama o endpoint de busca com o termo codificado', () => {
    servico.buscar('anel ouro').subscribe();
    const req = http.expectOne(`${API_URL}/produto/busca/anel%20ouro`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('obter devolve null quando o backend responde com objeto vazio (codigo 0)', () => {
    let resultado: unknown = 'x';
    servico.obter(99).subscribe(p => (resultado = p));
    http.expectOne(`${API_URL}/produto/99`).flush({ codigo: 0, nome: null, valor: 0, valorPromo: 0 });
    expect(resultado).toBeNull();
  });

  it('cadastrar devolve o código que vem no fim da mensagem do servidor', () => {
    let codigo = 0;
    servico.cadastrar({ nome: 'X', descritivo: '', valor: 1, valorPromo: 0, quantidade: 1, destaque: 0 }).subscribe(c => (codigo = c));
    http.expectOne(`${API_URL}/produto`).flush('Produto gravado com sucesso! 17');
    expect(codigo).toBe(17);
  });
});
