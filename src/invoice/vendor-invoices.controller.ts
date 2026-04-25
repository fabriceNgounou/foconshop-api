import { Controller, Get, Req, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { InvoiceQueriesService } from './invoice-queries.service';

@Controller('vendor/invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VENDOR')
export class VendorInvoicesController {
  constructor(private readonly invoiceQueriesService: InvoiceQueriesService) {}

  /**
   * Liste des factures du vendeur
   * GET /vendor/invoices
   */
  @Get()
  async getVendorInvoices(@Req() req: any) {
    const vendorId = req.user.vendorId;
    
    if (!vendorId) {
      return {
        message: 'Vendeur non trouvé ou non approuvé',
        invoices: [],
      };
    }

    return this.invoiceQueriesService.findInvoicesForVendor(vendorId);
  }

  /**
   * Détail d'une facture spécifique
   * GET /vendor/invoices/:id
   */
  @Get(':id')
  async getInvoiceById(
    @Req() req: any,
    @Param('id', ParseIntPipe) invoiceId: number
  ) {
    const vendorId = req.user.vendorId;
    const invoice = await this.invoiceQueriesService.findInvoiceById(invoiceId);

    // Vérifier que la facture contient au moins un produit du vendeur
    const hasVendorProduct = invoice.order.items.some(
      (item) => item.variant.product.vendorId === vendorId
    );

    if (!hasVendorProduct) {
      throw new Error('Vous n\'avez pas accès à cette facture');
    }

    return invoice;
  }
}