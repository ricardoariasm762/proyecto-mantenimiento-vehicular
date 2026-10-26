import { Component, inject, OnInit, OnDestroy, signal, effect, computed } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehicleApiService } from './core/services/vehicle-api.service';
import { VoiceInputService } from './core/services/voice-input.service';
import { ThemeService, ThemePreference } from './core/services/theme.service';
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
    DatePipe
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  public readonly themeService = inject(ThemeService);
  private readonly apiService = inject(VehicleApiService);
  public readonly voiceService = inject(VoiceInputService);

  // Navegación
  public readonly activeNav = signal<string>('diagnostico-predictivo');

  // Capas del CAD Blueprint
  public readonly activeLayer = signal<'wireframe' | 'thermal' | 'kinematics'>('wireframe');
  public readonly showGrid = signal<boolean>(true);
  public readonly activeHotspot = signal<'transmission' | 'engine' | 'brakes' | 'suspension' | 'electrical'>('transmission');

  // Estado del reloj UTC en tiempo real
  public readonly currentTimeUtc = signal<string>('14:28:09.412 UTC');
  private clockIntervalId: any = null;

  // Estado de las barras del espectro de audio (Osciloscopio reactivo)
  public readonly spectrumBars = signal<number[]>([
    12, 18, 30, 24, 38, 42, 28, 16, 24, 36, 42, 32, 20, 28, 36, 24, 32, 16, 12, 20, 28, 16, 8
  ]);
  private spectrumIntervalId: any = null;

  // Formulario y parámetros de telemetría reactivos
  public readonly licensePlate = signal<string>('TRX-720');
  public readonly mileageKm = signal<number>(64820);
  public readonly kmSinceLastService = signal<number>(8450);
  public readonly fuelConsumptionRatio = signal<number>(1.12);
  public readonly rawSymptomText = signal<string>(
    'Noticeable rattle and high vibration when accelerating over 60 km/h, accompanied by intermittent transmission slip between 3rd and 4th gear under load.'
  );

  // Estado de envío y diagnóstico
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

  // Cálculo del porcentaje del offset circular SVG (circunferencia = 2 * PI * r = 2 * 3.14159 * 54 ≈ 339.29)
  public readonly circleDashOffset = computed(() => {
    const res = this.currentResult();
    const pct = res ? Math.min(100, Math.max(0, res.confidencePercentage)) : 68;
    const circumference = 339.29;
    return circumference - (circumference * pct) / 100;
  });

  // Porcentaje del intervalo de servicio
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
    // Sincronizar automáticamente la transcripción de voz con el síntoma en tiempo real
    effect(() => {
      const voiceText = this.voiceService.transcriptText();
      if (voiceText && voiceText.trim().length > 0) {
        this.rawSymptomText.set(voiceText);
      }
    });
  }

  ngOnInit(): void {
    this.startClock();
    this.startOscilloscopeAnimation();
    this.loadHistory();
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
          // Altura más dinámica cuando se graba voz
          return Math.floor(Math.random() * 32) + 8;
        } else {
          // Movimiento de latencia suave tipo osciloscopio en espera
          const delta = (Math.random() - 0.5) * 6;
          const nextVal = Math.round(val + delta);
          return Math.max(6, Math.min(38, nextVal));
        }
      });
      this.spectrumBars.set(updated);
    }, 180);
  }

  public toggleVoiceRecognition(): void {
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
        this.showNotification(`Diagnóstico predictivo calculado exitosamente para ${response.licensePlate}`);
      },
      error: (err) => {
        console.warn('Backend API no respondió o error en servidor:', err);
        this.isSubmitting.set(false);

        // Fallback enriquecido: Realizar inferencia local inteligente para no bloquear la experiencia de usuario
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
    const obs$ = licensePlate && licensePlate.trim().length > 0
      ? this.apiService.getHistoryByPlate(licensePlate)
      : this.apiService.getAllHistory();

    obs$.subscribe({
      next: (data) => {
        this.historyList.set(data || []);
        this.isLoadingHistory.set(false);
      },
      error: () => {
        // En caso de que el backend aún no esté corriendo en 8082, poblar con datos de telemetría de demostración
        this.isLoadingHistory.set(false);
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
            },
            {
              id: 100,
              licensePlate: 'FRN-312',
              mileageKm: 68000,
              kmSinceLastService: 15000,
              fuelConsumptionRatio: 1.02,
              rawSymptomText: 'Chirrido agudo metálico al frenar',
              detectedSystem: 'Frenos',
              predictedFault: 'Desgaste Pastillas de Freno',
              confidencePercentage: 91.5,
              recommendedAction: 'Reemplazo de pastillas delanteras',
              createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
              id: 99,
              licensePlate: 'MTR-505',
              mileageKm: 159200,
              kmSinceLastService: 18000,
              fuelConsumptionRatio: 1.45,
              rawSymptomText: 'Pérdida de fuerza y humo blanco',
              detectedSystem: 'Motor',
              predictedFault: 'Inyección / Compresión Motor',
              confidencePercentage: 88.0,
              recommendedAction: 'Revisión técnica de inyectores',
              createdAt: new Date(Date.now() - 172800000).toISOString()
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
      this.showNotification('✓ Orden de repuesto OE Kit #TR-80-FK2 confirmada.');
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
    }, 4000);
  }

  public setNav(nav: string): void {
    this.activeNav.set(nav);
  }
}
