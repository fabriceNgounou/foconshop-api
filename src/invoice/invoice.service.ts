import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { invoiceHtmlTemplate } from './invoice.template';

@Injectable() // ✅ IMPORTANT
export class InvoiceService {
  async generateInvoicePdf(data: any): Promise<Buffer> {
    console.log('🚀 Lancement de Puppeteer...');
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Important pour Railway
      ],
    });
    
    try {
      const page = await browser.newPage();
      console.log('📝 Génération du HTML...');
      const html = invoiceHtmlTemplate(data);
      
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });
      
      console.log('📄 Génération du PDF...');
      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
      });
      
      const pdfBuffer = Buffer.from(pdfUint8Array);
      console.log(`✅ PDF généré (${pdfBuffer.length} bytes)`);
      
      return pdfBuffer;
    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      throw error;
    } finally {
      await browser.close();
      console.log('🔒 Puppeteer fermé');
    }
  }
}