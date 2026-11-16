import { Component, inject, OnInit, OnDestroy, signal, effect, computed } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehicleApiService } from './core/services/vehicle-api.service';
import { VoiceInputService } from './core/services/voice-input.service';
import { ThemeService, ThemePreference } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import {
  VehicleDiagnosisLog,
  VehicleDiagnosisRequest,
  VehicleDiagnosisResponse
} from './core/models/vehicle-diagnostic.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    DatePipe,
    LoginComponent,
    RegisterComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  public readonly themeService = inject(ThemeService);
  private readonly apiService = inject(VehicleApiService);
  public readonly voiceService = inject(VoiceInputService);
  public readonly authService = inject(AuthService);

  // Navigation
  public readonly activeNav = signal<string>('diagnostico-predictivo');

  // Authentication modal state
  public readonly showAuthModal = signal<boolean>(false);
  public readonly authModalTab = signal<'login' | 'register'>('login');

  // CAD Blueprint layers
  public readonly activeLayer = signal<'wireframe' | 'thermal' | 'kinematics'>('wireframe');
  public readonly showGrid = signal<boolean>(true);
  public readonly activeHotspot = signal<'transmission' | 'engine' | 'brakes' | 'suspension' | 'electrical'>('transmission');

  // Real-time UTC clock state
  public readonly currentTimeUtc = signal<string>('14:28:09.412 UTC');
  private clockIntervalId: any = null;

  // Audio spectrum bars state (reactive oscilloscope)
  public readonly spectrumBars = signal<number[]>([
    12, 18, 30, 24, 38, 42, 28, 16, 24, 36, 42, 32, 20, 28, 36, 24, 32, 16, 12, 20, 28, 16, 8
  ]);
  private spectrumIntervalId: any = null;

  // Reactive telemetry parameters and form state
  public readonly licensePlate = signal<string>('TRX-720');
  public readonly mileageKm = signal<number>(64820);
  public readonly kmSinceLastService = signal<number>(8450);
  public readonly fuelConsumptionRatio = signal<number>(1.12);
  public readonly rawSymptomText = signal<string>(
    'Noticeable rattle and high vibration when accelerating over 60 km/h, accompanied by intermittent transmission slip between 3rd and 4th gear under load.'
  );

  // Workshop status and mechanical repair orders
  public readonly workshopOrders = signal<Array<{ id: string; plate: string; fault: string; date: string; status: string }>>([
    { id: 'OT-9841', plate: 'TRX-720', fault: 'Falla en Transmisión (Deslizamiento Convertidor)', date: '2026-11-11 12:40', status: 'EMITIDA' }
  ]);

  // Diagnosis and submission state
  public readonly isSubmitting = signal<boolean>(false);
  public readonly currentResult = signal<VehicleDiagnosisResponse | null>({
    licensePlate: 'TRX-720',
    primaryFault: 'Falla en Transmisión (Deslizamiento de Convertidor de Par)',
    confidencePercentage: 68.4,
    riskLevel: 'CRÍTICO',
    recommendedAction: 'Inspeccionar convertidor de par, solenoide de bloqueo TCC y realizar lavado/reemplazo de fluido hidráulico dentro de los próximos 400 km.',
    disclaimer: 'Herramienta orientativa de soporte basada en IA predictiva y telemetría CAN. No reemplaza la inspección física certificada por un técnico maestro.'
  });

  public readonly historyList = signal<VehicleDiagnosisLog[]>([]);
  public readonly isLoadingHistory = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly actionNotification = signal<string | null>(null);

  // SVG circular gauge dash offset calculation (circumference = 2 * PI * r = 2 * 3.14159 * 54 ≈ 339.29)
  public readonly circleDashOffset = computed(() => {
    const res = this.currentResult();
    const pct = res ? Math.min(100, Math.max(0, res.confidencePercentage)) : 68;
    const circumference = 339.29;
    return circumference - (circumference * pct) / 100;
  });

  // Service interval percentage
  public readonly servicePercent = computed(() => {
    return Math.min(100, Math.round((this.kmSinceLastService() / 10000) * 100));
  });

  // Porcentaje de millaje en la barra de escala
  public readonly mileagePercent = computed(() => {
    return Math.min(100, Math.max(5, (this.mileageKm() / 100000) * 100));
  });

  // Cálculo de variación porcentual de combustible respecto al óptimo (1.00)
  public readonly fuelDeltaDisplay = computed(() => {
    const diff = (this.fuelConsumptionRatio() - 1.0) * 100;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)}%`;
  });

  // Subtema actual inferido o seleccionado
  public readonly currentSubsystem = computed(() => {
    const fault = this.currentResult()?.primaryFault?.toLowerCase() || '';
    if (fault.includes('transmisi') || this.activeHotspot() === 'transmission') return 'TRANSMISSION (TR-80SD)';
    if (fault.includes('freno') || this.activeHotspot() === 'brakes') return 'BRAKING ASSEMBLY (FL/FR)';
    if (fault.includes('suspensi') || this.activeHotspot() === 'suspension') return 'SUSPENSION & DAMPING';
    if (fault.includes('motor') || this.activeHotspot() === 'engine') return 'TWIN-TURBO V8 ENGINE';
    if (fault.includes('eléctric') || this.activeHotspot() === 'electrical') return 'CAN-BUS / ELECTRICAL';
    return 'NOMINAL DRIVE SUBSYSTEM';
  });

  public readonly currentDtc = computed(() => {
    const fault = this.currentResult()?.primaryFault?.toLowerCase() || '';
    if (fault.includes('transmisi') || this.activeHotspot() === 'transmission') return 'P0741 [TORQUE CONVERTER]';
    if (fault.includes('freno') || this.activeHotspot() === 'brakes') return 'C1045 [ABS WHEEL SPEED / BRAKE WEAR]';
    if (fault.includes('suspensi') || this.activeHotspot() === 'suspension') return 'C1520 [ACTIVE DAMPER ACTUATOR]';
    if (fault.includes('motor') || this.activeHotspot() === 'engine') return 'P0299 [TURBO UNDERBOOST / PRESSURE]';
    if (fault.includes('eléctric') || this.activeHotspot() === 'electrical') return 'U0100 [CAN COMMUNICATION LOST]';
    return 'P0000 [NO FAULT DETECTED]';
  });

  constructor() {
    // Automatically synchronize voice transcript with raw symptom in real time
    effect(() => {
      const voiceText = this.voiceService.transcriptText();
      if (voiceText && voiceText.trim().length > 0) {
        this.rawSymptomText.set(voiceText);
      }
    });

    // Synchronize plate when user changes or authenticates
    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.defaultLicensePlate) {
        this.licensePlate.set(user.defaultLicensePlate);
      }
    });
  }

  ngOnInit(): void {
    this.startClock();
    this.startOscilloscopeAnimation();

    // If authenticated user is already present, initialize their assigned plate
    const user = this.authService.currentUser();
    if (user && user.defaultLicensePlate) {
      this.licensePlate.set(user.defaultLicensePlate);
    }

    this.loadHistory(this.licensePlate());
  }

  ngOnDestroy(): void {
    if (this.clockIntervalId) clearInterval(this.clockIntervalId);
    if (this.spectrumIntervalId) clearInterval(this.spectrumIntervalId);
  }

  private startClock(): void {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      const millis = String(now.getUTCMilliseconds()).padStart(3, '0');
      this.currentTimeUtc.set(`${hours}:${minutes}:${seconds}.${millis} UTC`);
    };
    updateTime();
    this.clockIntervalId = setInterval(updateTime, 95);
  }

  private startOscilloscopeAnimation(): void {
    this.spectrumIntervalId = setInterval(() => {
      const isListening = this.voiceService.isListening();
      const current = this.spectrumBars();
      const updated = current.map((val) => {
        if (isListening) {
          return Math.floor(Math.random() * 32) + 8;
        } else {
          const delta = (Math.random() - 0.5) * 6;
          const nextVal = Math.round(val + delta);
          return Math.max(6, Math.min(38, nextVal));
        }
      });
      this.spectrumBars.set(updated);
    }, 180);
  }

  public openAuthModal(tab: 'login' | 'register' = 'login'): void {
    this.authModalTab.set(tab);
    this.showAuthModal.set(true);
  }

  public closeAuthModal(): void {
    this.showAuthModal.set(false);
  }

  public onAuthSuccess(): void {
    this.showAuthModal.set(false);
    const user = this.authService.currentUser();
    if (user) {
      if (user.defaultLicensePlate) {
        this.licensePlate.set(user.defaultLicensePlate);
      }
      this.showNotification(`Sesión iniciada correctamente: ${user.fullName || user.email} [${user.role}]`);
      this.loadHistory(this.licensePlate());
    }
  }

  public logout(): void {
    const user = this.authService.currentUser();
    this.authService.logout();
    this.showNotification(`Sesión cerrada para ${user?.fullName || 'operador'}. Modo invitado activado.`);
    this.loadHistory(this.licensePlate());
  }

  public toggleVoiceRecognition(): void {
    // Si no está autenticado, sugerir login
    if (!this.authService.isAuthenticated()) {
      this.showNotification('Aviso: Inicie sesión como Conductor para asociar el dictado a su vehículo.');
    }

    // Restringir dictado a conductores según RBAC
    if (this.authService.isAuthenticated() && this.authService.isMechanic()) {
      this.showNotification('Modo Taller (Mecánico): El dictado por voz está optimizado para conductores en ruta.');
    }

    if (this.voiceService.isListening()) {
      this.voiceService.stopListening();
    } else {
      this.voiceService.startListening();
    }
  }

  public selectLayer(layer: 'wireframe' | 'thermal' | 'kinematics'): void {
    this.activeLayer.set(layer);
  }

  public toggleGrid(): void {
    this.showGrid.update(v => !v);
  }

  public selectHotspot(hotspot: 'transmission' | 'engine' | 'brakes' | 'suspension' | 'electrical'): void {
    this.activeHotspot.set(hotspot);
    this.loadPreset(
      hotspot === 'transmission' ? 'transmision' :
      hotspot === 'engine' ? 'motor' :
      hotspot === 'brakes' ? 'frenos' :
      hotspot === 'suspension' ? 'suspension' : 'electrico'
    );
  }

  public loadPreset(type: 'transmision' | 'frenos' | 'suspension' | 'motor' | 'electrico' | 'normal'): void {
    switch (type) {
      case 'transmision':
        this.licensePlate.set('TRX-720');
        this.mileageKm.set(64820);
        this.kmSinceLastService.set(8450);
        this.fuelConsumptionRatio.set(1.12);
        this.rawSymptomText.set('Noticeable rattle and high vibration when accelerating over 60 km/h, accompanied by intermittent transmission slip between 3rd and 4th gear under load.');
        this.activeHotspot.set('transmission');
        break;
      case 'frenos':
        this.licensePlate.set('FRN-312');
        this.mileageKm.set(68000);
        this.kmSinceLastService.set(15000);
        this.fuelConsumptionRatio.set(1.02);
        this.rawSymptomText.set('Chirrido metálico constante al frenar a media velocidad y ligera vibración esponjosa en el pedal.');
        this.activeHotspot.set('brakes');
        break;
      case 'suspension':
        this.licensePlate.set('SUS-890');
        this.mileageKm.set(92000);
        this.kmSinceLastService.set(7000);
        this.fuelConsumptionRatio.set(1.00);
        this.rawSymptomText.set('Golpeteo seco y holgura en el tren delantero al tomar curvas cerradas o transitar sobre resaltos.');
        this.activeHotspot.set('suspension');
        break;
      case 'motor':
        this.licensePlate.set('MTR-505');
        this.mileageKm.set(160000);
        this.kmSinceLastService.set(18500);
        this.fuelConsumptionRatio.set(1.48);
        this.rawSymptomText.set('Pérdida súbita de potencia al subir pendientes empinadas, humo blanco denso y temperatura elevada.');
        this.activeHotspot.set('engine');
        break;
      case 'electrico':
        this.licensePlate.set('ELC-109');
        this.mileageKm.set(48000);
        this.kmSinceLastService.set(4500);
        this.fuelConsumptionRatio.set(1.00);
        this.rawSymptomText.set('Testigo de batería parpadea intermitente en el tablero y caída de voltaje en sensores CAN.');
        this.activeHotspot.set('electrical');
        break;
      case 'normal':
        this.licensePlate.set('OKV-200');
        this.mileageKm.set(28000);
        this.kmSinceLastService.set(2500);
        this.fuelConsumptionRatio.set(0.98);
        this.rawSymptomText.set('Parámetros nominales en telemetría de crucero, sin ruidos anómalos ni vibraciones extrañas.');
        this.activeHotspot.set('transmission');
        break;
    }
  }

  public onDiagnosticSubmit(): void {
    if (this.isSubmitting()) return;

    if (!this.licensePlate().trim()) {
      alert('Por favor ingrese la placa del vehículo.');
      return;
    }

    if (!this.rawSymptomText().trim()) {
      alert('Por favor describa el síntoma manualmente o mediante voz.');
      return;
    }

    // Si no está autenticado, sugerir login para registrar quién reportó la falla
    if (!this.authService.isAuthenticated()) {
      this.openAuthModal('login');
      this.showNotification('Acceso requerido: Inicie sesión para persistir el diagnóstico con su identidad.');
      return;
    }

    if (this.voiceService.isListening()) {
      this.voiceService.stopListening();
    }

    const payload: VehicleDiagnosisRequest = {
      licensePlate: this.licensePlate().toUpperCase().trim(),
      mileageKm: Number(this.mileageKm()),
      kmSinceLastService: Number(this.kmSinceLastService()),
      fuelConsumptionRatio: Number(this.fuelConsumptionRatio()),
      rawSymptomText: this.rawSymptomText().trim()
    };

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.apiService.diagnose(payload).subscribe({
      next: (response) => {
        this.currentResult.set(response);
        this.isSubmitting.set(false);
        this.loadHistory(response.licensePlate);
        this.showNotification(`✓ Diagnóstico predictivo registrado en PostgreSQL para ${response.licensePlate}`);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err.status === 403) {
          const detail = err.error?.message || 'Los conductores solo pueden diagnosticar sus vehículos asignados.';
          this.errorMessage.set(`Acceso Denegado (RBAC): ${detail}`);
          return;
        }

        console.warn('Backend API did not respond or server error:', err);
        // Contingent local fallback if backend is offline
        const localInference = this.generateLocalFallback(payload);
        this.currentResult.set(localInference);

        const detail = err.error?.message || err.statusText || 'Backend no disponible en http://localhost:8082';
        this.errorMessage.set(`Aviso: Se calculó inferencia en modo contingencia (${detail}).`);
        this.showNotification(`Diagnóstico local calculado para ${payload.licensePlate}`);
      }
    });
  }

  private generateLocalFallback(req: VehicleDiagnosisRequest): VehicleDiagnosisResponse {
    const text = req.rawSymptomText.toLowerCase();
    if (text.includes('transmisi') || text.includes('caja') || text.includes('slip') || text.includes('cambio')) {
      return {
        licensePlate: req.licensePlate,
        primaryFault: 'Falla en Transmisión (Deslizamiento de Convertidor de Par)',
        confidencePercentage: 88.5,
        riskLevel: 'CRÍTICO',
        recommendedAction: 'Programar inspección de convertidor de par y lavado de fluido dentro de 400 km.',
        disclaimer: 'Herramienta de diagnóstico predictivo basada en IA. No sustituye la inspección de un taller certificado.'
      };
    } else if (text.includes('freno') || text.includes('chirrido') || text.includes('pedal')) {
      return {
        licensePlate: req.licensePlate,
        primaryFault: 'Desgaste Severo de Pastillas de Freno Delanteras',
        confidencePercentage: 92.1,
        riskLevel: 'CRÍTICO',
        recommendedAction: 'Reemplazo inmediato de pastillas y rectificado de discos de freno delanteros.',
        disclaimer: 'Herramienta de diagnóstico predictivo basada en IA. No sustituye la inspección de un taller certificado.'
      };
    } else if (text.includes('suspensi') || text.includes('golp') || text.includes('bache')) {
      return {
        licensePlate: req.licensePlate,
        primaryFault: 'Holgura en Terminales de Dirección y Amortiguador',
        confidencePercentage: 85.0,
        riskLevel: 'MEDIO',
        recommendedAction: 'Alinear tren delantero y verificar topes de amortiguador.',
        disclaimer: 'Herramienta de diagnóstico predictivo basada en IA. No sustituye la inspección de un taller certificado.'
      };
    } else if (text.includes('motor') || text.includes('humo') || text.includes('fuerza')) {
      return {
        licensePlate: req.licensePlate,
        primaryFault: 'Falla de Compresión en Cilindro / Inyección de Combustible',
        confidencePercentage: 89.4,
        riskLevel: 'CRÍTICO',
        recommendedAction: 'Escanear sensores de inyección y revisar presión en rampa de combustible.',
        disclaimer: 'Herramienta de diagnóstico predictivo basada en IA. No sustituye la inspección de un taller certificado.'
      };
    } else if (text.includes('bater') || text.includes('eléctric') || text.includes('luces') || text.includes('voltaje')) {
      return {
        licensePlate: req.licensePlate,
        primaryFault: 'Caída de Tensión y Falla en Alternador / Regulador',
        confidencePercentage: 87.2,
        riskLevel: 'MEDIO',
        recommendedAction: 'Comprobar voltaje de carga del alternador y bornes de batería.',
        disclaimer: 'Herramienta de diagnóstico predictivo basada en IA. No sustituye la inspección de un taller certificado.'
      };
    } else {
      return {
        licensePlate: req.licensePlate,
        primaryFault: 'Condición Operativa Normal / Monitoreo Preventivo',
        confidencePercentage: 94.6,
        riskLevel: 'BAJO',
        recommendedAction: 'Continuar con el programa de mantenimiento regular de rutina.',
        disclaimer: 'Herramienta de diagnóstico predictivo basada en IA. No sustituye la inspección de un taller certificado.'
      };
    }
  }

  public loadHistory(licensePlate?: string): void {
    this.isLoadingHistory.set(true);

    // If mechanic and no plate specified, query entire global history
    const isMech = this.authService.isMechanic();
    const plate = licensePlate && licensePlate.trim().length > 0 ? licensePlate.trim() : (isMech ? '' : this.licensePlate());

    const obs$ = plate.length > 0
      ? this.apiService.getHistoryByPlate(plate)
      : this.apiService.getAllHistory();

    obs$.subscribe({
      next: (data) => {
        this.historyList.set(data || []);
        this.isLoadingHistory.set(false);
      },
      error: (err) => {
        this.isLoadingHistory.set(false);
        if (err.status === 403) {
          const detail = err.error?.message || 'Acceso restringido: no tiene permisos para ver el historial de esta placa.';
          this.errorMessage.set(`Acceso Denegado (RBAC): ${detail}`);
          this.historyList.set([]);
          return;
        }

        // Local fallback data for visualization
        if (this.historyList().length === 0) {
          this.historyList.set([
            {
              id: 101,
              licensePlate: 'TRX-720',
              mileageKm: 64820,
              kmSinceLastService: 8450,
              fuelConsumptionRatio: 1.12,
              rawSymptomText: 'Noticeable rattle and high vibration when accelerating over 60 km/h',
              detectedSystem: 'Transmisión',
              predictedFault: 'Falla en Transmisión (P0741)',
              confidencePercentage: 68.4,
              recommendedAction: 'Inspeccionar convertidor de par dentro de 400 km',
              createdAt: new Date().toISOString()
            }
          ]);
        }
      }
    });
  }

  public handlePrescriptiveAction(action: 'schedule' | 'order' | 'selfTest'): void {
    if (action === 'schedule') {
      this.showNotification('✓ Cita de servicio mecánico registrada en el sistema de telemetría.');
    } else if (action === 'order') {
      const orderId = `OT-${Math.floor(1000 + Math.random() * 9000)}`;
      const fault = this.currentResult()?.primaryFault || 'Mantenimiento Correctivo';
      const plate = this.licensePlate();
      const date = new Date().toISOString().replace('T', ' ').substring(0, 16);

      this.workshopOrders.update(orders => [
        { id: orderId, plate, fault, date, status: 'CONFIRMADA' },
        ...orders
      ]);

      this.showNotification(`✓ Orden de Taller #${orderId} emitida exitosamente para vehículo ${plate}.`);
    } else if (action === 'selfTest') {
      this.showNotification('✓ Auto-diagnóstico OBD-II iniciado: Ciclo de aprendizaje CAN restablecido.');
    }
  }

  public showNotification(msg: string): void {
    this.actionNotification.set(msg);
    setTimeout(() => {
      if (this.actionNotification() === msg) {
        this.actionNotification.set(null);
      }
    }, 4500);
  }

  public setNav(nav: string): void {
    this.activeNav.set(nav);
    if (nav === 'historial-de-fallas-obd-ii') {
      this.loadHistory(this.authService.isMechanic() ? '' : this.licensePlate());
    }
  }
}
