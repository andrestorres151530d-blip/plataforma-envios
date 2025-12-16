import { Injectable, NotFoundException } from '@nestjs/common';

export type ShipmentStatus =
  | 'CREADO'
  | 'EN_RECOLECCION'
  | 'EN_RUTA'
  | 'EN_ADUANA'
  | 'ENTREGADO'
  | 'INCIDENCIA';

export interface ShipmentHistoryEntry {
  status: ShipmentStatus;
  note: string;
  at: string;
}

export interface Shipment {
  tracking: string;
  sender: string;
  receiver: string;
  fromCity: string;
  toCity: string;
  weight: number;
  serviceLevel: 'Express' | 'Estandar';
  status: ShipmentStatus;
  price: number;
  createdAt: string;
  estimatedDelivery: string;
  history: ShipmentHistoryEntry[];
}

type CreateShipmentInput = {
  sender: string;
  receiver: string;
  fromCity: string;
  toCity: string;
  weight: number;
  serviceLevel: 'Express' | 'Estandar';
};

@Injectable()
export class ShipmentsService {
  private shipments: Shipment[] = [];

  constructor() {
    this.seedShipments();
  }

  createShipment(data: CreateShipmentInput): Shipment {
    const shipment = this.buildShipment(data);
    this.shipments.unshift(shipment);
    return shipment;
  }

  getShipments(): Shipment[] {
    return this.shipments;
  }

  getShipment(tracking: string): Shipment {
    const found = this.shipments.find((s) => s.tracking === tracking);
    if (!found) {
      throw new NotFoundException('Envío no encontrado');
    }
    return found;
  }

  updateStatus(
    tracking: string,
    status: ShipmentStatus,
    note?: string,
  ): Shipment {
    const shipment = this.getShipment(tracking);
    const description =
      note || this.statusDescriptions[status] || 'Estatus actualizado';

    const now = new Date();
    shipment.status = status;
    shipment.history.unshift({
      status,
      note: description,
      at: now.toISOString(),
    });

    return shipment;
  }

  private readonly statusDescriptions: Record<ShipmentStatus, string> = {
    CREADO: 'Solicitud recibida y registrada',
    EN_RECOLECCION: 'La unidad va en camino a recolectar el paquete',
    EN_RUTA: 'El envío está avanzando hacia su destino',
    EN_ADUANA: 'El paquete está siendo validado en aduana',
    ENTREGADO: 'Entrega confirmada con éxito',
    INCIDENCIA: 'Se detectó una incidencia en ruta',
  };

  private buildShipment(
    data: CreateShipmentInput & {
      status?: ShipmentStatus;
      createdAt?: Date;
      history?: ShipmentHistoryEntry[];
      estimatedDeliveryDays?: number;
      priceOverride?: number;
    },
  ): Shipment {
    const tracking =
      data.status === 'ENTREGADO'
        ? `MX-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
        : 'MX' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const createdAt = data.createdAt ?? new Date();
    const estimatedDelivery = new Date(createdAt);
    estimatedDelivery.setDate(
      estimatedDelivery.getDate() + (data.estimatedDeliveryDays ?? 4),
    );

    const initialHistory =
      data.history ??
      [
        {
          status: data.status ?? 'CREADO',
          note: this.statusDescriptions[data.status ?? 'CREADO'],
          at: createdAt.toISOString(),
        },
      ];

    const priceBase = 120 + data.weight * 40;
    const multiplier = data.serviceLevel === 'Express' ? 1.25 : 1;
    const price = data.priceOverride ?? Math.round(priceBase * multiplier);

    return {
      tracking,
      sender: data.sender,
      receiver: data.receiver,
      fromCity: data.fromCity,
      toCity: data.toCity,
      weight: data.weight,
      serviceLevel: data.serviceLevel,
      status: data.status ?? 'CREADO',
      price,
      createdAt: createdAt.toISOString(),
      estimatedDelivery: estimatedDelivery.toISOString(),
      history: initialHistory,
    };
  }

  private seedShipments() {
    const now = new Date();

    this.shipments = [
      this.buildShipment({
        sender: 'Moda Huasteca',
        receiver: 'Boutique Loma Linda',
        fromCity: 'Monterrey',
        toCity: 'Ciudad de México',
        weight: 6.5,
        serviceLevel: 'Express',
        status: 'EN_RUTA',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 18),
        history: [
          {
            status: 'EN_RUTA',
            note: 'Ruta directa al centro de distribución CDMX',
            at: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
          },
          {
            status: 'EN_RECOLECCION',
            note: 'Paquete cargado en unidad nocturna',
            at: new Date(now.getTime() - 1000 * 60 * 60 * 10).toISOString(),
          },
          {
            status: 'CREADO',
            note: 'Solicitud registrada',
            at: new Date(now.getTime() - 1000 * 60 * 60 * 18).toISOString(),
          },
        ],
      }),
      this.buildShipment({
        sender: 'ElectroNova',
        receiver: 'Hotel Turquesa',
        fromCity: 'Guadalajara',
        toCity: 'Cancún',
        weight: 3.2,
        serviceLevel: 'Express',
        status: 'EN_ADUANA',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 36),
        estimatedDeliveryDays: 2,
        history: [
          {
            status: 'EN_ADUANA',
            note: 'Validación de contenido premium',
            at: new Date(now.getTime() - 1000 * 60 * 60 * 1).toISOString(),
          },
          {
            status: 'EN_RUTA',
            note: 'Salida del centro metropolitano GDL',
            at: new Date(now.getTime() - 1000 * 60 * 60 * 14).toISOString(),
          },
          {
            status: 'CREADO',
            note: 'Orden creada en el portal',
            at: new Date(now.getTime() - 1000 * 60 * 60 * 36).toISOString(),
          },
        ],
      }),
      this.buildShipment({
        sender: 'Fresh Farms',
        receiver: 'Restaurante Casa Norte',
        fromCity: 'Querétaro',
        toCity: 'San Luis Potosí',
        weight: 1.4,
        serviceLevel: 'Estandar',
        status: 'ENTREGADO',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 72),
        estimatedDeliveryDays: 3,
        history: [
          {
            status: 'ENTREGADO',
            note: 'Recepción confirmada en mostrador',
            at: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(),
          },
          {
            status: 'EN_RUTA',
            note: 'Unidad con temperatura controlada',
            at: new Date(now.getTime() - 1000 * 60 * 60 * 30).toISOString(),
          },
          {
            status: 'CREADO',
            note: 'Orden generada desde panel',
            at: new Date(now.getTime() - 1000 * 60 * 60 * 72).toISOString(),
          },
        ],
      }),
    ];
  }
}
