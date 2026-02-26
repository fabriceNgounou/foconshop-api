import puppeteer from 'puppeteer';
import { invoiceHtmlTemplate } from './invoice.template';

export class InvoiceService {
  async generateInvoicePdf(data: any): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true, // ✅ compatible avec la version installée
    });

    try {
      const page = await browser.newPage();
      const html = invoiceHtmlTemplate(data);

      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
      });

      // ✅ conversion explicite Uint8Array → Buffer
      const pdfBuffer = Buffer.from(pdfUint8Array);

      return pdfBuffer;
    } finally {
      // ✅ garantit la fermeture même en cas d’erreur
      await browser.close();
    }
  }
}