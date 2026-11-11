import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  VehicleDiagnosisLog,
  VehicleDiagnosisRequest,
  VehicleDiagnosisResponse
} from '../models/vehicle-diagnostic.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VehicleApiService {
  private readonly http = inject(HttpClient);

  public get apiUrl(): string {
    return localStorage.getItem('veloce_custom_api_url') || environment.apiUrl;
  }

  private get baseUrl(): string {
    return `${this.apiUrl}/api/vehicles`;
  }

  public diagnose(request: VehicleDiagnosisRequest): Observable<VehicleDiagnosisResponse> {
    return this.http.post<VehicleDiagnosisResponse>(`${this.baseUrl}/diagnose`, request);
  }

  public getHistoryByPlate(licensePlate: string): Observable<VehicleDiagnosisLog[]> {
    return this.http.get<VehicleDiagnosisLog[]>(`${this.baseUrl}/history/${encodeURIComponent(licensePlate)}`);
  }

  public getAllHistory(): Observable<VehicleDiagnosisLog[]> {
    return this.http.get<VehicleDiagnosisLog[]>(`${this.baseUrl}/history`);
  }

  public getMyVehicles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/my-vehicles`);
  }

  public registerVehicle(vehicle: { licensePlate: string; brand?: string; model?: string; modelYear?: number; baseMileageKm?: number }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/register-vehicle`, vehicle);
  }
}
