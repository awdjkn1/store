const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');

async function generate(order, user) {
  const invoicesDir = path.join(__dirname, '..', 'backend', 'public', 'uploads', 'invoices');
  try { fs.mkdirSync(invoicesDir, { recursive: true }); } catch (e) {}

  const invoiceId = order.id || `inv-${uuidv4()}`;
  const filename = `invoice-${invoiceId}.pdf`;
  const filepath = path.join(invoicesDir, filename);

  const doc = new PDFDocument({ margin: 40 });
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  doc.fontSize(20).text(`Invoice: ${invoiceId}`, { align: 'left' });
  doc.moveDown();
  doc.fontSize(12).text(`To: ${user.username || 'Customer'} <${user.email || ''}>`);
  doc.text(`Date: ${new Date().toLocaleString()}`);
  doc.moveDown();

  doc.fontSize(14).text('Order Details');
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`Product: ${order.product_name || order.product_id || ''}`);
  doc.text(`Product ID: ${order.product_id || '-'}`);
  doc.text(`Unit Price: $${Number(order.unit_price || (order.total_price && order.quantity ? (Number(order.total_price)/Number(order.quantity)).toFixed(2) : '0.00')).toFixed(2)}`);
  doc.text(`Quantity: ${order.quantity || 1}`);
  doc.text(`Total: $${order.total_price || (order.payment_amount || '0.00')}`);

  doc.moveDown();
  doc.fontSize(14).text('Payment Details');
  doc.fontSize(12);
  doc.text(`Provider: ${order.payment_provider || 'N/A'}`);
  doc.text(`Transaction ID: ${order.payment_transaction_id || 'N/A'}`);
  doc.text(`Payment Status: ${order.payment_status || 'N/A'}`);
  doc.text(`Amount: $${order.payment_amount || order.total_price || '0.00'}`);

  doc.moveDown();
  doc.fontSize(14).text('Shipping');
  doc.fontSize(12);
  doc.text(order.shipping_address || '-');

  doc.moveDown();
  doc.fontSize(14).text('Confirmation');
  doc.fontSize(12);
  doc.text(`Order ID: ${order.id || invoiceId}`);
  doc.text(`Status: ${order.status || 'N/A'}`);
  doc.text(`Placed: ${order.created_at || new Date().toISOString()}`);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filepath));
    stream.on('error', (err) => reject(err));
  });
}

(async () => {
  const fakeOrder = {
    id: uuidv4(),
    product_id: 'fake-product-001',
    product_name: 'Fake LEGO Set 12345',
    quantity: 1,
    unit_price: 29.99,
    total_price: '29.99',
    payment_provider: 'fakepay',
    payment_transaction_id: `txn-${Date.now()}`,
    payment_status: 'paid',
    payment_amount: '29.99',
    shipping_address: '221B Baker Street, London, UK',
    status: 'paid',
    created_at: new Date().toISOString()
  };

  const fakeUser = { id: uuidv4(), username: 'tester', email: 'tester@example.com' };

  try {
    const fp = await generate(fakeOrder, fakeUser);
    console.log('Generated invoice at:', fp);
  } catch (e) {
    console.error('Failed to generate invoice:', e);
    process.exit(1);
  }
})();
