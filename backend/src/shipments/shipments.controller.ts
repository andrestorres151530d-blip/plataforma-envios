import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { ShipmentsService, ShipmentStatus } from './shipments.service';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  create(@Body() body: any) {
    this.validateCreatePayload(body);
    return this.shipmentsService.createShipment(body);
  }

  @Get()
  getAll() {
    return this.shipmentsService.getShipments();
  }

  @Get(':tracking')
  getOne(@Param('tracking') tracking: string) {
    return this.shipmentsService.getShipment(tracking);
  }

  @Patch(':tracking/status')
  updateStatus(
    @Param('tracking') tracking: string,
    @Body() body: { status?: ShipmentStatus; note?: string },
  ) {
    if (!body.status) {
      throw new BadRequestException('El estatus es obligatorio');
    }

    return this.shipmentsService.updateStatus(tracking, body.status, body.note);
  }

  private validateCreatePayload(body: any) {
    const requiredFields = ['sender', 'receiver', 'fromCity', 'toCity'];
    for (const field of requiredFields) {
      if (!body[field] || typeof body[field] !== 'string') {
        throw new BadRequestException(`El campo ${field} es obligatorio`);
      }
    }

    if (!body.weight || Number(body.weight) <= 0) {
      throw new BadRequestException('El peso debe ser mayor a 0');
    }

    if (!['Express', 'Estandar'].includes(body.serviceLevel)) {
      throw new BadRequestException(
        'El nivel de servicio debe ser Express o Estandar',
      );
    }

    body.weight = Number(body.weight);
  }
}

