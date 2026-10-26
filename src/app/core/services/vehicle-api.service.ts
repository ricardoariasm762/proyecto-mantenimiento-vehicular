import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  VehicleDiagnosisLog,
  VehicleDiagnosisRequest,
  VehicleDiagnosisResponse
} from '../models/vehicle-diagnostic.model';

@Injectable({
  providedIn: 'root'
})
export class VehicleApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8082/api/vehicles';

  public diagnose(request: VehicleDiagnosisRequest): Observable<VehicleDiagnosisResponse> {
    return this.http.post<VehicleDiagnosisResponse>(`${this.baseUrl}/diagnose`, request);
  }

  public getHistoryByPlate(licensePlate: string): Observable<VehicleDiagnosisLog[]> {
    return this.http.get<VehicleDiagnosisLog[]>(`${this.baseUrl}/history/${encodeURIComponent(licensePlate)}`);
  }

  public getAllHistory(): Observable<VehicleDiagnosisLog[]> {
    return this.http.get<VehicleDiagnosisLog[]>(`${this.baseUrl}/history`);
  }
}
