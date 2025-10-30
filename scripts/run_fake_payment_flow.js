#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

function isoFileStamp(d) {
  return d.toISOString().replace(/:/g, '-');
}

function now() { return new Date().toISOString(); }

function makeTransaction(method) {
  const ts = Date.now();
  const amount = (Math.random() * 490 + 10).toFixed(2); // 10.00 - 500.00
  const txn = `txn-${method}-${ts}-${Math.floor(Math.random()*9000)+1000}`;
  const steps = [];

  // 2FA send
  steps.push({ step: '2fa_sent', at: now(), contact: 'test@example.com' });
  // 2FA verify
  steps.push({ step: '2fa_verified', at: new Date(Date.now()+500).toISOString(), verified: true });
  // hosted initiate
  steps.push({ step: 'hosted_initiated', at: new Date(Date.now()+1200).toISOString() });
  // webhook (provider -> store)
  steps.push({ step: 'webhook_received', at: new Date(Date.now()+2200).toISOString(), status: 'paid' });
  // order recorded
  steps.push({ step: 'order_recorded', at: new Date(Date.now()+2500).toISOString() });

  const base = {
    id: randomUUID(),
    transaction_id: txn,
    provider: 'fakepay',
    method,
    status: 'paid',
    amount: Number(amount),
    currency: 'USD',
    created_at: now(),
    hosted_page_url: `https://fakepay.local/hosted/${txn}`,
    steps
  };

  if (method === 'bank') {
    base.bank = { account_mask: '****6789', bank_name: 'Test Bank' };
  }
  if (method === 'crypto') {
    base.crypto = { asset: 'BTC', address: 'bc1qexampleaddress', confirmations: 3 };
  }
  if (method === 'card') {
    base.card = { last4: '4242', brand: 'Visa', exp_month: '12', exp_year: '2030' };
  }

  return base;
}

function main() {
  const methods = ['bank', 'crypto', 'card'];
  const flows = methods.map(makeTransaction);

  const outDir = path.resolve(__dirname, '..', 'outputs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const stamp = isoFileStamp(new Date());
  const filename = `fake_payment_flow_${stamp}.json`;
  const outPath = path.join(outDir, filename);

  fs.writeFileSync(outPath, JSON.stringify({ generated_at: now(), flows }, null, 2), 'utf8');

  console.log(`Wrote ${flows.length} fake payment flows to ${outPath}`);
  // Also print a short summary
  flows.forEach(f => console.log(`${f.method.toUpperCase()} ${f.transaction_id} -> ${f.status} $${f.amount}`));
}

if (require.main === module) main();
