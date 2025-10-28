// Wrapper for the HoodPay browser SDK.
// Prefer the official npm package `@internal-labs/hoodpay` when available (bundled),
// else fall back to loading a CDN/global script if `REACT_APP_HOODPAY_SDK_URL` is set
// or if `window.HoodPay` exists. This keeps backward compatibility while enabling
// a straightforward npm install approach.

const SDK_GLOBAL = 'HoodPay';

function loadScript(src, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-hoodpay][src="${src}"]`);
    if (existing) {
      if (window[SDK_GLOBAL]) return resolve(window[SDK_GLOBAL]);
      existing.addEventListener('load', () => resolve(window[SDK_GLOBAL]));
      existing.addEventListener('error', () => reject(new Error('Failed to load HoodPay SDK')));
      return;
    }

    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.setAttribute('data-hoodpay', '1');
    let timer = null;
    s.onload = () => {
      if (timer) clearTimeout(timer);
      resolve(window[SDK_GLOBAL]);
    };
    s.onerror = (e) => {
      if (timer) clearTimeout(timer);
      reject(new Error('Failed to load HoodPay SDK'));
    };
    document.body.appendChild(s);
    timer = setTimeout(() => reject(new Error('Loading HoodPay SDK timed out')), timeout);
  });
}

let _clientInstance = null;

async function tryImportNpmSdk() {
  // Try dynamic import of the official npm package. This will work in bundled apps
  // after `npm install @internal-labs/hoodpay`.
  if (typeof window === 'undefined') return null;
  try {
    // dynamic import so SSR won't fail if package is only available in browser bundle
    const mod = await import('@internal-labs/hoodpay');
    const HoodPayClient = mod?.HoodPayClient || mod?.default || mod;
    if (typeof HoodPayClient === 'function' || typeof HoodPayClient === 'object') {
      // Create client with public-facing config if provided via env
      const apiKey = process.env.REACT_APP_HOODPAY_API_KEY;
      const businessId = process.env.REACT_APP_HOODPAY_BUSINESS_ID;
      try {
        _clientInstance = new (HoodPayClient)({ apiKey, businessId });
      } catch (e) {
        // Some SDKs export a factory rather than constructor
        try {
          _clientInstance = HoodPayClient.create ? HoodPayClient.create({ apiKey, businessId }) : HoodPayClient({ apiKey, businessId });
        } catch (ee) {
          console.warn('[hoodpayClient] could not instantiate HoodPayClient from package', ee && ee.message);
          _clientInstance = null;
        }
      }
      return _clientInstance;
    }
  } catch (e) {
    // not installed or errored — ignore and fall back to CDN/global loader
    return null;
  }
  return null;
}

export async function ensureHoodPay() {
  if (typeof window === 'undefined') return null;

  // Return existing instance if already resolved
  if (_clientInstance) return _clientInstance;

  // 1) Try npm package dynamic import (preferred)
  const fromPkg = await tryImportNpmSdk();
  if (fromPkg) return fromPkg;

  // 2) Check for global SDK attached to window
  if (window[SDK_GLOBAL]) return window[SDK_GLOBAL];

  // 3) Try loading from CDN/URL if provided
  const sdkUrl = process.env.REACT_APP_HOODPAY_SDK_URL;
  if (sdkUrl) {
    try {
      const sdk = await loadScript(sdkUrl);
      return sdk || window[SDK_GLOBAL] || null;
    } catch (e) {
      console.warn('[hoodpayClient] failed to load SDK from', sdkUrl, e && e.message);
      return null;
    }
  }

  return null;
}

export async function createToken(card) {
  // card: { number, expiry, cvv, name }
  const sdk = await ensureHoodPay();
  if (!sdk) {
    throw new Error('HoodPay SDK not available');
  }

  // Try common token APIs across providers
  try {
    if (sdk.tokens && typeof sdk.tokens.create === 'function') {
      return await sdk.tokens.create(card);
    }
    if (typeof sdk.createToken === 'function') {
      return await sdk.createToken(card);
    }
    // Some SDKs only expose payments.create — use it as a last-resort creation
    if (sdk.payments && typeof sdk.payments.create === 'function') {
      const p = await sdk.payments.create({ amount: 0, currency: 'USD', metadata: { tokenize: true }, card });
      return p;
    }
  } catch (e) {
    console.warn('[hoodpayClient] tokenization call failed', e && e.message);
    throw e;
  }

  throw new Error('HoodPay SDK present but tokenization API not found');
}

const hoodpayClient = { ensureHoodPay, createToken };

export default hoodpayClient;
