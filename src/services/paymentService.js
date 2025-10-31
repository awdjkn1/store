// HoodPay Payment Service Integration
// Replace with your actual HoodPay API credentials
const HOODPAY_API_KEY = process.env.REACT_APP_HOODPAY_API_KEY || 'your_hoodpay_api_key_here';
const HOODPAY_BASE_URL = 'https://api.hoodpay.io/v1'; // Replace with actual HoodPay API URL

class PaymentService {
  constructor() {
    this.apiKey = HOODPAY_API_KEY;
    this.baseUrl = HOODPAY_BASE_URL;
  }

  // Initialize payment
  async initializePayment(paymentData) {
    try {
      const response = await fetch(`${this.baseUrl}/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          amount: paymentData.amount,
          currency: paymentData.currency || 'USD',
          reference: paymentData.reference,
          customer: {
            email: paymentData.customerEmail,
            name: paymentData.customerName,
            phone: paymentData.customerPhone
          },
          callback_url: paymentData.callbackUrl || `${window.location.origin}/order-confirmation`,
          redirect_url: paymentData.redirectUrl || `${window.location.origin}/checkout/success`,
          metadata: {
            orderId: paymentData.orderId,
            customerInfo: paymentData.customerInfo,
            items: paymentData.items
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Payment initialization failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        paymentUrl: data.payment_url,
        reference: data.reference,
        accessCode: data.access_code,
        data: data
      };
    } catch (error) {
      console.error('Payment initialization error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify payment
  async verifyPayment(reference) {
    try {
      const response = await fetch(`${this.baseUrl}/payments/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Payment verification failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        paidAt: data.paid_at,
        customer: data.customer,
        metadata: data.metadata,
        data: data
      };
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process card payment (if HoodPay supports direct card processing)
  async processCardPayment(cardData, paymentData) {
    try {
      const response = await fetch(`${this.baseUrl}/payments/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          amount: paymentData.amount,
          currency: paymentData.currency || 'USD',
          card: {
            number: cardData.number,
            expiry_month: cardData.expiryMonth,
            expiry_year: cardData.expiryYear,
            cvv: cardData.cvv
          },
          customer: {
            email: paymentData.customerEmail,
            name: paymentData.customerName,
            phone: paymentData.customerPhone
          },
          reference: paymentData.reference,
          metadata: {
            orderId: paymentData.orderId,
            customerInfo: paymentData.customerInfo,
            items: paymentData.items
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Card payment failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        status: data.status,
        reference: data.reference,
        amount: data.amount,
        data: data
      };
    } catch (error) {
      console.error('Card payment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get payment methods
  async getPaymentMethods() {
    try {
      const response = await fetch(`${this.baseUrl}/payment-methods`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch payment methods: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        methods: data.methods || []
      };
    } catch (error) {
      console.error('Get payment methods error:', error);
      return {
        success: false,
        error: error.message,
        methods: [
          { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card' },
          { id: 'bank_transfer', name: 'Bank Transfer', icon: 'building' },
          { id: 'mobile_money', name: 'Mobile Money', icon: 'smartphone' }
        ]
      };
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
      const response = await fetch(
        `${this.baseUrl}/transactions?customer_id=${customerId}&limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch transaction history: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        transactions: data.transactions || [],
        total: data.total || 0,
        hasMore: data.has_more || false
      };
    } catch (error) {
      console.error('Get transaction history error:', error);
      return {
        success: false,
        error: error.message,
        transactions: [],
        total: 0,
        hasMore: false
      };
    }
  }

  // Refund payment
  async refundPayment(reference, amount = null) {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${reference}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          amount: amount // null for full refund
        })
      });

      if (!response.ok) {
        throw new Error(`Refund failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        refundId: data.refund_id,
        amount: data.amount,
        status: data.status,
        data: data
      };
    } catch (error) {
      console.error('Refund error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const paymentService = new PaymentService();
export default paymentService;