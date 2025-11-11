// DELETED: HoodPay browser shim removed in aggressive sweep.
// If this file is still imported, fail fast and instruct to use Card2Crypto.
export default function __hoodpay_client_removed__() {
  throw new Error('src/utils/hoodpayClient.js has been removed. Use Card2Crypto/browser integration or backend endpoints instead.');
}
