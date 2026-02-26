import { Injectable } from '@nestjs/common';
import { FOCONSHOP_LOGO_BASE64 } from './logo.base64';
const PDFDocument = require('pdfkit');

@Injectable()
export class InvoiceService {
  async generateInvoicePdf(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🚀 Génération du PDF avec PDFKit...');
        
        const doc = new PDFDocument({ 
          size: 'A4', 
          margin: 40,
          bufferPages: true
        });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          console.log(`✅ PDF généré (${pdfBuffer.length} bytes)`);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // ========== EN-TÊTE ==========
        // Logo à gauche
        try {
          const logoBuffer = Buffer.from(FOCONSHOP_LOGO_BASE64, 'base64');
          doc.image(logoBuffer, 40, 40, { width: 120 });
        } catch (error) {
          console.warn('⚠️ Impossible de charger le logo');
        }

        // "Invoice" en orange à droite
        doc.fontSize(32)
          .fillColor('#FF8C00')
          .font('Helvetica-Bold')
          .text('Invoice', 400, 50, { align: 'right' });

        // Numéro de facture
        doc.fontSize(11)
          .fillColor('#666666')
          .font('Helvetica')
          .text(`#${data.invoiceRef}`, 400, 90, { align: 'right' });

        // ========== INFORMATIONS FOCONSHOP (à droite) ==========
        const yCompany = 120;
        doc.fontSize(9)
          .fillColor('#333333')
          .font('Helvetica-Bold')
          .text('Foconshop', 340, yCompany)
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#666666')
          .text('125 Avenue de l\'Indépendance', 340, yCompany + 15)
          .text('Akwa, Douala BP 4302', 340, yCompany + 28)
          .text('Littoral, Cameroun', 340, yCompany + 41)
          .text('Tax ID: RC/DLA/2021/B/1043', 340, yCompany + 54);

        // ========== DATE ET RÉFÉRENCE (à gauche) ==========
        const yInfo = 120;
        doc.fontSize(9)
          .fillColor('#666666')
          .font('Helvetica')
          .text('Date issued:', 40, yInfo)
          .fillColor('#333333')
          .font('Helvetica-Bold')
          .text(new Date(data.orderDate).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
          }), 110, yInfo);

        doc.fontSize(9)
          .fillColor('#666666')
          .font('Helvetica')
          .text('Order ID:', 40, yInfo + 18)
          .fillColor('#333333')
          .font('Helvetica-Bold')
          .text(data.invoiceRef.replace('INV-', 'ORD-'), 110, yInfo + 18);

        // ========== LIGNE DE SÉPARATION ==========
        doc.strokeColor('#E0E0E0')
          .lineWidth(1)
          .moveTo(40, 200)
          .lineTo(555, 200)
          .stroke();

        // ========== BILL TO ==========
        const yBillTo = 220;
        doc.fontSize(10)
          .fillColor('#333333')
          .font('Helvetica-Bold')
          .text('Bill To', 40, yBillTo);

        doc.fontSize(10)
          .fillColor('#333333')
          .font('Helvetica-Bold')
          .text(data.customer.name, 40, yBillTo + 20)
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#666666')
          .text(data.customer.email || 'N/A', 40, yBillTo + 35)
          .text(data.customer.phone || 'N/A', 40, yBillTo + 48);

        // ========== PAYMENT DETAILS (à droite) ==========
        const yPayment = 220;
        doc.fontSize(10)
          .fillColor('#333333')
          .font('Helvetica-Bold')
          .text('Payment Details', 340, yPayment);

        // Badge MTN Mobile Money
        doc.roundedRect(340, yPayment + 18, 100, 24, 4)
          .fillAndStroke('#FFCC00', '#FFCC00');
        
        doc.fontSize(9)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text('MTN', 350, yPayment + 24);

        doc.fontSize(8)
          .fillColor('#333333')
          .font('Helvetica')
          .text('MTN Mobile Money', 340, yPayment + 48)
          .text('Transaction: MTN-20261026', 340, yPayment + 61);

        // Badge Status
        doc.roundedRect(340, yPayment + 80, 90, 22, 11)
          .fillAndStroke('#D4EDDA', '#28A745');
        
        doc.fontSize(8)
          .fillColor('#155724')
          .font('Helvetica-Bold')
          .text('✓ Completed', 348, yPayment + 85);

        doc.fontSize(7)
          .fillColor('#666666')
          .font('Helvetica')
          .text('Authorized on Oct 26, 14:32 WAT', 340, yPayment + 105);

        // ========== TABLEAU DES PRODUITS ==========
        const tableTop = 360;

        // En-tête du tableau
        doc.fillColor('#F8F9FA')
          .rect(40, tableTop, 515, 28)
          .fill();

        doc.fontSize(9)
          .fillColor('#333333')
          .font('Helvetica-Bold')
          .text('Description', 50, tableTop + 10)
          .text('Qty', 330, tableTop + 10, { width: 30, align: 'center' })
          .text('Unit Price', 380, tableTop + 10, { width: 70, align: 'right' })
          .text('Total', 470, tableTop + 10, { width: 75, align: 'right' });

        // Lignes des produits
        let yPosition = tableTop + 38;
        data.items.forEach((item: any, index: number) => {
          // Ligne de séparation
          if (index > 0) {
            doc.strokeColor('#E0E0E0')
              .lineWidth(0.5)
              .moveTo(40, yPosition - 5)
              .lineTo(555, yPosition - 5)
              .stroke();
          }

          // Nom du produit
          doc.fontSize(9)
            .fillColor('#333333')
            .font('Helvetica')
            .text(item.name, 50, yPosition, { width: 260 });

          // Quantité
          doc.text(item.quantity.toString(), 330, yPosition, { 
            width: 30, 
            align: 'center' 
          });

          // Prix unitaire
          doc.text(
            `${item.unitPrice.toLocaleString('fr-FR')} XAF`,
            380,
            yPosition,
            { width: 70, align: 'right' }
          );

          // Total
          doc.text(
            `${item.total.toLocaleString('fr-FR')} XAF`,
            470,
            yPosition,
            { width: 75, align: 'right' }
          );

          yPosition += 30;
        });

        // Ligne de séparation finale
        doc.strokeColor('#E0E0E0')
          .lineWidth(1)
          .moveTo(40, yPosition + 5)
          .lineTo(555, yPosition + 5)
          .stroke();

        // ========== TOTAUX ==========
        const yTotals = yPosition + 25;

        // Sous-total
        doc.fontSize(9)
          .fillColor('#666666')
          .font('Helvetica')
          .text('Subtotal:', 380, yTotals, { width: 90, align: 'left' })
          .fillColor('#333333')
          .text(
            `${data.subtotal.toLocaleString('fr-FR')} XAF`,
            470,
            yTotals,
            { width: 75, align: 'right' }
          );

        // Frais de livraison
        doc.fillColor('#666666')
          .text('Shipping (Express):', 380, yTotals + 18, { width: 90, align: 'left' })
          .fillColor('#333333')
          .text('1,500 XAF', 470, yTotals + 18, { width: 75, align: 'right' });

        // TVA
        doc.fillColor('#666666')
          .text('Tax (TVA 19.25%):', 380, yTotals + 36, { width: 90, align: 'left' })
          .fillColor('#333333')
          .text(
            `${Math.round(data.tax).toLocaleString('fr-FR')} XAF`,
            470,
            yTotals + 36,
            { width: 75, align: 'right' }
          );

        // Ligne de séparation
        doc.strokeColor('#E0E0E0')
          .lineWidth(0.5)
          .moveTo(380, yTotals + 52)
          .lineTo(555, yTotals + 52)
          .stroke();

        // Total TTC
        doc.fontSize(11)
          .fillColor('#333333')
          .font('Helvetica-Bold')
          .text('Total Paid', 380, yTotals + 62, { width: 90, align: 'left' })
          .fontSize(14)
          .text(
            `${Math.round(data.total + 1500).toLocaleString('fr-FR')} XAF`,
            450,
            yTotals + 60,
            { width: 95, align: 'right' }
          );

        // ========== LOYALTY BENEFITS ==========
        const yLoyalty = yTotals + 100;
        doc.fontSize(8)
          .fillColor('#666666')
          .font('Helvetica-Bold')
          .text('🎁 Loyalty Benefits', 40, yLoyalty);

        doc.fontSize(7)
          .font('Helvetica')
          .text('You earned 650 FoconPoints from this purchase.', 40, yLoyalty + 15)
          .text('2,000 points were redeemed for a discount on this order.', 40, yLoyalty + 28);

        // ========== PIED DE PAGE ==========
        const pageHeight = doc.page.height;
        const footerY = pageHeight - 100;

        doc.fontSize(14)
          .fillColor('#333333')
          .font('Helvetica-Bold')
          .text('Thank you for shopping at Foconshop!', 40, footerY, { 
            align: 'center', 
            width: 515 
          });

        doc.fontSize(8)
          .fillColor('#999999')
          .font('Helvetica')
          .text('We value your business and hope to see you again soon', 40, footerY + 20, { 
            align: 'center', 
            width: 515 
          });

        // Contacts
        const contactsY = footerY + 45;
        doc.fontSize(8)
          .fillColor('#666666')
          .text('🌐', 100, contactsY)
          .text('www.foconshop.cm', 115, contactsY)
          .text('✉', 245, contactsY)
          .text('support@foconshop.cm', 260, contactsY)
          .text('📞', 395, contactsY)
          .text('+237 690 28 98 92', 410, contactsY);

        // Note finale
        doc.fontSize(7)
          .fillColor('#CCCCCC')
          .text('Need help with this order? Contact our support team', 40, contactsY + 25, {
            align: 'center',
            width: 515
          });

        doc.end();
        
      } catch (error) {
        console.error('❌ Erreur génération PDF:', error);
        reject(error);
      }
    });
  }
}