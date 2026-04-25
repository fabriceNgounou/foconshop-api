import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvoiceQueriesService } from './invoice-queries.service';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoiceQueriesService: InvoiceQueriesService) {}

  /**
   * Mes factures (utilisateur connecté)
   * GET /invoices/me
   */
  @Get('me')
  async getMyInvoices(@Req() req: any) {
    const userId = req.user.sub;
    return this.invoiceQueriesService.findInvoicesForUser(userId);
  }
}