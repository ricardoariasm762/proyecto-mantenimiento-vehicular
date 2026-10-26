import {
  Component,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoiceInputService } from '../../core/services/voice-input.service';
import { VehicleDiagnosisRequest } from '../../core/models/vehicle-diagnostic.model';

@Component({
  selector: 'app-diagnostic-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diagnostic-form.component.html',
  styleUrl: './diagnostic-form.component.css'
})
export class DiagnosticFormComponent {
  public readonly voiceService = inject(VoiceInputService);

  public readonly isSubmitting = input<boolean>(false);
  public readonly submitRequest = output<VehicleDiagnosisRequest>();

  // Campos reactivos del formulario
  public licensePlate = signal<string>('PLK-482');
  public mileageKm = signal<number>(120000);
  public kmSinceLastService = signal<number>(14000);
  public fuelConsumptionRatio = signal<number>(1.15);
  public rawSymptomText = signal<string>('El carro empezó a vibrar de manera notoria cuando acelero en autopista');

  constructor() {
    // Sincronizar automáticamente la transcripción de voz con el síntoma en tiempo real
    effect(() => {
      const voiceText = this.voiceService.transcriptText();
      if (voiceText && voiceText.trim().length > 0) {
        this.rawSymptomText.set(voiceText);
      }
    });
  }

  public toggleVoiceRecognition(): void {
    if (this.voiceService.isListening()) {
      this.voiceService.stopListening();
    } else {
      this.voiceService.startListening();
    }
  }

  public onSubmit(): void {
    if (this.isSubmitting()) return;

    if (!this.licensePlate().trim()) {
      alert('Por favor ingrese la placa del vehículo.');
      return;
    }

    if (!this.rawSymptomText().trim()) {
      alert('Por favor describa el síntoma manualmente o mediante voz.');
      return;
    }

    // Detener la escucha si aún está activa al enviar
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

    this.submitRequest.emit(payload);
  }

  public loadPreset(type: 'transmision' | 'frenos' | 'suspension' | 'motor' | 'electrico' | 'normal'): void {
    switch (type) {
      case 'transmision':
        this.licensePlate.set('TRX-720');
        this.mileageKm.set(135000);
        this.kmSinceLastService.set(14500);
        this.fuelConsumptionRatio.set(1.12);
        this.rawSymptomText.set('El carro empezó a vibrar fuerte en la caja de cambios cuando acelero en tercera.');
        break;
      case 'frenos':
        this.licensePlate.set('FRN-312');
        this.mileageKm.set(68000);
        this.kmSinceLastService.set(15000);
        this.fuelConsumptionRatio.set(1.02);
        this.rawSymptomText.set('Escucho un chirrido agudo metálico al frenar y el pedal se siente algo esponjoso.');
        break;
      case 'suspension':
        this.licensePlate.set('SUS-890');
        this.mileageKm.set(92000);
        this.kmSinceLastService.set(7000);
        this.fuelConsumptionRatio.set(1.00);
        this.rawSymptomText.set('Se siente un golpe seco y golpeteo en la dirección cada vez que paso por baches.');
        break;
      case 'motor':
        this.licensePlate.set('MTR-505');
        this.mileageKm.set(160000);
        this.kmSinceLastService.set(18500);
        this.fuelConsumptionRatio.set(1.48);
        this.rawSymptomText.set('El motor pierde fuerza al subir, bota humo blanco y el consumo de combustible se disparó.');
        break;
      case 'electrico':
        this.licensePlate.set('ELC-109');
        this.mileageKm.set(48000);
        this.kmSinceLastService.set(4500);
        this.fuelConsumptionRatio.set(1.00);
        this.rawSymptomText.set('El testigo de batería parpadea en el tablero y las luces bajan de intensidad.');
        break;
      case 'normal':
        this.licensePlate.set('OKV-200');
        this.mileageKm.set(28000);
        this.kmSinceLastService.set(2500);
        this.fuelConsumptionRatio.set(0.98);
        this.rawSymptomText.set('Vehículo funciona suavemente, solo se percibe el andar común en carretera.');
        break;
    }
  }
}
