import { Injectable } from '@nestjs/common';

export interface Shipment {
  tracking: string;
  sender: string;
  receiver: string;
  fromCity: string;
  toCity: string;
  weight: number;
  status: string;
  createdAt: Date;
}

@Injectable()
export class ShipmentsService {
  private shipments: Shipment[] = [];

  createShipment(data: {
    sender: string;
    receiver: string;
    fromCity: string;
    toCity: string;
    weight: number;
  }) {
    const tracking =
      'MX' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const shipment: Shipment = {
      tracking,
      sender: data.sender,
      receiver: data.receiver,
      fromCity: data.fromCity,
      toCity: data.toCity,
      weight: data.weight,
      status: 'CREADO',
      createdAt: new Date(),
    };

    this.shipments.push(shipment);

    return shipment;
  }

  getShipment(tracking: string) {
    const found = this.shipments.find((s) => s.tracking === tracking);
    if (!found) {
      return { error: 'Envío no encontrado' };
    }
    return found;
  }
}
