#!/usr/bin/env node
// Small helper: compute bcrypt hash for `admin1234` and PATCH the users table
// Uses backend/.env SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

async function setAdminPassword(username = 'admin', password = 'admin1234') {
  const hash = bcrypt.hashSync(password, 10);
  const url = `${SUPABASE_URL.replace(/\/$/,'')}/rest/v1/users?username=eq.${encodeURIComponent(username)}`;

  try {
    const res = await axios.patch(url, { password: hash }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        Prefer: 'return=representation'
      }
    });

    console.log(`Patched users rows count: ${res.data && res.data.length ? res.data.length : 'unknown'}`);
    console.log('New password hash:', hash);
  } catch (err) {
    if (err.response) {
      console.error('Supabase error status:', err.response.status, err.response.data);
    } else {
      console.error('Request error:', err.message);
    }
    process.exit(2);
  }
}

setAdminPassword().then(() => process.exit(0));
