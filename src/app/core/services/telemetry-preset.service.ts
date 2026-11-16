import { Injectable } from '@angular/core';
import { TelemetryPreset } from '../models/telemetry-preset.model';

@Injectable({
  providedIn: 'root'
})
export class TelemetryPresetService {
  private readonly presets: TelemetryPreset[] = [
    {
      id: 'transmission-slip',
      label: 'Falla Transmisión (Patinamiento)',
      category: 'Transmisión',
      symptoms: 'El vehículo patina al meter segunda marcha y revoluciona sin avanzar con fuerza en subidas.',
      mileage: 85000,
      fuelDelta: 18
    },
    {
      id: 'brake-friction',
      label: 'Fricción en Frenos (Chillido)',
      category: 'Frenos',
      symptoms: 'Chillido metálico agudo al accionar el pedal de freno a baja velocidad y vibración leve en la dirección.',
      mileage: 42000,
      fuelDelta: 6
    },
    {
      id: 'engine-misfire',
      label: 'Fallo de Encendido Motor',
      category: 'Motor',
      symptoms: 'Tirones intermitentes en ralentí, pérdida momentánea de potencia y olor a combustible no quemado en el escape.',
      mileage: 112000,
      fuelDelta: 25
    },
    {
      id: 'suspension-clunk',
      label: 'Golpeteo en Suspensión',
      category: 'Suspensión',
      symptoms: 'Ruido sordo de golpeteo en el eje delantero al pasar por reductores de velocidad o baches en el pavimento.',
      mileage: 68000,
      fuelDelta: 12
    }
  ];

  getPresets(): TelemetryPreset[] {
    return [...this.presets];
  }

  getPresetById(id: string): TelemetryPreset | undefined {
    return this.presets.find(p => p.id === id);
  }
}

