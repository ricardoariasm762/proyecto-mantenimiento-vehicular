import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WorkshopOrder, CreateWorkshopOrderPayload } from '../models/workshop-order.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkshopOrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl || 'http://localhost:8082';

  createOrder(payload: CreateWorkshopOrderPayload): Observable<WorkshopOrder> {
    return this.http.post<WorkshopOrder>(`${this.apiUrl}/api/workshop-orders`, payload);
  }

  getOrdersByPlate(plate: string): Observable<WorkshopOrder[]> {
    return this.http.get<WorkshopOrder[]>(`${this.apiUrl}/api/workshop-orders/plate/${plate}`);
  }

  getAllOrders(): Observable<WorkshopOrder[]> {
    return this.http.get<WorkshopOrder[]>(`${this.apiUrl}/api/workshop-orders`);
  }
}

