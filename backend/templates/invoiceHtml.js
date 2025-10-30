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
    </head>
    <body style="font-family:Arial,Helvetica,sans-serif;color:#222;">
      <div style="max-width:800px;margin:0 auto;padding:20px;">
        <h1>Invoice</h1>
        <p><strong>Invoice:</strong> ${payload.invoice_number}</p>
        <p><strong>Date:</strong> ${payload.created_at || ''}</p>
        <p><strong>Order:</strong> ${payload.order_id || ''}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:12px">
          <thead>
            <tr>
              <th style="padding:8px;border:1px solid #ddd">#</th>
              <th style="padding:8px;border:1px solid #ddd">Description</th>
              <th style="padding:8px;border:1px solid #ddd">Qty</th>
              <th style="padding:8px;border:1px solid #ddd">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <h3 style="text-align:right">Total: ${payload.amount || '0.00'} ${payload.currency || 'USD'}</h3>
        <p>Payment method: ${payload.payment && payload.payment.provider || 'N/A'}</p>
        <p style="margin-top:30px">Thank you for your business.</p>
      </div>
    </body>
  </html>`;
};
