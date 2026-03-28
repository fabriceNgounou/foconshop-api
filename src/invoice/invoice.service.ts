// src/invoice/invoice.service.ts
import { Injectable } from '@nestjs/common';
import { FOCONSHOP_LOGO_BASE64 } from './logo.base64';
const PDFDocument = require('pdfkit');

@Injectable()
export class InvoiceService {
  // ✅ Formatage avec gestion des valeurs undefined/null
  private formatAmount(amount: number | undefined | null): string {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '0';
    }
    return amount.toLocaleString('en-US');
  }

  async generateInvoicePdf(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margin: 40, 
          bufferPages: true 
        });
        
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // ========== LOGO ==========
        try {
          const logoBuffer = Buffer.from(FOCONSHOP_LOGO_BASE64, 'base64');
          doc.image(logoBuffer, 40, 40, { width: 120 });
        } catch (error) {
          console.warn('⚠️ Impossible de charger le logo');
        }

        // ========== EN-TÊTE ==========
        doc.fontSize(32)
          .fillColor('#FF8C00')
          .font('Helvetica-Bold')
          .text('Invoice', 400, 50, { align: 'right' });

        doc.fontSize(11)
          .fillColor('#666666')
          .font('Helvetica')
          .text(`#${data.invoiceRef}`, 400, 90, { align: 'right' });

        // ========== INFORMATIONS SOCIÉTÉ ==========
        const yCompany = 120;
        doc.fontSize(9)
          .fillColor('#333')
          .font('Helvetica-Bold')
          .text('Foconshop', 340, yCompany)
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#666')
          .text('125 Avenue de l\'Indépendance', 340, yCompany + 15)
          .text('Akwa, Douala BP 4302', 340, yCompany + 28)
          .text('Littoral, Cameroun', 340, yCompany + 41)
          .text('Tax ID: RC/DLA/2021/B/1043', 340, yCompany + 54);

        // ========== DATE & RÉFÉRENCE ==========
        const yInfo = 120;
        doc.fontSize(9)
          .fillColor('#666')
          .font('Helvetica')
          .text('Date issued:', 40, yInfo)
          .fillColor('#333')
          .font('Helvetica-Bold')
          .text(
            new Date(data.orderDate).toLocaleDateString('en-US', { 
              month: 'short', 
              day: '2-digit', 
              year: 'numeric' 
            }), 
            110, 
            yInfo
          );

        doc.fontSize(9)
          .fillColor('#666')
          .font('Helvetica')
          .text('Order ID:', 40, yInfo + 18)
          .fillColor('#333')
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

        // ========== PAYMENT DETAILS ==========
        const yPayment = 220;
        doc.fontSize(10)
          .fillColor('#333333')
          .font('Helvetica-Bold')
          .text('Payment Details', 340, yPayment);

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

        // ========== TABLEAU PRODUITS ==========
        const tableTop = 360;
        
        doc.fillColor('#F8F9FA')
          .rect(40, tableTop, 515, 28)
          .fill();
        
        doc.fontSize(9)
          .fillColor('#333')
          .font('Helvetica-Bold')
          .text('Description', 50, tableTop + 10)
          .text('Qty', 330, tableTop + 10, { width: 30, align: 'center' })
          .text('Unit Price', 380, tableTop + 10, { width: 70, align: 'right' })
          .text('Total', 470, tableTop + 10, { width: 75, align: 'right' });

        let yPosition = tableTop + 38;
        
        data.items.forEach((item: any, index: number) => {
          if (index > 0) {
            doc.strokeColor('#E0E0E0')
              .lineWidth(0.5)
              .moveTo(40, yPosition - 5)
              .lineTo(555, yPosition - 5)
              .stroke();
          }

          doc.fontSize(9)
            .fillColor('#333')
            .font('Helvetica')
            .text(item.name, 50, yPosition, { width: 260 })
            .text(item.quantity.toString(), 330, yPosition, { width: 30, align: 'center' })
            .text(
              `${this.formatAmount(item.unitPrice)} XAF`, 
              380, 
              yPosition, 
              { width: 70, align: 'right' }
            )
            .text(
              `${this.formatAmount(item.total)} XAF`, 
              470, 
              yPosition, 
              { width: 75, align: 'right' }
            );

          // ✅ PROMOTION
          if (item.promotionApplied && item.originalUnitPrice) {
            yPosition += 14;
            const strikeY = yPosition - 3;
            
            doc.fontSize(7)
              .fillColor('#999')
              .font('Helvetica')
              .text(
                `Was: ${this.formatAmount(item.originalUnitPrice)} XAF`, 
                380, 
                yPosition, 
                { width: 70, align: 'right' }
              );
            
            doc.strokeColor('#999')
              .lineWidth(0.5)
              .moveTo(395, strikeY)
              .lineTo(440, strikeY)
              .stroke();

            doc.rect(50, yPosition - 2, 85, 11)
              .fillAndStroke('#28A745', '#28A745');
            
            doc.fontSize(7)
              .fillColor('#FFF')
              .font('Helvetica-Bold')
              .text('🎉 Promo applied', 52, yPosition + 1, { width: 81 });
          }

          yPosition += 30;
        });

        doc.strokeColor('#E0E0E0')
          .lineWidth(1)
          .moveTo(40, yPosition + 5)
          .lineTo(555, yPosition + 5)
          .stroke();

        // ========== TOTAUX ==========
        const yTotals = yPosition + 25;

        // ✅ Subtotal
        doc.fontSize(9)
          .fillColor('#666')
          .font('Helvetica')
          .text('Subtotal:', 380, yTotals, { width: 90, align: 'left' })
          .fillColor('#333')
          .text(
            `${this.formatAmount(data.subtotal)} XAF`, 
            470, 
            yTotals, 
            { width: 75, align: 'right' }
          );

        // ✅ Delivery Fee (avec valeur par défaut si undefined)
        const deliveryFee = data.deliveryFee || 0;
        doc.fillColor('#666')
          .text('Shipping (Express):', 380, yTotals + 18, { width: 90, align: 'left' })
          .fillColor('#333')
          .text(
            `${this.formatAmount(deliveryFee)} XAF`, 
            470, 
            yTotals + 18, 
            { width: 75, align: 'right' }
          );

        doc.strokeColor('#E0E0E0')
          .lineWidth(0.5)
          .moveTo(380, yTotals + 36)
          .lineTo(555, yTotals + 36)
          .stroke();

        // ✅ Total Paid
        const totalAmount = data.totalAmount || (data.subtotal + deliveryFee);
        doc.fontSize(11)
          .fillColor('#333')
          .font('Helvetica-Bold')
          .text('Total Paid', 380, yTotals + 46, { width: 90, align: 'left' })
          .fontSize(14)
          .text(
            `${this.formatAmount(totalAmount)} XAF`, 
            450, 
            yTotals + 44, 
            { width: 95, align: 'right' }
          );

        // ========== LOYALTY BENEFITS ==========
        const yLoyalty = yTotals + 100;
        doc.fontSize(8)
          .fillColor('#666')
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
          .fillColor('#333')
          .font('Helvetica-Bold')
          .text('Thank you for shopping at Foconshop!', 40, footerY, { 
            align: 'center', 
            width: 515 
          });

        doc.fontSize(8)
          .fillColor('#999')
          .font('Helvetica')
          .text('We value your business and hope to see you again soon', 40, footerY + 20, { 
            align: 'center', 
            width: 515 
          });

        const contactsY = footerY + 45;
        doc.fontSize(8)
          .fillColor('#666')
          .text('🌐', 100, contactsY)
          .text('www.foconshop.cm', 115, contactsY)
          .text('✉', 245, contactsY)
          .text('support@foconshop.cm', 260, contactsY)
          .text('📞', 395, contactsY)
          .text('+237 690 28 98 92', 410, contactsY);

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