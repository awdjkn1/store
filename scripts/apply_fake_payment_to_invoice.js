const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
const supabase = require('../backend/utils/supabaseRest');
const { encryptToByteaHex, decryptFromByteaHex } = require('../backend/utils/cryptoUtils');

async function run() {
  const orderId = process.argv[2] || 'ed1a3230-e629-4068-ba17-0fbe35149932';
  const provider = process.argv[3] || 'SimPay';
  const txn = process.argv[4] || `simtxn-${Date.now()}`;
  const amount = process.argv[5] || null;

  console.log('Applying fake payment to invoices for order:', orderId);
  try {
    const invRows = await supabase.select('invoices', { order_id: `eq.${orderId}` });
    console.log('Found invoices:', invRows && invRows.length);
    if (!Array.isArray(invRows) || invRows.length === 0) return;
    for (const inv of invRows) {
      try {
        let content = null;
        if (inv.content && typeof inv.content === 'string' && inv.content.startsWith('\\x')) {
          try {
            const dec = decryptFromByteaHex(inv.content);
            content = dec ? JSON.parse(dec) : null;
          } catch (e) {
            const jsonStr = Buffer.from(inv.content.slice(2), 'hex').toString();
            content = JSON.parse(jsonStr);
          }
        } else if (inv.content) {
          content = typeof inv.content === 'string' ? JSON.parse(inv.content) : inv.content;
        }
        if (!content) content = {};
        content.payment = content.payment || {};
        content.payment.provider = provider;
        content.payment.transaction_id = txn;
        content.payment.status = 'paid';
        if (amount !== null) content.payment.amount = Number(amount);

  const contentHex = encryptToByteaHex(content);
        const patch = {
          payment_provider: provider,
          payment_transaction_id: txn,
          content: contentHex,
          updated_at: new Date().toISOString()
        };
        const res = await supabase.patch('invoices', patch, { id: `eq.${inv.id}` });
        console.log('Patched invoice', inv.id, 'result:', res);
      } catch (e) {
        console.error('Failed to patch invoice', inv.id, e && e.message);
      }
    }
  } catch (e) {
    console.error('Failed to query invoices:', e && e.message);
  }
}

run();
