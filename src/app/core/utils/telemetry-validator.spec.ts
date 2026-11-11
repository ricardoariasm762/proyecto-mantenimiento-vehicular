import { validateLicensePlate, validateMileage, validateFuelDelta } from './telemetry-validator';

describe('TelemetryValidator', () => {
  it('should validate standard license plates', () => {
    expect(validateLicensePlate('ABC-123').isValid).toBeTrue();
    expect(validateLicensePlate('').isValid).toBeFalse();
    expect(validateLicensePlate('A').isValid).toBeFalse();
  });

  it('should validate vehicle mileage within range', () => {
    expect(validateMileage(45000).isValid).toBeTrue();
    expect(validateMileage(-5).isValid).toBeFalse();
    expect(validateMileage(2000000).isValid).toBeFalse();
  });

  it('should validate fuel delta percentage', () => {
    expect(validateFuelDelta(15).isValid).toBeTrue();
    expect(validateFuelDelta(-1).isValid).toBeFalse();
    expect(validateFuelDelta(105).isValid).toBeFalse();
  });
});
