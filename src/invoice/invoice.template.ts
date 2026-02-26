import { FOCONSHOP_LOGO_BASE64 } from './logo.base64';

export function invoiceHtmlTemplate(data: {
  invoiceRef: string;
  orderDate: Date;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
}) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Facture ${data.invoiceRef}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #333;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 40px;
    }

    .logo {
      max-height: 80px;
    }

    h1 {
      color: #f59e0b;
      margin: 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }

    th {
      background: #f3f4f6;
    }

    .right {
      text-align: right;
    }

    .total {
      font-size: 18px;
      font-weight: bold;
    }

    .footer {
      margin-top: 40px;
      font-size: 14px;
      color: #555;
    }
  </style>
</head>
<body>

  <!-- EN-TÊTE AVEC LOGO -->
  <div class="header">
    <img
      src="data:image/jpeg;base64,${FOCONSHOP_LOGO_BASE64}"
      alt="Foconshop"
      class="logo"
    />
    <h1>Facture</h1>
  </div>

  <p><strong>Référence :</strong> ${data.invoiceRef}</p>
  <p><strong>Date :</strong> ${data.orderDate.toLocaleDateString('fr-FR')}</p>

  <h3>Client</h3>
  <p>
    ${data.customer.name}<br/>
    ${data.customer.email}<br/>
    ${data.customer.phone}
  </p>

  <table>
    <thead>
      <tr>
        <th>Produit</th>
        <th>Qté</th>
        <th>Prix unitaire</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${data.items.map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td class="right">${item.unitPrice.toLocaleString('fr-FR')} XAF</td>
          <td class="right">${item.total.toLocaleString('fr-FR')} XAF</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <p class="right">Sous-total : ${data.subtotal.toLocaleString('fr-FR')} XAF</p>
  <p class="right">TVA : ${data.tax.toLocaleString('fr-FR')} XAF</p>
  <p class="right total">Total : ${data.total.toLocaleString('fr-FR')} XAF</p>

  <div class="footer">
    <p>Merci pour votre confiance.</p>
    <p><strong>Foconshop</strong></p>
  </div>

</body>
</html>
`;
}