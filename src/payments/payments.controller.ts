import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { InitPaymentDto } from './dto/init-payment.dto';
import { WebhookDto } from './dto/webhook.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * INIT PAYMENT
   */
  @UseGuards(JwtAuthGuard)
  @Post('init')
  init(@Req() req: any, @Body() dto: InitPaymentDto) {
    return this.paymentsService.initPayment(req.user.sub, dto);
  }

  /**
   * WEBHOOK SIMULÉ (pas protégé volontairement)
   */
  @Post('webhook')
  webhook(@Body() dto: WebhookDto) {
    return this.paymentsService.handleWebhook(dto.reference, dto.status);
  }
}
