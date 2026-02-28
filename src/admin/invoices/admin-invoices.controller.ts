import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { InvoiceQueriesService } from '../../invoice/invoice-queries.service';

@Controller('admin/invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminInvoicesController {
  constructor(private readonly invoiceQueriesService: InvoiceQueriesService) {}

  /**
   * Liste de TOUTES les factures
   * GET /admin/invoices
   */
  @Get()
  async getAllInvoices() {
    return this.invoiceQueriesService.findAllInvoices();
  }

  /**
   * Détail d'une facture par ID
   * GET /admin/invoices/:id
   */
  @Get(':id')
  async getInvoiceById(@Param('id', ParseIntPipe) invoiceId: number) {
    return this.invoiceQueriesService.findInvoiceById(invoiceId);
  }

  /**
   * Détail d'une facture par référence
   * GET /admin/invoices/reference/:reference
   */
  @Get('reference/:reference')
  async getInvoiceByReference(@Param('reference') reference: string) {
    return this.invoiceQueriesService.findInvoiceByReference(reference);
  }
}