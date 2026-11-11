import { TestBed } from '@angular/core/testing';
import { TelemetryPresetService } from './telemetry-preset.service';

describe('TelemetryPresetService', () => {
  let service: TelemetryPresetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TelemetryPresetService);
  });

  it('should return initial telemetry presets', () => {
    const presets = service.getPresets();
    expect(presets.length).toBeGreaterThanOrEqual(4);
  });

  it('should retrieve a preset by id', () => {
    const preset = service.getPresetById('transmission-slip');
    expect(preset).toBeDefined();
    expect(preset?.category).toBe('Transmisión');
  });
});
