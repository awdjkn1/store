const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const axios = require('axios');
const supabase = require('../utils/supabaseRest');
const { encryptToByteaHex, decryptFromByteaHex } = require('../utils/cryptoUtils');
const renderInvoiceHtml = require('../templates/invoiceHtml');

const INVOICE_UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'invoices');
if (!fs.existsSync(INVOICE_UPLOAD_DIR)) fs.mkdirSync(INVOICE_UPLOAD_DIR, { recursive: true });

async function createInvoiceForOrder(order, payment) {
  // Build canonical invoice payload
  const invoiceNumber = `inv-${order.id || order.order_id || Date.now()}`;
  const payload = {
    invoice_number: invoiceNumber,
    order_id: order.id || order.order_id || null,
    user_id: order.user_id || null,
    items: order.items || [],
    amount: order.total || order.amount || 0,
    currency: order.currency || 'USD',
    payment: payment || { provider: null, transaction_id: null, status: 'pending' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Encrypt content and store in invoices table
  const contentHex = encryptToByteaHex(payload);
  const insert = {
    invoice_number: invoiceNumber,
    order_id: payload.order_id,
    user_id: payload.user_id,
    amount: payload.amount,
    currency: payload.currency,
    payment_provider: payload.payment.provider,
    status: payload.payment.status || 'pending',
    content: contentHex,
    created_at: payload.created_at,
    updated_at: payload.updated_at
  };

  const res = await supabase.insert('invoices', insert);
  // generate PDF and save to uploads for download/delivery
  const pdfPath = await generateInvoicePdf(payload);

  return { db: res, payload, pdfPath };
}

function generateInvoicePdf(invoicePayload) {
  return new Promise((resolve, reject) => {
    try {
      const filename = `${invoicePayload.invoice_number}.pdf`;
      const outPath = path.join(INVOICE_UPLOAD_DIR, filename);
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(outPath);
      doc.pipe(stream);

      // Simple invoice layout
      doc.fontSize(20).text('Invoice', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Invoice: ${invoicePayload.invoice_number}`);
      doc.text(`Date: ${invoicePayload.created_at}`);
      doc.text(`Order: ${invoicePayload.order_id || 'N/A'}`);
      doc.text(`Payment Provider: ${invoicePayload.payment && invoicePayload.payment.provider || 'N/A'}`);
      doc.moveDown();

      doc.text('Items:', { underline: true });
      invoicePayload.items.forEach((it, idx) => {
        doc.text(`${idx + 1}. ${it.name || it.product_name || 'item'} — ${it.quantity || 1} × ${it.price || it.unit_price || '0.00'}`);
      });
      doc.moveDown();
      doc.text(`Total: ${invoicePayload.amount} ${invoicePayload.currency}`);
      doc.moveDown();
      doc.text('Thank you for your business.');

      doc.end();
      stream.on('finish', () => resolve(`/uploads/invoices/${filename}`));
      stream.on('error', reject);
    } catch (e) {
      reject(e);
    }
  });
}

async function deliverInvoice(invoiceIdOrNumber, options = {}) {
  // options: { method: 'email'|'download', to }
  // Fetch invoice row
  let where = {};
  if (String(invoiceIdOrNumber).startsWith('inv-')) where.invoice_number = `eq.${invoiceIdOrNumber}`;
  else where.id = `eq.${invoiceIdOrNumber}`;
  const rows = await supabase.select('invoices', { select: 'id,invoice_number,user_id,content,created_at', ...where });
  if (!rows || rows.length === 0) throw new Error('Invoice not found');
  const inv = rows[0];
  // decrypt content
  let contentPlain = null;
  try {
    contentPlain = decryptFromByteaHex(inv.content || inv.content_hex || inv.content);
  } catch (e) {
    // if decryption fails assume content is plaintext hex or JSON
    try {
      const hex = (inv.content || '').replace(/^\\x/, '');
      const buf = Buffer.from(hex, 'hex');
      contentPlain = buf.toString('utf8');
    } catch (err) {
      contentPlain = null;
    }
  }
  let payload = null;
  try { payload = contentPlain ? JSON.parse(contentPlain) : null; } catch (e) { payload = null; }

  // Find PDF path on disk
  const pdfPath = path.join(INVOICE_UPLOAD_DIR, `${inv.invoice_number}.pdf`);
  const pdfUrl = fs.existsSync(pdfPath) ? `/uploads/invoices/${inv.invoice_number}.pdf` : null;

  if (options.method === 'email' && options.to) {
    // attempt SendGrid if configured
    const sendgridKey = process.env.SENDGRID_API_KEY;
    const from = process.env.FROM_EMAIL || 'no-reply@example.com';
    const to = options.to;
    const subject = `Invoice ${inv.invoice_number}`;
    const html = renderInvoiceHtml(payload || { invoice_number: inv.invoice_number, amount: inv.amount });
    if (sendgridKey) {
      const body = {
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from },
        subject,
        content: [{ type: 'text/html', value: html }]
      };
      try {
        await axios.post('https://api.sendgrid.com/v3/mail/send', body, { headers: { Authorization: `Bearer ${sendgridKey}`, 'Content-Type': 'application/json' } });
        return { delivered: true, method: 'sendgrid' };
      } catch (e) {
        console.warn('SendGrid send failed, falling back to disk delivery', e && e.message);
      }
    }
    // fallback: attach link to pdf or include html in email (but we can't send without provider)
    return { delivered: false, reason: 'no-email-provider-configured', pdfUrl };
  }

  // default: return downloadable link
  return { delivered: true, method: 'download', pdfUrl };
}

async function markInvoicePaid(invoiceIdOrNumber, paymentRecord) {
  // mark invoice status paid and update payment link and record
  let where = {};
  if (String(invoiceIdOrNumber).startsWith('inv-')) where.invoice_number = `eq.${invoiceIdOrNumber}`;
  else where.id = `eq.${invoiceIdOrNumber}`;
  const rows = await supabase.select('invoices', { select: 'id,invoice_number,content', ...where });
  if (!rows || rows.length === 0) throw new Error('Invoice not found');
  const inv = rows[0];

  // decrypt payload
  let contentPlain = null;
  try { contentPlain = decryptFromByteaHex(inv.content); } catch (e) { contentPlain = null; }
  let payload = null;
  try { payload = contentPlain ? JSON.parse(contentPlain) : {}; } catch (e) { payload = {}; }
  payload.payment = paymentRecord;
  payload.updated_at = new Date().toISOString();

  const contentHex = encryptToByteaHex(payload);
  await supabase.patch('invoices', { content: contentHex, status: paymentRecord.status || 'paid', updated_at: payload.updated_at }, where);

  // write reconciliation log to event_logs or admin_audit_log if available
  try {
    await supabase.insert('event_logs', { event_type: 'invoice_paid', invoice_number: inv.invoice_number, payload: JSON.stringify({ payment: paymentRecord }), created_at: new Date().toISOString() });
  } catch (e) {
    // ignore if table not present
  }

  return { invoice: inv.invoice_number, updated: true };
}

module.exports = {
  createInvoiceForOrder,
  deliverInvoice,
  generateInvoicePdf,
  markInvoicePaid
};
