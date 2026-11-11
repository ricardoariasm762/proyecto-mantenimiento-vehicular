import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RegisterRequest } from '../../core/models/auth.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public readonly registerSuccess = output<void>();
  public readonly switchToLogin = output<void>();

  // Form state
  public fullName = signal<string>('');
  public email = signal<string>('');
  public password = signal<string>('');
  public phone = signal<string>('');
  public role = signal<'ROLE_DRIVER' | 'ROLE_MECHANIC'>('ROLE_DRIVER');

  // Optional vehicle fields for driver
  public licensePlate = signal<string>('');
  public brand = signal<string>('Toyota');
  public model = signal<string>('Hilux');
  public modelYear = signal<number>(2023);
  public baseMileageKm = signal<number>(45000);

  public isLoading = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  public selectRole(newRole: 'ROLE_DRIVER' | 'ROLE_MECHANIC'): void {
    this.role.set(newRole);
    if (newRole === 'ROLE_DRIVER' && !this.licensePlate()) {
      this.licensePlate.set('TRX-850');
    }
  }

  public onRegister(): void {
    if (!this.fullName().trim() || !this.email().trim() || !this.password().trim()) {
      this.errorMessage.set('Por favor ingrese nombre, correo electrónico y contraseña.');
      return;
    }

    if (this.password().length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload: RegisterRequest = {
      fullName: this.fullName().trim(),
      email: this.email().trim().toLowerCase(),
      password: this.password(),
      phone: this.phone().trim() || undefined,
      role: this.role(),
      licensePlate: this.licensePlate().trim() ? this.licensePlate().toUpperCase().trim() : undefined,
      brand: this.brand().trim() || undefined,
      model: this.model().trim() || undefined,
      modelYear: Number(this.modelYear()) || undefined,
      baseMileageKm: Number(this.baseMileageKm()) || undefined
    };

    this.authService.register(payload).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        this.registerSuccess.emit();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Error al procesar el registro de usuario.';
        this.errorMessage.set(msg);
      }
    });
  }

  public onGoToLogin(): void {
    this.switchToLogin.emit();
    this.router.navigate(['/login']);
  }
}

