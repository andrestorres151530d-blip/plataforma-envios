import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  create(@Body() body: any) {
    // body debe traer: sender, receiver, fromCity, toCity, weight
    return this.shipmentsService.createShipment(body);
  }

  @Get(':tracking')
  getOne(@Param('tracking') tracking: string) {
    return this.shipmentsService.getShipment(tracking);
  }
}

