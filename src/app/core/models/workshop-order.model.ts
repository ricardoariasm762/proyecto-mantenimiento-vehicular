export interface WorkshopOrder {
  id?: number;
  orderNumber: string;
  licensePlate: string;
  faultCategory: string;
  priority: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA' | string;
  status: 'EMITIDA' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA' | string;
  technicalNotes?: string;
  mechanicName?: string;
  createdAt?: string;
}

export interface CreateWorkshopOrderPayload {
  licensePlate: string;
  faultCategory: string;
  priority?: string;
  technicalNotes?: string;
}

