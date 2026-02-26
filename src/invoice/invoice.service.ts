import { FOCONSHOP_LOGO_BASE64 } from './logo.base64';
import { Injectable } from '@nestjs/common';
const PDFDocument = require('pdfkit');

@Injectable()
export class InvoiceService {
  async generateInvoicePdf(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🚀 Génération du PDF avec PDFKit...');
        
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        // Collecter les chunks du PDF
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          console.log(`✅ PDF généré (${pdfBuffer.length} bytes)`);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // ====== EN-TÊTE ======
        doc.fontSize(28)
          .fillColor('#f59e0b')
          .text('FACTURE', 50, 50);
        const logoBase64 = `data:image/jpeg;base64,${FOCONSHOP_LOGO_BASE64}`;
        doc.image(logoBase64, 50, 45, { width: 100 });

        doc.fontSize(10)
          .fillColor('#333333')
          .text('Foconshop', 450, 50, { align: 'right' })
          .text('125 Avenue de l\'Indépendance', 450, 65, { align: 'right' })
          .text('Akwa, Douala BP 4302', 450, 80, { align: 'right' })
          .text('Littoral, Cameroun', 450, 95, { align: 'right' })
          .text('Tax ID: RC/DLA/2021/B/1043', 450, 110, { align: 'right' });

        doc.moveTo(50, 140).lineTo(550, 140).stroke();

        // ====== INFORMATIONS FACTURE ======
        doc.fontSize(10)
          .fillColor('#333333')
          .text(`Référence : ${data.invoiceRef}`, 50, 160)
          .text(`Date : ${new Date(data.orderDate).toLocaleDateString('fr-FR')}`, 50, 175);

        // ====== INFORMATIONS CLIENT ======
        doc.fontSize(12)
          .fillColor('#1f2937')
          .text('Facturé à :', 50, 210);

        doc.fontSize(10)
          .fillColor('#333333')
          .text(data.customer.name, 50, 230)
          .text(data.customer.email, 50, 245)
          .text(data.customer.phone, 50, 260);

        // ====== TABLEAU DES PRODUITS ======
        const tableTop = 320;
        const itemCodeX = 50;
        const descriptionX = 150;
        const quantityX = 300;
        const priceX = 380;
        const amountX = 480;

        // En-tête du tableau
        doc.fontSize(10)
          .fillColor('#ffffff')
          .rect(50, tableTop, 500, 25)
          .fill('#3949ab');

        doc.fillColor('#ffffff')
          .text('Produit', descriptionX, tableTop + 8)
          .text('Qté', quantityX, tableTop + 8)
          .text('Prix unit.', priceX, tableTop + 8)
          .text('Total', amountX, tableTop + 8);

        // Lignes du tableau
        let position = tableTop + 35;
        data.items.forEach((item: any, index: number) => {
          const background = index % 2 === 0 ? '#f9fafb' : '#ffffff';
          doc.rect(50, position - 5, 500, 25).fill(background);

          doc.fillColor('#333333')
            .fontSize(9)
            .text(item.name, descriptionX, position, { width: 140 })
            .text(item.quantity.toString(), quantityX, position)
            .text(
              `${item.unitPrice.toLocaleString('fr-FR')} XAF`,
              priceX,
              position,
              { width: 90 }
            )
            .text(
              `${item.total.toLocaleString('fr-FR')} XAF`,
              amountX,
              position,
              { width: 70, align: 'right' }
            );

          position += 30;
        });

        // ====== TOTAUX ======
        const subtotalY = position + 20;
        doc.fontSize(10)
          .fillColor('#333333')
          .text('Sous-total :', 380, subtotalY)
          .text(
            `${data.subtotal.toLocaleString('fr-FR')} XAF`,
            480,
            subtotalY,
            { align: 'right' }
          );

        doc.text('TVA (19.25%) :', 380, subtotalY + 20)
          .text(
            `${data.tax.toLocaleString('fr-FR')} XAF`,
            480,
            subtotalY + 20,
            { align: 'right' }
          );

        doc.fontSize(12)
          .fillColor('#1f2937')
          .text('Total TTC :', 380, subtotalY + 45)
          .text(
            `${data.total.toLocaleString('fr-FR')} XAF`,
            480,
            subtotalY + 45,
            { align: 'right' }
          );

        // ====== PIED DE PAGE ======
        doc.fontSize(9)
          .fillColor('#6b7280')
          .text(
            'Merci pour votre confiance.',
            50,
            subtotalY + 100,
            { align: 'center', width: 500 }
          )
          .text(
            'Foconshop - www.foconshop.cm',
            50,
            subtotalY + 115,
            { align: 'center', width: 500 }
          )
          .text(
            'support@foconshop.cm - +237 690 28 98 92',
            50,
            subtotalY + 130,
            { align: 'center', width: 500 }
          );

        // Finaliser le PDF
        doc.end();
        
      } catch (error) {
        console.error('❌ Erreur génération PDF:', error);
        reject(error);
      }
    });
  }
}