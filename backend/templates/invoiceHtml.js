module.exports = function renderInvoiceHtml(payload) {
  const itemsHtml = (payload.items || []).map((it, idx) => `
    <tr>
      <td style="padding:0.5rem;border:0625rem solid #ddd">${idx + 1}</td>
      <td style="padding:0.5rem;border:0625rem solid #ddd">${it.name || it.product_name || 'Item'}</td>
      <td style="padding:0.5rem;border:0625rem solid #ddd;text-align:right">${it.quantity || 1}</td>
      <td style="padding:0.5rem;border:0625rem solid #ddd;text-align:right">${it.price || it.unit_price || '0.00'}</td>
    </tr>`).join('');

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Invoice ${payload.invoice_number}</title>
    </head>
    <body style="font-family:'Poppins',sans-serif;color:#F7ECDE;background-color:#3A104E;margin:0;padding:1.25rem;">
      <div style="max-width:50rem;margin:0 auto;padding:1.25rem;background:transparent;">
        <h1 style="color:#E0BBE4;margin-top:0">Invoice</h1>
        <p style="color:#F7ECDE"><strong>Invoice:</strong> ${payload.invoice_number}</p>
        <p style="color:#F7ECDE"><strong>Date:</strong> ${payload.created_at || ''}</p>
        <p style="color:#F7ECDE"><strong>Order:</strong> ${payload.order_id || ''}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:0.75rem">
          <thead>
            <tr>
              <th style="padding:0.5rem;border:0625rem solid #260A35">#</th>
              <th style="padding:0.5rem;border:0625rem solid #260A35">Description</th>
              <th style="padding:0.5rem;border:0625rem solid #260A35">Qty</th>
              <th style="padding:0.5rem;border:0625rem solid #260A35">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <h3 style="text-align:right;color:#E0BBE4">Total: ${payload.amount || '0.00'} ${payload.currency || 'USD'}</h3>
        <p style="color:#F7ECDE">Payment method: ${payload.payment && payload.payment.provider || 'N/A'}</p>
        <p style="margin-top:1.875rem;color:#F7ECDE">Thank you for your business.</p>
      </div>
    </body>
  </html>`;
};
