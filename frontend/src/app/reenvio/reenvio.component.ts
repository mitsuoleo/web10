import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-reenvio',
  styleUrl: './reenvio.component.css',
  templateUrl: './reenvio.component.html',
})
export class ReenvioComponent {
  email = '';
  cpf = '';
  novaSenha = '';
  confirmaSenha = '';

  erro = signal('');
  sucesso = signal(false);
  enviando = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Redefine a senha na API (PATCH /api/cliente/alterarSenha), confirmando o cliente
   * pelo e-mail + CPF. Em caso de sucesso, volta para o login.
   */
  redefinir() {
    this.erro.set('');

    if (!this.email.trim() || !this.cpf.trim() || !this.novaSenha) {
      this.erro.set('Preencha o e-mail, o CPF e a nova senha.');
      return;
    }
    if (this.novaSenha.length < 8) {
      this.erro.set('A senha deve ter ao menos 8 caracteres.');
      return;
    }
    if (this.novaSenha !== this.confirmaSenha) {
      this.erro.set('As senhas não coincidem.');
      return;
    }
    if (this.enviando()) return;

    this.enviando.set(true);
    this.authService.alterarSenha(this.email.trim(), this.cpf.replace(/\D/g, ''), this.novaSenha).subscribe({
      next: () => {
        this.enviando.set(false);
        this.sucesso.set(true);
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (e: unknown) => {
        this.enviando.set(false);
        const msg = e instanceof Error ? e.message : '';
        this.erro.set(
          /não conferem/i.test(msg)
            ? 'E-mail e CPF não conferem com nenhum cadastro. Verifique os dados.'
            : 'Não foi possível redefinir a senha agora. Tente novamente em instantes.'
        );
      },
    });
  }
}
