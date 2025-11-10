// Minimal uuid v4 shim for Jest environment
module.exports = {
  v4: function() {
    return 'uuid-' + Math.random().toString(36).slice(2,10);
  }
};
