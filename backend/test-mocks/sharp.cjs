// Minimal sharp shim for Jest to avoid native binary requirement during tests
module.exports = function () {
  return {
    resize: function () { return this; },
    toBuffer: async function () { return Buffer.from(''); },
    jpeg: function () { return this; },
    png: function () { return this; },
  };
};
