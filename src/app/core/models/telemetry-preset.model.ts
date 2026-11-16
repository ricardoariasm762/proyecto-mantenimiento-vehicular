export interface TelemetryPreset {
  id: string;
  label: string;
  category: 'Transmisión' | 'Frenos' | 'Motor' | 'Suspensión' | string;
  symptoms: string;
  mileage: number;
  fuelDelta: number;
}

