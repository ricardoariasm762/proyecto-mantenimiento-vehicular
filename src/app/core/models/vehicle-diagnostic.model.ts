export interface VehicleDiagnosisRequest {
  licensePlate: string;
  mileageKm: number;
  kmSinceLastService: number;
  fuelConsumptionRatio: number;
  rawSymptomText: string;
}

export interface VehicleDiagnosisResponse {
  licensePlate: string;
  primaryFault: string;
  confidencePercentage: number;
  riskLevel: 'BAJO' | 'MEDIO' | 'CRÍTICO' | string;
  recommendedAction: string;
  disclaimer: string;
}

export interface VehicleDiagnosisLog {
  id?: number;
  licensePlate: string;
  mileageKm: number;
  kmSinceLastService: number;
  fuelConsumptionRatio: number;
  rawSymptomText: string;
  detectedSystem: string;
  predictedFault: string;
  confidencePercentage: number;
  recommendedAction: string;
  createdAt: string;
}
