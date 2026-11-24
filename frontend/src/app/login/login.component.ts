import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  imports: [CommonModule, FormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.component.css',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  senha = '';
  erroLogin = signal('');
  enviando = signal(false);
  tentativas = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /**
   * Faz o login na API (POST /api/cliente/login). Em caso de sucesso, volta para a tela
   * de onde o usuário veio (parâmetro "retorno") ou vai para a vitrine. Em caso de falha,
   * conta as tentativas e exibe mensagens de erro.
   */
  entrar() {
    this.erroLogin.set('');

    if (!this.email || !this.senha) {
      this.erroLogin.set('Preencha o e-mail e a senha para continuar.');
      return;
    }
    if (this.enviando()) return;

    this.enviando.set(true);
    this.authService.login(this.email.trim(), this.senha).subscribe({
      next: sucesso => {
        this.enviando.set(false);
        if (sucesso) {
          this.router.navigateByUrl(this.destinoAposLogin());
          return;
        }
        this.tentativas++;
        if (this.tentativas >= 3) {
          this.erroLogin.set('Muitas tentativas incorretas. Verifique seus dados ou recupere sua senha.');
        } else {
          this.erroLogin.set('E-mail ou senha incorretos. Verifique e tente novamente.');
        }
      },
      error: () => {
        this.enviando.set(false);
        this.erroLogin.set('Não foi possível conectar ao servidor. Tente novamente em instantes.');
      },
    });
  }

  /** Só aceita retorno para rotas internas (começa com "/" e não com "//"). */
  private destinoAposLogin(): string {
    const retorno = this.route.snapshot.queryParamMap.get('retorno');
    return retorno && retorno.startsWith('/') && !retorno.startsWith('//') ? retorno : '/vitrine';
  }
}
