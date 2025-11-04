// Simple in-memory cache for last verified webhook event
// Note: this is ephemeral and will reset on process restart. Intended for short-term debugging only.
let lastVerifiedEvent = null;
let lastVerifiedAt = null;

module.exports = {
  setLastVerified: (evt) => {
    try {
      lastVerifiedEvent = evt;
      lastVerifiedAt = new Date().toISOString();
    } catch (e) {
      // ignore
    }
  },
  getLastVerified: () => ({ event: lastVerifiedEvent, timestamp: lastVerifiedAt })
};
