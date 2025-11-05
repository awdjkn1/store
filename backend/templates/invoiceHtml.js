module.exports = function renderInvoiceHtml(payload) {
  const itemsHtml = (payload.items || []).map((it, idx) => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd">${idx + 1}</td>
      <td style="padding:8px;border:1px solid #ddd">${it.name || it.product_name || 'Item'}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right">${it.quantity || 1}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:right">${it.price || it.unit_price || '0.00'}</td>
    </tr>`).join('');

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Invoice ${payload.invoice_number}</title>
      <!-- Poppins font: clients may ignore external fonts; fallback stack is provided in inline styles -->
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Poppins', Arial, Helvetica, sans-serif; background-color: #F0FAF9; color: #0D3B3A; }
        .container { max-width:800px; margin:0 auto; padding:20px; }
        table { width:100%; border-collapse:collapse; margin-top:12px; }
        th, td { padding:8px; border:1px solid #e6efea; }
        h1 { color: #36FBC1; margin-bottom: 6px; }
        .total { text-align:right; font-weight:700; color:#072B29; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Invoice</h1>
        <p><strong>Invoice:</strong> ${payload.invoice_number}</p>
        <p><strong>Date:</strong> ${payload.created_at || ''}</p>
        <p><strong>Order:</strong> ${payload.order_id || ''}</p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <h3 class="total">Total: ${payload.amount || '0.00'} ${payload.currency || 'USD'}</h3>
        <p>Payment method: ${payload.payment && payload.payment.provider || 'N/A'}</p>
        <p style="margin-top:30px">Thank you for your business.</p>
      </div>
    </body>
  </html>`;
};
