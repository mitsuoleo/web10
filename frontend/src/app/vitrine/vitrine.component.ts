import { Component, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, catchError, debounceTime, distinctUntilChanged, merge, of, switchMap, tap } from 'rxjs';
import { CestaService, Produto } from '../cesta.service';
import { ProdutoService } from '../produto.service';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-vitrine',
  styleUrl: './vitrine.component.css',
  templateUrl: './vitrine.component.html',
})
export class VitrineComponent {
  /** Produtos vindos da API (vitrine, ou resultado da busca). */
  produtos = signal<Produto[]>([]);
  carregando = signal(true);
  erro = signal('');

  private buscas = new Subject<string>();

  termoBusca = '';
  paginaAtual = 1;
  itensPorPagina = 6;

  constructor(private cestaService: CestaService, private produtoService: ProdutoService) {
    // Carga inicial (vitrine) + buscas digitadas, com espera de 300ms entre as teclas.
    merge(of(''), this.buscas.pipe(debounceTime(300)))
      .pipe(
        distinctUntilChanged(),
        tap(() => { this.carregando.set(true); this.erro.set(''); }),
        switchMap(termo =>
          this.produtoService.buscar(termo).pipe(
            catchError(() => {
              this.erro.set('Não foi possível carregar os produtos. Verifique se o servidor está no ar.');
              return of([] as Produto[]);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe(lista => {
        this.produtos.set(lista);
        this.carregando.set(false);
      });
  }

  /**
   * Adiciona o produto selecionado à cesta de compras através do serviço.
   * @param produto Objeto do produto selecionado
   */
  adicionarNaCesta(produto: Produto) {
    this.cestaService.adicionarItem(produto);
  }

  /**
   * Lista exibida: a busca é feita pelo servidor (GET /api/produto/busca/{termo}).
   */
  get produtosFiltrados() {
    return this.produtos();
  }

  /**
   * Reseta a paginação e dispara a busca no servidor sempre que o termo for alterado.
   */
  aoMudarBusca() {
    this.paginaAtual = 1;
    this.buscas.next(this.termoBusca);
  }

  /**
   * Calcula o número total de páginas com base na quantidade de produtos filtrados e itens por página.
   */
  get totalPaginas() {
    return Math.ceil(this.produtosFiltrados.length / this.itensPorPagina);
  }

  /**
   * Retorna um array com os números das páginas para renderizar os botões de paginação.
   */
  get arrayPaginas() {
    return Array(this.totalPaginas).fill(0).map((x, i) => i + 1);
  }

  /**
   * Retorna apenas a fatia de produtos correspondente à página atual.
   */
  get produtosPaginados() {
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;
    return this.produtosFiltrados.slice(inicio, fim);
  }

  /**
   * Atualiza a página atual se a página informada for válida.
   * @param pagina Número da nova página desejada
   */
  mudarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaAtual = pagina;
    }
  }
}

