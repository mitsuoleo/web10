import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from './api.config';
import { AuthService, gerarIniciais } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('gera iniciais a partir do nome', () => {
    expect(gerarIniciais('João Silva')).toBe('JS');
    expect(gerarIniciais('maria')).toBe('M');
    expect(gerarIniciais('Ana Paula de Souza')).toBe('AS');
  });

  it('login válido guarda o usuário (sem senha) e marca como logado', () => {
    let ok = false;
    auth.login('joao@email.com', '12345678').subscribe(r => (ok = r));
    const req = http.expectOne(`${API_URL}/cliente/login`);
    expect(req.request.body).toEqual({ email: 'joao@email.com', senha: '12345678' });
    req.flush({ codigo: 3, nome: 'João Silva', email: 'joao@email.com', documento: '1', telefone: '2', logradouro: 'Rua A' });

    expect(ok).toBe(true);
    expect(auth.estaLogado).toBe(true);
    expect(auth.usuarioLogado()?.iniciais).toBe('JS');
    expect(localStorage.getItem('anelar.usuario')).not.toContain('senha');
  });

  it('login inválido (cliente vazio, codigo 0) não loga', () => {
    let ok = true;
    auth.login('x@x.com', 'errada').subscribe(r => (ok = r));
    http.expectOne(`${API_URL}/cliente/login`).flush({ codigo: 0, nome: null });
    expect(ok).toBe(false);
    expect(auth.estaLogado).toBe(false);
  });

  it('logout limpa o usuário e o armazenamento', () => {
    auth.login('a@a.com', 'x').subscribe();
    http.expectOne(`${API_URL}/cliente/login`).flush({ codigo: 1, nome: 'A B' });
    auth.logout();
    expect(auth.estaLogado).toBe(false);
    expect(localStorage.getItem('anelar.usuario')).toBeNull();
  });

  it('cadastro com e-mail repetido dá erro com a mensagem do servidor', () => {
    let mensagem = '';
    auth.cadastrar({ nome: 'A B', email: 'a@a.com', senha: '12345678', documento: '1', telefone: '2', logradouro: 'R' })
      .subscribe({ error: (e: Error) => (mensagem = e.message) });
    http.expectOne(`${API_URL}/cliente`).flush('E-mail já cadastrado!');
    expect(mensagem).toBe('E-mail já cadastrado!');
  });

  it('alterarSenha com dados que não conferem dá erro', () => {
    let mensagem = '';
    auth.alterarSenha('a@a.com', '111', 'NovaSenha1').subscribe({ error: (e: Error) => (mensagem = e.message) });
    const req = http.expectOne(`${API_URL}/cliente/alterarSenha`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ email: 'a@a.com', documento: '111', senha: 'NovaSenha1' });
    req.flush('Dados não conferem! Verifique o e-mail e o documento.');
    expect(mensagem).toContain('não conferem');
  });
});
