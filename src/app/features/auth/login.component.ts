import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../core/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public readonly loginSuccess = output<void>();
  public readonly switchToRegister = output<void>();

  public email = signal<string>('driver@veloce.com');
  public password = signal<string>('driver123');
  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  public onLogin(): void {
    if (!this.email().trim() || !this.password().trim()) {
      this.errorMessage.set('Por favor complete todos los campos de acceso.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload: LoginRequest = {
      email: this.email().trim().toLowerCase(),
      password: this.password()
    };

    this.authService.login(payload).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        this.loginSuccess.emit();
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Error de autenticación. Verifique sus credenciales.';
        this.errorMessage.set(msg);
      }
    });
  }

  public fillPreset(type: 'driver' | 'mechanic'): void {
    if (type === 'driver') {
      this.email.set('driver@veloce.com');
      this.password.set('driver123');
    } else {
      this.email.set('mecanico@veloce.com');
      this.password.set('mecanico123');
    }
    this.errorMessage.set(null);
  }

  public onGoToRegister(): void {
    this.switchToRegister.emit();
  }
}

