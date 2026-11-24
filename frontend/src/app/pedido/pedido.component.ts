import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoService, Pedido } from '../pedido.service';
import { AuthService } from '../auth.service';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-pedido',
  styleUrl: './pedido.component.css',
  templateUrl: './pedido.component.html',
})
export class PedidoComponent implements OnInit {
  pedido: Pedido | undefined;
  formaSelecionada: string = '';
  parcelas: number = 1;
  confirmado = false;
  enviando = false;
  erro = '';

  readonly formas = [
    { id: 'debito', label: 'Débito', icon: '', desc: 'Desconto de 5% no débito' },
    { id: 'credito', label: 'Crédito à Vista', icon: '', desc: 'Sem juros à vista' },
    { id: 'parcelado', label: 'Crédito Parcelado', icon: '', desc: 'Em até 12x com juros' },
    { id: 'boleto', label: 'Boleto Bancário', icon: '', desc: 'Vence em 3 dias úteis' },
    { id: 'pix', label: 'Pix', icon: '', desc: 'Aprovação instantânea' },
  ];

  readonly opsParcelas = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private pedidoService: PedidoService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  /**
   * Método de ciclo de vida do Angular executado na inicialização.
   * Obtém o código do pedido via Query Params e carrega o pedido da API.
   * Sem login, pedido inexistente ou de outro cliente: redireciona o usuário.
   */
  ngOnInit() {
    const cliente = this.authService.usuarioLogado();
    const id = Number(this.route.snapshot.queryParamMap.get('id'));
    if (!cliente || !id) {
      this.router.navigate(['/lista-pedidos']);
      return;
    }
    this.pedidoService.obter(id).subscribe({
      next: pedido => {
        if (!pedido || pedido.codigoCliente !== cliente.codigo) {
          this.router.navigate(['/lista-pedidos']);
          return;
        }
        this.pedido = pedido;
        this.cdr.markForCheck();
      },
      error: () => this.router.navigate(['/lista-pedidos']),
    });
  }

  /**
   * Calcula o valor total do pedido com possível desconto.
   * Aplica 5% de desconto caso a forma de pagamento selecionada seja 'debito'.
   */
  get totalComDesconto(): number {
    if (!this.pedido) return 0;
    if (this.formaSelecionada === 'debito') return this.pedido.total * 0.95;
    return this.pedido.total;
  }

  /**
   * Calcula o valor de cada parcela no pagamento parcelado, 
   * incluindo juros compostos simulados.
   */
  get valorParcela(): number {
    if (!this.pedido || this.formaSelecionada !== 'parcelado' || this.parcelas < 2) return 0;
    const juros = 1 + (0.0199 * this.parcelas);
    return (this.pedido.total * juros) / this.parcelas;
  }

  /**
   * Marca uma forma de pagamento como selecionada pelo usuário.
   * @param id Identificador da forma de pagamento
   */
  selecionar(id: string) {
    this.formaSelecionada = id;
    this.erro = '';
    if (id !== 'parcelado') this.parcelas = 1;
  }

  /**
   * Finaliza e confirma o pagamento do pedido atual (PUT /api/pedido), registrando a
   * forma de pagamento e o novo status. Redireciona para a lista de pedidos após 2.5 segundos.
   */
  confirmarPagamento() {
    if (!this.formaSelecionada) {
      this.erro = 'Selecione uma forma de pagamento para continuar.';
      return;
    }
    if (!this.pedido || this.enviando) return;

    const parcelas = this.formaSelecionada === 'parcelado' ? this.parcelas : undefined;
    this.erro = '';
    this.enviando = true;
    this.pedidoService.confirmarPagamento(this.pedido.id, this.formaSelecionada, parcelas).subscribe({
      next: () => {
        this.enviando = false;
        this.confirmado = true;
        this.cdr.markForCheck();
        setTimeout(() => this.router.navigate(['/lista-pedidos']), 2500);
      },
      error: () => {
        this.enviando = false;
        this.erro = 'Não foi possível confirmar o pagamento agora. Tente novamente em instantes.';
        this.cdr.markForCheck();
      },
    });
  }
}
