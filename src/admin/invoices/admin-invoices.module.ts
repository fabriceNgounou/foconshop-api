import { Module } from '@nestjs/common';
import { AdminInvoicesController } from './admin-invoices.controller';
import { InvoiceModule } from '../../invoice/invoice.module';

@Module({
  imports: [InvoiceModule],
  controllers: [AdminInvoicesController],
})
export class AdminInvoicesModule {}