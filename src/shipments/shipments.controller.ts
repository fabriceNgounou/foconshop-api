import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShipmentsService } from './shipments.service';

@Controller('shipments')
@UseGuards(JwtAuthGuard)
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  /**
   * GET /shipments/:orderId
   * Suivi de livraison pour le client
   */
  @Get(':orderId')
  getShipment(@Param('orderId') orderId: string, @Req() req: any) {
    return this.shipmentsService.getShipmentByOrder(
      Number(orderId),
      req.user.sub,
    );
  }

  /**
   * Patch /shipments/:orderId
   * Marquer une commande comme expédiée et notifier le client
   */
  @Patch(':orderId')
  shipOrder(@Param('orderId') orderId: string) {
    return this.shipmentsService.shipOrder(
      Number(orderId)
    );
  }
}
