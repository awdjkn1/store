const fs = require("fs");
const axios = require("axios");
(async function(){
  const OUT = "/tmp/cart_smoke.txt";
  const SERVER = process.env.SERVER_URL || "http://localhost:5000";
  const lines = [];
  try{
    lines.push("smoke run " + new Date().toISOString());

    // get products
    lines.push("--- GET /api/products ---");
    let prodResp = await axios.get(SERVER + "/api/products");
    lines.push(JSON.stringify(prodResp.data));

    // register
    lines.push("--- register ---");
    const username = "smoke_cart_" + Date.now();
    const email = username + "@example.com";
    const password = "TestPass!234";
    const reg = await axios.post(SERVER + "/api/auth/register", { username, email, password }, { validateStatus: s => s < 500 });
    lines.push(JSON.stringify({ status: reg.status, data: reg.data }));
    const setCookie = Array.isArray(reg.headers['set-cookie']) ? reg.headers['set-cookie'][0] : (reg.headers['set-cookie'] || null);
    lines.push("set-cookie: " + String(setCookie));
    const cookie = setCookie ? setCookie.split(';')[0] : null;

    // pick product id
    lines.push("--- choose product id ---");
    let prodId = null;
    try{
      const p = prodResp.data;
      if (Array.isArray(p) && p.length) prodId = p[0].id || p[0].product_id || p[0].id_old_text || null;
      else if (p && p.products && p.products.length) prodId = p.products[0].id || null;
    }catch(e){}
    lines.push("prodId: " + String(prodId));

    // add to cart
    lines.push("--- add to cart ---");
    const addBody = { product_id: prodId, quantity: 1 };
    try{
      const add = await axios.post(SERVER + "/api/cart", addBody, { headers: { Cookie: cookie }, validateStatus: s => s < 500 });
      lines.push(JSON.stringify({ status: add.status, data: add.data }));
    } catch(e){ lines.push('add error: ' + (e.response ? JSON.stringify(e.response.data) : String(e.message))); }

    // get cart
    lines.push('--- get cart ---');
    try{
      const getc = await axios.get(SERVER + '/api/cart', { headers: { Cookie: cookie }, validateStatus: s => s < 500 });
      lines.push(JSON.stringify({ status: getc.status, data: getc.data }));
    } catch(e){ lines.push('get cart error: ' + (e.response ? JSON.stringify(e.response.data) : String(e.message))); }

    // clear cart
    lines.push('--- clear cart ---');
    try{
      const clr = await axios.delete(SERVER + '/api/cart', { headers: { Cookie: cookie }, validateStatus: s => s < 500 });
      lines.push(JSON.stringify({ status: clr.status, data: clr.data }));
    } catch(e){ lines.push('clear cart error: ' + (e.response ? JSON.stringify(e.response.data) : String(e.message))); }

  } catch (err) {
    lines.push('run failed: ' + String(err.message || err));
  }
  fs.writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');
  console.log(fs.readFileSync(OUT, 'utf8'));
})();
