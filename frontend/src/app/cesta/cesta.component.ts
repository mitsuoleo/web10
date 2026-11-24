import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CestaService, Produto } from '../cesta.service';
import { PedidoService } from '../pedido.service';
import { AuthService } from '../auth.service';

@Component({
  imports: [CommonModule],
  selector: 'app-cesta',
  styleUrl: './cesta.component.css',
  templateUrl: './cesta.component.html',
})
export class CestaComponent {
  enviando = signal(false);
  erro = signal('');

  constructor(
    private cestaService: CestaService,
    private pedidoService: PedidoService,
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Retorna os itens atualmente presentes na cesta através do CestaService.
   */
  get itens(): Produto[] {
    return this.cestaService.obterItens();
  }

  /**
   * Retorna o valor total da cesta somando todos os itens.
   */
  get total(): number {
    return this.cestaService.obterTotal();
  }

  /**
   * Remove um item específico da cesta utilizando o seu ID.
   * @param produtoId ID do produto a ser removido
   */
  removerItem(produtoId: number) {
    this.cestaService.removerItem(produtoId);
  }

  /**
   * Grava o pedido na API (POST /api/pedido) com os itens da cesta, limpa a cesta
   * e redireciona o usuário para a lista de pedidos. Exige cliente logado: se não houver,
   * vai para o login e volta para a cesta depois.
   */
  aprovarPedido() {
    const cliente = this.authService.usuarioLogado();
    if (!cliente) {
      this.router.navigate(['/login'], { queryParams: { retorno: '/cesta' } });
      return;
    }
    if (this.enviando()) return;

    this.erro.set('');
    this.enviando.set(true);
    this.pedidoService.criar(this.itens, this.total, cliente).subscribe({
      next: () => {
        this.cestaService.limparCesta();
        this.enviando.set(false);
        this.router.navigate(['/lista-pedidos']);
      },
      error: () => {
        this.enviando.set(false);
        this.erro.set('Não foi possível aprovar o pedido agora. Verifique se o servidor está no ar e tente novamente.');
      },
    });
  }
}
