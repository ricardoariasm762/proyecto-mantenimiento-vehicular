/**
 * Industrial Blueprint Telemetry Validation Utilities
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export function validateLicensePlate(plate: string): ValidationResult {
  if (!plate || plate.trim().length === 0) {
    return { isValid: false, message: 'La placa es obligatoria' };
  }
  const clean = plate.trim().toUpperCase();
  if (clean.length < 5 || clean.length > 10) {
    return { isValid: false, message: 'La placa debe tener entre 5 y 10 caracteres' };
  }
  return { isValid: true };
}

export function validateMileage(mileage: number): ValidationResult {
  if (mileage < 0) {
    return { isValid: false, message: 'El kilometraje no puede ser negativo' };
  }
  if (mileage > 1500000) {
    return { isValid: false, message: 'El kilometraje excede el límite operativo realista (1,500,000 km)' };
  }
  return { isValid: true };
}

export function validateFuelDelta(fuelDelta: number): ValidationResult {
  if (fuelDelta < 0 || fuelDelta > 100) {
    return { isValid: false, message: 'El delta de combustible debe oscilar entre 0% y 100%' };
  }
  return { isValid: true };
}

