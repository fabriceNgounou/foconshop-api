import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceQueriesService } from './invoice-queries.service';
import { InvoicesController } from './invoices.controller';
import { VendorInvoicesController } from './vendor-invoices.controller';

@Module({
  providers: [InvoiceService, InvoiceQueriesService],
  controllers: [InvoicesController, VendorInvoicesController],
  exports: [InvoiceService, InvoiceQueriesService],
})
export class InvoiceModule {}