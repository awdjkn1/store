// This client-side service now proxies requests to our backend endpoints.
// That avoids exposing any HoodPay secret keys in the browser bundle.
const BACKEND_PREFIX = '/api/payments';

class PaymentService {
  constructor() {
    this.backend = BACKEND_PREFIX;
  }

  // Initialize / create a hosted payment via our backend proxy
  // Returns standardized shape: { success, url?, paymentId?, hosted?, data? }
  async initializePayment(paymentData) {
    try {
      const body = {
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        return_url: paymentData.returnUrl || undefined,
        cancel_url: paymentData.cancelUrl || undefined,
        metadata: Object.assign({}, paymentData.metadata || {}, { orderId: paymentData.orderId }),
        paymentMethods: paymentData.paymentMethods || undefined,
        customerEmail: paymentData.customerEmail || undefined,
      };

      const resp = await fetch(`${this.backend}/hosted`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) return { success: false, error: data.error || 'Payment initialization failed', data };

      // data is expected to be standardized { url?, paymentId?, hosted? }
      return { success: true, url: data.url || null, paymentId: data.paymentId || null, hosted: data.hosted || null, data };
    } catch (err) {
      console.error('initializePayment error', err);
      return { success: false, error: err && err.message };
    }
  }

  // Verify a provider payment id via backend
  async verifyPayment(paymentId, amount = null, currency = null) {
    try {
      const resp = await fetch(`${this.backend}/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, amount, currency })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) return { success: false, error: data.error || 'Verification failed', data };
      return { success: true, payment: data.payment || data };
    } catch (err) {
      console.error('verifyPayment error', err);
      return { success: false, error: err && err.message };
    }
  }

  // Process a charge via backend (expects tokenization to be done client-side if needed)
  async processCardPayment(tokenOrCard, paymentData) {
    try {
      // tokenOrCard can be a token string or object; backend /charge expects { token, amount }
      const body = {
        token: typeof tokenOrCard === 'string' ? tokenOrCard : (tokenOrCard.token || null),
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD'
      };
      const resp = await fetch(`${this.backend}/charge`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) return { success: false, error: data.error || 'Charge failed', data };
      return { success: true, charge: data.charge || data };
    } catch (err) {
      console.error('processCardPayment error', err);
      return { success: false, error: err && err.message };
    }
  }

  // Get available payment methods (proxy to backend for safe logic)
  async getPaymentMethods() {
    try {
      const resp = await fetch(`${this.backend}/crypto/available`, { credentials: 'include' });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) return { success: false, error: data.error || 'Failed to fetch methods', methods: [] };
      // Always include card + crypto list
      const methods = [
        { id: 'card', name: 'Credit/Debit Card' },
        { id: 'crypto', name: 'Cryptocurrency', cryptos: Array.isArray(data.cryptos) ? data.cryptos : [] }
      ];
      return { success: true, methods };
    } catch (err) {
      console.error('getPaymentMethods error', err);
      return { success: false, error: err && err.message, methods: [{ id: 'card', name: 'Credit/Debit Card' }] };
    }
  }

  // Create payment reference
  generatePaymentReference(orderId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `HP_${orderId}_${timestamp}_${random}`.toUpperCase();
  }

  // Format amount for display
  formatAmount(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Validate card number (basic validation)
  validateCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\s/g, '');
    const regex = /^[0-9]{13,19}$/;
    return regex.test(cleaned);
  }

  // Get card type from number
  getCardType(cardNumber) {
    const cleaned = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'discover';
    
    return 'unknown';
  }

  // Validate expiry date
  validateExpiryDate(month, year) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const expMonth = parseInt(month);
    const expYear = parseInt(year);
    
    if (expMonth < 1 || expMonth > 12) return false;
    
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;
    
    return true;
  }

  // Validate CVV
  validateCVV(cvv, cardType) {
    const length = cardType === 'amex' ? 4 : 3;
    const regex = new RegExp(`^[0-9]{${length}}$`);
    return regex.test(cvv);
  }

  // Handle payment webhook (for backend integration)
  async handleWebhook(webhookData) {
    try {
      // Verify webhook signature if HoodPay provides one
      const isValid = this.verifyWebhookSignature(webhookData);
      
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }

      // Process webhook based on event type
      switch (webhookData.event) {
        case 'payment.successful':
          return this.handleSuccessfulPayment(webhookData.data);
        case 'payment.failed':
          return this.handleFailedPayment(webhookData.data);
        case 'payment.pending':
          return this.handlePendingPayment(webhookData.data);
        default:
          console.log('Unhandled webhook event:', webhookData.event);
          return { success: true };
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify webhook signature (implement based on HoodPay documentation)
  verifyWebhookSignature(webhookData) {
    // Implement signature verification logic based on HoodPay's webhook security
    // This is a placeholder - replace with actual implementation
    return true;
  }

  // Handle successful payment
  async handleSuccessfulPayment(paymentData) {
    try {
      // Update order status
      // Send confirmation email
      // Update inventory
      console.log('Payment successful:', paymentData);
      
      return {
        success: true,
        message: 'Payment processed successfully'
      };
    } catch (error) {
      console.error('Error handling successful payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle failed payment
  async handleFailedPayment(paymentData) {
    try {
      // Update order status to failed
      // Send failure notification
      console.log('Payment failed:', paymentData);
      
      return {
        success: true,
        message: 'Payment failure handled'
      };
    } catch (error) {
      console.error('Error handling failed payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle pending payment
  async handlePendingPayment(paymentData) {
    try {
      // Update order status to pending
      console.log('Payment pending:', paymentData);
      
      return {
        success: true,
        message: 'Payment pending status updated'
      };
    } catch (error) {
      console.error('Error handling pending payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get transaction history
  async getTransactionHistory(customerId, limit = 10, offset = 0) {
    try {
      const resp = await fetch(`${this.backend}/transactions?customerId=${encodeURIComponent(customerId)}&limit=${limit}&offset=${offset}`, { credentials: 'include' });
      if (!resp.ok) {
        // backend may not implement transactions endpoint — return graceful message
        const txt = await resp.text().catch(() => 'not available');
        return { success: false, error: `transactions endpoint not available: ${txt}` };
      }
      const data = await resp.json().catch(() => ({}));
      return { success: true, transactions: data.transactions || [], total: data.total || 0, hasMore: data.has_more || false };
    } catch (error) {
      console.error('Get transaction history error:', error);
      return { success: false, error: error.message, transactions: [], total: 0, hasMore: false };
    }
  }

  // Refund payment
  async refundPayment(reference, amount = null) {
    try {
      const resp = await fetch(`${this.backend}/refund`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, amount })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) return { success: false, error: data.error || 'Refund failed', data };
      return { success: true, refundId: data.refund_id || data.id || null, amount: data.amount || amount, status: data.status || null, data };
    } catch (error) {
      console.error('Refund error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const paymentService = new PaymentService();
export default paymentService;