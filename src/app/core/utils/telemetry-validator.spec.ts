import { validateLicensePlate, validateMileage, validateFuelDelta } from './telemetry-validator';

describe('TelemetryValidator', () => {
  it('should validate standard license plates', () => {
    expect(validateLicensePlate('ABC-123').isValid).toBe(true);
    expect(validateLicensePlate('').isValid).toBe(false);
    expect(validateLicensePlate('A').isValid).toBe(false);
  });

  it('should validate vehicle mileage within range', () => {
    expect(validateMileage(45000).isValid).toBe(true);
    expect(validateMileage(-5).isValid).toBe(false);
    expect(validateMileage(2000000).isValid).toBe(false);
  });

  it('should validate fuel delta percentage', () => {
    expect(validateFuelDelta(15).isValid).toBe(true);
    expect(validateFuelDelta(-1).isValid).toBe(false);
    expect(validateFuelDelta(105).isValid).toBe(false);
  });
});
