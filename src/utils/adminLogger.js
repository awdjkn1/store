/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:09.417Z */
const logAdmin = async (action, details) => {
  try {
    // Fire-and-forget: we don't want admin UI to block if logging fails
    await fetch('/api/admin/logs', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details })
    }).catch(() => null);
  } catch (e) {
    // ignore logging errors in UI
    try { console.warn('[adminLogger] failed', e && e.message); } catch (er) {}
  }
};

export default { log: logAdmin };
