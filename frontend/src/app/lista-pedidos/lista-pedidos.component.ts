import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PedidoService, Pedido } from '../pedido.service';
import { AuthService } from '../auth.service';

@Component({
  imports: [],
  selector: 'app-lista-pedidos',
  styleUrl: './lista-pedidos.component.css',
  templateUrl: './lista-pedidos.component.html',
})
export class ListaPedidosComponent implements OnInit {
  private _pedidos = signal<Pedido[]>([]);
  carregando = signal(true);
  erro = signal('');

  constructor(
    private pedidoService: PedidoService,
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Carrega da API (GET /api/pedido/cliente/{codigo}) os pedidos do cliente logado.
   * Sem login, redireciona para a tela de login e volta para cá depois.
   */
  ngOnInit() {
    const cliente = this.authService.usuarioLogado();
    if (!cliente) {
      this.router.navigate(['/login'], { queryParams: { retorno: '/lista-pedidos' } });
      return;
    }
    this.pedidoService.listarDoCliente(cliente.codigo).subscribe({
      next: lista => {
        this._pedidos.set(lista);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar seus pedidos. Verifique se o servidor está no ar.');
        this.carregando.set(false);
      },
    });
  }

  /**
   * Pedidos do cliente logado, do mais recente para o mais antigo.
   */
  get pedidos(): Pedido[] {
    return this._pedidos();
  }

  /**
   * Formata um valor numérico para o padrão de moeda brasileiro (BRL).
   * @param valor Valor a ser formatado
   * @returns String formatada (ex: R$ 1.500,00)
   */
  formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /**
   * Redireciona o usuário para a tela de pagamento do pedido selecionado.
   * @param pedidoId Código do pedido
   */
  irParaPagamento(pedidoId: number) {
    this.router.navigate(['/pedido'], { queryParams: { id: pedidoId } });
  }
}
