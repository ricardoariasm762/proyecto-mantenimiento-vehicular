import { Component, computed, input, output } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { VehicleDiagnosisLog, VehicleDiagnosisResponse } from '../../core/models/vehicle-diagnostic.model';

@Component({
  selector: 'app-diagnostic-result',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe],
  templateUrl: './diagnostic-result.component.html',
  styleUrl: './diagnostic-result.component.css'
})
export class DiagnosticResultComponent {
  public readonly result = input<VehicleDiagnosisResponse | null>(null);
  public readonly historyList = input<VehicleDiagnosisLog[]>([]);
  public readonly isLoadingHistory = input<boolean>(false);

  public readonly queryHistory = output<string>();

  // Cálculo del offset SVG para el gráfico circular (circunferencia = 2 * PI * r = 2 * 3.14159 * 52 ≈ 326.7)
  public readonly circleDashOffset = computed(() => {
    const res = this.result();
    if (!res) return 327;
    const pct = Math.min(100, Math.max(0, res.confidencePercentage));
    return 327 - (327 * pct) / 100;
  });

  public getRiskBadgeClass(riskLevel: string | undefined): string {
    switch (riskLevel?.toUpperCase()) {
      case 'CRÍTICO':
        return 'risk-critical';
      case 'MEDIO':
        return 'risk-medium';
      case 'BAJO':
      default:
        return 'risk-low';
    }
  }

  public getSubsystemMeta(faultName: string | undefined) {
    const text = (faultName || '').toLowerCase();
    if (text.includes('transmisión') || text.includes('transmision')) {
      return {
        label: 'Transmisión & Embrague',
        badge: 'Caja / Clutch',
        color: '#3b82f6',
        icon: 'gear'
      };
    }
    if (text.includes('freno')) {
      return {
        label: 'Sistema de Frenos',
        badge: 'Pastillas / Discos',
        color: '#ef4444',
        icon: 'brake'
      };
    }
    if (text.includes('suspensión') || text.includes('suspension')) {
      return {
        label: 'Suspensión & Dirección',
        badge: 'Amortiguadores / Tren',
        color: '#8b5cf6',
        icon: 'suspension'
      };
    }
    if (text.includes('motor')) {
      return {
        label: 'Tren Motriz / Motor',
        badge: 'Combustión / Inyección',
        color: '#f59e0b',
        icon: 'engine'
      };
    }
    if (text.includes('eléctrico') || text.includes('electrico')) {
      return {
        label: 'Sistema Electro-Electrónico',
        badge: 'Batería / Alternador',
        color: '#eab308',
        icon: 'battery'
      };
    }
    return {
      label: 'Condición Operativa Normal',
      badge: 'Parámetros Seguros',
      color: '#10b981',
      icon: 'shield'
    };
  }

  public onRefreshHistory(): void {
    const currentPlate = this.result()?.licensePlate;
    if (currentPlate) {
      this.queryHistory.emit(currentPlate);
    }
  }
}
