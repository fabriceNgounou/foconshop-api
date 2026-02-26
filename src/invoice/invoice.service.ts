import puppeteer from 'puppeteer';
import { invoiceHtmlTemplate } from './invoice.template';

export class InvoiceService {
  async generateInvoicePdf(data: any): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: 'new',
    });

    const page = await browser.newPage();
    const html = invoiceHtmlTemplate(data);

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();
    return pdfBuffer;
  }
}