// Simple CommonJS axios shim for Jest module mapping
// Exports async functions returning an empty { data: {} } by default.
module.exports = {
  create: () => ({ get: async () => ({ data: {} }), post: async () => ({ data: {} }), put: async () => ({ data: {} }), delete: async () => ({ data: {} }) }),
  get: async () => ({ data: {} }),
  post: async () => ({ data: {} }),
  put: async () => ({ data: {} }),
  delete: async () => ({ data: {} })
};
